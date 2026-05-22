# Backend API Test Scenarios

## ✅ SYSTEM READINESS CHECK

### Server Status
- ✅ Running on PORT 4000
- ✅ No startup errors
- ✅ Swagger docs at http://localhost:4000/api-docs

### Database
- ✅ PostgreSQL connected (Neon Cloud)
- ✅ All models migrated
- ✅ Admin user available (admin@benhvienabc.com / admin123)

---

## 🔑 AUTHENTICATION TESTS

### 1. Register New Customer ✅
```
POST /api/auth/register
Body: {
  "username": "customer1",
  "email": "customer1@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "0123456789"
}
Expected: 201, JWT token, role=CUSTOMER (forced)
Note: Role parameter ignored, always set to CUSTOMER
```

### 2. Login ✅
```
POST /api/auth/login
Body: {
  "username": "customer1",
  "password": "password123"
}
Expected: 200, JWT token
```

### 3. Get User Profile ✅
```
GET /api/auth/me
Headers: Authorization: Bearer {TOKEN}
Expected: 200, user profile with relations
```

---

## 🐾 PET MANAGEMENT TESTS

### 4. Create Pet (with validation) ✅
```
POST /api/pets
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Body: {
  "name": "Fluffy",
  "species": "Cat",
  "breed": "Persian",
  "gender": "Female",
  "birth_date": "2020-01-15",
  "owner_id": "{CUSTOMER_ID}"
}
Expected: 201, pet created
Validation: name and species required and non-empty
```

### 5. Get Pets with Search ✅
```
GET /api/pets?search=Fluffy&page=1&limit=10
Expected: 200, paginated list, total count
```

### 6. Get Pet by ID ✅
```
GET /api/pets/{PET_ID}
Expected: 200, pet with owner, appointments, medical records
```

### 7. Update Pet (with validation) ✅
```
PUT /api/pets/{PET_ID}
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Body: {
  "name": "Fluffy Updated",
  "species": "Cat"
}
Expected: 200, updated pet
Authorization: Owner or ADMIN only
Validation: name and species validated if provided
```

### 8. Delete Pet ✅
```
DELETE /api/pets/{PET_ID}
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Expected: 200, pet deleted
Authorization: Owner or ADMIN only
```

---

## 📅 APPOINTMENT MANAGEMENT TESTS

### 9. Create Appointment (with priority & notification) ✅
```
POST /api/appointments
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Body: {
  "pet_id": "{PET_ID}",
  "appointment_date": "2024-12-25T10:00:00Z",
  "priority_level": "EMERGENCY",
  "reason": "Injured paw",
  "service_id": "{SERVICE_ID}"
}
Expected: 201, appointment created
Features:
- Only pet owner or admin can book
- EMERGENCY: auto-assigns available doctor
- Email notification sent to customer
- Validation: pet_id and appointment_date required
```

### 10. Get Appointments with Filters ✅
```
GET /api/appointments?status=SCHEDULED&priority_level=EMERGENCY&page=1
Expected: 200, filtered list with pagination
```

### 11. Update Appointment Status (with notification) ✅
```
PUT /api/appointments/{APPOINTMENT_ID}
Headers: Authorization: Bearer {DOCTOR_TOKEN}
Body: {
  "status": "COMPLETED",
  "notes": "Treatment completed successfully"
}
Expected: 200, updated appointment
Features:
- Only customer, doctor, or admin can update
- Status change triggers email notification
Authorization: customer/doctor/admin
```

### 12. Cancel Appointment (with notification) ✅
```
DELETE /api/appointments/{APPOINTMENT_ID}
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Expected: 200, appointment cancelled
Features:
- Email notification sent to customer
- Cancellation email notification sent
Authorization: customer/doctor/admin
```

### 13. Get Doctor Schedule ✅
```
GET /api/appointments/doctor/{DOCTOR_ID}/schedule
Expected: 200, appointments ordered by date
```

