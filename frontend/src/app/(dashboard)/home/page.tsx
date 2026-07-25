'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays, Users, Trophy, TrendingUp,
  Clock, ArrowUpRight, Zap, Loader2,
  Building2, UserCheck, Settings, ShieldCheck,
  Star, Lock, Newspaper, ChevronRight,
  Activity, BarChart3, Award, QrCode, Medal,
  FileWarning, DollarSign, CreditCard, History,
  GraduationCap, CheckCircle2, MapPin, Flame, ClipboardCheck,
  AlertTriangle, Download
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

import { FAIXAS, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';

function formatDate(iso: string) {
  if (!iso) return 'A definir';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#002B7F] animate-spin" />
        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Carregando painel FBKE...</p>
      </div>
    </div>
  );
}

/* --- Stat Card --- */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'brand' | 'gold' | 'blue' | 'green';
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  const styles = {
    brand: { iconBg: 'bg-red-50 text-[#CE1126] border border-red-200', val: 'text-slate-900' },
    gold: { iconBg: 'bg-amber-50 text-amber-700 border border-amber-200', val: 'text-slate-900' },
    blue: { iconBg: 'bg-blue-50 text-[#002B7F] border border-blue-200', val: 'text-slate-900' },
    green: { iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', val: 'text-slate-900' },
  }[color];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-[#002B7F]/30 transition duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 ${styles.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 rounded-xl animate-pulse mb-1.5" />
        ) : (
          <p className="text-3xl font-black text-slate-900 leading-none mb-1.5">{value}</p>
        )}
        <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

/* --- Quick Action Item --- */
interface QuickItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  color: 'brand' | 'gold' | 'blue' | 'green';
}

