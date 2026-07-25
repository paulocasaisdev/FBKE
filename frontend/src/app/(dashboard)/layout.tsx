'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import DashTopBar from '@/components/dashboard/DashTopBar';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { carregando, autenticado, cadastroIncompleto, tipo, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!carregando && !autenticado) {
      router.push('/auth');
    }
  }, [carregando, autenticado, router]);

  // Trava de Cadastro Incompleto: força o usuário a ir para /configuracoes (atleta) ou /filial (filial)
  useEffect(() => {
    if (!carregando && autenticado && cadastroIncompleto && !isAdmin) {
      const targetPage = tipo === 'filial' ? '/filial' : '/configuracoes';
      if (pathname !== targetPage) {
        router.push(targetPage);
      }
    }
  }, [carregando, autenticado, cadastroIncompleto, isAdmin, tipo, pathname, router]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden select-none font-sans">
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs text-center">
          {/* Logo container FBKE */}
          <div className="w-20 h-20 rounded-2xl bg-[#002B7F] text-white flex items-center justify-center font-black text-2xl border-b-4 border-[#CE1126] shadow-xl animate-pulse">
            FBKE
          </div>

          {/* Typography */}
          <div className="space-y-1">
            <h2 className="text-[#001D54] font-black text-sm tracking-wider uppercase">
              Federação Baiana de Karate
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Carregando painel do usuário...
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#002B7F]">
            <Loader2 size={18} className="animate-spin text-[#CE1126]" />
          </div>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-[#CE1126] selection:text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <DashTopBar onMenuOpen={() => setSidebarOpen(true)} />
        
        {/* Banner de Cadastro Incompleto */}
        {cadastroIncompleto && !isAdmin && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs flex items-center justify-center gap-2 font-medium">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 animate-bounce" />
            <span>
              <strong>Atenção:</strong> Seu cadastro está incompleto. Por favor, preencha os dados obrigatórios (CPF, endereço e dados pessoais) e salve para liberar o acesso total ao sistema.
            </span>
          </div>
        )}

        <div className="flex-1 w-full bg-slate-50 text-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}
