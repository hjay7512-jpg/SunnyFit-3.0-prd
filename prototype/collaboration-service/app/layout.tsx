import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SunnyFit 原型协作",
  description: "SunnyFit 原型文案、评论与修改记录的共享服务。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
