import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bilgeyis Mirzazada — Motion Designer",
  description: "Motion design and video editing studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className="antialiased">{children}</body>
    </html>
  );
}
