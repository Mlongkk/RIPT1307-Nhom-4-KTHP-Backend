# Medical Records API - Chi Tiết Đầy Đủ

**Base URL:** `https://ript1307-nhom-4-kthp-backend.onrender.com/api`  
**Dev/Local:** `http://localhost:3000/api`

---

## 📋 Mục Lục
1. [GET - Danh sách hồ sơ y tế](#1-get-danh-sách-hồ-sơ-y-tế)
2. [GET - Chi tiết hồ sơ theo ID](#2-get-chi-tiết-hồ-sơ-theo-id)
3. [POST - Tạo hồ sơ y tế mới](#3-post-tạo-hồ-sơ-y-tế-mới)
4. [PUT - Cập nhật hồ sơ y tế](#4-put-cập-nhật-hồ-sơ-y-tế)
5. [DELETE - Xóa hồ sơ y tế](#5-delete-xóa-hồ-sơ-y-tế)
6. [GET - Lịch sử y tế thú cưng](#6-get-lịch-sử-y-tế-thú-cưng)
7. [Mô Hình Dữ Liệu](#mô-hình-dữ-liệu)

---

## 1. GET - Danh sách hồ sơ y tế

Lấy danh sách tất cả hồ sơ y tế có hỗ trợ bộ lọc và phân trang.

### Endpoint
```
GET /api/medical-records
```

### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `pet_id` | string | ❌ | ID của thú cưng (để lọc hồ sơ theo thú cưng) |
| `doctor_id` | string | ❌ | ID của bác sĩ (để lọc hồ sơ theo bác sĩ) |
| `page` | integer | ❌ | Số trang (mặc định: 1) |
| `limit` | integer | ❌ | Số bản ghi trên trang (mặc định: 10) |

### Authorization
🔓 **Không yêu cầu token**

### Ví dụ Request

```bash
curl -X GET "http://localhost:3000/api/medical-records?pet_id=123&page=1&limit=10"
```

### Ví dụ Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "petId": "550e8400-e29b-41d4-a716-446655440001",
      "doctorId": "550e8400-e29b-41d4-a716-446655440002",
      "visit_date": "2026-05-25T10:30:00.000Z",
      "diagnosis": "Viêm tai ngoài",
      "treatment": "Dùng thuốc viêm tai",
      "notes": "Thú cưng cần theo dõi sau 1 tuần",
      "createdAt": "2026-05-25T10:30:00.000Z",
      "updatedAt": "2026-05-25T10:30:00.000Z",
      "pet": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Mimi",
        "species": "Cat",
        "breed": "Persian",
        "weight": 3.5
      },
      "doctor": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "full_name": "Dr. Nguễn Văn A",
        "email": "doctor@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 200 | ✅ Thành công |

---

## 2. GET - Chi tiết hồ sơ theo ID

Lấy thông tin chi tiết của một hồ sơ y tế cụ thể.

### Endpoint
```
GET /api/medical-records/{id}
```

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `id` | string | ✅ | ID của hồ sơ y tế |

### Authorization
🔓 **Không yêu cầu token**

### Ví dụ Request

```bash
curl -X GET "http://localhost:3000/api/medical-records/550e8400-e29b-41d4-a716-446655440000"
```

### Ví dụ Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "petId": "550e8400-e29b-41d4-a716-446655440001",
    "doctorId": "550e8400-e29b-41d4-a716-446655440002",
    "visit_date": "2026-05-25T10:30:00.000Z",
    "diagnosis": "Viêm tai ngoài",
    "treatment": "Dùng thuốc viêm tai",
    "notes": "Thú cưng cần theo dõi sau 1 tuần",
    "createdAt": "2026-05-25T10:30:00.000Z",
    "updatedAt": "2026-05-25T10:30:00.000Z",
    "pet": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Mimi",
      "species": "Cat",
      "breed": "Persian",
      "weight": 3.5
    },
    "doctor": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "full_name": "Dr. Nguễn Văn A",
      "email": "doctor@example.com"
    }
  }
}
```

### Ví dụ Response Lỗi (404 Not Found)

```json
{
  "success": false,
  "error": "Medical record not found"
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 200 | ✅ Thành công |
| 404 | ❌ Không tìm thấy hồ sơ |

---

## 3. POST - Tạo hồ sơ y tế mới

Tạo một hồ sơ y tế mới cho thú cưng. **Chỉ bác sĩ hoặc admin mới có thể tạo**.

### Endpoint
```
POST /api/medical-records
```

### Authorization
🔒 **Yêu cầu token Bearer**  
**Roles cho phép:** `DOCTOR`, `ADMIN`

### Request Body (application/json)

| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `pet_id` | string | ✅ | ID của thú cưng |
| `visit_date` | string (ISO 8601) | ✅ | Ngày khám (ví dụ: "2026-05-25T10:30:00Z") |
| `diagnosis` | string | ❌ | Chẩn đoán |
| `treatment` | string | ❌ | Phương pháp điều trị |
| `notes` | string | ❌ | Ghi chú thêm |

### Ví dụ Request

```bash
curl -X POST "http://localhost:3000/api/medical-records" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "550e8400-e29b-41d4-a716-446655440001",
    "visit_date": "2026-05-25T10:30:00Z",
    "diagnosis": "Viêm tai ngoài",
    "treatment": "Dùng thuốc viêm tai",
    "notes": "Thú cưng cần theo dõi sau 1 tuần"
  }'
```

### Ví dụ Response (201 Created)

```json
{
  "success": true,
  "message": "Medical record created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "petId": "550e8400-e29b-41d4-a716-446655440001",
    "doctorId": "550e8400-e29b-41d4-a716-446655440002",
    "visit_date": "2026-05-25T10:30:00.000Z",
    "diagnosis": "Viêm tai ngoài",
    "treatment": "Dùng thuốc viêm tai",
    "notes": "Thú cưng cần theo dõi sau 1 tuần",
    "createdAt": "2026-05-25T10:30:00.000Z",
    "updatedAt": "2026-05-25T10:30:00.000Z",
    "pet": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Mimi",
      "species": "Cat"
    },
    "doctor": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "full_name": "Dr. Nguễn Văn A"
    }
  }
}
```

### Ví dụ Response Lỗi

**400 Bad Request** - Thiếu trường bắt buộc:
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

**404 Not Found** - Thú cưng không tồn tại:
```json
{
  "success": false,
  "error": "Pet not found"
}
```

**401 Unauthorized** - Token không hợp lệ:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden** - Không có quyền:
```json
{
  "success": false,
  "error": "Forbidden"
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 201 | ✅ Tạo thành công |
| 400 | ❌ Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ |
| 401 | ❌ Token không hợp lệ |
| 403 | ❌ Không có quyền (không phải DOCTOR hoặc ADMIN) |
| 404 | ❌ Thú cưng không tồn tại |

---

## 4. PUT - Cập nhật hồ sơ y tế

Cập nhật thông tin hồ sơ y tế. **Chỉ bác sĩ tạo hồ sơ hoặc admin mới có thể cập nhật**.

### Endpoint
```
PUT /api/medical-records/{id}
```

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `id` | string | ✅ | ID của hồ sơ y tế |

### Authorization
🔒 **Yêu cầu token Bearer**  
**Roles cho phép:** `DOCTOR`, `ADMIN`  
**Giới hạn:** Bác sĩ chỉ có thể cập nhật hồ sơ của chính mình

### Request Body (application/json)

| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `diagnosis` | string | ❌ | Chẩn đoán |
| `treatment` | string | ❌ | Phương pháp điều trị |
| `notes` | string | ❌ | Ghi chú thêm |

### Ví dụ Request

```bash
curl -X PUT "http://localhost:3000/api/medical-records/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Viêm tai ngoài - nặng",
    "treatment": "Dùng thuốc viêm tai + tiêm kháng sinh",
    "notes": "Tình trạng đã cải thiện sau 3 ngày"
  }'
```

### Ví dụ Response (200 OK)

```json
{
  "success": true,
  "message": "Medical record updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "petId": "550e8400-e29b-41d4-a716-446655440001",
    "doctorId": "550e8400-e29b-41d4-a716-446655440002",
    "visit_date": "2026-05-25T10:30:00.000Z",
    "diagnosis": "Viêm tai ngoài - nặng",
    "treatment": "Dùng thuốc viêm tai + tiêm kháng sinh",
    "notes": "Tình trạng đã cải thiện sau 3 ngày",
    "createdAt": "2026-05-25T10:30:00.000Z",
    "updatedAt": "2026-05-25T15:45:00.000Z",
    "pet": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Mimi",
      "species": "Cat"
    },
    "doctor": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "full_name": "Dr. Nguễn Văn A"
    }
  }
}
```

### Ví dụ Response Lỗi

**403 Forbidden** - Bác sĩ cố gắng cập nhật hồ sơ của bác sĩ khác:
```json
{
  "success": false,
  "error": "You can only update your own records"
}
```

**404 Not Found** - Hồ sơ không tồn tại:
```json
{
  "success": false,
  "error": "Medical record not found"
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 200 | ✅ Cập nhật thành công |
| 401 | ❌ Token không hợp lệ |
| 403 | ❌ Không có quyền cập nhật |
| 404 | ❌ Hồ sơ không tồn tại |

---

## 5. DELETE - Xóa hồ sơ y tế

Xóa một hồ sơ y tế. **Chỉ bác sĩ tạo hồ sơ hoặc admin mới có thể xóa**.

### Endpoint
```
DELETE /api/medical-records/{id}
```

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `id` | string | ✅ | ID của hồ sơ y tế |

### Authorization
🔒 **Yêu cầu token Bearer**  
**Roles cho phép:** `DOCTOR`, `ADMIN`  
**Giới hạn:** Bác sĩ chỉ có thể xóa hồ sơ của chính mình

### Ví dụ Request

```bash
curl -X DELETE "http://localhost:3000/api/medical-records/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Ví dụ Response (200 OK)

```json
{
  "success": true,
  "message": "Medical record deleted successfully"
}
```

### Ví dụ Response Lỗi

**403 Forbidden** - Bác sĩ cố gắng xóa hồ sơ của bác sĩ khác:
```json
{
  "success": false,
  "error": "You can only delete your own records"
}
```

**404 Not Found** - Hồ sơ không tồn tại:
```json
{
  "success": false,
  "error": "Medical record not found"
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 200 | ✅ Xóa thành công |
| 401 | ❌ Token không hợp lệ |
| 403 | ❌ Không có quyền xóa |
| 404 | ❌ Hồ sơ không tồn tại |

---

## 6. GET - Lịch sử y tế thú cưng

Lấy toàn bộ lịch sử y tế của một thú cưng cụ thể, được sắp xếp theo ngày khám (mới nhất trước).

### Endpoint
```
GET /api/medical-records/pet/{pet_id}/history
```

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `pet_id` | string | ✅ | ID của thú cưng |

### Authorization
🔓 **Không yêu cầu token**

### Ví dụ Request

```bash
curl -X GET "http://localhost:3000/api/medical-records/pet/550e8400-e29b-41d4-a716-446655440001/history"
```

### Ví dụ Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "petId": "550e8400-e29b-41d4-a716-446655440001",
      "doctorId": "550e8400-e29b-41d4-a716-446655440002",
      "visit_date": "2026-05-25T10:30:00.000Z",
      "diagnosis": "Viêm tai ngoài",
      "treatment": "Dùng thuốc viêm tai",
      "notes": "Thú cưng cần theo dõi sau 1 tuần",
      "createdAt": "2026-05-25T10:30:00.000Z",
      "updatedAt": "2026-05-25T10:30:00.000Z",
      "doctor": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "full_name": "Dr. Nguễn Văn A",
        "email": "doctor@example.com"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "petId": "550e8400-e29b-41d4-a716-446655440001",
      "doctorId": "550e8400-e29b-41d4-a716-446655440003",
      "visit_date": "2026-05-20T14:15:00.000Z",
      "diagnosis": "Tiêm vắc xin",
      "treatment": "Tiêm vắc xin phòng bệnh",
      "notes": "Vắc xin cơ bản hàng năm",
      "createdAt": "2026-05-20T14:15:00.000Z",
      "updatedAt": "2026-05-20T14:15:00.000Z",
      "doctor": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "full_name": "Dr. Trần Thị B",
        "email": "doctor2@example.com"
      }
    }
  ]
}
```

### Lỗi Có Thể Xảy Ra

| Status | Lỗi |
|--------|-----|
| 200 | ✅ Thành công |

---

## 📊 Mô Hình Dữ Liệu

### MedicalRecord Object

```javascript
{
  "id": "string (UUID)",                    // ID duy nhất
  "petId": "string (UUID)",                 // ID thú cưng
  "doctorId": "string (UUID)",              // ID bác sĩ tạo hồ sơ
  "visit_date": "ISO 8601 DateTime",        // Ngày khám
  "diagnosis": "string | null",             // Chẩn đoán
  "treatment": "string | null",             // Phương pháp điều trị
  "notes": "string | null",                 // Ghi chú
  "createdAt": "ISO 8601 DateTime",         // Ngày tạo
  "updatedAt": "ISO 8601 DateTime",         // Ngày cập nhật
  "pet": {                                  // Thông tin thú cưng
    "id": "string (UUID)",
    "name": "string",
    "species": "string",
    "breed": "string | null",
    "weight": "number | null"
  },
  "doctor": {                               // Thông tin bác sĩ
    "id": "string (UUID)",
    "full_name": "string",
    "email": "string"
  }
}
```

### Pet Object

```javascript
{
  "id": "string (UUID)",
  "name": "string",
  "species": "string",
  "breed": "string | null",
  "gender": "string | null",
  "birth_date": "ISO 8601 DateTime | null",
  "weight": "number | null",
  "image_url": "string | null",
  "ownerId": "string (UUID)"
}
```

### User Object (Doctor)

```javascript
{
  "id": "string (UUID)",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "phone": "string | null",
  "role": "DOCTOR | ADMIN | CUSTOMER"
}
```

---

## 🔐 Quy Tắc Bảo Mật

### Access Control

| Endpoint | Public | CUSTOMER | DOCTOR | ADMIN |
|----------|--------|----------|--------|-------|
| GET All Records | ✅ | ✅ | ✅ | ✅ |
| GET Record by ID | ✅ | ✅ | ✅ | ✅ |
| POST (Create) | ❌ | ❌ | ✅ | ✅ |
| PUT (Update) | ❌ | ❌ | ✅* | ✅ |
| DELETE | ❌ | ❌ | ✅* | ✅ |
| GET Pet History | ✅ | ✅ | ✅ | ✅ |

**\* Chỉ có thể thao tác với hồ sơ của chính mình (ngoại trừ admin)**

---

## 💡 Hướng Dẫn Sử Dụng

### 1. Lấy token đăng nhập
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor_username",
    "password": "password"
  }'
```

