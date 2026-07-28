'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, Instagram, Facebook, Lock, UserPlus, 
  Menu, X, ShieldCheck, BookOpen, Users, Calendar, FileText,
  User, Building2, UserCheck, LayoutDashboard, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const institucionalLinks = [
  { label: 'A Academia', href: '/sobre', desc: 'Conheça nossa história e mestres', icon: ShieldCheck },
  { label: 'Dojo Kun', href: '/dojo-kun', desc: 'Os 5 princípios do Karate-do', icon: BookOpen },
  { label: 'Equipe', href: '/equipe', desc: 'Professores e corpo técnico', icon: Users },
  { label: 'Eventos', href: '/eventos', desc: 'Calendário oficial de torneios', icon: Calendar },
  { label: 'Transparência', href: '/transparencia', desc: 'Atas e documentos oficiais', icon: FileText },
];

export default function Navbar() {
  const { usuario, autenticado, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const [assocDropdownOpen, setAssocDropdownOpen] = useState(false);
  const pathname = usePathname();

  const instRef = useRef<HTMLDivElement>(null);
  const assocRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (instRef.current && !instRef.current.contains(e.target as Node)) {
        setInstDropdownOpen(false);
      }
      if (assocRef.current && !assocRef.current.contains(e.target as Node)) {
        setAssocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 font-sans shadow-sm">
      {/* BARRA DE NAVEGAÇÃO PRINCIPAL (TopBar superior removida a pedido) */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* Logo FBKE */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002B7F] to-slate-900 flex items-center justify-center text-white font-black text-lg border-b-2 border-[#CE1126] shadow-sm group-hover:scale-105 transition duration-200">
              FBKE
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1">
                FBKE <span className="w-1.5 h-1.5 rounded-full bg-[#CE1126]"></span>
              </span>
              <span className="text-[10px] font-bold text-[#002B7F] tracking-widest uppercase">
                Federação Baiana de Karate
              </span>
            </div>
          </Link>

          {/* Links de Navegação Desktop */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5">
            <Link
              href="/"
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                pathname === '/' ? 'bg-[#CE1126] text-white shadow-sm' : 'text-slate-700 hover:text-[#002B7F]'
              }`}
            >
              Início
            </Link>

            {/* Dropdown Institucional */}
            <div className="relative" ref={instRef}>
              <button
                onClick={() => setInstDropdownOpen(!instDropdownOpen)}
                className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl text-slate-700 hover:text-[#002B7F] transition cursor-pointer"
              >
                Institucional <ChevronDown size={14} className={`transition ${instDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {instDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  {institucionalLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setInstDropdownOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-[#002B7F] group-hover:bg-[#CE1126] group-hover:text-white transition">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/galeria"
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                pathname === '/galeria' ? 'bg-[#CE1126] text-white shadow-sm' : 'text-slate-700 hover:text-[#002B7F]'
              }`}
            >
              Galeria
            </Link>

            <Link
              href="/contato"
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                pathname === '/contato' ? 'bg-[#CE1126] text-white shadow-sm' : 'text-slate-700 hover:text-[#002B7F]'
              }`}
            >
              Contato
            </Link>
          </div>

          {/* Botões de Ação: Redes Sociais, Associe-se & Área Restrita */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Ícones de Redes Sociais reposicionados no Header */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                title="Instagram FBKE"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 transition shadow-2xs"
              >
                <Instagram size={15} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                title="Facebook FBKE"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#1877F2] transition shadow-2xs"
              >
                <Facebook size={15} />
              </a>
            </div>

            {/* Dropdown Associe-se */}
            <div className="relative" ref={assocRef}>
              <button
                onClick={() => setAssocDropdownOpen(!assocDropdownOpen)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition border border-slate-200 cursor-pointer"
              >
                <UserPlus size={14} className="text-[#CE1126]" /> Associe-se <ChevronDown size={12} />
              </button>

              {assocDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  <Link
                    href="/auth/cadastro-atleta"
                    onClick={() => setAssocDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition"
                  >
                    <User size={15} className="text-[#002B7F]" /> Sou Atleta
                  </Link>
                  <Link
                    href="/auth/cadastro-filial"
                    onClick={() => setAssocDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition"
                  >
                    <Building2 size={15} className="text-[#CE1126]" /> Sou Filial / Dojo
                  </Link>
                </div>
              )}
            </div>

            {/* Login Rápido / Área Restrita / Minha Área */}
            {autenticado ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition border border-blue-800"
                >
                  <LayoutDashboard size={14} className="text-amber-400" />
                  Minha Área ({usuario?.nome?.split(' ')[0] || 'Painel'})
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sair da Conta"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-[#CE1126] border border-slate-200 transition cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition border border-blue-800"
              >
                <Lock size={14} /> Área Restrita
              </Link>
            )}
          </div>

          {/* Botão Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Expandido Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-bold text-slate-900">
              Início
            </Link>
            
            <div className="pl-3 space-y-1 border-l-2 border-[#CE1126]">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 my-1">Institucional</p>
              {institucionalLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs text-slate-600 font-medium">
                  {item.label}
                </Link>
              ))}
            </div>

            <Link href="/galeria" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-bold text-slate-900">
              Galeria
            </Link>
            <Link href="/contato" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-bold text-slate-900">
              Contato
            </Link>

            <div className="pt-2 grid grid-cols-2 gap-2">
              {autenticado ? (
                <>
                  <Link href="/home" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-[#002B7F] text-white py-2.5 rounded-xl text-xs font-bold col-span-2">
                    <LayoutDashboard size={14} className="text-amber-400" /> Minha Área (Dashboard)
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/cadastro-atleta" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-slate-100 py-2.5 rounded-xl text-xs font-bold text-slate-800">
                    <UserPlus size={14} /> Cadastrar
                  </Link>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-[#002B7F] text-white py-2.5 rounded-xl text-xs font-bold">
                    <Lock size={14} /> Entrar
                  </Link>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs font-bold">
                <Instagram size={16} /> Instagram
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs font-bold">
                <Facebook size={16} /> Facebook
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
