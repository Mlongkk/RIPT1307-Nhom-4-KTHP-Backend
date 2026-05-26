# 🔐 Quyền Hạn Của Mỗi Role - BenhVienABC Backend

## Tổng Quan

Hệ thống BenhVienABC có **3 role chính**: ADMIN, DOCTOR, và CUSTOMER. Mỗi role có các quyền khác nhau đối với các tài nguyên trong hệ thống.

---

## 📋 Chi Tiết Quyền Hạn

### 1. 🔴 ADMIN (Quản Trị Viên)

#### Mô Tả:
Có quyền truy cập và quản lý toàn bộ hệ thống.

#### Quyền Hạn:

| Resource | Create | Read | Update | Delete | Notes |
|----------|--------|------|--------|--------|-------|
| **Users** | ✅ | ✅ (All) | ✅ | ✅ | Quản lý tất cả users |
| **Customers** | ✅ | ✅ (All) | ✅ | ✅ | Quản lý thông tin khách hàng |
| **Pets** | ✅ | ✅ (All) | ✅ | ✅ | Quản lý tất cả thú cưng |
| **Appointments** | ✅ | ✅ (All) | ✅ | ✅ | Quản lý lịch hẹn |
| **Medical Records** | ✅ | ✅ (All) | ✅ | ✅ | Xem & quản lý tất cả hồ sơ y tế |
| **Statistics** | ❌ | ✅ | ❌ | ❌ | Xem thống kê |

#### Endpoints (Admin Only):
```
GET    /api/users                              - Lấy danh sách tất cả users
POST   /api/users                              - Tạo user mới
GET    /api/users/{id}                         - Xem chi tiết user
PUT    /api/users/{id}                         - Cập nhật thông tin user
DELETE /api/users/{id}                         - Xóa user
```

---

### 2. 🟢 DOCTOR (Bác Sĩ)

#### Mô Tả:
Quản lý các appointments và hồ sơ y tế của bệnh nhân (thú cưng).

#### Quyền Hạn:

| Resource | Create | Read | Update | Delete | Notes |
|----------|--------|------|--------|--------|-------|
| **Users** | ❌ | ❌ | ❌ | ❌ | Không quản lý users |
| **Customers** | ❌ | ✅ | ❌ | ❌ | Chỉ xem thông tin |
| **Pets** | ❌ | ✅ (All) | ❌ | ❌ | Chỉ xem thông tin |
| **Appointments** | ✅ | ✅ (All) | ✅ | ❌ | Tạo & cập nhật appointments |
| **Medical Records** | ✅ | ✅ (All) | ✅ | ❌ | Tạo & cập nhật hồ sơ y tế |
| **Statistics** | ❌ | ✅ | ❌ | ❌ | Xem thống kê công việc của mình |

#### Endpoints (Doctor Only):
```
POST   /api/appointments                       - Tạo appointment
PUT    /api/appointments/{id}                  - Cập nhật appointment
POST   /api/medical-records                    - Tạo hồ sơ y tế
PUT    /api/medical-records/{id}               - Cập nhật hồ sơ y tế

GET    /api/appointments                       - Xem appointments
GET    /api/appointments/{id}                  - Xem chi tiết appointment
GET    /api/medical-records                    - Xem hồ sơ y tế
GET    /api/medical-records/{id}               - Xem chi tiết hồ sơ y tế
GET    /api/customers                          - Xem danh sách khách hàng
GET    /api/pets                               - Xem danh sách thú cưng
```

---

### 3. 🔵 CUSTOMER (Khách Hàng)

#### Mô Tả:
Quản lý thông tin cá nhân, thú cưng, và đặt lịch hẹn khám bệnh.

#### Quyền Hạn:

| Resource | Create | Read | Update | Delete | Notes |
|----------|--------|------|--------|--------|-------|
| **Users** | ❌ | ✅ (Self) | ✅ (Self) | ❌ | Chỉ quản lý tài khoản của mình |
| **Customers** | ❌ | ✅ (Self) | ✅ (Self) | ❌ | Chỉ quản lý thông tin của mình |
| **Pets** | ✅ | ✅ (Own) | ✅ (Own) | ✅ (Own) | Quản lý thú cưng của mình |
| **Appointments** | ✅ | ✅ (Own) | ✅ (Own) | ✅ (Own) | Đặt & quản lý lịch hẹn của mình |
| **Medical Records** | ❌ | ✅ (Own Pets) | ❌ | ❌ | Xem hồ sơ y tế thú cưng của mình |
| **Statistics** | ❌ | ❌ | ❌ | ❌ | Không có quyền xem |