### 2. Dùng token để tạo hồ sơ y tế mới
```bash
curl -X POST "http://localhost:3000/api/medical-records" \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "pet-id-here",
    "visit_date": "2026-05-25T10:30:00Z",
    "diagnosis": "Cảm cúm",
    "treatment": "Nghỉ ngơi và uống nước",
    "notes": "Cần tái khám sau 3 ngày"
  }'
```

### 3. Xem lịch sử y tế thú cưng
```bash
curl -X GET "http://localhost:3000/api/medical-records/pet/pet-id-here/history"
```

---

## 🚀 Trạng Thái HTTP

| Code | Mô Tả |
|------|-------|
| 200 | ✅ OK - Yêu cầu thành công |
| 201 | ✅ Created - Tài nguyên được tạo thành công |
| 400 | ❌ Bad Request - Dữ liệu không hợp lệ |
| 401 | ❌ Unauthorized - Chưa đăng nhập hoặc token không hợp lệ |
| 403 | ❌ Forbidden - Không có quyền truy cập |
| 404 | ❌ Not Found - Tài nguyên không tồn tại |
| 500 | ❌ Internal Server Error - Lỗi máy chủ |

---

## 📝 Ghi Chú Thêm

- Tất cả các timestamp được trả về dưới định dạng ISO 8601
- ID được sinh ngẫu nhiên dưới dạng UUID (v4)
- Pagination được cung cấp cho endpoint danh sách
- Dữ liệu y tế được sắp xếp theo ngày khám (mới nhất trước)
- Backend tự động liên kết bác sĩ từ token người dùng khi tạo hồ sơ
- Xóa thú cưng sẽ tự động xóa tất cả hồ sơ y tế liên quan (Cascade Delete)
