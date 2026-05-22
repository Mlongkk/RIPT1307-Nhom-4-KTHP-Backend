const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/clinic/info:
 *   get:
 *     summary: Get clinic information (public)
 *     tags: [Clinic]
 *     responses:
 *       200:
 *         description: Clinic info
 */
router.get('/info', async (req, res, next) => {
    try {
        const clinicInfo = await prisma.clinicInfo.findFirst();

        if (!clinicInfo) {
            return res.status(404).json({ success: false, error: 'Clinic info not found' });
        }

        res.json({ success: true, data: clinicInfo });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/clinic/info:
 *   put:
 *     summary: Update clinic information (Admin only)
 *     tags: [Clinic]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               country:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               opening_hour:
 *                 type: string
 *               closing_hour:
 *                 type: string
 */
router.put('/info', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { name, email, phone, address, city, district, country, website, description, opening_hour, closing_hour } = req.body;

        // Get or create clinic info
        let clinicInfo = await prisma.clinicInfo.findFirst();

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (city) updateData.city = city;
        if (district) updateData.district = district;
        if (country) updateData.country = country;
        if (website) updateData.website = website;
        if (description) updateData.description = description;
        if (opening_hour) updateData.opening_hour = opening_hour;
        if (closing_hour) updateData.closing_hour = closing_hour;

        if (clinicInfo) {
            clinicInfo = await prisma.clinicInfo.update({
                where: { id: clinicInfo.id },
                data: updateData,
            });
        } else {
            clinicInfo = await prisma.clinicInfo.create({
                data: {
                    name: name || 'Pet Hospital',
                    ...updateData,
                },
            });
        }

        res.json({
            success: true,
            message: 'Clinic info updated successfully',
            data: clinicInfo,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/clinic/services:
 *   get:
 *     summary: Get all services
 *     tags: [Clinic]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 */
router.get('/services', async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (page - 1) * limit;

        const services = await prisma.service.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { name: 'asc' },
        });

        const total = await prisma.service.count({ where });

        res.json({
            success: true,
            data: services,
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
 * /api/clinic/services:
 *   post:
 *     summary: Create new service (Admin only)
 *     tags: [Clinic]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               durationMin:
 *                 type: integer
 */
router.post('/services', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { name, description, price, durationMin } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }

        const service = await prisma.service.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price),
                durationMin: durationMin ? parseInt(durationMin) : null,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/clinic/services/{id}:
 *   put:
 *     summary: Update service (Admin only)
 *     tags: [Clinic]
 *     security:
 *       - BearerAuth: []
 */
router.put('/services/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const { name, description, price, durationMin } = req.body;

        const service = await prisma.service.findUnique({ where: { id: req.params.id } });
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        const updated = await prisma.service.update({
            where: { id: req.params.id },
            data: {
                name: name || service.name,
                description: description !== undefined ? description : service.description,
                price: price ? parseFloat(price) : service.price,
                durationMin: durationMin ? parseInt(durationMin) : service.durationMin,
            },
        });

        res.json({
            success: true,
            message: 'Service updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/clinic/services/{id}:
 *   delete:
 *     summary: Delete service (Admin only)
 *     tags: [Clinic]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/services/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res, next) => {
    try {
        const service = await prisma.service.findUnique({ where: { id: req.params.id } });
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        await prisma.service.delete({ where: { id: req.params.id } });

        res.json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
