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
        const { search, species, gender, owner_id, page = 1, limit = 10 } = req.query;

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

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
        if (gender) {
            where.gender = gender;
        }

        // Debug log
        console.log('📋 GET /pets - Query:', { page: pageNum, limit: limitNum, search, species, owner_id });
        console.log('📋 WHERE filter:', where);

        const skip = (pageNum - 1) * limitNum;

        // Get total count BEFORE pagination
        const total = await prisma.pet.count({ where });
        console.log('📋 Total pets matching filter:', total);

        const pets = await prisma.pet.findMany({
            where,
            skip,
            take: limitNum,
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                appointments: true,
                medicalRecords: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        console.log(`✅ Returned ${pets.length} pets, Total: ${total}, Page: ${pageNum}/${Math.ceil(total / limitNum)}`);

        res.json({
            success: true,
            data: pets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets/my-pets:
 *   get:
 *     summary: Get all pets of current logged-in user with search & filter
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
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
 *         name: gender
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
 *         description: List of pets owned by current user
 *       401:
 *         description: Unauthorized
 */
router.get('/my-pets', authMiddleware, async (req, res, next) => {
    try {
        const { search, species, gender, page = 1, limit = 10 } = req.query;

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = { ownerId: req.user.id };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (species) {
            where.species = { contains: species, mode: 'insensitive' };
        }
        if (gender) {
            where.gender = gender;
        }

        // Debug log
        console.log(`📋 GET /pets/my-pets - User: ${req.user.id}, Query:`, { page: pageNum, limit: limitNum, search, species, gender });
        console.log('📋 WHERE filter:', where);

        const skip = (pageNum - 1) * limitNum;

        // Get total count of user's pets matching filter
        const total = await prisma.pet.count({ where });
        console.log(`📋 Total pets of user ${req.user.id} matching filter: ${total}`);

        const pets = await prisma.pet.findMany({
            where,
            skip,
            take: limitNum,
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                appointments: true,
                medicalRecords: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        console.log(`✅ Returned ${pets.length} pets, Total: ${total}, Page: ${pageNum}/${Math.ceil(total / limitNum)} for user ${req.user.id}`);

        res.json({
            success: true,
            data: pets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets/my-pets/{id}:
 *   get:
 *     summary: Get pet details of current logged-in user by ID
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pet details owned by current user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Pet does not belong to user
 *       404:
 *         description: Pet not found
 */
router.get('/my-pets/:id', authMiddleware, async (req, res, next) => {
    try {
        const petId = req.params.id;

        console.log(`📋 GET /pets/my-pets/${petId} - User: ${req.user.id}`);

        const pet = await prisma.pet.findUnique({
            where: { id: petId },
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                appointments: {
                    select: {
                        id: true,
                        appointment_date: true,
                        status: true,
                        reason: true,
                    },
                },
                medicalRecords: {
                    select: {
                        id: true,
                        visit_date: true,
                        diagnosis: true,
                        treatment: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!pet) {
            console.log(`❌ Pet ${petId} not found`);
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        // Check if pet belongs to current user
        if (pet.ownerId !== req.user.id) {
            console.log(`❌ Access denied - Pet ${petId} belongs to user ${pet.ownerId}, not ${req.user.id}`);
            return res.status(403).json({ success: false, error: 'This pet does not belong to you' });
        }

        console.log(`✅ Retrieved pet ${petId} for user ${req.user.id}`);

        res.json({ success: true, data: pet });
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
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                appointments: true,
                medicalRecords: true,
                createdAt: true,
                updatedAt: true,
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
 *     summary: Create new pet 
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
 *               weight:
 *                 type: number
 *                 format: float
 *               owner_id:
 *                 type: string

 */
router.post('/', authMiddleware, upload.single('image'), handleUploadErrors, async (req, res, next) => {
    try {
        const { name, species, breed, gender, birth_date, weight, owner_id } = req.body;

        // Only customer can create pets for themselves
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

        // let imageUrl = null;
        // if (req.file) {
        //     try {
        //         imageUrl = await uploadImage(req.file.buffer, `pet-${uuidv4()}`);
        //     } catch (error) {
        //         return res.status(400).json({ success: false, error: error.message });
        //     }
        // }

        const pet = await prisma.pet.create({
            data: {
                name,
                species,
                breed: breed || null,
                gender: gender || null,
                birth_date: birth_date ? new Date(birth_date) : null,
                weight: weight ? parseFloat(weight) : null,
                // image_url: imageUrl,
                ownerId: owner_id,
            },
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                // image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
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
        const { name, species, breed, gender, birth_date, weight } = req.body;

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
                weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : pet.weight,
                image_url: imageUrl,
            },
            select: {
                id: true,
                name: true,
                species: true,
                breed: true,
                gender: true,
                birth_date: true,
                weight: true,
                image_url: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        full_name: true,
                        email: true,
                        phone: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
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
 * /api/pets/{id}/check-dependencies:
 *   get:
 *     summary: Check pet dependencies before deletion
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dependencies check result
 */
router.get('/:id/check-dependencies', authMiddleware, async (req, res, next) => {
    try {
        const pet = await prisma.pet.findUnique({
            where: { id: req.params.id },
            include: {
                appointments: true,
                medicalRecords: true,
                invoices: {
                    include: { items: true },
                },
            },
        });

        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        const dependencies = {
            appointments: pet.appointments.length,
            medicalRecords: pet.medicalRecords.length,
            invoices: pet.invoices.length,
            invoiceItems: pet.invoices.reduce((sum, inv) => sum + inv.items.length, 0),
            hasRelations: pet.appointments.length > 0 || pet.medicalRecords.length > 0 || pet.invoices.length > 0,
            details: {
                appointmentIds: pet.appointments.map(a => a.id),
                medicalRecordIds: pet.medicalRecords.map(m => m.id),
                invoiceIds: pet.invoices.map(i => i.id),
            },
        };

        res.json({
            success: true,
            data: dependencies,
            warning: dependencies.hasRelations
                ? `⚠️ Pet này có liên kết với ${dependencies.appointments} appointments, ${dependencies.medicalRecords} medical records, ${dependencies.invoices} invoices. Xóa pet sẽ xóa tất cả dữ liệu này!`
                : null,
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
        const pet = await prisma.pet.findUnique({
            where: { id: req.params.id },
            include: {
                appointments: true,
                medicalRecords: true,
                invoices: {
                    include: { items: true },
                },
            },
        });

        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet not found' });
        }

        // Only pet owner or admin can delete
        if (req.user.role !== 'ADMIN' && req.user.id !== pet.ownerId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Collect information about related records that will be deleted
        const deletedData = {
            pet: pet.name,
            appointments: pet.appointments.length,
            medicalRecords: pet.medicalRecords.length,
            invoices: pet.invoices.length,
            totalInvoiceItems: pet.invoices.reduce((sum, inv) => sum + inv.items.length, 0),
        };

        // Delete pet (cascade delete will handle related records)
        await prisma.pet.delete({ where: { id: req.params.id } });

        res.json({
            success: true,
            message: `Pet "${pet.name}" deleted successfully with cascade deletions`,
            deletedRecords: deletedData,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
