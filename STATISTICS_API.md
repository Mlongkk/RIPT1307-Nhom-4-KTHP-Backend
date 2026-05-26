# 📊 BenhVienABC - Statistics API Documentation

**Base URL**: `/api/statistics`  
**Authentication**: Required (Bearer Token)  
**Header**: `Authorization: Bearer <token>`

---

## 🔐 Access Control

| Endpoint | ADMIN | DOCTOR | CUSTOMER |
|----------|-------|--------|----------|
| Dashboard | ✅ | ✅ | ❌ |
| Appointments Stats | ✅ | ❌ | ❌ |
| Doctor Performance | ✅ (any) | ✅ (own only) | ❌ |
| Revenue | ✅ | ❌ | ❌ |
| Pet Health | ✅ | ❌ | ❌ |

---

## 1️⃣ GET /api/statistics/dashboard

### 📝 Mô tả
Lấy thống kê tổng quan cho Dashboard chính

### 🔐 Quyền truy cập
- **ADMIN**: ✅ Có
- **DOCTOR**: ✅ Có
- **CUSTOMER**: ❌ Không

### 📤 Request
```
GET /api/statistics/dashboard
Authorization: Bearer <token>
```

### 📥 Response (200 OK)
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "totalPets": 200,
      "totalAppointments": 500,
      "totalMedicalRecords": 350,
      "totalDoctors": 15,
      "totalCustomers": 135
    },
    "appointments": {
      "byStatus": [
        {
          "status": "SCHEDULED",
          "_count": 100
        },
        {
          "status": "CONFIRMED",
          "_count": 150
        },
        {
          "status": "COMPLETED",
          "_count": 200
        },
        {
          "status": "CANCELLED",
          "_count": 50
        }
      ],
      "byPriority": [
        {
          "priority_level": "LOW",
          "_count": 150
        },
        {
          "priority_level": "MEDIUM",
          "_count": 200
        },
        {
          "priority_level": "HIGH",
          "_count": 100
        },
        {
          "priority_level": "URGENT",
          "_count": 50
        }
      ]
    },
    "pets": {
      "topSpecies": [
        {
          "species": "Chó",
          "_count": 120
        },
        {
          "species": "Mèo",
          "_count": 80
        },
        {
          "species": "Chim",
          "_count": 0
        }
      ]
    }
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": "Access denied"
}
```

---

## 2️⃣ GET /api/statistics/appointments

### 📝 Mô tả
Lấy thống kê lịch hẹn theo tháng/năm cụ thể

### 🔐 Quyền truy cập
- **ADMIN**: ✅ Có
- **DOCTOR**: ❌ Không
- **CUSTOMER**: ❌ Không

### 📤 Request
```
GET /api/statistics/appointments?month=5&year=2026
Authorization: Bearer <token>
```

### 🔍 Query Parameters

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|--------|
| `month` | Integer | ❌ No | Tháng (1-12). Nếu không truyền, lấy tất cả |
| `year` | Integer | ❌ No | Năm. Nếu không truyền, lấy tất cả |

### 📥 Response (200 OK)
```json
{
  "success": true,
  "data": {
    "appointmentStats": [
      {
        "status": "SCHEDULED",
        "priority_level": "LOW",
        "_count": 10
      },
      {
        "status": "SCHEDULED",
        "priority_level": "MEDIUM",
        "_count": 20
      },
      {
        "status": "CONFIRMED",
        "priority_level": "HIGH",
        "_count": 15
      },
      {
        "status": "COMPLETED",
        "priority_level": "MEDIUM",
        "_count": 40
      }
    ],
    "doctorStats": [
      {
        "doctorId": "doc-001",
        "appointmentCount": 45
      },
      {
        "doctorId": "doc-002",
        "appointmentCount": 38
      },
      {
        "doctorId": "doc-003",
        "appointmentCount": 42
      }
    ]
  }
}
```

### 💡 Lưu ý
- Nếu không truyền `month` và `year`, API trả về thống kê tất cả các lịch hẹn
- Dữ liệu được nhóm theo (status, priority_level)
- `doctorStats` hiển thị tổng số lịch hẹn mỗi bác sĩ

---

## 3️⃣ GET /api/statistics/doctor/{doctor_id}

### 📝 Mô tả
Lấy thống kê hiệu suất của bác sĩ cụ thể (tỷ lệ hoàn thành, số hồ sơ, v.v.)

### 🔐 Quyền truy cập
- **ADMIN**: ✅ Có (xem bất kỳ bác sĩ nào)
- **DOCTOR**: ✅ Có (chỉ xem stats của chính mình)
- **CUSTOMER**: ❌ Không

### 📤 Request
```
GET /api/statistics/doctor/doc-001
Authorization: Bearer <token>
```

### 🔍 Path Parameters

| Parameter | Type | Mô tả |
|-----------|------|--------|
| `doctor_id` | String | ID của bác sĩ |

### 📥 Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalAppointments": 150,
    "completedAppointments": 120,
    "medicalRecords": 95,
    "appointmentsByPriority": [
      {
        "priority_level": "LOW",
        "_count": 50
      },
      {
        "priority_level": "MEDIUM",
        "_count": 60
      },
      {
        "priority_level": "HIGH",
        "_count": 30
      },
      {
        "priority_level": "URGENT",
        "_count": 10
      }
    ],
    "completionRate": "80.00"
  }
}
```

