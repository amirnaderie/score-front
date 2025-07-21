import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "مصرف امتیاز",
  description: "سامانه مصرف امتیاز",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body className={`persian-numbers antialiased`}>
        <Toaster
          position="top-center" // Or any position you prefer
          reverseOrder={false} // You can set this based on preference
          gutter={8}
          toastOptions={{
            // Default options for all toasts
            // duration: 20000,
            style: {
              background: "#363636", // Example background
              color: "#fff", // Example text color
              fontFamily: "Vazirmatn, sans-serif", // Apply Vazirmatn font
              fontSize: "15px", // Example font size
              direction: "rtl", // Ensure RTL direction for toast content
            },
            // Default options for specific types
            success: {
              // duration: 20000,
              style: {
                fontFamily: "Vazirmatn, sans-serif",
                direction: "rtl",
              },
            },
            error: {
              style: {
                fontFamily: "Vazirmatn, sans-serif",
                direction: "rtl",
              },
            },
          }}
        />

        {children}
      </body>
    </html>
  );
}
