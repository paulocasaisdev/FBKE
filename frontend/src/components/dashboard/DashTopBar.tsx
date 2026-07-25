'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, Bell, ArrowUpRight, Check, AlertCircle, Clock, 
  CreditCard, Award, UserCheck, Building2, Sparkles, ChevronRight, RefreshCw, LogOut 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { obterIniciais } from './Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Notificacao {
  id: string | number;
  titulo: string;
  mensagem: string;
  tipo: 'sucesso' | 'alerta' | 'info';
  lida: boolean;
  created_at: string;
}

interface DashTopBarProps {
  onMenuOpen: () => void;
}

interface ResolvedNotif {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  tagLabel: string;
  route: string | null;
  actionLabel: string | null;
}

function resolveNotificationDetails(n: Notificacao, userType: string | null): ResolvedNotif {
  const text = `${n.titulo} ${n.mensagem}`.toLowerCase();
  
  // 1. Financeiro
  if (text.includes('fatura') || text.includes('pagamento') || text.includes('cobrança') || text.includes('mensalidade')) {
    return {
      icon: <CreditCard size={12} className="text-amber-700" />,
      colorClass: 'text-amber-800 border-amber-200 bg-amber-50',
      bgClass: 'bg-amber-50/50 hover:bg-amber-100/50',
      tagLabel: 'Financeiro',
      route: '/financeiro',
      actionLabel: 'Ver Faturas'
    };
  }
  
  // 2. Exames de Faixa
  if (text.includes('exame') || text.includes('banca') || text.includes('graduação') || text.includes('faixa') || text.includes('candidato')) {
    return {
      icon: <Award size={12} className="text-emerald-700" />,
      colorClass: 'text-emerald-800 border-emerald-200 bg-emerald-50',
      bgClass: 'bg-emerald-50/50 hover:bg-emerald-100/50',
      tagLabel: 'Exame',
      route: '/exames',
      actionLabel: 'Ver Exames'
    };
  }

  // 3. Filiais
  if (text.includes('filial') || text.includes('dojo') || text.includes('credenciamento')) {
    const route = userType === 'admin' ? '/filiais' : '/home';
    return {
      icon: <Building2 size={12} className="text-[#002B7F]" />,
      colorClass: 'text-[#002B7F] border-blue-200 bg-blue-50',
      bgClass: 'bg-blue-50/50 hover:bg-blue-100/50',
      tagLabel: 'Filial',
      route,
      actionLabel: userType === 'admin' ? 'Ver Filiais' : 'Ver Painel'
    };
  }

  // 4. Atletas
  if (text.includes('atleta') || text.includes('homologado') || text.includes('cadastro')) {
    const route = userType === 'admin' ? '/atletas' : '/home';
    return {
      icon: <UserCheck size={12} className="text-[#CE1126]" />,
      colorClass: 'text-[#CE1126] border-red-200 bg-red-50',
      bgClass: 'bg-red-50/50 hover:bg-red-100/50',
      tagLabel: 'Atleta',
      route,
      actionLabel: userType === 'admin' ? 'Gerenciar Atletas' : 'Ver Carteirinha'
    };
  }

  // 5. Sensei IA
  if (text.includes('sensei') || text.includes('ia') || text.includes('chat') || text.includes('pergunta')) {
    return {
      icon: <Sparkles size={12} className="text-purple-700 animate-pulse" />,
      colorClass: 'text-purple-800 border-purple-200 bg-purple-50',
      bgClass: 'bg-purple-50/50 hover:bg-purple-100/50',
      tagLabel: 'Sensei IA',
      route: '/sensei-ia',
      actionLabel: 'Falar com IA'
    };
  }

  // Fallbacks baseados no n.tipo original
  if (n.tipo === 'sucesso') {
    return {
      icon: <Check size={12} className="text-emerald-700" />,
      colorClass: 'text-emerald-800 border-emerald-200 bg-emerald-50',
      bgClass: 'hover:bg-slate-50',
      tagLabel: 'Sucesso',
      route: null,
      actionLabel: null
    };
  }

  if (n.tipo === 'alerta') {
    return {
      icon: <AlertCircle size={12} className="text-red-700" />,
      colorClass: 'text-red-800 border-red-200 bg-red-50',
      bgClass: 'hover:bg-slate-50',
      tagLabel: 'Alerta',
      route: null,
      actionLabel: null
    };
  }

  return {
    icon: <Clock size={12} className="text-slate-600" />,
    colorClass: 'text-slate-700 border-slate-200 bg-slate-100',
    bgClass: 'hover:bg-slate-50',
    tagLabel: 'Aviso',
    route: null,
    actionLabel: null
  };
}