### ❌ Error Responses

**403 Forbidden** - DOCTOR không được xem stats của bác sĩ khác
```json
{
  "success": false,
  "error": "Access denied"
}
```

**404 Not Found** - Không tìm thấy bác sĩ
```json
{
  "success": false,
  "error": "Doctor not found"
}
```

### 💡 Lưu ý
- `completionRate` được tính: `(completedAppointments / totalAppointments) * 100`
- Nếu không có lịch hẹn: `completionRate = 0`
- Bác sĩ chỉ có thể xem stats của chính mình

---

## 4️⃣ GET /api/statistics/revenue

### 📝 Mô tả
Lấy thống kê doanh thu theo tháng/năm

### 🔐 Quyền truy cập
- **ADMIN**: ✅ Có
- **DOCTOR**: ❌ Không
- **CUSTOMER**: ❌ Không

### 📤 Request
```
GET /api/statistics/revenue?month=5&year=2026
Authorization: Bearer <token>
```

### 🔍 Query Parameters

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|--------|
| `month` | Integer | ❌ No | Tháng (1-12). Nếu không truyền, lấy tất cả |
| `year` | Integer | ❌ No | Năm. Nếu không truyền, lấy tất cả |

### 📥 Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000000,
    "paidRevenue": 45000000,
    "pendingRevenue": 5000000,
    "invoiceCount": 120,
    "invoices": [
      {
        "id": "inv-001",
        "totalAmount": 500000,
        "status": "PAID",
        "issuedAt": "2026-05-20T10:30:00Z",
        "items": [
          {
            "id": "item-001",
            "invoiceId": "inv-001",
            "serviceId": "srv-001",
            "quantity": 1,
            "unitPrice": 500000,
            "totalPrice": 500000
          }
        ]
      },
      {
        "id": "inv-002",
        "totalAmount": 300000,
        "status": "PENDING",
        "issuedAt": "2026-05-22T14:15:00Z",
        "items": [...]
      }
    ]
  }
}
```

### 💡 Lưu ý
- Tất cả số tiền tính bằng đơn vị tiền tệ (VND)
- `totalRevenue = paidRevenue + pendingRevenue`
- Status có thể là: `PAID` hoặc `PENDING`
- Nếu không truyền `month` và `year`, trả về tất cả hóa đơn

---

## 5️⃣ GET /api/statistics/pet-health

### 📝 Mô tả
Lấy thống kê sức khỏe thú cưng (số lượng theo phân loài, chẩn đoán phổ biến)

### 🔐 Quyền truy cập
- **ADMIN**: ✅ Có
- **DOCTOR**: ❌ Không
- **CUSTOMER**: ❌ Không

### 📤 Request
```
GET /api/statistics/pet-health
Authorization: Bearer <token>
```

### 📥 Response (200 OK)
```json
{
  "success": true,
  "data": {
    "petsBySpecies": [
      {
        "species": "Chó",
        "id": 120
      },
      {
        "species": "Mèo",
        "id": 80
      },
      {
        "species": "Chim",
        "id": 0
      }
    ],
    "commonDiagnoses": [
      {
        "diagnosis": "Viêm da",
        "_count": 45
      },
      {
        "diagnosis": "Bệnh lỵ",
        "_count": 30
      },
      {
        "diagnosis": "Đau họng",
        "_count": 25
      },
      {
        "diagnosis": "Vấn đề hệ tiêu hóa",
        "_count": 20
      },
      {
        "diagnosis": "Bệnh nha chu",
        "_count": 18
      }
    ]
  }
}
```

### 💡 Lưu ý
- `petsBySpecies` hiển thị số lượng thú cưng của mỗi loài
- `commonDiagnoses` hiển thị top 10 chẩn đoán phổ biến nhất
- Dữ liệu được sắp xếp theo số lượng (nhiều nhất -> ít nhất)

---

## ❌ Global Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied - Insufficient permissions"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🔄 Response Format Standard

Tất cả API trả về format đồng nhất:

### ✅ Success
```json
{
  "success": true,
  "data": { ... }
}
```

### ❌ Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🛠️ Frontend Implementation Guide

### 1. Dashboard Statistics
```javascript
// Lấy tất cả thông tin dashboard
const response = await fetch('/api/statistics/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
// Hiển thị summary, charts (appointments by status/priority, top species)
```

### 2. Appointment Stats By Month
```javascript
// Lấy stats tháng 5 năm 2026
const response = await fetch('/api/statistics/appointments?month=5&year=2026', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Doctor Performance
```javascript
// Bác sĩ xem stats của chính mình
const doctorId = currentUser.id; // ID bác sĩ hiện tại
const response = await fetch(`/api/statistics/doctor/${doctorId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Hiển thị: completion rate, appointment count, medical records
```

### 4. Revenue Analytics
```javascript
// Lấy doanh thu tháng hiện tại
const today = new Date();
const month = today.getMonth() + 1;
const year = today.getFullYear();
const response = await fetch(`/api/statistics/revenue?month=${month}&year=${year}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 5. Pet Health Statistics
```javascript
// Lấy thống kê sức khỏe thú cưng
const response = await fetch('/api/statistics/pet-health', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Hiển thị: pie chart (species), list (diagnoses)
```

---

## 💡 Gợi ý cải thiện cho Frontend

| # | Tính năng | Mô tả | Ưu tiên |
|---|----------|--------|--------|
| 1 | **Date Range Filter** | Thay month/year bằng from-date/to-date | High |
| 2 | **Invoice Pagination** | Thêm pagination cho danh sách invoices | High |
| 3 | **Export to PDF/Excel** | Xuất báo cáo thống kê | Medium |
| 4 | **Real-time Updates** | WebSocket để cập nhật stats real-time | Medium |
| 5 | **Service Usage Stats** | Thêm endpoint `/statistics/service-usage` | Medium |
| 6 | **Peak Hours Analysis** | Endpoint `/statistics/peak-hours` | Low |
| 7 | **Data Caching** | Cache stats 15-30 phút để giảm tải DB | High |

---

## 📞 Support & Notes

- **Base URL**: Thay đổi tùy theo environment (dev/prod)
- **Timeout**: Khuyến nghị 30 giây cho các endpoint lớn
- **Rate Limiting**: Chưa implement (cân nhắc thêm)
- **Caching**: Khuyến nghị cache ở client side (1-5 phút)

---

**Last Updated**: May 25, 2026  
**API Version**: 1.0
