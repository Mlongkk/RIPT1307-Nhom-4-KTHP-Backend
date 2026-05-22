const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, DOCTOR, CUSTOMER]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        const where = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { full_name: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            where,
            skip,
            take: parseInt(limit),
            select: {
                id: true,
                username: true,
                email: true,
                full_name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.user.count({ where });

        res.json({
            success: true,
            data: users,
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
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        // Allow user to view their own profile or admin to view any
        if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                username: true,
                email: true,
                full_name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin updates others, users update own profile)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, CUSTOMER]
 *                 description: Only admin can change role
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        // Only user themselves or admin can update
        if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { full_name, phone, role } = req.body;

        // Only admin can change role
        let updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (phone) updateData.phone = phone;
        if (role && req.user.role === 'ADMIN') {
            updateData.role = role;
        } else if (role && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Only admin can change role' });
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                full_name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        // Prevent self-deletion
        if (req.user.id === req.params.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                ownedPets: { select: { id: true } },
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Cascade delete: Handle related data before deleting user
        // Get all pets owned by this user
        const petIds = user.ownedPets.map(pet => pet.id);

        if (petIds.length > 0) {
            // Delete medical records for pets
            await prisma.medicalRecord.deleteMany({
                where: { petId: { in: petIds } },
            });

            // Delete appointments for pets
            await prisma.appointment.deleteMany({
                where: { petId: { in: petIds } },
            });

            // Delete invoices for pets
            await prisma.invoice.deleteMany({
                where: { petId: { in: petIds } },
            });

            // Delete pets
            await prisma.pet.deleteMany({
                where: { ownerId: req.params.id },
            });
        }

        // Delete appointments where user is doctor
        await prisma.appointment.deleteMany({
            where: { doctorId: req.params.id },
        });

        // Delete medical records created by user (if doctor)
        await prisma.medicalRecord.deleteMany({
            where: { doctorId: req.params.id },
        });

        // Delete appointments created by user (if customer)
        await prisma.appointment.deleteMany({
            where: { customerId: req.params.id },
        });

        // Delete invoices owned by user
        await prisma.invoice.deleteMany({
            where: { ownerId: req.params.id },
        });

        // Finally delete user
        await prisma.user.delete({
            where: { id: req.params.id },
        });

        res.json({
            success: true,
            message: 'User deleted successfully with all related data',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/stats/roles:
 *   get:
 *     summary: Get user statistics by role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router.get('/stats/roles', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: true,
        });

        res.json({
            success: true,
            data: usersByRole,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
