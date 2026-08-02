'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import FormAvaliacao from './FormAvaliacao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  id: string | number;
  titulo: string;
  status: string;
  modalidade: string;
  faixa_alvo: string;
}

interface Candidato {
  id: string | number;
  atleta_nome: string;
  avaliado_por?: string | null;
}

export default function AvaliarAtletaClient({ params }: { params: Promise<{ id: string; inscricaoId: string }> }) {
  const { id: exameIdProp, inscricaoId: inscricaoIdProp } = use(params);
  
  // Resolução de IDs reais para exportação estática (Apache/HostGator)
  let exameId = exameIdProp;
  let inscricaoId = inscricaoIdProp;
  if (typeof window !== 'undefined' && (exameIdProp === 'exame-1' || exameIdProp === 'exame-2' || exameIdProp === 'exame-3')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[0] === 'exames' && parts[2] === 'avaliar') {
      exameId = parts[1];
      inscricaoId = parts[3];
    }
  }

  const router = useRouter();
  const { usuario, tipo, isAdmin, carregando } = useAuth();
  const isExaminador = tipo === 'filial'; // Na GRKK, representantes de filial atuam como examinadores

  const [exame, setExame] = useState<Exame | null>(null);
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (carregando) return;

    if (!usuario) {
      router.push('/auth');
      return;
    }

    if (!isAdmin && !isExaminador) {
      router.push('/exames');
      return;
    }

    const carregarDados = async () => {
      try {
        const res = await fetch(`${API_URL}/api/exames/${exameId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Não foi possível carregar o exame.');
        const data = await res.json();
        
        setExame(data.exame);
        
        const cand = (data.candidatos || []).find((c: any) => String(c.id) === inscricaoId);
        if (!cand) {
          router.push(`/exames/${exameId}`);
          return;
        }

        setCandidato(cand);

        // Segurança: Apenas o examinador designado para o atleta ou admins podem avaliar
        if (!isAdmin && cand.avaliado_por !== usuario.id) {
          alert('Você não é o examinador designado para avaliar este atleta.');
          router.push(`/exames/${exameId}`);
          return;
        }

        // Verifica status do exame
        if (!['publicado', 'em_andamento'].includes(data.exame.status)) {
          alert('Este exame não está ativo para avaliações.');
          router.push(`/exames/${exameId}`);
          return;
        }

      } catch (err) {
        console.error(err);
        router.push(`/exames/${exameId}`);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [exameId, inscricaoId, usuario, carregando]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
        <p className="text-slate-500 font-bold text-xs tracking-wider uppercase">Carregando ficha de avaliação...</p>
      </div>
    );
  }

  if (!exame || !candidato) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 w-full max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Link 
          href={`/exames/${exameId}`} 
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-xs"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User size={20} className="text-[#002B7F]" /> Avaliação Técnica
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
            Exame de Faixa Digital · {exame.titulo}
          </p>
        </div>
      </div>

      {/* Form de Avaliação */}
      <FormAvaliacao
        exameId={String(exameId)}
        inscricaoId={String(inscricaoId)}
        candidatoNome={candidato.atleta_nome}
        faixaAlvo={exame.faixa_alvo}
        modalidade={exame.modalidade}
      />

    </div>
  );
}
