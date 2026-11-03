import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_NOME_APP || 'DocMind — ERP Knowledge AI',
  description:
    'Assistente Inteligente para Documentação de Sistemas ERP, APIs, RAG Fundamentado e Diagnóstico Técnico',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="6" y="14" width="22" height="20" rx="5" fill="%231e293b" stroke="%23475569" stroke-width="1.2"/><rect x="12" y="6" width="22" height="22" rx="5" fill="%230f172a" stroke="%2338bdf8" stroke-width="1.6"/><circle cx="27" cy="21" r="3" fill="%2338bdf8"/><circle cx="21" cy="27" r="2.5" fill="%238b5cf6"/><circle cx="31" cy="29" r="2.5" fill="%233b82f6"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-mesh-pattern relative">
          {children}
        </main>
      </body>
    </html>
  );
}
