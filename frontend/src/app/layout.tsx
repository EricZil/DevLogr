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

// Server-side domain detection
async function shouldShowPublicProject(): Promise<boolean> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Check if it's a subdomain of devlogr.space
  if (host.endsWith('.devlogr.space')) {
    const slug = host.replace('.devlogr.space', '');
    // Skip API and proxy subdomains
    if (slug === 'api' || slug === 'proxy' || slug === 'www') {
      return false;
    }
    return true;
  }
  
  // Check if it's a custom domain (not our main domains)
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
  // Check if we should show public project page using server-side detection
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
