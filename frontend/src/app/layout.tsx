import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_NOME_APP || 'DocMind — ERP Knowledge AI',
  description:
    'Assistente Inteligente para Documentação de Sistemas ERP, APIs e Procedimentos Técnicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

