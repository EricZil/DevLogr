import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { domainUtils } from '@/lib/api';
import PublicProjectPage from '@/components/public/PublicProjectPage';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevLogr - Track Your Development Journey",
  description: "Share your development progress with beautiful project pages",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldShowPublic = domainUtils.shouldShowPublicProject();

  if (shouldShowPublic) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <NotificationProvider>
            <PublicProjectPage />
          </NotificationProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
