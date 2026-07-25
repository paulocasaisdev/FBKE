'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, Award, Shield, Loader2 } from 'lucide-react';

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  belt: string;
  bio: string;
  photo_url: string | null;
}

const defaultTeam: TeamMember[] = [
  {
    id: 1,
    name: 'Sensei Paulo Roberto',
    role: 'Instrutor Chefe',
    belt: 'Preta 4º Dan',
    bio: 'Praticante de Karatê Goju-Ryu há mais de 20 anos, formado e graduado pela IOGKF Brasil. Dedicado à preservação e ensino da arte marcial em sua forma mais tradicional.',
    photo_url: null,
  },
  {
    id: 2,
    name: 'Senpai Carlos Silva',
    role: 'Instrutor Auxiliar',
    belt: 'Preta 1º Dan',
    bio: 'Instrutor credenciado pela IOGKF Brasil com vasta experiência em competições nacionais e internacionais. Especialista em kata e bunkai.',
    photo_url: null,
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch(`${API_URL}/api/equipe`);
        if (!res.ok) throw new Error('Erro ao carregar equipe');
        const data = await res.json();
        const apiMembers = data.members || [];
        const mapped = apiMembers.map((m: any) => {
          let belt = "Faixa Preta";
          let role = m.cargo || m.role || "";
          if (role.includes(" - ")) {
            const parts = role.split(" - ");
            role = parts[0];
            belt = parts[1];
          }
          return {
            id: m.id,
            name: m.nome || m.name || "",
            role: role,
            belt: m.belt || m.graduacao || belt,
            bio: m.biografia || m.bio || "",
            photo_url: m.foto_url || m.photo_url || null
          };
        });
        setMembers(mapped.length > 0 ? mapped : defaultTeam);
      } catch (err) {
        console.error('Erro ao buscar equipe do backend:', err);
        setMembers(defaultTeam);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
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
              <Users size={14} className="text-[#CE1126]" />
              Corpo Técnico & Professores
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              NOSSA EQUIPE TÉCNICA
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Instrutores qualificados e diplomados, dedicados à excelência técnica, formação de atletas e transmissão dos valores éticos da federação.
            </p>
          </div>
        </section>

        {/* ================= GRID DA EQUIPE ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Loader2 size={32} className="text-[#002B7F] animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carregando membros da equipe...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition duration-300 flex flex-col justify-between"
                >
                  {/* Foto ou Avatar */}
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden relative border-b border-slate-200">
                    {member.photo_url ? (
                      <img 
                        src={member.photo_url} 
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="w-20 h-20 rounded-full bg-[#002B7F] text-white flex items-center justify-center font-black text-2xl border-2 border-[#CE1126] shadow-sm">
                          {member.name ? member.name.split(' ')[0]?.[0] || 'F' : 'F'}{member.name ? member.name.split(' ')[1]?.[0] || 'B' : 'B'}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Credenciado FBKE</span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-red-50 text-[#CE1126] border border-red-200">
                        {member.belt}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {member.role}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-snug">{member.name}</h3>

                    <div className="w-12 h-1 bg-[#002B7F] rounded-full"></div>

                    <p className="text-slate-600 text-xs leading-relaxed font-normal pt-1">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
