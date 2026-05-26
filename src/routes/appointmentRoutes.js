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
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Get appointments of current logged-in customer with filter
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, CONFIRMED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: priority_level
 *         schema:
 *           type: string
 *           enum: [EMERGENCY, URGENT, NORMAL]
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: pet_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of appointments of current user
 *       401:
 *         description: Unauthorized
 */
router.get('/my-appointments', authMiddleware, async (req, res, next) => {
    try {
        const { status, priority_level, doctor_id, pet_id, page = 1, limit = 10 } = req.query;

        // Filter by current user's appointments
        const where = { customerId: req.user.id };
        if (status) where.status = status;
        if (priority_level) where.priority_level = priority_level;
        if (doctor_id) where.doctorId = doctor_id;
        if (pet_id) where.petId = pet_id;

        console.log(`📋 GET /appointments/my-appointments - User: ${req.user.id}, Query:`, { status, priority_level, doctor_id, pet_id, page, limit });

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const appointments = await prisma.appointment.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                pet: {
                    select: {
                        id: true,
                        name: true,
                        species: true,
                        breed: true,
                        image_url: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                doctor: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                    },
                },
            },
            orderBy: { appointment_date: 'asc' },
        });

        const total = await prisma.appointment.count({ where });

        console.log(`✅ Returned ${appointments.length} appointments, Total: ${total}, Page: ${page}/${Math.ceil(total / limit)} for user ${req.user.id}`);

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
 *               doctor_id:
 *                 type: string
 *               priority_level:
 *                 type: string
 *                 enum: [EMERGENCY, URGENT, NORMAL]
 *               reason:
 *                 type: string
 */
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { pet_id, appointment_date, doctor_id, priority_level = 'NORMAL', reason } = req.body;

        // Validate required fields
        if (!pet_id) {
            return res.status(400).json({ success: false, error: 'Missing required field: pet_id (must be UUID of pet, not pet name)' });
        }
        if (!appointment_date) {
            return res.status(400).json({ success: false, error: 'Missing required field: appointment_date' });
        }

        // Validate appointment_date format
        let appointmentDate = new Date(appointment_date);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid appointment_date format. Must be ISO 8601 (e.g., 2026-05-24T14:30:00)' });
        }

        // FIX: Ensure date is stored in UTC - convert local date to UTC if needed
        // If the date string doesn't have 'Z' or timezone info, assume it's local time
        if (!appointment_date.includes('Z') && !appointment_date.match(/[+-]\d{2}:\d{2}$/)) {
            // Date string is in local time - convert to UTC by adjusting for timezone offset
            const offset = appointmentDate.getTimezoneOffset() * 60000;
            appointmentDate = new Date(appointmentDate.getTime() + offset);
        }

        // Validate priority_level enum
        const validPriorities = ['EMERGENCY', 'URGENT', 'NORMAL'];
        if (priority_level && !validPriorities.includes(priority_level)) {
            return res.status(400).json({ success: false, error: `Invalid priority_level. Must be one of: ${validPriorities.join(', ')}` });
        }

        // Check pet exists
        const pet = await prisma.pet.findUnique({ where: { id: pet_id } });
        if (!pet) {
            return res.status(404).json({ success: false, error: `Pet with ID "${pet_id}" not found. Note: pet_id must be the UUID of the pet, not the pet name` });
        }

        // Only pet owner or admin can book appointment for the pet
        if (req.user.role !== 'ADMIN' && req.user.id !== pet.ownerId) {
            return res.status(403).json({ success: false, error: 'You can only book appointments for your own pets' });
        }

        // Validate doctor_id if provided
        if (doctor_id) {
            const doctor = await prisma.user.findUnique({ where: { id: doctor_id } });
            if (!doctor) {
                return res.status(404).json({ success: false, error: `Doctor with ID "${doctor_id}" not found. Note: doctor_id must be the UUID of the doctor, not the username` });
            }
            if (doctor.role !== 'DOCTOR') {
                return res.status(400).json({ success: false, error: `User with ID "${doctor_id}" is not a doctor` });
            }
        }

        const appointment = await prisma.appointment.create({
            data: {
                petId: pet_id,
                customerId: req.user.id,
                doctorId: doctor_id || null,
                appointment_date: appointmentDate,
                priority_level,
                reason: reason || null,
                status: 'SCHEDULED',
            },
            include: {
                pet: true,
                customer: true,
                doctor: true
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
 *     summary: Update appointment (Doctor can confirm, Customer can update, Admin can do all)
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Roles:
 *       - DOCTOR: Can confirm appointments (status = CONFIRMED) and update appointment details
 *       - CUSTOMER: Can update their own appointments
 *       - ADMIN: Can update any appointment
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

        // Validate status enum if provided
        const validStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Validate priority_level enum if provided
        const validPriorities = ['EMERGENCY', 'URGENT', 'NORMAL'];
        if (priority_level && !validPriorities.includes(priority_level)) {
            return res.status(400).json({ success: false, error: `Invalid priority_level. Must be one of: ${validPriorities.join(', ')}` });
        }

        // Validate appointment_date format if provided
        let newAppointmentDate = appointment.appointment_date;
        if (appointment_date) {
            newAppointmentDate = new Date(appointment_date);
            if (isNaN(newAppointmentDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid appointment_date format. Must be ISO 8601 (e.g., 2026-05-24T14:30:00)' });
            }
            // FIX: Ensure date is stored in UTC - convert local date to UTC if needed
            if (!appointment_date.includes('Z') && !appointment_date.match(/[+-]\d{2}:\d{2}$/)) {
                const offset = newAppointmentDate.getTimezoneOffset() * 60000;
                newAppointmentDate = new Date(newAppointmentDate.getTime() + offset);
            }
        }

        // Validate doctor_id if provided
        let newDoctorId = appointment.doctorId;
        if (doctor_id !== undefined) {
            if (doctor_id === null) {
                newDoctorId = null;
            } else {
                const doctor = await prisma.user.findUnique({ where: { id: doctor_id } });
                if (!doctor) {
                    return res.status(404).json({ success: false, error: `Doctor with ID "${doctor_id}" not found` });
                }
                if (doctor.role !== 'DOCTOR') {
                    return res.status(400).json({ success: false, error: `User with ID "${doctor_id}" is not a doctor` });
                }
                newDoctorId = doctor_id;
            }
        }

        // Role-based permission check:
        // - DOCTOR: Can confirm and update any appointment
        // - CUSTOMER: Can update their own appointments
        // - ADMIN: Can update any appointment
        const isCustomer = req.user.id === appointment.customerId;
        const isDoctor = req.user.role === 'DOCTOR';
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied. Only the customer, doctor, or admin can update this appointment.' });
        }

        const updated = await prisma.appointment.update({
            where: { id: req.params.id },
            data: {
                status: status || appointment.status,
                doctorId: newDoctorId,
                appointment_date: newAppointmentDate,
                priority_level: priority_level || appointment.priority_level,
                reason: reason !== undefined ? reason : appointment.reason,
            },
            include: {
                pet: true,
                customer: true,
                doctor: true,
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
 *     summary: Cancel appointment (Doctor can cancel, Customer can cancel, Admin can cancel)
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Roles:
 *       - DOCTOR: Can cancel appointments they are assigned to
 *       - CUSTOMER: Can cancel their own appointments
 *       - ADMIN: Can cancel any appointment
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Role-based permission check:
        // - DOCTOR: Can cancel any appointment
        // - CUSTOMER: Can cancel their own appointments
        // - ADMIN: Can cancel any appointment
        const isCustomer = req.user.id === appointment.customerId;
        const isDoctor = req.user.role === 'DOCTOR';
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied. Only the customer, doctor, or admin can cancel this appointment.' });
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

/**
 * @swagger
 * /api/appointments/{id}/confirm:
 *   patch:
 *     summary: Confirm appointment (SCHEDULED → CONFIRMED)
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
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED]
 *             required:
 *               - status
 */
router.patch('/:id/confirm', authMiddleware, async (req, res, next) => {
    try {
        const { status } = req.body;

        // Validate status is CONFIRMED
        if (status !== 'CONFIRMED') {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Only "CONFIRMED" is allowed for this endpoint'
            });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
            include: {
                pet: true,
                customer: true,
                doctor: true,
            },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Only doctor (any doctor) or admin can confirm appointment
        const isDoctor = req.user.role === 'DOCTOR';
        const isAdmin = req.user.role === 'ADMIN';

        if (!isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Only doctor or admin can confirm appointment' });
        }

        // Only allow confirming SCHEDULED appointments
        if (appointment.status !== 'SCHEDULED') {
            return res.status(400).json({
                success: false,
                error: `Cannot confirm appointment with status "${appointment.status}". Only "SCHEDULED" appointments can be confirmed.`
            });
        }

        const updated = await prisma.appointment.update({
            where: { id: req.params.id },
            data: { status: 'CONFIRMED' },
            include: {
                pet: true,
                customer: true,
                doctor: true,
            },
        });

        // Send confirmation notification email
        try {
            const customer = await prisma.user.findUnique({
                where: { id: appointment.customerId },
            });

            if (customer?.email) {
                const doctorName = appointment.doctor?.full_name || 'Bác sĩ';
                const subject = 'Lịch khám của bạn đã được xác nhận';
                const htmlContent = `
                    <h2>Xác nhận lịch khám</h2>
                    <p>Xin chào ${customer.full_name},</p>
                    <p>Lịch khám của bạn đã được xác nhận bởi bác sĩ:</p>
                    <ul>
                        <li><strong>Thú cưng:</strong> ${updated.pet.name}</li>
                        <li><strong>Bác sĩ:</strong> ${doctorName}</li>
                        <li><strong>Ngày giờ:</strong> ${new Date(updated.appointment_date).toLocaleString('vi-VN')}</li>
                        <li><strong>Mức độ ưu tiên:</strong> ${updated.priority_level}</li>
                    </ul>
                    <p>Vui lòng có mặt 15 phút trước giờ khám.</p>
                `;
                // Don't await - send asynchronously
                sendEmail(customer.email, subject, htmlContent).catch(err => {
                    console.error('Failed to send confirmation notification:', err);
                });
            }
        } catch (notificationError) {
            console.error('Failed to send confirmation notification:', notificationError);
            // Don't fail the confirmation if notification fails
        }

        res.json({
            success: true,
            message: 'Appointment confirmed successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/{id}/complete:
 *   patch:
 *     summary: Complete appointment (CONFIRMED/SCHEDULED → COMPLETED)
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
 *               status:
 *                 type: string
 *                 enum: [COMPLETED]
 *             required:
 *               - status
 */
router.patch('/:id/complete', authMiddleware, async (req, res, next) => {
    try {
        const { status } = req.body;

        // Validate status is COMPLETED
        if (status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Only "COMPLETED" is allowed for this endpoint'
            });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
            include: {
                pet: true,
                customer: true,
                doctor: true,
            },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Only doctor (any doctor) or admin can complete appointment
        const isDoctor = req.user.role === 'DOCTOR';
        const isAdmin = req.user.role === 'ADMIN';

        if (!isDoctor && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Only doctor or admin can complete appointment' });
        }

        // Only allow completing SCHEDULED or CONFIRMED appointments
        const validStatuses = ['SCHEDULED', 'CONFIRMED'];
        if (!validStatuses.includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot complete appointment with status "${appointment.status}". Only "SCHEDULED" or "CONFIRMED" appointments can be completed.`
            });
        }

        const updated = await prisma.appointment.update({
            where: { id: req.params.id },
            data: { status: 'COMPLETED' },
            include: {
                pet: true,
                customer: true,
                doctor: true,
            },
        });

        // Send completion notification email
        try {
            const customer = await prisma.user.findUnique({
                where: { id: appointment.customerId },
            });

            if (customer?.email) {
                const doctorName = appointment.doctor?.full_name || 'Bác sĩ';
                const subject = 'Lịch khám của bạn đã hoàn thành';
                const htmlContent = `
                    <h2>Hoàn thành lịch khám</h2>
                    <p>Xin chào ${customer.full_name},</p>
                    <p>Lịch khám của bạn đã hoàn thành:</p>
                    <ul>
                        <li><strong>Thú cưng:</strong> ${updated.pet.name}</li>
                        <li><strong>Bác sĩ:</strong> ${doctorName}</li>
                        <li><strong>Ngày giờ:</strong> ${new Date(updated.appointment_date).toLocaleString('vi-VN')}</li>
                    </ul>
                    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Vui lòng liên hệ nếu có bất kỳ thắc mắc nào.</p>
                `;
                // Don't await - send asynchronously
                sendEmail(customer.email, subject, htmlContent).catch(err => {
                    console.error('Failed to send completion notification:', err);
                });
            }
        } catch (notificationError) {
            console.error('Failed to send completion notification:', notificationError);
            // Don't fail the completion if notification fails
        }

        res.json({
            success: true,
            message: 'Appointment completed successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
