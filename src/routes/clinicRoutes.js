/**
 * @deprecated This file is deprecated. Use clinicInfoRoutes.js instead.
 * 
 * This file previously used a non-existent PetOwner model.
 * All functionality has been moved to appropriate routes.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        warning: 'clinicRoutes is deprecated. Please use appropriate endpoints:',
        endpoints: {
            clinic_info: '/api/clinic/info',
            services: '/api/clinic/services',
            pets: '/api/pets',
            appointments: '/api/appointments',
            users: '/api/users'
        }
    });
});

module.exports = router;
