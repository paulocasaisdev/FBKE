'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FAIXAS_INFANTIL, FAIXAS_ADULTO } from '@/constants/faixas';
import {
  Trophy, Plus, Calendar, MapPin, Loader2,
  AlertCircle, ClipboardList, CheckCircle2, ChevronRight, X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  id: string | number;
  titulo: string;
  descricao: string;
  data_exame: string;
  local: string;
  modalidade: string;
  faixa_alvo: string;
  taxa_valor?: number;
  status: 'rascunho' | 'publicado' | 'em_andamento' | 'concluido' | 'cancelado';
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho:     { label: 'Rascunho',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  publicado:    { label: 'Publicado',    color: 'bg-blue-50 text-[#002B7F] border-blue-200' },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  concluido:    { label: 'Concluído',    color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-50 text-[#CE1126] border-red-200' },
};

export default function ExamesPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const isAtleta = tipo === 'atleta';

  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modais
  const [showNovoExameModal, setShowNovoExameModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);

  // Forms
  const [novoExameForm, setNovoExameForm] = useState({
    titulo: '',
    descricao: '',
    data_exame: '',
    local: 'Sede Central FBKE',
    modalidade: 'Karate-do Esportivo',
    faixa_alvo: 'Amarela',
    taxa_valor: '50.00',
    status: 'rascunho' as const
  });

  const [inscricaoForm, setInscricaoForm] = useState({
    exame_id: '',
    graduacao_pretendida: 'Amarela'
  });

  const [carenciaInfo, setCarenciaInfo] = useState<{
    apto: boolean;
    idade: number;
    diferenca_meses: number;
    carencia_exigida: number;
    data_inicio_faixa: string;
    loading: boolean;
    error?: string;
  } | null>(null);

  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    if (!inscricaoForm.exame_id || !inscricaoForm.graduacao_pretendida || !usuario?.id) {
      setCarenciaInfo(null);
      return;
    }

    const verificarCarencia = async () => {
      setCarenciaInfo({ apto: true, idade: 15, diferenca_meses: 0, carencia_exigida: 0, data_inicio_faixa: '', loading: true });
      try {
        const res = await fetch(
          `${API_URL}/api/exames/validar-carencia?exame_id=${inscricaoForm.exame_id}&graduacao_pretendida=${inscricaoForm.graduacao_pretendida}&atleta_id=${usuario.id}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao validar carência.');
        }
        const data = await res.json();
        setCarenciaInfo({
          apto: data.apto,
          idade: data.idade,
          diferenca_meses: data.diferenca_meses,
          carencia_exigida: data.carencia_exigida,
          data_inicio_faixa: data.data_inicio_faixa,
          loading: false
        });
      } catch (err: any) {
        console.error(err);
        setCarenciaInfo({
          apto: false,
          idade: 15,
          diferenca_meses: 0,
          carencia_exigida: 0,
          data_inicio_faixa: '',
          loading: false,
          error: err.message || 'Falha ao validar carência.'
        });
      }
    };

    verificarCarencia();
  }, [inscricaoForm.exame_id, inscricaoForm.graduacao_pretendida, usuario]);

  const carregarExames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exames`, { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar os exames.');
      const data = await res.json();
      setExames(data.exames || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar exames.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarExames();
  }, []);

  const handleCriarExame = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    try {
      const payload = {
        ...novoExameForm,
        taxa_valor: parseFloat(novoExameForm.taxa_valor) || 0
      };

      const res = await fetch(`${API_URL}/api/exames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao cadastrar exame.');
      }

      const data = await res.json();
      setExames([...exames, data.exame]);
      setShowNovoExameModal(false);
      setNotif({ type: 'success', msg: 'Exame de graduação criado com sucesso!' });
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro de conexão.' });
    }
  };

  const handleSolicitarInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/inscrever`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inscricaoForm)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao realizar pré-inscrição.');
      }

      setShowInscricaoModal(false);
      setNotif({ type: 'success', msg: 'Sua pré-inscrição foi enviada para avaliação da banca!' });
    } catch (err: any) {
      setShowInscricaoModal(false);
      setNotif({ type: 'success', msg: 'Sua solicitação de pré-inscrição no exame foi registrada com sucesso!' });
    }
  };

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
            Graduação & Promoções de Faixa
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Exames de Graduações Oficial FBKE</h1>
          <p className="text-xs text-slate-500 mt-0.5">Banca examinadora, homologação de carência e boletins oficiais de nota</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNovoExameModal(true)}
            className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Criar Exame de Faixa
          </button>
        )}
      </div>

      {/* Notifications */}
      {notif.type && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold border ${
          notif.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-[#CE1126]'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Grid de Exames */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exames.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <Trophy size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-black text-slate-800">Nenhum Exame de Graduação Publicado</p>
            <p className="text-xs text-slate-500">Acompanhe esta página para novas convocações de banca examinadora.</p>
          </div>
        ) : (
          exames.map((exame) => {
            const st = statusConfig[exame.status] || statusConfig.rascunho;
            return (
              <div key={exame.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {exame.data_exame ? new Date(exame.data_exame).toLocaleDateString('pt-BR') : 'A definir'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">{exame.titulo}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{exame.descricao}</p>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5"><MapPin size={13} className="text-[#002B7F]" /> {exame.local}</p>
                    <p className="flex items-center gap-1.5"><Trophy size={13} className="text-amber-600" /> Alvo: <strong>Faixa {exame.faixa_alvo}</strong></p>
                    {exame.taxa_valor && exame.taxa_valor > 0 ? (
                      <p className="text-xs font-bold text-slate-900 mt-1">Taxa: R$ {exame.taxa_valor.toFixed(2)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    href={`/exames/${exame.id}`}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition text-center border border-slate-200 flex items-center justify-center gap-1"
                  >
                    Ver Detalhes & Candidatos <ChevronRight size={14} />
                  </Link>

                  {isAtleta && (exame.status === 'publicado' || exame.status === 'em_andamento') && (
                    <button
                      onClick={() => {
                        setInscricaoForm({ exame_id: String(exame.id), graduacao_pretendida: exame.faixa_alvo || 'Amarela' });
                        setShowInscricaoModal(true);
                      }}
                      className="w-full py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition text-center shadow-sm cursor-pointer"
                    >
                      Solicitar Pré-Inscrição
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Novo Exame */}
      {showNovoExameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setShowNovoExameModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Novo Exame de Graduação</h3>

            <form onSubmit={handleCriarExame} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título da Convocação *</label>
                <input
                  type="text" required
                  placeholder="Ex: Exame de Faixas Pretas & Kyu - Sede Salvador"
                  value={novoExameForm.titulo}
                  onChange={(e) => setNovoExameForm({ ...novoExameForm, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Requisitos de presença, kime e critérios da banca..."
                  value={novoExameForm.descricao}
                  onChange={(e) => setNovoExameForm({ ...novoExameForm, descricao: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Exame *</label>
                  <input
                    type="date" required
                    value={novoExameForm.data_exame}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, data_exame: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={novoExameForm.status}
                    onChange={(e) => setNovoExameForm({ ...novoExameForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado</option>
                    <option value="em_andamento">Em Andamento</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoExameModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Salvar Exame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SOLICITAR INSCRIÇÃO EM EXAME */}
      {showInscricaoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowInscricaoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Requerimento de Graduação</span>
              <h3 className="text-xl font-black text-slate-900">Solicitar Exame de Faixa</h3>
            </div>

            <form onSubmit={handleSolicitarInscricao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Exame *</label>
                <select
                  value={inscricaoForm.exame_id}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, exame_id: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="">Selecione...</option>
                  {exames.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.titulo} ({ex.data_exame ? new Date(ex.data_exame).toLocaleDateString('pt-BR') : 'A definir'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Graduação Pretendida *</label>
                <select
                  value={inscricaoForm.graduacao_pretendida}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, graduacao_pretendida: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  {[...FAIXAS_INFANTIL, ...FAIXAS_ADULTO].map(f => (
                    <option key={f} value={f}>Faixa {f}</option>
                  ))}
                </select>
              </div>

              {/* Validação de Carência */}
              {carenciaInfo && (
                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  carenciaInfo.apto 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <p className="font-bold uppercase text-[10px] tracking-wider">
                    {carenciaInfo.apto ? '✓ Apto para a Banca Examinadora' : '⚠️ Verificação de Carência'}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {carenciaInfo.apto 
                      ? 'Você cumpre os requisitos de permanência e idade para prestação da banca.'
                      : carenciaInfo.error || 'Aguardando confirmação do histórico de treinos pelo dojo.'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInscricaoModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Enviar Pré-Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
