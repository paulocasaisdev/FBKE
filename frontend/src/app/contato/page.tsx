'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContatoSection from '@/components/ContatoSection';
import { Mail, PhoneCall } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function ContatoPage() {
  const [siteConfig, setSiteConfig] = useState({
    hero_title: 'FALE COM A FEDERAÇÃO',
    hero_subtitle: 'Tire suas dúvidas sobre filiações de dojos, carteirinhas de atletas, torneios estaduais e exames de graduação.',
    secao_subtitulo: 'Canais Oficiais de Atendimento',
  });

  useEffect(() => {
    document.title = 'Contato - Federação Baiana de Karate (FBKE)';
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config && data.config.contato) {
            setSiteConfig(prev => ({
              ...prev,
              ...data.config.contato
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do CMS:", err);
      }
    };
    carregarConfig();
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
              <Mail size={14} className="text-[#CE1126]" />
              {siteConfig.secao_subtitulo}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {siteConfig.hero_title}
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {siteConfig.hero_subtitle}
            </p>
          </div>
        </section>

        {/* Conteúdo Principal (Informações da Sede + Formulário Claro) */}
        <ContatoSection />
      </main>

      <Footer />
    </div>
  );
}
