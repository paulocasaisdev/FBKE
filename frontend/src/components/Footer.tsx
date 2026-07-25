'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

const dojoKunPrincipios = [
  'Respeitar os outros',
  'Ser corajoso',
  'Proteger o Karate tradicional',
  'Treinar mente e corpo',
  'Nunca desistir',
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
        
        {/* Coluna 1: Identidade FBKE (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#002B7F] font-black flex items-center justify-center border-b-2 border-[#CE1126]">
              FBKE
            </div>
            <div>
              <p className="font-extrabold text-white text-base">FBKE</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Federação Baiana de Karate</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Entidade oficial responsável pela regulamentação, apoio técnico e formação de atletas de Karate-do Esportivo no Estado da Bahia.
          </p>
          <div className="inline-flex items-center gap-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
            <Award size={18} className="text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300">Filiada e reconhecida pela <strong>IOGKF Brasil</strong></span>
          </div>
        </div>

        {/* Coluna 2: Navegação Rápida (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-xs font-extrabold uppercase text-white tracking-wider border-b border-slate-800 pb-2">
            Navegação
          </p>
          <ul className="space-y-2 text-xs">
            <li><Link href="/sobre" className="hover:text-white transition">A Academia</Link></li>
            <li><Link href="/dojo-kun" className="hover:text-white transition">Dojo Kun</Link></li>
            <li><Link href="/equipe" className="hover:text-white transition">Equipe Técnica</Link></li>
            <li><Link href="/galeria" className="hover:text-white transition">Galeria de Fotos</Link></li>
            <li><Link href="/eventos" className="hover:text-white transition">Eventos & Torneios</Link></li>
            <li><Link href="/transparencia" className="hover:text-white transition">Portal da Transparência</Link></li>
            <li><Link href="/contato" className="hover:text-white transition">Fale Conosco</Link></li>
          </ul>
        </div>

        {/* Coluna 3: Dojo Kun - 5 Princípios (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-xs font-extrabold uppercase text-amber-400 tracking-wider border-b border-slate-800 pb-2">
            Dojo Kun (Lema)
          </p>
          <ul className="space-y-2 text-xs">
            {dojoKunPrincipios.map((principio, idx) => (
              <li key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={13} className="text-[#CE1126] shrink-0" />
                <span>{principio}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 4: Contato (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-extrabold uppercase text-white tracking-wider border-b border-slate-800 pb-2">
            Sede
          </p>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="text-[#CE1126] shrink-0 mt-0.5" />
              <span>Salvador – BA, Brasil</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-blue-400 shrink-0" />
              <span>(71) 98811-0000</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-blue-400 shrink-0" />
              <span className="truncate">contato@fbke.com.br</span>
            </li>
          </ul>
        </div>

      </div>

      {/* RODAPÉ INFERIOR */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <p>© 2026 FBKE - Federação Baiana de Karate-do Esportivo. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <Link href="/transparencia/privacidade" className="hover:text-slate-400">Privacidade</Link>
          <Link href="/transparencia/termos" className="hover:text-slate-400">Termos de Uso</Link>
        </div>
      </div>
    </footer>
  );
}
