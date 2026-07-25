'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, Medal, Search, Award, Plus,
  Loader2, Building2, Sparkles, Clock, ChevronRight, X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface LeaderboardItem {
  id: string | number;
  nome: string;
  filial_id: string;
  filial_nome: string;
  faixa: string;
  pontos: number;
  posicao: number;
  cidade: string;
}

interface Conquista {
  id: string | number;
  tipo_evento: string;
  descricao: string;
  pontos: number;
  data_pontuacao: string;
}

interface AtletaSelect {
  id: string;
  nome: string;
  faixa: string;
}

interface FilialSelect {
  id: string;
  nome: string;
}

const PONTOS_EVENTOS: Record<string, { label: string; pontos: number; cor: string }> = {
  evento_participado: { label: 'Participação em Evento', pontos: 15, cor: 'text-[#002B7F] bg-blue-50 border-blue-200' },
  medalha_ouro: { label: 'Medalha de Ouro 🥇', pontos: 100, cor: 'text-amber-800 bg-amber-50 border-amber-200' },
  medalha_prata: { label: 'Medalha de Prata 🥈', pontos: 50, cor: 'text-slate-700 bg-slate-100 border-slate-200' },
  medalha_bronze: { label: 'Medalha de Bronze 🥉', pontos: 30, cor: 'text-amber-900 bg-amber-100 border-amber-300' },
  arbitragem: { label: 'Atuação como Árbitro', pontos: 40, cor: 'text-purple-800 bg-purple-50 border-purple-200' },
  curso: { label: 'Curso Federativo / Técnico', pontos: 25, cor: 'text-teal-800 bg-teal-50 border-teal-200' },
  exame: { label: 'Aprovação em Graduação', pontos: 80, cor: 'text-[#CE1126] bg-red-50 border-red-200' },
};

import { FAIXAS } from '@/constants/faixas';

export default function RankingPage() {
  const { usuario, isAdmin } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [historico, setHistorico] = useState<Conquista[]>([]);
  const [atletas, setAtletas] = useState<AtletaSelect[]>([]);
  const [filiais, setFiliais] = useState<FilialSelect[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroFaixa, setFiltroFaixa] = useState('todos');
  const [filtroFilial, setFiltroFilial] = useState('todos');

  // Modal
  const [showModalPontos, setShowModalPontos] = useState(false);
  const [salvandoPontos, setSalvandoPontos] = useState(false);
  const [formPontos, setFormPontos] = useState({
    atleta_id: '',
    tipo_evento: 'evento_participado',
    descricao: '',
    pontos: '15',
    data_pontuacao: new Date().toISOString().split('T')[0]
  });

  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    try {
      const [resRanking, resFiliais] = await Promise.all([
        fetch(`${API_URL}/api/ranking`, { credentials: 'include' }),
        fetch(`${API_URL}/api/filiais`, { credentials: 'include' })
      ]);

      if (resRanking.ok) {
        const data = await resRanking.json();
        setLeaderboard(data.leaderboard || []);
        setHistorico(data.historicoPessoal || []);
      } else {
        throw new Error("Falha no servidor");
      }

      if (resFiliais.ok) {
        const data = await resFiliais.json();
        setFiliais(data.filiais || []);
      }
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
      setLeaderboard([
        { id: "st-1", nome: "Pedro Oliveira", filial_id: "f-1", filial_nome: "Filial Salvador Centro", faixa: "Branca", pontos: 185, posicao: 1, cidade: "Salvador" },
        { id: "st-2", nome: "Lucas Almeida", filial_id: "f-1", filial_nome: "Filial Salvador Centro", faixa: "Amarela", pontos: 120, posicao: 2, cidade: "Salvador" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarAtletasSelect = async () => {
    try {
      const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAtletas(data.atletas || []);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de atletas:", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleOpenModal = () => {
    carregarAtletasSelect();
    setShowModalPontos(true);
  };

  const handleLancamentoPontos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPontos(true);
    setNotif({ type: null, msg: '' });

    try {
      const res = await fetch(`${API_URL}/api/ranking/pontuar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          atleta_id: formPontos.atleta_id,
          tipo_evento: formPontos.tipo_evento,
          descricao: formPontos.descricao,
          pontos: parseInt(formPontos.pontos, 10) || 0,
          data_pontuacao: formPontos.data_pontuacao
        })
      });

      if (!res.ok) throw new Error("Erro ao lançar pontos para o atleta.");

      setShowModalPontos(false);
      setNotif({ type: 'success', msg: 'Pontuação lançada no ranking com sucesso!' });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || "Falha ao lançar pontos." });
    } finally {
      setSalvandoPontos(false);
    }
  };

  const leaderboardFiltrado = leaderboard.filter(item => {
    const matchesBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || item.filial_nome.toLowerCase().includes(busca.toLowerCase());
    const matchesFaixa = filtroFaixa === 'todos' || item.faixa === filtroFaixa;
    const matchesFilial = filtroFilial === 'todos' || item.filial_id === filtroFilial;
    return matchesBusca && matchesFaixa && matchesFilial;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
            Competição & Pontuação
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Ranking Estadual de Atletas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pontuação oficial de campeonatos, cursos e atuações de arbitragem</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenModal}
            className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Lançar Pontuação
          </button>
        )}
      </div>

      {/* Tabela do Ranking */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-black text-slate-900">Classificação Geral de Atletas</h2>
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar por nome ou dojo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="table-responsive">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Posição</th>
                <th className="p-3.5">Atleta</th>
                <th className="p-3.5">Filial / Dojo</th>
                <th className="p-3.5">Graduação</th>
                <th className="p-3.5 text-right">Pontos Totais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {leaderboardFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum atleta ranqueado até o momento.</td>
                </tr>
              ) : (
                leaderboardFiltrado.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold">
                      {idx === 0 ? <span className="text-amber-500 font-black text-sm">🥇 1º</span> :
                       idx === 1 ? <span className="text-slate-400 font-black text-sm">🥈 2º</span> :
                       idx === 2 ? <span className="text-amber-700 font-black text-sm">🥉 3º</span> :
                       <span className="text-slate-600 font-mono">#{idx + 1}</span>}
                    </td>
                    <td className="p-3.5 font-black text-slate-900">{item.nome}</td>
                    <td className="p-3.5 text-slate-600">{item.filial_nome}</td>
                    <td className="p-3.5"><span className="font-bold text-[#002B7F]">Faixa {item.faixa}</span></td>
                    <td className="p-3.5 text-right font-mono font-black text-base text-[#CE1126]">{item.pontos} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
