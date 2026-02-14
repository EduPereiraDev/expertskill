import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TelegramFloat } from '@/components/ui/telegram-float';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expert Skills - Análise e Gestão para eSoccer',
  description: 'Plataforma de análise automatizada e gestão de banca para apostadores de eSoccer FIFA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        {children}
        <TelegramFloat />
      </body>
    </html>
  );
}
