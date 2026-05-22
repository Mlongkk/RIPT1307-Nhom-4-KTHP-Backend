const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     summary: Get medical records with filter
 *     tags: [Medical Records]
 *     parameters:
 *       - in: query
 *         name: pet_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 */
router.get('/', async (req, res, next) => {
    try {
        const { pet_id, doctor_id, page = 1, limit = 10 } = req.query;

        const where = {};
        if (pet_id) where.petId = pet_id;
        if (doctor_id) where.doctorId = doctor_id;

        const skip = (page - 1) * limit;

        const records = await prisma.medicalRecord.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                pet: true,
                doctor: true,
            },
            orderBy: { visit_date: 'desc' },
        });

        const total = await prisma.medicalRecord.count({ where });

        res.json({
            success: true,
            data: records,
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
 * /api/medical-records/{id}:
 *   get:
 *     summary: Get medical record by ID
 *     tags: [Medical Records]
 */
router.get('/:id', async (req, res, next) => {
    try {
        const record = await prisma.medicalRecord.findUnique({
            where: { id: req.params.id },
            include: {
                pet: true,
                doctor: true,
            },
        });

        if (!record) {
            return res.status(404).json({ success: false, error: 'Medical record not found' });
        }

        res.json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records:
 *   post:
 *     summary: Create medical record (Doctor only)
 *     tags: [Medical Records]
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
 *               visit_date:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               treatment:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post('/', authMiddleware, roleMiddleware(['DOCTOR', 'ADMIN']), async (req, res, next) => {
    try {
        const { pet_id, visit_date, diagnosis, treatment, notes } = req.body;

        if (!pet_id || !visit_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check pet exists
        const pet = await prisma.pet.findUnique({ where: { id: pet_id } });
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        const record = await prisma.medicalRecord.create({
            data: {
                petId: pet_id,
                doctorId: req.user.id,
                visit_date: new Date(visit_date),
                diagnosis: diagnosis || null,
                treatment: treatment || null,
                notes: notes || null,
            },
            include: {
                pet: true,
                doctor: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Medical record created successfully',
            data: record,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records/{id}:
 *   put:
 *     summary: Update medical record (Doctor only)
 *     tags: [Medical Records]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', authMiddleware, roleMiddleware(['DOCTOR', 'ADMIN']), async (req, res, next) => {
    try {
        const { diagnosis, treatment, notes } = req.body;

        const record = await prisma.medicalRecord.findUnique({
            where: { id: req.params.id },
        });

        if (!record) {
            return res.status(404).json({ success: false, error: 'Medical record not found' });
        }

        // Doctor can only update their own records, admin can update any
        if (req.user.role === 'DOCTOR' && req.user.id !== record.doctorId) {
            return res.status(403).json({ success: false, error: 'You can only update your own records' });
        }

        const updated = await prisma.medicalRecord.update({
            where: { id: req.params.id },
            data: {
                diagnosis: diagnosis !== undefined ? diagnosis : record.diagnosis,
                treatment: treatment !== undefined ? treatment : record.treatment,
                notes: notes !== undefined ? notes : record.notes,
            },
            include: {
                pet: true,
                doctor: true,
            },
        });

        res.json({
            success: true,
            message: 'Medical record updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records/{id}:
 *   delete:
 *     summary: Delete medical record (Doctor/Admin only)
 *     tags: [Medical Records]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', authMiddleware, roleMiddleware(['DOCTOR', 'ADMIN']), async (req, res, next) => {
    try {
        const record = await prisma.medicalRecord.findUnique({
            where: { id: req.params.id },
        });

        if (!record) {
            return res.status(404).json({ success: false, error: 'Medical record not found' });
        }

        // Doctor can only delete their own records, admin can delete any
        if (req.user.role === 'DOCTOR' && req.user.id !== record.doctorId) {
            return res.status(403).json({ success: false, error: 'You can only delete your own records' });
        }

        await prisma.medicalRecord.delete({ where: { id: req.params.id } });

        res.json({
            success: true,
            message: 'Medical record deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records/pet/{pet_id}/history:
 *   get:
 *     summary: Get pet's medical history
 *     tags: [Medical Records]
 */
router.get('/pet/:pet_id/history', async (req, res, next) => {
    try {
        const history = await prisma.medicalRecord.findMany({
            where: { petId: req.params.pet_id },
            include: {
                doctor: true,
            },
            orderBy: { visit_date: 'desc' },
        });

        res.json({
            success: true,
            data: history,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
