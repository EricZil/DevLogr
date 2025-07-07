import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import PublicProjectPage from '@/components/public/PublicProjectPage';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevLogr - Track Your Development Journey",
  description: "Share your development progress with beautiful project pages",
};

async function shouldShowPublicProject(): Promise<boolean> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  if (host.endsWith('.devlogr.space')) {
    const slug = host.replace('.devlogr.space', '');
    if (slug === 'api' || slug === 'proxy' || slug === 'www') {
      return false;
    }
    return true;
  }
  
  if (host !== 'devlogr.space' && host !== 'www.devlogr.space' && host !== 'localhost' && !host.startsWith('127.0.0.1')) {
    return true;
  }
  
  return false;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldShowPublic = await shouldShowPublicProject();

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
