'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Calendar, MapPin, Award, Search, ArrowRight, ShieldCheck,
  CheckCircle2, Users, Flame, BookOpen, GraduationCap, ExternalLink, ChevronRight
} from 'lucide-react';

// Banners em Destaque
const heroBanners = [
  {
    id: 1,
    tag: 'Campeonato Estadual',
    titulo: 'Campeonato Baiano de Karate-do 2026',
    data: '15 de Agosto, 2026',
    local: 'Centro de Boxe e Artes Marciais – Salvador/BA',
    imagem: '/images/banner-torneio.jpg',
    status: 'Inscrições Abertas',
  },
  {
    id: 2,
    tag: 'Seminário Internacional',
    titulo: 'Seminário Técnico de Goju-Ryu & Kata Tradicional',
    data: '28 de Setembro, 2026',
    local: 'Centro de Treinamento FBKE – Lauro de Freitas/BA',
    imagem: '/images/banner-seminario.jpg',
    status: 'Vagas Limitadas',
  }
];

// Lista de Eventos Públicos para Inscrição Direta
const eventosInscricao = [
  {
    id: 'evt-1',
    tipo: 'Campeonato',
    titulo: '3ª Etapa do Circuito Baiano de Kumite & Kata',
    data: '15 AGO 2026',
    horario: '08:00 - 18:00',
    local: 'Salvador / BA',
    vagas: 'Inscrições Abertas',
    corTag: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    id: 'evt-2',
    tipo: 'Curso',
    titulo: 'Curso Oficial de Arbitragem Esportiva 2026',
    data: '05 SET 2026',
    horario: '09:00 - 17:00',
    local: 'Feira de Santana / BA',
    vagas: '30 vagas restantes',
    corTag: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'evt-3',
    tipo: 'Seminario',
    titulo: 'Seminário Especial de Bunkai e Defesa Pessoal',
    data: '28 SET 2026',
    horario: '14:00 - 19:00',
    local: 'Lauro de Freitas / BA',
    vagas: 'Inscrições Abertas',
    corTag: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'evt-4',
    tipo: 'Exame',
    titulo: 'Exame Unificado de Faixas Pretas (1º ao 5º Dan)',
    data: '24 OUT 2026',
    horario: '08:00 - 13:00',
    local: 'Salvador / BA',
    vagas: 'Exclusivo para Filiados',
    corTag: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

// Carrossel de Parceiros & Entidades
const parceiros = [
  { nome: 'IOGKF International', sigla: 'IOGKF', desc: 'Chancela Internacional' },
  { nome: 'Confederação Brasileira de Karatê', sigla: 'CBK', desc: 'Entidade Nacional' },
  { nome: 'SUDESB', sigla: 'SUDESB', desc: 'Governo do Estado da Bahia' },
  { nome: 'Conselho Estadual de Esportes', sigla: 'CEE-BA', desc: 'Homologação Estadual' },
  { nome: 'World Karate Federation', sigla: 'WKF', desc: 'Chancela Olímpica Mundial' },
  { nome: 'Federação Baiana de Karate', sigla: 'FBKE', desc: 'Órgão Oficial da Bahia' },
  { nome: 'Associação Baiana de Dojos', sigla: 'ABD', desc: 'Filiada Oficial' },
  { nome: 'Comitê Olímpico do Brasil', sigla: 'COB', desc: 'Apoio Esportivo' },
];

export default function HomePage() {
  const [filtroEvento, setFiltroEvento] = useState('Todos');
  const [hashQuery, setHashQuery] = useState('');

  const eventosFiltrados = filtroEvento === 'Todos'
    ? eventosInscricao
    : eventosInscricao.filter(e => e.tipo === filtroEvento);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-[#CE1126] selection:text-white">
      <Navbar />

      <main className="flex-1">

        {/* ================= HERO SECTION COM BANNERS E DESTAQUES ================= */}
        <section className="relative bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden flex items-center">
          {/* Elementos sutis da bandeira da Bahia */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Coluna Esquerda: Chamada Principal */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-slate-100 border border-white/20 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#CE1126] animate-pulse"></span>
                Tradição & Excelência no Esporte Baiano
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                <span className="text-white drop-shadow-sm block">
                  FEDERAÇÃO BAIANA <br />
                  DE KARATE-DO <br />
                  ESPORTIVO
                </span>
              </h1>

              <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full"></div>

              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
                Órgão oficial regulador no Estado da Bahia. Unindo alta performance, formação de faixas pretas e transparência digital.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/auth/cadastro-atleta"
                  className="inline-flex items-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-red-900/40 transition"
                >
                  Filiar-se / Atleta <ArrowRight size={15} />
                </Link>
                <Link
                  href="/sobre"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur-md transition"
                >
                  Conheça a FBKE
                </Link>
              </div>
            </div>

            {/* Coluna Direita: Card de Destaque / Banner Rápido + Validador */}
            <div className="lg:col-span-5 space-y-4">

              {/* Banner de Evento em Destaque */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Flame size={14} /> Destaque de Hoje
                  </span>
                  <span className="text-[10px] font-bold bg-[#CE1126] text-white px-2.5 py-0.5 rounded-md">
                    {heroBanners[0].status}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-blue-200 font-medium">{heroBanners[0].tag}</span>
                  <h3 className="text-lg font-black text-white mt-1 leading-snug">
                    {heroBanners[0].titulo}
                  </h3>
                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5"><Calendar size={13} className="text-sky-400" /> {heroBanners[0].data}</p>
                    <p className="flex items-center gap-1.5"><MapPin size={13} className="text-sky-400" /> {heroBanners[0].local}</p>
                  </div>
                </div>

                <Link
                  href="#inscricoes"
                  className="block text-center w-full bg-white hover:bg-slate-100 text-[#002B7F] font-extrabold text-xs uppercase py-3 rounded-xl shadow transition"
                >
                  Garantir Inscrição Agora
                </Link>
              </div>

              {/* Consulta Autêntica de Diplomas */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-blue-200 tracking-wider">Transparência Oficial</p>
                    <p className="text-xs font-bold text-white">Validar Certificado por Hash / QR Code</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (hashQuery) window.location.href = `/transparencia/validar-certificado?hash=${hashQuery}`;
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={hashQuery}
                    onChange={(e) => setHashQuery(e.target.value)}
                    placeholder="Cole o Hash do Diploma..."
                    className="flex-1 bg-slate-950/60 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                  />
                  <button type="submit" className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl border border-blue-400/30 transition cursor-pointer">
                    <Search size={14} />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </section>

        {/* ================= KPIS / MÉTRICAS CLARAS ================= */}
        <section className="py-10 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-black text-[#002B7F]">40+</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Dojos & Filiais</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-black text-[#CE1126]">1.200+</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Atletas Cadastrados</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-black text-[#002B7F]">100%</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Homologado IOGKF / CBK</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl font-black text-amber-600">2026</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Temporada Oficial</p>
            </div>
          </div>
        </section>

        {/* ================= DIV PÚBLICA DE INSCRIÇÕES DE EVENTOS ================= */}
        <section id="inscricoes" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block mb-1">
                Portal de Inscrições Abertas
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Campeonatos, Cursos & Seminários
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Garanta sua vaga nos eventos oficiais chancelados pela federação.
              </p>
            </div>

            {/* Filtros da Div Pública */}
            <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
              {['Todos', 'Campeonato', 'Curso', 'Seminario', 'Exame'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroEvento(tipo)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer ${filtroEvento === tipo
                      ? 'bg-[#002B7F] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {tipo === 'Seminario' ? 'Seminários' : tipo === 'Todos' ? 'Todos os Eventos' : `${tipo}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Cards de Inscrição Pública */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventosFiltrados.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-900/30 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg border ${item.corTag}`}>
                      {item.tipo}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> {item.vagas}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.titulo}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#CE1126]" />
                      <span>{item.data}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#002B7F]" />
                      <span>{item.local}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Até 12x no cartão ou PIX</span>
                  <Link
                    href={`/eventos`}
                    className="inline-flex items-center gap-1 bg-[#CE1126] hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-sm"
                  >
                    Inscrever-se <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ================= CARROSSEL DINÂMICO DE PARCEIROS & FILIADOS ================= */}
        <section className="py-14 bg-white border-y border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#002B7F] border border-blue-200 text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-[#CE1126] animate-ping" /> Chancela & Apoio Institucional
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Parceiros, Confederações e Entidades Filiadas</h3>
            <p className="text-xs text-slate-500 mt-1">Homologação oficial e órgãos reguladores do Karatê-do</p>
          </div>

          {/* Faixa Deslizante Infinita com Movimento Contínuo */}
          <div className="relative w-full overflow-hidden py-4 bg-slate-50/50 border-y border-slate-100">
            <div className="animate-marquee gap-6">
              {[...parceiros, ...parceiros].map((parc, index) => (
                <div
                  key={`${parc.sigla}-${index}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 min-w-[220px] max-w-[250px] text-center shadow-xs hover:shadow-md hover:border-[#002B7F] hover:-translate-y-1 transition duration-300 cursor-pointer select-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002B7F] to-slate-900 text-white font-black text-xs flex items-center justify-center mx-auto mb-3 border-b-2 border-[#CE1126] shadow-xs">
                    {parc.sigla}
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{parc.nome}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{parc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
