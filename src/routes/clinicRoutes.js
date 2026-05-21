const express = require('express');
const prisma = require('../prismaClient');
const { handleValidationErrors, handleNotFound, handleServerError, getPaginationParams, getSearchParams } = require('../middleware');
const { validatePetOwner, validatePet, validateService, validateAppointment, validateInvoice, validateStaff, validateUser } = require('../validators');
const router = express.Router();

// ============ HÀM TRỢ GIÚP ============
/**
 * Trả về lỗi 404
 */
function send404(res, name) {
    res.status(404).json({ success: false, error: `${name} not found` });
}

// ============ CHỦ THÚ CƯNG (PET OWNERS) ============

/**
 * @swagger
 * /api/owners:
 *   post:
 *     summary: Create a new pet owner
 *     tags: [Pet Owners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PetOwner'
 *     responses:
 *       201:
 *         description: Owner created successfully
 */
router.post('/owners', async (req, res, next) => {
    try {
        const owner = await prisma.petOwner.create({ data: req.body });
        res.status(201).json(owner);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/owners:
 *   get:
 *     summary: Get all pet owners
 *     tags: [Pet Owners]
 *     responses:
 *       200:
 *         description: List of all pet owners
 */
router.get('/owners', async (req, res, next) => {
    try {
        const owners = await prisma.petOwner.findMany({ include: { pets: true, invoices: true } });
        res.json(owners);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/owners/{id}:
 *   get:
 *     summary: Get pet owner by ID
 *     tags: [Pet Owners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Pet owner found
 *       404:
 *         description: Owner not found
 */
router.get('/owners/:id', async (req, res, next) => {
    try {
        const owner = await prisma.petOwner.findUnique({
            where: { id: req.params.id },
            include: { pets: true, invoices: true },
        });
        if (!owner) return send404(res, 'Owner');
        res.json(owner);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/owners/{id}:
 *   put:
 *     summary: Update pet owner
 *     tags: [Pet Owners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Owner updated successfully
 */
router.put('/owners/:id', async (req, res, next) => {
    try {
        const owner = await prisma.petOwner.update({ where: { id: req.params.id }, data: req.body });
        res.json(owner);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/owners/{id}:
 *   delete:
 *     summary: Delete pet owner
 *     tags: [Pet Owners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Owner deleted successfully
 */
router.delete('/owners/:id', async (req, res, next) => {
    try {
        await prisma.petOwner.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ PETS ============

/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Create a new pet
 *     tags: [Pets]
 *     responses:
 *       201:
 *         description: Pet created successfully
 */
router.post('/pets', async (req, res, next) => {
    try {
        const pet = await prisma.pet.create({ data: req.body });
        res.status(201).json(pet);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets:
 *   get:
 *     summary: Get all pets
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: List of all pets
 */
router.get('/pets', async (req, res, next) => {
    try {
        const pets = await prisma.pet.findMany({ include: { owner: true, appointments: true, medicalRecords: true, invoices: true } });
        res.json(pets);
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
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Pet found
 *       404:
 *         description: Pet not found
 */
router.get('/pets/:id', async (req, res, next) => {
    try {
        const pet = await prisma.pet.findUnique({
            where: { id: req.params.id },
            include: { owner: true, appointments: true, medicalRecords: true, invoices: true },
        });
        if (!pet) return send404(res, 'Pet');
        res.json(pet);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   put:
 *     summary: Update pet
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Pet updated successfully
 */
router.put('/pets/:id', async (req, res, next) => {
    try {
        const pet = await prisma.pet.update({ where: { id: req.params.id }, data: req.body });
        res.json(pet);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Pet deleted successfully
 */
router.delete('/pets/:id', async (req, res, next) => {
    try {
        await prisma.pet.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ SERVICES ============

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     responses:
 *       201:
 *         description: Service created successfully
 */
router.post('/services', async (req, res, next) => {
    try {
        const service = await prisma.service.create({ data: req.body });
        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of all services
 */
router.get('/services', async (req, res, next) => {
    try {
        const services = await prisma.service.findMany();
        res.json(services);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Service found
 *       404:
 *         description: Service not found
 */
router.get('/services/:id', async (req, res, next) => {
    try {
        const service = await prisma.service.findUnique({ where: { id: req.params.id } });
        if (!service) return send404(res, 'Service');
        res.json(service);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Service updated successfully
 */
router.put('/services/:id', async (req, res, next) => {
    try {
        const service = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
        res.json(service);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Service deleted successfully
 */
router.delete('/services/:id', async (req, res, next) => {
    try {
        await prisma.service.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ APPOINTMENTS ============

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/appointments', async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.create({ data: req.body });
        res.status(201).json(appointment);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: List of all appointments
 */
router.get('/appointments', async (req, res, next) => {
    try {
        const appointments = await prisma.appointment.findMany({ include: { pet: true, staff: true, service: true } });
        res.json(appointments);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Appointment found
 *       404:
 *         description: Appointment not found
 */
router.get('/appointments/:id', async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: req.params.id },
            include: { pet: true, staff: true, service: true },
        });
        if (!appointment) return send404(res, 'Appointment');
        res.json(appointment);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.put('/appointments/:id', async (req, res, next) => {
    try {
        const appointment = await prisma.appointment.update({ where: { id: req.params.id }, data: req.body });
        res.json(appointment);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Appointment deleted successfully
 */
router.delete('/appointments/:id', async (req, res, next) => {
    try {
        await prisma.appointment.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ MEDICAL RECORDS ============

/**
 * @swagger
 * /api/medical-records:
 *   post:
 *     summary: Create a new medical record
 *     tags: [Medical Records]
 *     responses:
 *       201:
 *         description: Medical record created successfully
 */
router.post('/medical-records', async (req, res, next) => {
    try {
        const record = await prisma.medicalRecord.create({ data: req.body });
        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     summary: Get all medical records
 *     tags: [Medical Records]
 *     responses:
 *       200:
 *         description: List of all medical records
 */
router.get('/medical-records', async (req, res, next) => {
    try {
        const records = await prisma.medicalRecord.findMany({ include: { pet: true } });
        res.json(records);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Medical record found
 *       404:
 *         description: Medical record not found
 */
router.get('/medical-records/:id', async (req, res, next) => {
    try {
        const record = await prisma.medicalRecord.findUnique({ where: { id: req.params.id }, include: { pet: true } });
        if (!record) return send404(res, 'Medical record');
        res.json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records/{id}:
 *   put:
 *     summary: Update medical record
 *     tags: [Medical Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Medical record updated successfully
 */
router.put('/medical-records/:id', async (req, res, next) => {
    try {
        const record = await prisma.medicalRecord.update({ where: { id: req.params.id }, data: req.body });
        res.json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/medical-records/{id}:
 *   delete:
 *     summary: Delete medical record
 *     tags: [Medical Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Medical record deleted successfully
 */
router.delete('/medical-records/:id', async (req, res, next) => {
    try {
        await prisma.medicalRecord.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ INVOICES ============

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post('/invoices', async (req, res, next) => {
    try {
        const invoice = await prisma.invoice.create({
            data: {
                ...req.body,
                items: {
                    create: req.body.items || [],
                },
            },
            include: { items: true },
        });
        res.status(201).json(invoice);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: List of all invoices
 */
router.get('/invoices', async (req, res, next) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { pet: true, owner: true, items: { include: { service: true } } },
        });
        res.json(invoices);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invoice found
 *       404:
 *         description: Invoice not found
 */
router.get('/invoices/:id', async (req, res, next) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { pet: true, owner: true, items: { include: { service: true } } },
        });
        if (!invoice) return send404(res, 'Invoice');
        res.json(invoice);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 */
router.put('/invoices/:id', async (req, res, next) => {
    try {
        const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
        res.json(invoice);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Invoice deleted successfully
 */
router.delete('/invoices/:id', async (req, res, next) => {
    try {
        await prisma.invoice.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ STAFF ============

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     responses:
 *       201:
 *         description: Staff member created successfully
 */
router.post('/staff', async (req, res, next) => {
    try {
        const staff = await prisma.staff.create({ data: req.body });
        res.status(201).json(staff);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     responses:
 *       200:
 *         description: List of all staff members
 */
router.get('/staff', async (req, res, next) => {
    try {
        const staff = await prisma.staff.findMany({ include: { appointments: true } });
        res.json(staff);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Staff member found
 *       404:
 *         description: Staff member not found
 */
router.get('/staff/:id', async (req, res, next) => {
    try {
        const staff = await prisma.staff.findUnique({ where: { id: req.params.id }, include: { appointments: true } });
        if (!staff) return send404(res, 'Staff');
        res.json(staff);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 */
router.put('/staff/:id', async (req, res, next) => {
    try {
        const staff = await prisma.staff.update({ where: { id: req.params.id }, data: req.body });
        res.json(staff);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Delete staff member
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Staff member deleted successfully
 */
router.delete('/staff/:id', async (req, res, next) => {
    try {
        await prisma.staff.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

// ============ USERS ============

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', async (req, res, next) => {
    try {
        const user = await prisma.user.create({ data: req.body });
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', async (req, res, next) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return send404(res, 'User');
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:id', async (req, res, next) => {
    try {
        const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: User deleted successfully
 */
router.delete('/users/:id', async (req, res, next) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
