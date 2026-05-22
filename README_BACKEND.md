# Pet Hospital Backend 🏥🐾

Backend API cho hệ thống quản lý bệnh viện thú y.

## Tính năng

### ✅ Đã cài đặt:
- **Auth System**: JWT-based authentication, Login/Register
- **User Management**: ADMIN, DOCTOR, CUSTOMER roles
- **Pet Management**: CRUD pets, upload ảnh (Cloudinary)
- **Appointments**: Booking, scheduling, doctor assignment
- **Medical Records**: Lịch sử khám, chẩn đoán, điều trị
- **Statistics & Reports**: Dashboard, appointment stats, revenue tracking
- **Notifications**: Email reminders, appointment confirmations
- **Search & Filter**: Tìm kiếm pets, appointments, medical records

## Công nghệ

- **Node.js + Express.js**: Backend framework
- **PostgreSQL (Neon)**: Database
- **Prisma ORM**: Database management
- **JWT**: Authentication
- **Cloudinary**: Image upload service
- **Nodemailer**: Email notifications
- **Swagger**: API documentation

## Cấu trúc thư mục

```
src/
├── index.js                 # Server entry point
├── prismaClient.js         # Prisma client
├── middleware/
│   ├── authMiddleware.js   # JWT authentication
│   ├── uploadMiddleware.js # File upload
│   └── index.js            # Other middleware
├── routes/
│   ├── authRoutes.js       # Login/Register
│   ├── petRoutes.js        # Pet CRUD
│   ├── appointmentRoutes.js    # Appointment booking
│   ├── medicalRecordRoutes.js  # Medical records
│   ├── statisticsRoutes.js     # Reports & stats
│   └── clinicRoutes.js     # Legacy routes
├── services/
│   ├── cloudinaryService.js    # Image upload
│   └── notificationService.js  # Email notifications
├── utils/
│   └── auth.js             # JWT utilities
└── validators.js           # Data validation
```

## Setup & Installation

### 1. Prerequisites
- Node.js 16+
- PostgreSQL database
- Cloudinary account (for image upload)
- Email service (Gmail with App Password or similar)

### 2. Installation

```bash
# Clone repository
git clone <repo-url>
cd BenhVienABC-Backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Open Prisma Studio
npm run prisma:studio
```

### 4. Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=4000

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Email (Gmail example)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=Pet Hospital <noreply@pethospital.com>
```

### 5. Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will start on `http://localhost:4000`

## API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login
GET    /api/auth/me           - Get current user
```

### Pets
```
GET    /api/pets              - Get all pets (search, filter)
GET    /api/pets/:id          - Get pet by ID
POST   /api/pets              - Create pet with image
PUT    /api/pets/:id          - Update pet
DELETE /api/pets/:id          - Delete pet
```

### Appointments
```
GET    /api/appointments      - Get appointments (filter)
GET    /api/appointments/:id  - Get appointment by ID
POST   /api/appointments      - Create appointment (booking)
PUT    /api/appointments/:id  - Update appointment
DELETE /api/appointments/:id  - Cancel appointment
GET    /api/appointments/doctor/:id/schedule - Doctor's schedule
```

### Medical Records
```
GET    /api/medical-records           - Get records (filter)
GET    /api/medical-records/:id       - Get record by ID
POST   /api/medical-records           - Create record (Doctor only)
PUT    /api/medical-records/:id       - Update record
DELETE /api/medical-records/:id       - Delete record
GET    /api/medical-records/pet/:id/history - Pet's history
```

### Statistics
```
GET    /api/statistics/dashboard      - Dashboard stats
GET    /api/statistics/appointments   - Appointment stats
GET    /api/statistics/doctor/:id     - Doctor performance
GET    /api/statistics/revenue        - Revenue stats
GET    /api/statistics/pet-health     - Pet health stats
```

### API Documentation
```
GET    /api-docs              - Swagger UI
```

## Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

### User Roles:
- **ADMIN**: Full access to all features
- **DOCTOR**: Can create/update medical records, manage appointments
- **CUSTOMER**: Can book appointments, view own pets & records

## Features Detail

### 1. Auth System
- Bcrypt password hashing
- JWT token generation (expires in 7 days)
- Role-based access control

### 2. Image Upload
- Multer for file handling
- Cloudinary for storage
- Max file size: 5MB
- Supported formats: JPG, PNG, GIF, WebP

### 3. Appointment Booking
- Auto-assign doctor for emergency cases
- Priority levels: EMERGENCY, URGENT, NORMAL
- Status tracking: SCHEDULED, COMPLETED, CANCELLED

### 4. Notifications
- Email reminders 24 hours before appointment
- Appointment confirmation emails
- Medical result notifications
- Doctor notifications

### 5. Statistics & Reports
- Dashboard overview
- Appointment statistics
- Doctor performance metrics
- Revenue tracking
- Pet health analytics

## Search & Filter

### Pets Search
```
GET /api/pets?search=name&species=dog&owner_id=xxx&page=1&limit=10
```

### Appointments Filter
```
GET /api/appointments?status=SCHEDULED&priority_level=URGENT&doctor_id=xxx
```

### Medical Records Filter
```
GET /api/medical-records?pet_id=xxx&doctor_id=xxx&page=1&limit=10
```

## Error Handling

API returns standardized error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `500`: Server error

## Development

### Run tests
```bash
npm run test
```

### Generate Prisma types
```bash
npm run prisma:generate
```

### View database
```bash
npm run prisma:studio
```

## Production Deployment

1. Set all environment variables
2. Run database migrations: `npm run prisma:migrate`
3. Build if needed: `npm run build`
4. Start server: `npm start`

## Security

- JWT_SECRET should be strong and unique
- Use HTTPS in production
- Keep dependencies updated
- Validate all inputs
- Use environment variables for sensitive data

## Contributing

1. Create feature branch
2. Commit changes
3. Push to branch
4. Create Pull Request

## License

MIT License

## Support

For issues or questions, please contact the development team.

---

**Last Updated**: May 2026