export default function DashTopBar({ onMenuOpen }: DashTopBarProps) {
  const { usuario, tipo, isAdmin, isFilial, isPerfilUnificado, alternarPerfil, logout } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const nomeExibido = usuario?.nome ?? usuario?.name ?? 'Usuário FBKE';
  const iniciais = obterIniciais(nomeExibido);

  const carregarNotificacoes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notificacoes || []);
      }
    } catch (err) {
      console.error("Erro ao buscar notificações backend:", err);
      const mockData: Notificacao[] = [
        {
          id: 'mock-1',
          titulo: "Atualização de Cadastro",
          mensagem: "Mantenha seus dados pessoais e filiação em dia no painel FBKE.",
          tipo: "info",
          lida: false,
          created_at: new Date().toISOString()
        }
      ];

      if (tipo === 'admin') {
        mockData.unshift({
          id: 'mock-admin-1',
          titulo: "Nova Solicitação de Filial",
          mensagem: "A filial 'Dojo Salvador Centro' solicitou homologação de credenciamento.",
          tipo: "info",
          lida: false,
          created_at: new Date().toISOString()
        });
      } else if (tipo === 'atleta') {
        mockData.unshift({
          id: 'mock-atleta-1',
          titulo: "Cadastro de Atleta Homologado",
          mensagem: "Sua ficha cadastral e filiação da FBKE foram aprovadas com sucesso.",
          tipo: "sucesso",
          lida: false,
          created_at: new Date().toISOString()
        });
      }

      setNotifs(mockData);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 20000);
    return () => clearInterval(interval);
  }, [usuario]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalNaoLidas = notifs.filter((n) => !n.lida).length;

  const marcarComoLida = async (id: string | number) => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ lida: true }),
      });
      if (res.ok) {
        setNotifs((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    }
  };

  const handleNotifClick = async (n: Notificacao) => {
    if (!n.lida) {
      await marcarComoLida(n.id);
    }
    const details = resolveNotificationDetails(n, usuario?.tipo || null);
    if (details.route) {
      router.push(details.route);
      setIsOpen(false);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes`, {
        method: "PATCH",
        credentials: 'include',
      });
      if (res.ok) {
        setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
      }
    } catch (err) {
      console.error(err);
      setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <button
        onClick={onMenuOpen}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      <button
        onClick={() => router.push('/')}
        className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#002B7F] transition-colors px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
      >
        <ArrowUpRight size={14} className="text-[#CE1126]" /> Ver site principal
      </button>

      {/* Sino / Dropdown de Notificações */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isOpen ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bell size={18} />
          {totalNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#CE1126] text-white text-[9px] font-black min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border border-white shadow-sm select-none pointer-events-none animate-pulse">
              {totalNaoLidas}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Notificações</h3>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{totalNaoLidas} novos alertas</p>
              </div>
              {totalNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-[10px] font-bold text-[#002B7F] hover:underline cursor-pointer"
                >
                  Marcar todas lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifs.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-3">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Nenhum aviso novo</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Você está atualizado com o sistema.</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const details = resolveNotificationDetails(n, tipo || null);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-4 flex gap-3 cursor-pointer transition relative group ${
                        n.lida 
                          ? "bg-transparent hover:bg-slate-50 opacity-60" 
                          : `${details.bgClass} border-l-2 border-[#CE1126]`
                      }`}
                    >
                      <div className="mt-0.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${details.colorClass}`}>
                          {details.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-xs font-bold leading-tight ${n.lida ? "text-slate-500" : "text-slate-900"}`}>{n.titulo}</p>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{n.mensagem}</p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ${details.colorClass}`}>
                            {details.tagLabel}
                          </span>
                          {details.actionLabel && (
                            <span className="text-[8px] font-bold text-[#002B7F] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {details.actionLabel} <ChevronRight size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé com atalhos rápidos */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-around text-[10px] text-slate-600 font-bold">
              <button 
                onClick={() => { router.push('/financeiro'); setIsOpen(false); }}
                className="hover:text-[#002B7F] transition cursor-pointer flex items-center gap-1"
              >
                <CreditCard size={12} /> Financeiro
              </button>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <button 
                onClick={() => { router.push('/exames'); setIsOpen(false); }}
                className="hover:text-[#002B7F] transition cursor-pointer flex items-center gap-1"
              >
                <Award size={12} /> Exames
              </button>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <button 
                onClick={() => { router.push('/sensei-ia'); setIsOpen(false); }}
                className="hover:text-[#002B7F] transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={12} /> Sensei IA
              </button>
            </div>
          </div>
        )}
      </div>

      {isPerfilUnificado && (
        <button
          onClick={alternarPerfil}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition cursor-pointer font-bold"
          title={tipo === 'filial' ? 'Mudar para Atleta' : 'Mudar para Dojo'}
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">
            {tipo === 'filial' ? 'Atleta' : 'Dojo'}
          </span>
        </button>
      )}

      <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
        <div className="w-7 h-7 bg-[#CE1126] text-white rounded-lg flex items-center justify-center text-[10px] font-black uppercase">
          {iniciais}
        </div>
        <span className="text-xs font-bold text-slate-800 hidden sm:block truncate max-w-[120px]">
          {nomeExibido}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-xs font-bold text-[#CE1126] hover:bg-red-50 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200/80 transition cursor-pointer shrink-0"
        title="Encerrar sessão"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </header>
  );
}