---

## 📋 MEDICAL RECORDS TESTS

### 14. Create Medical Record (Doctor only) ✅
```
POST /api/medical-records
Headers: Authorization: Bearer {DOCTOR_TOKEN}
Body: {
  "pet_id": "{PET_ID}",
  "visit_date": "2024-12-25T10:00:00Z",
  "diagnosis": "Acute infection",
  "treatment": "Antibiotic injection",
  "notes": "Follow-up after 5 days"
}
Expected: 201, record created
Authorization: DOCTOR or ADMIN
Doctor auto-set to req.user.id
```

### 15. Get Medical Records with Filter ✅
```
GET /api/medical-records?pet_id={PET_ID}&page=1
Expected: 200, records ordered by visit_date DESC
Pagination: page, limit
```

### 16. Update Medical Record ✅
```
PUT /api/medical-records/{RECORD_ID}
Headers: Authorization: Bearer {DOCTOR_TOKEN}
Body: {
  "diagnosis": "Updated diagnosis",
  "treatment": "New treatment"
}
Expected: 200, updated
Authorization: Doctor can only edit own; ADMIN can edit any
```

### 17. Delete Medical Record ✅
```
DELETE /api/medical-records/{RECORD_ID}
Headers: Authorization: Bearer {DOCTOR_TOKEN}
Expected: 200, deleted
Authorization: Same as update
```

---

## 👥 USER MANAGEMENT TESTS

### 18. Get All Users (Admin only) ✅
```
GET /api/users?role=DOCTOR&search=John&page=1
Expected: 200, filtered list
Authorization: ADMIN only
Features: Search by username/email/full_name, filter by role
```

### 19. Get User by ID ✅
```
GET /api/users/{USER_ID}
Headers: Authorization: Bearer {TOKEN}
Expected: 200, user details
Authorization: Self or ADMIN
```

### 20. Update User Profile ✅
```
PUT /api/users/{USER_ID}
Headers: Authorization: Bearer {TOKEN}
Body: {
  "full_name": "John Updated",
  "phone": "0987654321",
  "role": "DOCTOR"
}
Expected: 200, updated
Authorization Rules:
- Customer: can update own full_name/phone only
- Admin: can update anyone and change role
```

### 21. Delete User (Admin only, cascade delete) ✅
```
DELETE /api/users/{USER_ID}
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200, user deleted with all related data
Authorization: ADMIN only
Features:
- Cannot delete self
- Cascading delete: medical records → appointments → invoices → pets → user
- All related data cleaned up
```

### 22. Get User Statistics by Role ✅
```
GET /api/users/stats/roles
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200, count by role (ADMIN, DOCTOR, CUSTOMER)
Authorization: ADMIN only
```

---

## 📊 STATISTICS TESTS

### 23. Dashboard Statistics (Admin/Doctor only) ✅
```
GET /api/statistics/dashboard
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200, dashboard data
Data includes:
- Total: users, pets, appointments, medical records
- Appointments: by status, by priority
- Top 5 pet species
- Doctor and customer counts
Authorization: ADMIN or DOCTOR
```

### 24. Appointment Statistics by Month ✅
```
GET /api/statistics/appointments?month=12&year=2024
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200, monthly stats
Authorization: ADMIN only
```

---

## 🏥 CLINIC MANAGEMENT TESTS

### 25. Get Clinic Info (Public) ✅
```
GET /api/clinic/info
Expected: 200, clinic information
Note: Public endpoint, no auth required
```

### 26. Update/Create Clinic Info (Admin only) ✅
```
PUT /api/clinic/info
Headers: Authorization: Bearer {ADMIN_TOKEN}
Body: {
  "name": "Pet Hospital ABC",
  "email": "info@pethosp.com",
  "phone": "0123456789",
  "address": "123 Main St",
  "city": "Ho Chi Minh City",
  "opening_hour": "08:00",
  "closing_hour": "18:00",
  "website": "https://pethosp.com"
}
Expected: 200, created or updated
Features: Creates if not exists, updates if exists
Authorization: ADMIN only
```