#### Endpoints (Customer):
```
GET    /api/auth/me                            - Xem thông tin cá nhân
PUT    /api/users/{id}                         - Cập nhật thông tin cá nhân (self only)

GET    /api/customers/{id}                     - Xem thông tin khách hàng (self only)
PUT    /api/customers/{id}                     - Cập nhật thông tin khách hàng (self only)

POST   /api/pets                               - Tạo thú cưng mới
GET    /api/pets                               - Xem danh sách thú cưng
GET    /api/pets/{id}                          - Xem chi tiết thú cưng
PUT    /api/pets/{id}                          - Cập nhật thông tin thú cưng (own only)
DELETE /api/pets/{id}                          - Xóa thú cưng (own only)

POST   /api/appointments                       - Đặt lịch hẹn
GET    /api/appointments                       - Xem danh sách appointments
GET    /api/appointments/{id}                  - Xem chi tiết appointment
PUT    /api/appointments/{id}                  - Cập nhật appointment (own only)
DELETE /api/appointments/{id}                  - Hủy appointment (own only)

GET    /api/medical-records                    - Xem hồ sơ y tế thú cưng
GET    /api/medical-records/{id}               - Xem chi tiết hồ sơ y tế (own pets only)
```

---

## 🔑 Quy Tắc Truy Cập

### Xác Thực (Authentication)
- ✅ Hầu hết endpoints yêu cầu **Bearer Token** (JWT)
- ✅ Token được cấp sau khi login thành công

### Phân Quyền (Authorization)
- **ADMIN**: Có quyền truy cập toàn bộ
- **DOCTOR**: Có quyền truy cập appointments & medical records
- **CUSTOMER**: Chỉ có quyền truy cập tài nguyên của chính mình

### Quy Tắc Ownership
- **Pets**: Mỗi pet thuộc sở hữu của 1 customer
- **Appointments**: Mỗi appointment thuộc về 1 customer & 1 doctor
- **Medical Records**: Mỗi hồ sơ y tế thuộc về 1 pet & được tạo bởi 1 doctor

---

## 📊 Bảng Tóm Tắt Quyền

```
                    ADMIN   DOCTOR   CUSTOMER
────────────────────────────────────────────
Users               ✅✅✅   ❌       ✅(self)
Customers           ✅✅✅   ✅(read) ✅(self)
Pets                ✅✅✅   ✅(read) ✅(own)
Appointments        ✅✅✅   ✅✅     ✅(own)
Medical Records     ✅✅✅   ✅✅     ✅(own)
Clinic Info         ✅✅✅   ✅(read) ✅(read)
Statistics          ✅(read) ✅(read) ❌
────────────────────────────────────────────
Legend: ✅ = Đầy đủ quyền | ✅(read) = Chỉ đọc | ✅(own/self) = Chỉ tài nguyên của mình | ❌ = Không có quyền
```

---

## 🔄 Luồng Login

### 1. **Login Bằng Username/Password**
```
POST /api/auth/login
Body: { username, password }
Response: { token, user: { id, username, role, ... } }
```

### 2. **Login Bằng Keycloak (OIDC)**
```
POST /api/auth/keycloak/callback
Body: { code }
Response: { token, accessToken, refreshToken, user }
```

### 3. **Refresh Token**
```
POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken }
```

### 4. **Logout**
```
POST /api/auth/logout
Header: Authorization: Bearer {token}
```

---

## 🚀 Cách Kiểm Tra Role

Mỗi request được xác thực sẽ có `req.user` object chứa:
```javascript
{
  id: "user_id",
  username: "username",
  role: "ADMIN|DOCTOR|CUSTOMER"
}
```

### Middleware Check Role:
```javascript
// Check ADMIN only
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), ...)

// Check DOCTOR & ADMIN
router.post('/', authMiddleware, roleMiddleware(['DOCTOR', 'ADMIN']), ...)

// Check CUSTOMER only
router.put('/:id', authMiddleware, roleMiddleware(['CUSTOMER']), ...)
```

---

## 📝 Chú Ý Quan Trọng

1. **Security First**: Luôn kiểm tra role trước khi cấp quyền truy cập
2. **Data Isolation**: CUSTOMER không được phép xem dữ liệu của customer khác
3. **Audit Trail**: Tất cả hành động ADMIN nên được ghi log
4. **Token Expiration**: Token hết hạn sau 7 ngày (cấu hình tuỳ chỉnh)
5. **Rate Limiting**: Nên thêm rate limiting để chống brute force attacks

---

**Cập nhật lần cuối**: 25/05/2026
**Phiên bản**: 1.0.0
