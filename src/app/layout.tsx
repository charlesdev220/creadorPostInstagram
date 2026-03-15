import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Creador Post Instagram | Bolsos y Moda',
  description: 'Aplicación potenciada por Nano Banana Pro para generar imágenes y videos para Instagram.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Creador IA',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
