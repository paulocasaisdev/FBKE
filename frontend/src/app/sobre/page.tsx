'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Heart, Star, Award, Users, Globe, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function SobrePage() {
  const [siteConfig, setSiteConfig] = useState({
    hero_subtitulo: 'Nossa História & Instituição',
    hero_titulo: 'A Federação & Academia',
    hero_descricao: 'Conheça a história, missão e valores da Federação Baiana de Karate-do Esportivo, uma entidade comprometida com a preservação do Karatê Goju-Ryu e a formação de atletas de alta performance.',
    desde_subtitulo: 'Trajetória de Excelência',
    desde_titulo: 'Nossa História no Esporte Baiano',
    desde_paragrafo1: 'A FBKE nasceu com a missão de regulamentar, fomentar e difundir o Karatê Goju-Ryu em Salvador e em todo o Estado da Bahia, mantendo viva a tradição e o respeito aos valores do Budo.',
    desde_paragrafo2: 'Filiados à IOGKF Brasil e reconhecida pela CBK, seguimos um rigoroso currículo técnico e filosófico, promovendo torneios estaduais, seminários internacionais e a chancela oficial de faixas pretas.',
    desde_paragrafo3: 'Nossa instituição acolhe atletas, professores e dojos de toda a Bahia, oferecendo suporte técnico, portal de transparência e ambiente de aprendizado transformador.',
    missao_desc: 'Preservar e transmitir o Karatê Goju-Ryu Okinawano e o Karatê Esportivo em sua forma mais autêntica, promovendo a formação técnica e ética dos atletas baianos.',
    visao_desc: 'Ser a entidade de referência no Karatê Esportivo na Bahia, reconhecida pela transparência digital, excelência técnica e expansão dos dojos filiados.',
    valores_desc: 'Respeito, disciplina, lealdade, transparência e perseverança — os pilares que sustentam cada treino e evento chancelado pela federação.'
  });

  useEffect(() => {
    document.title = 'A Academia - FBKE Federação Baiana de Karate';
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config && data.config.academia) {
            const ac = data.config.academia;
            setSiteConfig(prev => ({
              ...prev,
              ...ac
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
              <Building2 size={14} className="text-[#CE1126]" />
              {siteConfig.hero_subtitulo}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              {siteConfig.hero_titulo}
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {siteConfig.hero_descricao}
            </p>
          </div>
        </section>

        {/* ================= HISTÓRIA ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
                {siteConfig.desde_subtitulo}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {siteConfig.desde_titulo}
              </h2>
              <div className="w-16 h-1 bg-[#002B7F] rounded-full"></div>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                {siteConfig.desde_paragrafo1 && <p>{siteConfig.desde_paragrafo1}</p>}
                {siteConfig.desde_paragrafo2 && <p>{siteConfig.desde_paragrafo2}</p>}
                {siteConfig.desde_paragrafo3 && <p>{siteConfig.desde_paragrafo3}</p>}
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { icon: Award, title: 'IOGKF & CBK', desc: 'Chancela oficial e filiação nacional' },
                { icon: Users, title: 'Todos os Níveis', desc: 'Formação da iniciação ao alto rendimento' },
                { icon: Globe, title: 'Okinawa Tradicional', desc: 'Preservação da raiz do Goju-Ryu' },
                { icon: Shield, title: 'Gestão Transparente', desc: 'Homologação digital e certificados com QR Code' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#002B7F]/40 hover:shadow-md transition space-y-2">
                    <div className="p-2 w-10 h-10 rounded-xl bg-blue-50 text-[#002B7F] flex items-center justify-center font-bold">
                      <Icon size={20} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================= MISSÃO, VISÃO E VALORES ================= */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-2">
              <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
                Pilares Institucionais
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Missão, Visão e Valores
              </h2>
              <div className="w-16 h-1 bg-[#002B7F] rounded-full mx-auto mt-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Heart,
                  title: 'Missão',
                  desc: siteConfig.missao_desc,
                  tagColor: 'text-[#CE1126] bg-red-50',
                },
                {
                  icon: Star,
                  title: 'Visão',
                  desc: siteConfig.visao_desc,
                  tagColor: 'text-[#002B7F] bg-blue-50',
                },
                {
                  icon: Shield,
                  title: 'Valores',
                  desc: siteConfig.valores_desc,
                  tagColor: 'text-amber-700 bg-amber-50',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 hover:shadow-md hover:border-slate-300 transition">
                    <div className={`w-12 h-12 rounded-2xl ${item.tagColor} flex items-center justify-center font-bold`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
