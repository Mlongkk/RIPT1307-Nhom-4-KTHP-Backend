# BenhVienABC Backend

Backend quản lý bệnh viện thú y Pet Hospital, sử dụng Node.js, Express và PostgreSQL.

## Cấu hình

Database đã cấu hình trong file `.env`:

```env
DATABASE_URL="postgresql://neondb_owner:npg_tWLrV5QwO2iz@ep-purple-dawn-apfi7lyl-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=4000
```

## Cài đặt

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

> Lưu ý: nếu database hiện đã có schema, bạn có thể dùng `npx prisma db push` để đồng bộ schema từ `prisma/schema.prisma` mà không cần reset dữ liệu.

## Chạy server

```bash
npm run dev
```

## Swagger API Documentation

Sau khi chạy server, truy cập Swagger docs tại:

```
http://localhost:4000/api-docs
```

Tại đây bạn có thể xem tất cả các endpoint và thử test API trực tiếp.

## Endpoints chính

- `GET /api/owners`
- `POST /api/owners`
- `GET /api/pets`
- `POST /api/pets`
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/services`
- `POST /api/services`
- `GET /api/medical-records`
- `POST /api/medical-records`
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/staff`
- `POST /api/staff`
- `GET /api/users`
- `POST /api/users`

## Mô hình dữ liệu chính

- `PetOwner`: thông tin chủ thú cưng
- `Pet`: thông tin thú cưng
- `Appointment`: lịch khám
- `Service`: dịch vụ thú y
- `MedicalRecord`: hồ sơ khám bệnh
- `Invoice`: hóa đơn thanh toán
- `Staff`: nhân viên thú y
- `User`: tài khoản hệ thống
