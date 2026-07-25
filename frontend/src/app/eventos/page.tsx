'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, MapPin, ExternalLink, Trophy, Loader2, FileText, ChevronRight } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';
import Link from 'next/link';

interface Evento {
  id: string | number;
  titulo: string;
  descricao: string;
  tipo: string;
  data_inicio: string;
  data_fim?: string;
  imagem_url?: string;
  link_regulamento?: string;
  link_resultados?: string;
}

const typeColors: Record<string, string> = {
  'Graduação': 'bg-slate-100 text-slate-800 border-slate-300',
  'Seminário': 'bg-amber-50 text-amber-800 border-amber-200',
  'Competição': 'bg-red-50 text-[#CE1126] border-red-200',
  'Curso': 'bg-blue-50 text-[#002B7F] border-blue-200',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventos() {
      try {
        const res = await fetch(`${API_URL}/api/eventos`);
        if (!res.ok) throw new Error('Erro ao carregar eventos');
        const data = await res.json();
        setEventos(data.eventos || []);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-[#CE1126] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-slate-100 border border-white/20 backdrop-blur-md">
              <Calendar size={14} className="text-[#CE1126]" />
              Calendário Oficial 2026
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              EVENTOS & CAMPEONATOS
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Confira os campeonatos estaduais, seminários técnicos, exames de faixa e cursos homologados pela Federação Baiana de Karate-do Esportivo.
            </p>
          </div>
        </section>

        {/* ================= LISTA DE EVENTOS ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Loader2 size={32} className="text-[#002B7F] animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carregando calendário de eventos...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Trophy size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Nenhum evento agendado</h3>
              <p className="text-xs text-slate-500">
                Novas datas e torneios oficiais serão publicados em breve pela comissão organizadora.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {eventos.map((evento) => {
                const date = new Date(evento.data_inicio + 'T00:00:00');
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                const year = date.getFullYear();
                const tipoExibido = evento.tipo || 'Competição';
                const typeClass = typeColors[tipoExibido] || 'bg-slate-100 text-slate-800 border-slate-300';

                return (
                  <div 
                    key={evento.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition flex flex-col md:flex-row gap-6 items-center"
                  >
                    {/* Imagem / Banner */}
                    <div className="w-full md:w-48 h-32 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <ImageLightbox
                        src={evento.imagem_url || 'https://images.unsplash.com/photo-1555597673-b21d5c935865'}
                        alt={evento.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Bloco de Data */}
                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-blue-50 border border-blue-200 text-center flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#002B7F] leading-none">{day}</span>
                      <span className="text-[10px] font-extrabold text-[#CE1126] uppercase tracking-wider">{month}</span>
                      <span className="text-[10px] font-bold text-slate-500">{year}</span>
                    </div>

                    {/* Informações */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-lg font-black text-slate-900 leading-snug">{evento.titulo}</h3>
                        <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg border inline-block ${typeClass}`}>
                          {tipoExibido}
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs leading-relaxed">{evento.descricao}</p>

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 pt-2 justify-center md:justify-start">
                        {evento.data_fim && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-[#CE1126]" /> 
                            Término: {new Date(evento.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {evento.link_regulamento && (
                          <a href={evento.link_regulamento} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#002B7F] hover:underline">
                            <FileText size={13} /> Regulamento
                          </a>
                        )}
                        {evento.link_resultados && (
                          <a href={evento.link_resultados} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 hover:underline">
                            <Trophy size={13} /> Resultados
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
