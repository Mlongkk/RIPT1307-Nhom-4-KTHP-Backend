const express = require('express');
const prisma = require('../prismaClient');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload, handleUploadErrors } = require('../middleware/uploadMiddleware');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const { v4: uuidv4 } = require('uuid');
const { validatePet } = require('../validators');

const router = express.Router();

/**
 * @swagger
 * /api/pets:
 *   get:
 *     summary: Get all pets with search & filter
 *     tags: [Pets]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: species
 *         schema:
 *           type: string
 *       - in: query
 *         name: owner_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pets
 */
router.get('/', async (req, res, next) => {
    try {
        const { search, species, owner_id, page = 1, limit = 10 } = req.query;

        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (species) {
            where.species = { contains: species, mode: 'insensitive' };
        }
        if (owner_id) {
            where.ownerId = owner_id;
        }

        const skip = (page - 1) * limit;

        const pets = await prisma.pet.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                owner: true,
                appointments: true,
                medicalRecords: true,
            },
        });

        const total = await prisma.pet.count({ where });

        res.json({
            success: true,
            data: pets,
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
 * /api/pets/{id}:
 *   get:
 *     summary: Get pet by ID
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.get('/:id', async (req, res, next) => {
    try {
        const pet = await prisma.pet.findUnique({
            where: { id: req.params.id },
            include: {
                owner: true,
                appointments: true,
                medicalRecords: true,
            },
        });

        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        res.json({ success: true, data: pet });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Create new pet with image upload
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *               breed:
 *                 type: string
 *               gender:
 *                 type: string
 *               birth_date:
 *                 type: string
 *               owner_id:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 */
router.post('/', authMiddleware, upload.single('image'), handleUploadErrors, async (req, res, next) => {
    try {
        const { name, species, breed, gender, birth_date, owner_id } = req.body;

        // Only customer can create pets for themselves, or admin can create for anyone
        if (req.user.role === 'CUSTOMER' && req.user.id !== owner_id) {
            return res.status(403).json({ success: false, error: 'Customers can only create pets for themselves' });
        }

        // Validate required fields
        if (!name || !species || !owner_id) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Validate pet data
        const validationErrors = validatePet({ name, species, ownerId: owner_id });
        if (validationErrors.length > 0) {
            return res.status(400).json({ success: false, errors: validationErrors });
        }

        let imageUrl = null;
        if (req.file) {
            try {
                imageUrl = await uploadImage(req.file.buffer, `pet-${uuidv4()}`);
            } catch (error) {
                return res.status(400).json({ success: false, error: error.message });
            }
        }

        const pet = await prisma.pet.create({
            data: {
                name,
                species,
                breed: breed || null,
                gender: gender || null,
                birth_date: birth_date ? new Date(birth_date) : null,
                image_url: imageUrl,
                ownerId: owner_id,
            },
            include: { owner: true },
        });

        res.status(201).json({
            success: true,
            message: 'Pet created successfully',
            data: pet,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   put:
 *     summary: Update pet with image
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', authMiddleware, upload.single('image'), handleUploadErrors, async (req, res, next) => {
    try {
        const { name, species, breed, gender, birth_date } = req.body;

        const pet = await prisma.pet.findUnique({ where: { id: req.params.id } });
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        // Only pet owner or admin can update
        if (req.user.role !== 'ADMIN' && req.user.id !== pet.ownerId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Validate updated fields if provided
        if (name || species) {
            const validationErrors = validatePet({
                name: name || pet.name,
                species: species || pet.species,
                ownerId: pet.ownerId
            });
            if (validationErrors.length > 0) {
                return res.status(400).json({ success: false, errors: validationErrors });
            }
        }

        let imageUrl = pet.image_url;
        if (req.file) {
            try {
                imageUrl = await uploadImage(req.file.buffer, `pet-${pet.id}`);
            } catch (error) {
                return res.status(400).json({ success: false, error: error.message });
            }
        }

        const updatedPet = await prisma.pet.update({
            where: { id: req.params.id },
            data: {
                name: name || pet.name,
                species: species || pet.species,
                breed: breed !== undefined ? breed : pet.breed,
                gender: gender !== undefined ? gender : pet.gender,
                birth_date: birth_date ? new Date(birth_date) : pet.birth_date,
                image_url: imageUrl,
            },
            include: { owner: true },
        });

        res.json({
            success: true,
            message: 'Pet updated successfully',
            data: updatedPet,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   delete:
 *     summary: Delete pet
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const pet = await prisma.pet.findUnique({ where: { id: req.params.id } });
        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        // Only pet owner or admin can delete
        if (req.user.role !== 'ADMIN' && req.user.id !== pet.ownerId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        await prisma.pet.delete({ where: { id: req.params.id } });

        res.json({
            success: true,
            message: 'Pet deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
