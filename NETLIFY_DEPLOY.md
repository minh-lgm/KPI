# Hướng dẫn Deploy lên Netlify với Password Protection

## Tổng quan

Ứng dụng KPI Tracker sẽ được deploy lên Netlify với:
- **Password Protection**: Chỉ người có password mới truy cập được
- **Serverless Functions**: API routes hoạt động như serverless functions
- **Dữ liệu**: Lưu trữ trên Netlify (trong build)

## Bước 1: Chuẩn bị Project

### 1.1. Cài đặt Netlify CLI (tùy chọn)

```bash
npm install -g netlify-cli
```

### 1.2. Cài đặt Netlify Next.js Plugin

```bash
npm install @netlify/plugin-nextjs
```

## Bước 2: Deploy lên Netlify

### Cách 1: Deploy qua GitHub (Khuyến nghị)

1. Push code lên GitHub repository
2. Truy cập [Netlify](https://app.netlify.com)
3. Click **"Add new site"** → **"Import an existing project"**
4. Chọn GitHub và authorize
5. Chọn repository KPI
6. Cấu hình build:
   - Build command: `npm run build`
   - Publish directory: `.next`
7. Click **"Deploy site"**

### Cách 2: Deploy qua CLI

```bash
# Login vào Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Bước 3: Cấu hình Password Protection

### 3.1. Sử dụng Netlify Identity (Miễn phí)

1. Vào **Site settings** → **Identity**
2. Click **"Enable Identity"**
3. Vào **Registration** → Chọn **"Invite only"**
4. Vào **Site settings** → **Access control** → **Visitor access**
5. Chọn **"Password protect this site"**
6. Đặt password

### 3.2. Hoặc sử dụng Basic Auth (Team plan)

Nếu bạn có Netlify Team plan, có thể dùng Basic Auth:

1. Vào **Site settings** → **Access control**
2. Chọn **"Set password"**
3. Nhập password

## Bước 4: Cấu hình Environment Variables (nếu cần)

1. Vào **Site settings** → **Environment variables**
2. Thêm các biến môi trường nếu cần

## Lưu ý quan trọng

### Về dữ liệu

⚠️ **Dữ liệu JSON được bundle vào build**

Với cách deploy này:
- File `data/data.json`, `data/tasks.json` được đọc tại **build time**
- Mỗi khi thay đổi dữ liệu, cần **rebuild và redeploy**

### Cách cập nhật dữ liệu

1. Chỉnh sửa file JSON trên local hoặc GitHub
2. Push lên GitHub (nếu dùng GitHub deploy)
3. Netlify sẽ tự động rebuild

### Hoặc sử dụng Netlify Functions để ghi file

Nếu muốn ghi dữ liệu runtime, cần:
1. Sử dụng Netlify Blobs hoặc external database
2. Hoặc chấp nhận dữ liệu chỉ đọc trên production

## Cấu trúc URL sau deploy

```
https://your-site-name.netlify.app/
https://your-site-name.netlify.app/kpi-khoi
https://your-site-name.netlify.app/kpi-phong
```

## Troubleshooting

### Build failed

- Kiểm tra Node.js version (cần 18+)
- Chạy `npm run build` local để test

### API không hoạt động

- Kiểm tra Netlify Functions logs
- Đảm bảo đã cài `@netlify/plugin-nextjs`

### Password protection không hoạt động

- Kiểm tra đã enable Identity
- Kiểm tra Visitor access settings
