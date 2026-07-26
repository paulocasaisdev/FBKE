'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Calendar, Award, BookOpen, Trophy, DollarSign, 
  FileText, Bot, Settings, Shield, Users, CheckSquare, Package, 
  Search, BarChart2, Globe, LogOut, X 
} from 'lucide-react';

export type UserRole = 'atleta' | 'filial' | 'admin';

export function obterIniciais(nome: string) {
  if (!nome) return 'FB';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Mapeamento dos Menus por Perfil
const menuConfig: Record<UserRole, MenuItem[]> = {
  atleta: [
    { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
    { label: 'Eventos', href: '/eventos-dash', icon: Calendar },
    { label: 'Exames de Graduação', href: '/exames', icon: Award },
    { label: 'Grade Curricular', href: '/curriculo', icon: BookOpen },
    { label: 'Ranking Interno', href: '/ranking', icon: Trophy },
    { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
    { label: 'Documentos', href: '/documentos', icon: FileText },
    { label: 'Sensei IA', href: '/sensei-ia', icon: Bot },
    { label: 'Configurações', href: '/configuracoes', icon: Settings },
  ],
  filial: [
    { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
    { label: 'Minha Filial', href: '/filial', icon: Shield },
    { label: 'Atletas', href: '/atletas', icon: Users },
    { label: 'Frequência', href: '/frequencia', icon: CheckSquare },
    { label: 'Eventos', href: '/eventos-dash', icon: Calendar },
    { label: 'Exames de Graduação', href: '/exames', icon: Award },
    { label: 'Grade Curricular', href: '/curriculo', icon: BookOpen },
    { label: 'Ranking Interno', href: '/ranking', icon: Trophy },
    { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
    { label: 'Estoque', href: '/estoque', icon: Package },
    { label: 'Documentos', href: '/documentos', icon: FileText },
    { label: 'Auditoria', href: '/auditoria', icon: Search },
    { label: 'Sensei IA', href: '/sensei-ia', icon: Bot },
  ],
  admin: [
    { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
    { label: 'Filiais & Dojos', href: '/filiais', icon: Shield },
    { label: 'Atletas', href: '/atletas', icon: Users },
    { label: 'Frequência', href: '/frequencia', icon: CheckSquare },
    { label: 'Eventos', href: '/eventos-dash', icon: Calendar },
    { label: 'Notícias', href: '/noticias', icon: FileText },
    { label: 'Exames de Graduação', href: '/exames', icon: Award },
    { label: 'Certificados Matriz', href: '/certificados', icon: Award },
    { label: 'Grade Curricular', href: '/curriculo', icon: BookOpen },
    { label: 'Ranking Interno', href: '/ranking', icon: Trophy },
    { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
    { label: 'Estoque', href: '/estoque', icon: Package },
    { label: 'Documentos', href: '/documentos', icon: FileText },
    { label: 'Relatórios', href: '/relatorios', icon: BarChart2 },
    { label: 'Auditoria', href: '/auditoria', icon: Search },
    { label: 'Sensei IA', href: '/sensei-ia', icon: Bot },
    { label: 'Gerenciar Site (CMS)', href: '/admin', icon: Globe },
  ],
};

interface SidebarProps {
  role?: UserRole;
  userNome?: string;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, userNome, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, tipo, logout } = useAuth();

  // Determina o papel do usuário
  const effectiveRole: UserRole = role || (tipo as UserRole) || 'atleta';
  const effectiveName = userNome || usuario?.nome || usuario?.name || 'Usuário FBKE';
  const currentMenu = menuConfig[effectiveRole] || menuConfig.atleta;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin': return 'Administrador';
      case 'filial': return 'Filial / Dojo';
      default: return 'Atleta Filiado';
    }
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Overlay Mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col font-sans z-50 transition-transform duration-300 shadow-xl lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* LOGO DO DASHBOARD */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-[#002B7F] text-white flex items-center justify-center font-black text-sm border-b-2 border-[#CE1126] shadow-sm group-hover:scale-105 transition">
              FBKE
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">PAINEL FBKE</p>
              <span className="text-[9px] font-bold uppercase text-[#CE1126] tracking-wider">
                {getRoleBadge(effectiveRole)}
              </span>
            </div>
          </Link>

          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO DA SIDEBAR */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest px-3 mb-2">
            Módulos do Sistema
          </p>

          {currentMenu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#002B7F] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={17} className={active ? 'text-[#CE1126]' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PERFIL LOGADO & LOGOUT (SEMPRE FIXO NO RODAPÉ DA SIDEBAR) */}
        <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#CE1126] text-white flex items-center justify-center font-black text-xs uppercase shrink-0 shadow-xs">
              {obterIniciais(effectiveName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate" title={effectiveName}>{effectiveName}</p>
              <p className="text-[10px] font-semibold text-slate-500 truncate" title={usuario?.email || getRoleBadge(effectiveRole)}>
                {usuario?.email || getRoleBadge(effectiveRole)}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-xs font-bold text-[#CE1126] bg-red-50 hover:bg-[#CE1126] hover:text-white border border-red-200/80 py-2.5 px-3 rounded-xl transition cursor-pointer shadow-xs"
          >
            <LogOut size={15} /> Sair da Plataforma
          </button>
        </div>
      </aside>
    </>
  );
}