function QuickItem({ label, href, icon: Icon, color }: QuickItemProps) {
  const styles = {
    brand: 'border-red-200 bg-red-50/50 hover:bg-red-100/60 text-[#CE1126]',
    gold: 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-800',
    blue: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-[#002B7F]',
    green: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-700',
  }[color];

  return (
    <Link href={href} className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200 group hover:scale-[1.02] text-center ${styles}`}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200 shadow-xs">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 leading-tight">
        {label}
      </span>
    </Link>
  );
}

/* --- Empty Module --- */
function EmptySection({ icon: Icon, text, emBreve = false }: { icon: React.ComponentType<any>; text: string; emBreve?: boolean }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
      <div className="flex flex-col items-center justify-center gap-2 py-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-600 font-medium">{text}</p>
        {emBreve && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 mt-1">
            <Lock size={9} /> Em breve
          </span>
        )}
      </div>
    </div>
  );
}

/* --- ADMIN DASHBOARD --- */
function AdminDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ activeAthletes: 0, openEvents: 0, pendingExams: 0, totalFiliais: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [resAtletas, resEventos, resExames, resFiliais] = await Promise.all([
          fetch(`${API_URL}/api/atletas`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/eventos`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/exames`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/filiais`, { credentials: 'include' }).then(r => r.ok ? r.json() : null)
        ]);
        setStats({
          activeAthletes: (resAtletas?.atletas || []).filter((a: any) => a.status === 'ativo').length,
          openEvents: (resEventos?.eventos || []).length,
          pendingExams: (resExames?.exames || []).filter((e: any) => e.status === 'publicado' || e.status === 'em_andamento').length,
          totalFiliais: (resFiliais?.filiais || []).length,
        });
      } catch (err) {
        console.error('Erro ao carregar stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
      {/* Header Corporativo */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white border border-blue-900/40 rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white text-[#002B7F] font-black rounded-2xl flex items-center justify-center border-b-4 border-[#CE1126] shadow-md shrink-0">
              FBKE
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-amber-400 font-extrabold uppercase tracking-widest mb-1">Painel da Presidência / Administração</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{usuario?.nome ?? 'Administrador FBKE'}</h1>
              <p className="text-xs text-slate-300 mt-1">Federação Baiana de Karate-do Esportivo</p>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center justify-center sm:justify-end gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 shrink-0 backdrop-blur-md">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white">Sistema Homologado</span>
            </div>
            <p className="text-[11px] text-slate-300 text-center sm:text-right font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Atletas Ativos" value={stats.activeAthletes} icon={Users} color="brand" loading={loading} />
        <StatCard label="Eventos em Aberto" value={stats.openEvents} icon={CalendarDays} color="gold" loading={loading} />
        <StatCard label="Exames Ativos" value={stats.pendingExams} icon={Trophy} color="blue" loading={loading} />
        <StatCard label="Filiais Credenciadas" value={stats.totalFiliais} icon={Building2} color="green" loading={loading} />
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Módulos Administrativos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Acesso direto a todas as ferramentas de gestão do sistema</p>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          <QuickItem label="Filiais" href="/filiais" icon={Building2} color="brand" />
          <QuickItem label="Atletas" href="/atletas" icon={Users} color="gold" />
          <QuickItem label="Frequência" href="/frequencia" icon={Activity} color="green" />
          <QuickItem label="Eventos" href="/eventos-dash" icon={CalendarDays} color="blue" />
          <QuickItem label="Notícias" href="/noticias" icon={Star} color="green" />
          <QuickItem label="Graduações" href="/exames" icon={Trophy} color="brand" />
          <QuickItem label="Financeiro" href="/financeiro" icon={CreditCard} color="gold" />
        </div>
      </div>
    </main>
  );
}

/* --- FILIAL DASHBOARD --- */
interface Aviso {
  id: string | number;
  titulo: string;
  conteudo: string;
  categoria: string;
  destinatario: 'todos' | 'filial' | 'atleta';
  created_at?: string;
}

function FilialDashboard({ usuario }: { usuario: any }) {
  const [stats, setStats] = useState({ totalAlunos: 0, alunosAtivos: 0, preAvaliacoes: 0 });
  const [loading, setLoading] = useState(true);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  useEffect(() => {
    async function loadFilialStats() {
      try {
        const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = data.atletas || [];
          const total = list.length;
          const ativos = list.filter((a: any) => a.status === 'ativo').length;
          const pendentes = list.filter((a: any) => a.status === 'pendente').length;
          setStats({
            totalAlunos: total,
            alunosAtivos: ativos,
            preAvaliacoes: pendentes
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas da filial:", err);
      } finally {
        setLoading(false);
      }
    }
    async function loadAvisos() {
      try {
        const res = await fetch(`${API_URL}/api/avisos`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAvisos(data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar avisos:", err);
      } finally {
        setLoadingAvisos(false);
      }
    }
    loadFilialStats();
    loadAvisos();
  }, []);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white border border-blue-900/40 rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-white text-[#002B7F] font-black rounded-2xl flex items-center justify-center border-b-4 border-[#CE1126] shadow-md shrink-0">
            <Building2 className="w-7 h-7 text-[#002B7F]" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mb-1">Painel do Dojo / Filial Credenciada</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{usuario?.nome ?? 'Filial Credenciada'}</h1>
            <p className="text-xs text-slate-300 mt-1">Dojo filiado à Federação Baiana de Karate-do Esportivo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Total de Alunos" value={stats.totalAlunos} icon={Users} color="brand" loading={loading} />
        <StatCard label="Alunos Ativos" value={stats.alunosAtivos} icon={CheckCircle2} color="green" loading={loading} />
        <StatCard label="Pré-Avaliações" value={stats.preAvaliacoes} icon={FileWarning} color="gold" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Avisos da Diretoria</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {loadingAvisos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#002B7F] animate-spin" />
              </div>
            ) : avisos.length > 0 ? (
              avisos.map(aviso => (
                <div key={aviso.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 transition hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {aviso.categoria}
                    </span>
                    {aviso.created_at && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">{aviso.titulo}</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aviso.conteudo}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">Nenhum aviso no momento.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Próximas Graduações</h3>
          <EmptySection icon={GraduationCap} text="Nenhum exame agendado para o seu dojo." />
        </div>
      </div>
    </main>
  );
}

/* --- ATLETA DASHBOARD --- */
function AtletaDashboard({ usuario }: { usuario: any }) {
  const nome = usuario?.nome ?? 'Atleta';
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
  const cpfMask = usuario?.cpf ? usuario.cpf.replace(/(\d{3})\.\d{3}\.(\d{3})-(\d{2})/, '$1.***.***-$3') : '—';
  const regNum = usuario?.registro_federacao || usuario?.dados_atleta?.registro_federacao || (usuario?.id ? `FBKE-${usuario.id.slice(0, 8).toUpperCase()}` : '—');
  const faixa = usuario?.faixa || usuario?.dados_atleta?.faixa || 'Branca';

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  useEffect(() => {
    async function loadAvisos() {
      try {
        const res = await fetch(`${API_URL}/api/avisos`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAvisos(data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar avisos:", err);
      } finally {
        setLoadingAvisos(false);
      }
    }
    loadAvisos();
  }, []);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full">
      {/* Header do Atleta */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white border border-blue-900/40 rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 bg-[#CE1126] text-white font-black rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0">
              {iniciais}
            </div>
            <div>
              <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mb-1">Carteira do Atleta Filiado</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{nome}</h1>
              <p className="text-xs text-slate-300 mt-1">Registro: <strong className="text-white font-mono">{regNum}</strong> | CPF: {cpfMask}</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Graduação Atual</span>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-white text-slate-900 shadow-sm border border-slate-200">
              🥋 Faixa {faixa}
            </span>
          </div>
        </div>
      </div>

      {/* Grid do Atleta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Comunicados & Avisos</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {loadingAvisos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#002B7F] animate-spin" />
              </div>
            ) : avisos.length > 0 ? (
              avisos.map(aviso => (
                <div key={aviso.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 transition hover:border-slate-300">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#002B7F] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {aviso.categoria}
                  </span>
                  <p className="text-xs font-bold text-slate-900">{aviso.titulo}</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aviso.conteudo}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">Nenhum comunicado recente.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ações Rápida do Atleta</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickItem label="Eventos" href="/eventos-dash" icon={CalendarDays} color="blue" />
            <QuickItem label="Graduações" href="/exames" icon={Trophy} color="brand" />
            <QuickItem label="Grade Curricular" href="/curriculo" icon={Award} color="gold" />
            <QuickItem label="Documentos" href="/documentos" icon={ClipboardCheck} color="green" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* --- MAIN CONTROLLER --- */
export default function DashboardHomePage() {
  const { usuario, tipo, carregando } = useAuth();

  if (carregando) return <PageLoader />;

  if (tipo === 'admin') {
    return <AdminDashboard usuario={usuario} />;
  }

  if (tipo === 'filial') {
    return <FilialDashboard usuario={usuario} />;
  }

  return <AtletaDashboard usuario={usuario} />;
}
