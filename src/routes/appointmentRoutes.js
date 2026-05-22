const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { sendAppointmentReminder, sendEmail } = require('../services/notificationService');

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get appointments with filter
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority_level
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: pet_id
 *         schema:
 *           type: string
 */
router.get('/', async (req, res, next) => {
    try {
        const { status, priority_level, doctor_id, pet_id, page = 1, limit = 10 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority_level) where.priority_level = priority_level;
        if (doctor_id) where.doctorId = doctor_id;
        if (pet_id) where.petId = pet_id;

        const skip = (page - 1) * limit;

        const appointments = await prisma.appointment.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                pet: true,
                customer: true,
                doctor: true,
                service: true,
            },
            orderBy: { appointment_date: 'asc' },
        });

        const total = await prisma.appointment.count({ where });

        res.json({
            success: true,
            data: appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 */
router.get('/:id', async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
            include: {
                pet: true,
                customer: true,
                doctor: true,
                service: true,
            },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        res.json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create new appointment (booking)
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet_id:
 *                 type: string
 *               appointment_date:
 *                 type: string
 *               priority_level:
 *                 type: string
 *                 enum: [EMERGENCY, URGENT, NORMAL]
 *               reason:
 *                 type: string
 *               service_id:
 *                 type: string
 */
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { pet_id, appointment_date, priority_level = 'NORMAL', reason, service_id } = req.body;

        // Validate
        if (!pet_id || !appointment_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check pet exists
        const pet = await prisma.pet.findUnique({ where: { id: pet_id } });
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        // Only pet owner or admin can book appointment for the pet
        if (req.user.role !== 'ADMIN' && req.user.id !== pet.ownerId) {
            return res.status(403).json({ success: false, error: 'You can only book appointments for your own pets' });
        }

        // Auto-assign doctor based on priority & availability
        let doctorId = null;
        if (priority_level === 'EMERGENCY') {
            // Assign available doctor
            const availableDoctor = await prisma.user.findFirst({
                where: {
                    role: 'DOCTOR',
                    appointmentsAsDoctor: {
                        none: {
                            appointment_date: {
                                equals: new Date(appointment_date),
                            },
                        },
                    },
                },
            });
            doctorId = availableDoctor?.id || null;
        }

        const appointment = await prisma.appointment.create({
            data: {
                petId: pet_id,
                customerId: req.user.id,
                doctorId,
                serviceId: service_id || null,
                appointment_date: new Date(appointment_date),
                priority_level,
                reason: reason || null,
                status: 'SCHEDULED',
            },
            include: {
                pet: true,
                customer: true,
                doctor: true,
                service: true,
            },
        });

        // Send notification email (fire and forget - don't await)
        try {
            const customer = await prisma.user.findUnique({
                where: { id: req.user.id },
            });

            if (customer?.email) {
                // Don't await - send asynchronously to avoid blocking response
                sendAppointmentReminder(appointment, customer.email, customer.full_name).catch(err => {
                    console.error('Failed to send notification:', err);
                });
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Don't fail the appointment creation if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { status, doctor_id, appointment_date, priority_level, reason } = req.body;

        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Only customer, doctor, or admin can update
        const isCustomer = req.user.id === appointment.customerId;
        const isDoctor = req.user.id === appointment.doctorId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await prisma.appointment.update({
            where: { id: req.params.id },
            data: {
                status: status || appointment.status,
                doctorId: doctor_id !== undefined ? doctor_id : appointment.doctorId,
                appointment_date: appointment_date ? new Date(appointment_date) : appointment.appointment_date,
                priority_level: priority_level || appointment.priority_level,
                reason: reason !== undefined ? reason : appointment.reason,
            },
            include: {
                pet: true,
                customer: true,
                doctor: true,
                service: true,
            },
        });

        // Send notification if status changed
        try {
            if (status && status !== appointment.status) {
                const customer = await prisma.user.findUnique({
                    where: { id: appointment.customerId },
                });

                if (customer?.email) {
                    const subject = `Cập nhật trạng thái lịch khám: ${status}`;
                    const htmlContent = `
                        <h2>Cập nhật trạng thái lịch khám</h2>
                        <p>Xin chào ${customer.full_name},</p>
                        <p>Trạng thái lịch khám của bạn đã thay đổi:</p>
                        <ul>
                            <li><strong>Thú cưng:</strong> ${updated.pet.name}</li>
                            <li><strong>Trạng thái mới:</strong> ${status}</li>
                            <li><strong>Ngày giờ:</strong> ${new Date(updated.appointment_date).toLocaleString('vi-VN')}</li>
                        </ul>
                    `;
                    // Don't await - send asynchronously
                    sendEmail(customer.email, subject, htmlContent).catch(err => {
                        console.error('Failed to send update notification:', err);
                    });
                }
            }
        } catch (notificationError) {
            console.error('Failed to send update notification:', notificationError);
        }

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Only customer, doctor, or admin can cancel
        const isCustomer = req.user.id === appointment.customerId;
        const isDoctor = req.user.id === appointment.doctorId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        await prisma.appointment.update({
            where: { id: req.params.id },
            data: { status: 'CANCELLED' },
        });

        // Send cancellation notification
        try {
            const customer = await prisma.user.findUnique({
                where: { id: appointment.customerId },
            });

            if (customer?.email) {
                const subject = 'Lịch khám đã bị hủy';
                const htmlContent = `
                    <h2>Thông báo hủy lịch khám</h2>
                    <p>Xin chào ${customer.full_name},</p>
                    <p>Lịch khám của bạn đã bị hủy:</p>
                    <ul>
                        <li><strong>Thú cưng:</strong> ${appointment.pet?.name}</li>
                        <li><strong>Ngày giờ:</strong> ${new Date(appointment.appointment_date).toLocaleString('vi-VN')}</li>
                    </ul>
                    <p>Vui lòng liên hệ với chúng tôi để đặt lịch mới.</p>
                `;
                // Don't await - send asynchronously
                sendEmail(customer.email, subject, htmlContent).catch(err => {
                    console.error('Failed to send cancellation notification:', err);
                });
            }
        } catch (notificationError) {
            console.error('Failed to send cancellation notification:', notificationError);
        }

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/doctor/{doctor_id}/schedule:
 *   get:
 *     summary: Get doctor's appointment schedule
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 */
router.get('/doctor/:doctor_id/schedule', async (req, res, next) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: req.params.doctor_id },
            include: {
                pet: true,
                customer: true,
            },
            orderBy: { appointment_date: 'asc' },
        });

        res.json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
