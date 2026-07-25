'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DojoKunInteractive from '@/components/DojoKunInteractive';
import { BookOpen, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function DojoKunPublicPage() {
  const [preambulo, setPreambulo] = useState('Os cinco preceitos que regem a mente e o corpo dos praticantes de Karatê Tradicional. Mais do que regras de comportamento dentro do Dojo, são diretrizes morais para a vida.');

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.config?.dojo_kun?.preambulo) {
            setPreambulo(data.config.dojo_kun.preambulo);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar preambulo do Dojo Kun:", err);
      }
    }
    loadConfig();
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
              <BookOpen size={14} className="text-amber-400" />
              Código Moral & Filosofia
            </span>

            {/* Kanji Calligraphy */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 tracking-widest leading-none select-none">
              道場訓
            </h1>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest uppercase">
              DOJO KUN — LEMA DO KARATE
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>
            
            <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed pt-2 whitespace-pre-line">
              {preambulo}
            </p>
          </div>
        </section>

        {/* ================= SEÇÃO INTERATIVA DOJO KUN ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <DojoKunInteractive />
        </section>

        {/* ================= CARD DE FILOSOFIA ================= */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm hover:shadow-md transition">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200">
              <Sparkles size={13} /> A Filosofia da Recitação
            </div>
            
            <h3 className="text-xl font-black text-slate-900">
              "Por que cada preceito começa com 'Hitotsu'?"
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Tradicionalmente, ao recitar o Dojo Kun no encerramento de cada treino, todos os preceitos são iniciados com a palavra <strong className="text-[#002B7F]">Hitotsu (一)</strong>, que significa "Primeiro" ou "Um". 
              Isso demonstra que não existe uma hierarquia entre os ensinamentos: nenhum princípio é mais importante que o outro. Todos possuem o mesmo peso e devem ser observados com a mesma dedicação absoluta.
            </p>

            <div className="w-16 h-0.5 bg-slate-200 mx-auto pt-1" />

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Praticado e recitado nas escolas tradicionais de Goju-Ryu no mundo inteiro.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
