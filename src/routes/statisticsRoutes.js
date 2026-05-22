const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/statistics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 */
router.get('/dashboard', authMiddleware, roleMiddleware(['ADMIN', 'DOCTOR']), async (req, res, next) => {
    try {
        // Total counts
        const totalUsers = await prisma.user.count();
        const totalPets = await prisma.pet.count();
        const totalAppointments = await prisma.appointment.count();
        const totalMedicalRecords = await prisma.medicalRecord.count();

        // Appointments by status
        const appointmentsByStatus = await prisma.appointment.groupBy({
            by: ['status'],
            _count: true,
        });

        // Appointments by priority
        const appointmentsByPriority = await prisma.appointment.groupBy({
            by: ['priority_level'],
            _count: true,
        });

        // Top species
        const topSpecies = await prisma.pet.groupBy({
            by: ['species'],
            _count: true,
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 5,
        });

        // Doctors count
        const totalDoctors = await prisma.user.count({
            where: { role: 'DOCTOR' },
        });

        // Customers count
        const totalCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER' },
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalPets,
                    totalAppointments,
                    totalMedicalRecords,
                    totalDoctors,
                    totalCustomers,
                },
                appointments: {
                    byStatus: appointmentsByStatus,
                    byPriority: appointmentsByPriority,
                },
                pets: {
                    topSpecies,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/statistics/appointments:
 *   get:
 *     summary: Get appointment statistics
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 */
router.get('/appointments', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { month, year } = req.query;

        const where = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            where.appointment_date = {
                gte: startDate,
                lt: endDate,
            };
        }

        const appointments = await prisma.appointment.groupBy({
            by: ['status', 'priority_level'],
            where,
            _count: true,
        });

        // Average appointments per doctor
        const doctorStats = await prisma.appointment.groupBy({
            by: ['doctorId'],
            where: { doctorId: { not: null } },
            _count: true,
        });

        res.json({
            success: true,
            data: {
                appointmentStats: appointments,
                doctorStats: doctorStats.map(stat => ({
                    doctorId: stat.doctorId,
                    appointmentCount: stat._count,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/statistics/doctor/{doctor_id}:
 *   get:
 *     summary: Get doctor's performance statistics
 *     tags: [Statistics]
 */
router.get('/doctor/:doctor_id', authMiddleware, async (req, res, next) => {
    try {
        const { doctor_id } = req.params;

        // Check if user is the doctor or admin
        if (req.user.role !== 'ADMIN' && req.user.id !== doctor_id) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const totalAppointments = await prisma.appointment.count({
            where: { doctorId: doctor_id },
        });

        const completedAppointments = await prisma.appointment.count({
            where: { doctorId: doctor_id, status: 'COMPLETED' },
        });

        const medicalRecords = await prisma.medicalRecord.count({
            where: { doctorId: doctor_id },
        });

        const appointmentsByPriority = await prisma.appointment.groupBy({
            by: ['priority_level'],
            where: { doctorId: doctor_id },
            _count: true,
        });

        res.json({
            success: true,
            data: {
                totalAppointments,
                completedAppointments,
                medicalRecords,
                appointmentsByPriority,
                completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/statistics/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 */
router.get('/revenue', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { month, year } = req.query;

        const where = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            where.issuedAt = {
                gte: startDate,
                lt: endDate,
            };
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                items: true,
            },
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const paidRevenue = invoices
            .filter(inv => inv.status === 'PAID')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pendingRevenue = invoices
            .filter(inv => inv.status === 'PENDING')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        res.json({
            success: true,
            data: {
                totalRevenue,
                paidRevenue,
                pendingRevenue,
                invoiceCount: invoices.length,
                invoices: invoices,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/statistics/pet-health:
 *   get:
 *     summary: Get pet health statistics by species
 *     tags: [Statistics]
 */
router.get('/pet-health', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const petHealthStats = await prisma.pet.groupBy({
            by: ['species'],
            _count: {
                id: true,
            },
        });

        // Get common diagnoses
        const commonDiagnoses = await prisma.medicalRecord.groupBy({
            by: ['diagnosis'],
            where: { diagnosis: { not: null } },
            _count: true,
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        });

        res.json({
            success: true,
            data: {
                petsBySpecies: petHealthStats,
                commonDiagnoses: commonDiagnoses,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
