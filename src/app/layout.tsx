import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KPI Tracker - Theo dõi KPI Khối",
  description: "Hệ thống theo dõi KPI Khối Thẩm định & Phê duyệt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