### 27. Get Services (Public) ✅
```
GET /api/clinic/services?search=vaccination&page=1
Expected: 200, paginated services
Search: by name
```

### 28. Create Service (Admin only) ✅
```
POST /api/clinic/services
Headers: Authorization: Bearer {ADMIN_TOKEN}
Body: {
  "name": "Vaccination",
  "description": "Pet vaccination service",
  "price": 500000,
  "durationMin": 30
}
Expected: 201, service created
Validation: name and price required
Authorization: ADMIN only
```

### 29. Update Service (Admin only) ✅
```
PUT /api/clinic/services/{SERVICE_ID}
Headers: Authorization: Bearer {ADMIN_TOKEN}
Body: {
  "price": 600000,
  "description": "Updated description"
}
Expected: 200, updated
Authorization: ADMIN only
```

### 30. Delete Service (Admin only) ✅
```
DELETE /api/clinic/services/{SERVICE_ID}
Headers: Authorization: Bearer {ADMIN_TOKEN}
Expected: 200, deleted
Authorization: ADMIN only
```

---

## 🔐 SECURITY & AUTHORIZATION TESTS

### 31. Test Unauthorized Access ✅
```
GET /api/users (without token)
Expected: 401, "No token provided"
```

### 32. Test Role-Based Access ✅
```
POST /api/medical-records (as CUSTOMER)
Expected: 403, "Access denied"
Only DOCTOR or ADMIN allowed
```

### 33. Test Ownership Verification ✅
```
PUT /api/pets/{ANOTHER_USERS_PET}
Headers: Authorization: Bearer {CUSTOMER_TOKEN}
Expected: 403, "Access denied"
Only owner or ADMIN can update
```

### 34. Test Admin-Only Endpoints ✅
```
DELETE /api/users/{USER_ID} (as DOCTOR)
Expected: 403, "Access denied"
Only ADMIN allowed
```

---

## 🔔 NOTIFICATION TESTS

### 35. Verify Appointment Booking Email ✅
Feature: sendAppointmentReminder triggers on POST /api/appointments
Verify: Email sent to customer with:
- Pet name
- Appointment date/time
- Appointment reason
- Priority level

### 36. Verify Status Update Email ✅
Feature: Email sent on PUT /api/appointments when status changes
Verify: Email contains:
- Pet name
- New status
- Appointment date/time

### 37. Verify Cancellation Email ✅
Feature: Email sent on DELETE /api/appointments
Verify: Email contains:
- Pet name
- Cancellation notice
- Contact information

---

## ✅ REQUIREMENT VERIFICATION

| Requirement | Status | Notes |
|-------------|--------|-------|
| Quản lý thông tin thú cưng | ✅ | CRUD, search, pagination |
| Tra cứu nhanh chóng | ✅ | Search & filter on all entities |
| Quản lý lịch khám | ✅ | Booking, scheduling, cancellation |
| Phân loại & ưu tiên | ✅ | Priority levels, auto-assign doctor |
| Quản lý người dùng | ✅ | Role-based, authorization checks |
| Thông báo & nhắc lịch | ✅ | Email notifications via nodemailer |
| Báo cáo & thống kê | ✅ | Dashboard, appointments, species |
| Hiệu năng | ✅ | Pagination, efficient queries |
| Bảo mật dữ liệu | ✅ | JWT, password hashing, role-based |

---

## 📝 FINAL CHECKLIST

- [x] Server running on PORT 4000
- [x] Database connected
- [x] All routes mounted
- [x] Authentication working (JWT)
- [x] Authorization checks in place
- [x] Notifications integrated
- [x] Validators integrated
- [x] Cascade delete implemented
- [x] Pagination on all list endpoints
- [x] Error handling with middleware
- [x] Swagger documentation available
