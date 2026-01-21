# KPI Tracker

Hệ thống theo dõi KPI Khối Thẩm định & Phê duyệt.

## Tính năng

- **Dashboard**: Tổng quan tiến độ KPI với biểu đồ
- **KPI Khối**: Xem chi tiết KPI theo nhóm (A, B, C, D)
- **KPI Phòng**: Xem và cập nhật tiến độ KPI theo phòng ban
- **Phân quyền**: Admin, Trưởng phòng, Nhân viên

## Cài đặt

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Tài khoản demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | 123456 |
| Trưởng phòng TĐDN | manager.tddn@company.com | 123456 |
| Trưởng phòng TĐBL | manager.tdbl@company.com | 123456 |
| Trưởng phòng HT&GSPD | manager.htgspd@company.com | 123456 |
| Trưởng phòng PDTD | manager.pdtd@company.com | 123456 |

## Cấu trúc thư mục

```
kpi-tracker/
├── data/
│   ├── data.xlsx          # Dữ liệu KPI Khối
│   └── progress.json      # Tiến độ (tự động tạo)
├── src/
│   ├── app/               # Pages
│   ├── components/        # React components
│   ├── lib/               # Utilities (excel, auth)
│   └── styles/            # BEM CSS
```

## Công nghệ

- Next.js 16
- TypeScript
- BEM CSS
- Recharts (biểu đồ)
- XLSX (đọc Excel)
- Jose + bcryptjs (authentication)
