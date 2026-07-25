'use client';

import React from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// ── Cores da identidade visual GRKK ──────────────────────────────────────
const GOLD = '#C8A96E';
const COBALT = '#3B8BEB';
const EMERALD = '#34D399';
const RED = '#EF4444';
const PURPLE = '#A78BFA';

const CORES_FAIXAS_CHART: Record<string, string> = {
  'Branca': '#e4e4e7',
  'Branca/Amarela': '#fde68a',
  'Amarela': '#FBBF24',
  'Amarela/Laranja': '#FB923C',
  'Laranja': '#F97316',
  'Laranja/Verde': '#86EFAC',
  'Verde': '#22C55E',
  'Verde/Azul': '#34D399',
  'Azul': '#3B82F6',
  'Azul/Vermelha': '#8B5CF6',
  'Vermelha': '#EF4444',
  'Marrom': '#92400E',
  'Marrom I': '#78350F',
  'Marrom II': '#451A03',
  'Preta I': '#71717A',
  'Preta II': '#27272A',
};

// ── Tooltip Customizado Padrão ────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      {label && <p className="text-zinc-400 mb-1.5 font-bold uppercase tracking-wider text-[10px]">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: entry.color }}>
          {entry.name}: {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}{suffix}
        </p>
      ))}
    </div>
  );
}

// ── 1. Gráfico de Matrículas por Mês (AreaChart) ─────────────────────────
interface MatriculasData { mes: string; atletas: number }
export function GraficoMatriculas({ data, loading }: { data: MatriculasData[]; loading: boolean }) {
  if (loading) return <SkeletonChart />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAtletas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
            <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip suffix=" atletas" />} />
        <Area
          type="monotone" dataKey="atletas" name="Matrículas"
          stroke={GOLD} strokeWidth={2}
          fill="url(#gradAtletas)"
          dot={{ fill: GOLD, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: GOLD }}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── 2. Gráfico de Receita vs Pendente (BarChart duplo) ───────────────────
interface ReceitaData { mes: string; receita: number; pendente: number }
export function GraficoReceita({ data, loading }: { data: ReceitaData[]; loading: boolean }) {
  if (loading) return <SkeletonChart />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip prefix="R$ " />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(value) => <span className="text-[10px] text-zinc-400">{value}</span>} />
        <Bar dataKey="receita" name="Recebido" fill={EMERALD} radius={[4, 4, 0, 0]} animationDuration={800} maxBarSize={24} />
        <Bar dataKey="pendente" name="Pendente" fill={RED} radius={[4, 4, 0, 0]} animationDuration={800} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 3. Gráfico de Distribuição por Faixa (PieChart) ──────────────────────
interface FaixaData { faixa: string; total: number }
export function GraficoFaixas({ data, loading }: { data: FaixaData[]; loading: boolean }) {
  if (loading) return <SkeletonChart />;
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={180}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={45} outerRadius={75}
            dataKey="total" animationDuration={800}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.faixa} fill={CORES_FAIXAS_CHART[entry.faixa] || '#52525B'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip suffix=" atletas" />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legenda customizada */}
      <div className="flex-1 space-y-1 max-h-[180px] overflow-y-auto pr-1">
        {data.map((d) => (
          <div key={d.faixa} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CORES_FAIXAS_CHART[d.faixa] || '#52525B' }} />
              <span className="text-[9px] text-zinc-400 truncate">{d.faixa}</span>
            </div>
            <span className="text-[9px] font-bold text-zinc-300 font-mono shrink-0">
              {d.total} <span className="text-zinc-600">({Math.round(d.total / total * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. Gráfico de Frequência por Filial (BarChart horizontal) ────────────
interface FreqFilialData { filial: string; treinos: number }
export function GraficoFrequencia({ data, loading }: { data: FreqFilialData[]; loading: boolean }) {
  if (loading) return <SkeletonChart />;
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-zinc-600 text-xs italic">
        Nenhuma chamada registrada neste mês.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category" dataKey="filial" width={110}
          tick={{ fill: '#A1A1AA', fontSize: 10 }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => v.length > 16 ? v.slice(0, 15) + '…' : v}
        />
        <Tooltip content={<CustomTooltip suffix=" treinos" />} />
        <Bar dataKey="treinos" name="Presenças" fill={COBALT} radius={[0, 4, 4, 0]} animationDuration={800} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Skeleton de carregamento ──────────────────────────────────────────────
function SkeletonChart() {
  return (
    <div className="w-full h-[200px] bg-zinc-900 rounded-xl animate-pulse flex items-end gap-2 p-4">
      {[60, 80, 40, 90, 55, 70].map((h, i) => (
        <div key={i} className="flex-1 bg-zinc-800 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
