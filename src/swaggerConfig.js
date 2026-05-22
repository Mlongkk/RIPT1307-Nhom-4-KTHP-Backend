const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// Xác định URL server dựa trên environment
const getServerUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return process.env.API_URL || 'https://ript1307-nhom-4-kthp-backend.onrender.com';
    }
    return 'http://localhost:4000';
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pet Hospital API',
            version: '1.0.0',
            description: 'Backend quản lý bệnh viện thú y Pet Hospital với PostgreSQL'
        },
        servers: [
            {
                url: getServerUrl(),
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            schemas: {
                PetOwner: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string'
                        },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        phone: {
                            type: 'string'
                        },
                        address: {
                            type: 'string'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Pet: {
                    type: 'object',
                    required: ['name', 'species', 'ownerId'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string'
                        },
                        species: {
                            type: 'string'
                        },
                        breed: {
                            type: 'string'
                        },
                        sex: {
                            type: 'string'
                        },
                        birthDate: {
                            type: 'string',
                            format: 'date'
                        },
                        ownerId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Service: {
                    type: 'object',
                    required: ['name', 'price', 'durationMin'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                        price: {
                            type: 'number',
                            format: 'float'
                        },
                        durationMin: {
                            type: 'integer'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Appointment: {
                    type: 'object',
                    required: ['petId', 'serviceId', 'scheduledAt'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        petId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        staffId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        serviceId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        scheduledAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        status: {
                            type: 'string',
                            enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED']
                        },
                        notes: {
                            type: 'string'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Invoice: {
                    type: 'object',
                    required: ['petId', 'ownerId', 'totalAmount'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        petId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        ownerId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        totalAmount: {
                            type: 'number',
                            format: 'float'
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'PAID', 'CANCELLED']
                        },
                        issuedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Staff: {
                    type: 'object',
                    required: ['name', 'email', 'role'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string'
                        },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        phone: {
                            type: 'string'
                        },
                        role: {
                            type: 'string'
                        },
                        specialty: {
                            type: 'string'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
