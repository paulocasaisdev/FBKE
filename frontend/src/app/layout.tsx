import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'FBKE - Federação Baiana de Karate-do Esportivo',
  description: 'Entidade oficial do Karate Esportivo no Estado da Bahia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-bahia-bg text-slate-900 antialiased flex flex-col justify-between min-h-screen selection:bg-bahia-red selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
