'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Calendar, MapPin, Users, Award, Shield,
  UserCheck, HelpCircle, Building2, Loader2, AlertCircle,
  CheckCircle2, Plus, Zap
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

interface Candidato {
  id: string | number;
  exame_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_id: string;
  filial_nome: string;
  faixa_atual: string;
  graduacao_pretendida: string;
  status: 'pendente' | 'inscrito' | 'aprovado' | 'reprovado';
  autorizacao_tecnica: boolean;
  pagamento_status: 'pendente' | 'pago' | 'cancelado';
  avaliado_por?: string | null;
  dados_banca?: {
    criterios?: any[];
    nota_final?: number;
    observacoes?: string;
  };
}

interface Examinador {
  id: string;
  nome: string;
  email: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho:     { label: 'Rascunho',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  publicado:    { label: 'Publicado',    color: 'bg-blue-50 text-[#002B7F] border-blue-200' },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  concluido:    { label: 'Concluído',    color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-50 text-[#CE1126] border-red-200' },
};

const PROXIMOS_STATUS: Record<string, string[]> = {
  rascunho:     ['publicado', 'cancelado'],
  publicado:    ['em_andamento', 'cancelado'],
  em_andamento: ['concluido', 'cancelado'],
  concluido:    [],
  cancelado:    [],
};

export default function ExameDetalheClient({ id: idProp }: { id: string }) {
  // Resolução de ID real para exportação estática (Apache/HostGator)
  let id = idProp;
  if (typeof window !== 'undefined' && (idProp === 'exame-1' || idProp === 'exame-2' || idProp === 'exame-3')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'exames') {
      id = parts[1];
    }
  }

  const router = useRouter();
  const { usuario, tipo, isAdmin, carregando } = useAuth();
  const isExaminador = tipo === 'filial'; // Na GRKK, representantes de filial atuam como examinadores no tatame
  const isAtleta = tipo === 'atleta';

  const [exame, setExame] = useState<Exame | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [examinadoresVinculadosIds, setExaminadoresVinculadosIds] = useState<string[]>([]);
  
  // Todos os potenciais examinadores do sistema
  const [todosExaminadores, setTodosExaminadores] = useState<Examinador[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    try {
      const [resExame, resExaminadores] = await Promise.all([
        fetch(`${API_URL}/api/exames/${id}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/examinadores`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resExame.ok) {
        const data = await resExame.json();
        setExame(data.exame);
        setCandidatos(data.candidatos || []);
        setExaminadoresVinculadosIds(data.examinadores_ids || []);
      } else {
        router.push('/exames');
      }

      if (resExaminadores && resExaminadores.ok) {
        const data = await resExaminadores.json();
        setTodosExaminadores(data.examinadores || []);
      }
    } catch (err) {
      console.error(err);
      setNotif({ type: 'error', msg: 'Erro ao carregar dados do exame.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarDados();
  }, [id, usuario, carregando]);

  const handleSalvarExaminadores = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}/examinadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ examinador_ids: examinadoresVinculadosIds })
      });

      if (!res.ok) throw new Error('Não foi possível salvar os examinadores.');
      setNotif({ type: 'success', msg: 'Examinadores vinculados atualizados com sucesso!' });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao vincular examinadores.' });
    }
  };

  const handleCheckboxChange = (exId: string, checked: boolean) => {
    if (checked) {
      setExaminadoresVinculadosIds([...examinadoresVinculadosIds, exId]);
    } else {
      setExaminadoresVinculadosIds(examinadoresVinculadosIds.filter(id => id !== exId));
    }
  };

  const handleAtualizarStatus = async (novoStatus: string) => {
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status do exame.');
      setNotif({ type: 'success', msg: `Status do exame alterado para ${novoStatus}!` });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao alterar status.' });
    }
  };

  const handleEmitirCertificados = async () => {
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}/certificados`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao emitir certificados.');
      setNotif({ type: 'success', msg: `Certificados gerados com sucesso para os atletas aprovados! (${data.emitidos} emitidos)` });
      carregarDados();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao emitir certificados.' });
    }
  };

  const handleExcluirExame = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este exame permanentemente? Todos os candidatos e examinadores vinculados serão removidos.")) {
      return;
    }
    
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/exames/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir o exame.');
      
      router.push('/exames');
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao excluir exame.' });
    }
  };

  const handleConfirmarCandidato = async (candidatoId: string | number, novoStatus: 'inscrito' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, status: novoStatus } : c));
        setNotif({ type: 'success', msg: novoStatus === 'inscrito' ? 'Candidato confirmado na fila de avaliação!' : 'Candidato movido de volta para pendente.' });
      } else {
        const data = await res.json();
        setNotif({ type: 'error', msg: data.error || 'Erro ao atualizar status.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprovacaoTecnica = async (candidatoId: string | number, aprovado: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autorizacao_tecnica: aprovado })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, autorizacao_tecnica: aprovado } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprovacaoAdministrativa = async (candidatoId: string | number, statusPagamento: 'pago' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/exames/candidatos/${candidatoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pagamento_status: statusPagamento })
      });
      if (res.ok) {
        setCandidatos(candidatos.map(c => c.id === candidatoId ? { ...c, pagamento_status: statusPagamento } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-cinzel text-xs tracking-widest uppercase">Carregando detalhes do exame...</p>
      </div>
    );
  }

  if (!exame) return null;

  const cfg = statusConfig[exame.status] || { label: exame.status, color: 'bg-zinc-900 text-zinc-400' };
  const proximos = PROXIMOS_STATUS[exame.status] || [];
  const aprovados = candidatos.filter(c => c.status === 'aprovado').length;
  const meusCandidatosDesignados = candidatos.filter(c => c.avaliado_por === usuario?.id);

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <Link href="/exames" className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition mt-1 shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{exame.titulo}</h2>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar size={13} className="text-[#002B7F]" /> 
                {exame.data_exame.includes('T') ? exame.data_exame.split('T')[0].split('-').reverse().join('/') : exame.data_exame.split('-').reverse().join('/')}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#002B7F]" /> {exame.local}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-[#002B7F]" /> {candidatos.length} atletas inscritos
              </span>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-2 flex-wrap items-center">
          {exame.status === 'concluido' && isAdmin && (
            <button
              onClick={handleEmitirCertificados}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-500 hover:text-white transition duration-300 cursor-pointer shadow-xs"
            >
              🏅 Emitir Certificados
            </button>
          )}

          {isAdmin && (exame.status === 'cancelado' || exame.status === 'rascunho') && (
            <button
              onClick={handleExcluirExame}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-red-50 text-[#CE1126] border border-red-200 hover:bg-[#CE1126] hover:text-white transition duration-300 cursor-pointer shadow-xs"
            >
              🗑 Excluir Exame
            </button>
          )}

          {isAdmin && proximos.map((s) => (
            <button
              key={s}
              onClick={() => handleAtualizarStatus(s)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition uppercase tracking-wider cursor-pointer shadow-xs ${
                s === 'cancelado'
                  ? 'bg-red-50 text-[#CE1126] border border-red-200 hover:bg-red-100'
                  : 'bg-[#002B7F] hover:bg-blue-900 text-white'
              }`}
            >
              → {statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Notificações */}
      {notif.type && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold border ${
          notif.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-[#CE1126]'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Modalidade', value: exame.modalidade },
          { label: 'Graduação Pretendida', value: exame.faixa_alvo || 'Todas as Faixas' },
          { label: 'Taxa de Inscrição', value: exame.taxa_valor ? `R$ ${Number(exame.taxa_valor).toFixed(2)}` : 'Gratuito' },
          { label: 'Aprovados', value: `${aprovados} / ${candidatos.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{label}</p>
            <p className="font-black text-slate-900 text-sm sm:text-base">{value}</p>
          </div>
        ))}
      </div>

      {/* Alunos Designados para sua Banca */}
      {meusCandidatosDesignados.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Award size={16} className="text-[#002B7F]" /> Alunos Designados para sua Banca
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Você é o examinador designado para avaliar estes atletas neste exame.
              </p>
            </div>
            {meusCandidatosDesignados.some(c => c.status === 'inscrito') && ['publicado', 'em_andamento'].includes(exame.status) && (
              <Link
                href={`/exames/${id}/avaliar-banca`}
                className="inline-flex items-center justify-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <Zap size={13} className="animate-pulse" /> Banca Concorrente (Avaliar Todos Juntos)
              </Link>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meusCandidatosDesignados.map((c) => {
              const podeAvaliar = c.status === 'inscrito' && ['publicado', 'em_andamento'].includes(exame.status);

              return (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.atleta_nome}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.filial_nome}</p>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        c.status === 'aprovado'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : c.status === 'reprovado'
                          ? 'bg-red-50 text-[#CE1126] border-red-200'
                          : c.status === 'inscrito'
                          ? 'bg-blue-50 text-[#002B7F] border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.status === 'pendente' ? 'Pendente' :
                         c.status === 'inscrito' ? 'Em Exame' :
                         c.status === 'aprovado' ? 'Aprovado' :
                         c.status === 'reprovado' ? 'Reprovado' : c.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      <span>Graduação: {c.faixa_atual} → </span>
                      <strong className="text-[#002B7F]">{c.graduacao_pretendida}</strong>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {podeAvaliar ? (
                      <Link
                        href={`/exames/${id}/avaliar/${c.id}`}
                        className="w-full text-center bg-white hover:bg-[#002B7F] hover:text-white text-[#002B7F] border border-blue-200 font-bold py-2 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer shadow-2xs"
                      >
                        Avaliar Atleta
                      </Link>
                    ) : c.status === 'aprovado' && c.dados_banca ? (
                      <Link
                        href={`/exames/boletim/${c.id}`}
                        className="w-full text-center bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Visualizar Boletim
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic font-medium w-full text-center py-1">
                        {c.status === 'pendente' ? 'Aguardando início' : 'Avaliação concluída'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção de Examinadores e Distribuição de Bancas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Vincular Examinadores (Apenas Admins) */}
        {isAdmin && ['rascunho', 'publicado', 'em_andamento'].includes(exame.status) && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                <UserCheck size={16} className="text-[#002B7F]" /> Vincular Examinadores
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Selecione os examinadores para julgar as apresentações na banca.</p>
              
              <form id="form-examinadores" onSubmit={handleSalvarExaminadores} className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {todosExaminadores.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum examinador cadastrado no sistema.</p>
                  ) : (
                    todosExaminadores.map((ex) => (
                      <label key={ex.id} className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none font-medium">
                        <input
                          type="checkbox"
                          checked={examinadoresVinculadosIds.includes(ex.id)}
                          onChange={(e) => handleCheckboxChange(ex.id, e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-[#002B7F] focus:ring-[#002B7F] w-4 h-4"
                        />
                        {ex.nome}
                      </label>
                    ))
                  )}
                </div>
              </form>
            </div>
            
            <button
              type="submit"
              form="form-examinadores"
              className="w-full text-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer shadow-xs"
            >
              Salvar Examinadores
            </button>
          </div>
        )}

        {/* Fila de Examinadores / Distribuição de Alunos */}
        <div className={`${isAdmin && ['rascunho', 'publicado', 'em_andamento'].includes(exame.status) ? 'md:col-span-2' : 'md:col-span-3'} bg-white border border-slate-200 rounded-3xl p-6 shadow-sm`}>
          <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
            <Shield size={16} className="text-[#002B7F]" /> Distribuição de Bancas
          </h3>
          
          {examinadoresVinculadosIds.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <HelpCircle size={24} className="mx-auto mb-2 opacity-30 text-[#002B7F]" />
              Nenhum examinador vinculado a este exame.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {todosExaminadores.filter(ex => examinadoresVinculadosIds.includes(ex.id)).map((ex) => {
                const ativos = candidatos.filter(c => c.avaliado_por === ex.id && c.status === 'inscrito');
                const isCurrentUser = ex.id === usuario?.id;
                const canEvaluate = isAdmin || isCurrentUser;

                return (
                  <div key={ex.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{ex.nome}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Banca de Avaliação</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ativos.length >= 9 ? 'bg-red-50 text-[#CE1126] border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                        {ativos.length} / 9 ativos
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-200 pt-2">
                      {ativos.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic py-1">Aguardando início ou sem alunos alocados...</p>
                      ) : (
                        ativos.map(cand => (
                          <div key={cand.id} className="flex justify-between items-center bg-white px-3 py-2 border border-slate-200 rounded-xl text-xs">
                            <span className="text-slate-800 truncate max-w-[150px] font-medium">{cand.atleta_nome}</span>
                            {exame.status === 'em_andamento' && canEvaluate ? (
                              <Link
                                href={`/exames/${id}/avaliar/${cand.id}`}
                                className="text-[10px] font-bold text-[#002B7F] hover:text-blue-900 transition uppercase tracking-widest"
                              >
                                Avaliar →
                              </Link>
                            ) : (
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Em espera</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {isCurrentUser && exame.status === 'em_andamento' && (
                      <div className="pt-2 border-t border-slate-200">
                        <Link
                          href={`/exames/${id}/avaliar-banca`}
                          className="flex items-center justify-center gap-1.5 w-full bg-blue-50 hover:bg-[#002B7F] text-[#002B7F] hover:text-white font-bold py-2 rounded-xl transition border border-blue-200 text-[10px] uppercase tracking-widest text-center cursor-pointer"
                        >
                          <Zap size={10} className="animate-pulse" /> Banca Concorrente
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Homologações e Validações (Alunos e Filiais) */}
      {(isAdmin || isExaminador) && (
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-6`}>
          {/* Homologação Técnica (Recomendação) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Award size={16} className="text-[#002B7F]" /> Homologação Técnica (Alunos)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {isAdmin
                ? 'Autorize os alunos inscritos a irem para a banca de avaliação baseado em critérios técnicos.'
                : 'Autorize os alunos de sua filial a irem para a banca de avaliação baseado em critérios técnicos.'}
            </p>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2">
              {candidatos.filter(c => isAdmin || c.filial_id === usuario?.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Nenhum aluno para homologação técnica.</p>
              ) : (
                candidatos.filter(c => isAdmin || c.filial_id === usuario?.id).map((c) => (
                  <div key={c.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.atleta_nome}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.filial_nome}</p>
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 mt-1 rounded-md border ${
                        c.autorizacao_tecnica 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {c.autorizacao_tecnica ? 'Autorizado' : 'Não Autorizado'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAprovacaoTecnica(c.id, true)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition cursor-pointer ${
                          c.autorizacao_tecnica ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Autorizar
                      </button>
                      <button
                        onClick={() => handleAprovacaoTecnica(c.id, false)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition cursor-pointer ${
                          !c.autorizacao_tecnica ? 'bg-[#CE1126] text-white border-[#CE1126]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Homologação Administrativa (Pagamento) - Exclusivo do Admin */}
          {isAdmin && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Building2 size={16} className="text-[#002B7F]" /> Homologação Administrativa (Taxas)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Valide se as taxas de inscrição correspondentes foram quitadas para homologar a inscrição.</p>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2">
                {candidatos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhum aluno inscrito.</p>
                ) : (
                  candidatos.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{c.atleta_nome}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.filial_nome}</p>
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 mt-1 rounded-md border ${
                          c.pagamento_status === 'pago'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          {c.pagamento_status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAprovacaoAdministrativa(c.id, 'pago')}
                          className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition cursor-pointer ${
                            c.pagamento_status === 'pago' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Quitar
                        </button>
                        <button
                          onClick={() => handleAprovacaoAdministrativa(c.id, 'pendente')}
                          className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition cursor-pointer ${
                            c.pagamento_status === 'pendente' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Pendente
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela Geral de Candidatos */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
            <Users size={16} className="text-[#002B7F]" /> Fila e Status Geral de Inscrições
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-extrabold">
                <th className="px-6 py-3.5">Candidato</th>
                <th className="px-6 py-3.5 hidden md:table-cell">Graduação</th>
                <th className="px-6 py-3.5 hidden lg:table-cell">Banca Designada</th>
                <th className="px-6 py-3.5 hidden lg:table-cell">Pagamento</th>
                <th className="px-6 py-3.5">Resultado</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic text-xs tracking-wider">
                    Nenhum aluno inscrito neste exame ainda.
                  </td>
                </tr>
              ) : (
                candidatos.map((c) => {
                  const examinadorNome = todosExaminadores.find(ex => ex.id === c.avaliado_por)?.nome;
                  const canEvaluate = isAdmin || (isExaminador && c.avaliado_por === usuario?.id);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{c.atleta_nome}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.filial_nome}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs">
                        <p className="text-slate-700 font-medium">{c.faixa_atual} → <strong className="text-[#002B7F]">{c.graduacao_pretendida}</strong></p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        {examinadorNome ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <UserCheck size={13} className="text-[#002B7F]" />
                            <span>{examinadorNome}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Fila de espera geral</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          c.pagamento_status === 'pago' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {c.pagamento_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          c.status === 'aprovado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.status === 'reprovado'
                            ? 'bg-red-50 text-[#CE1126] border-red-200'
                            : c.status === 'inscrito'
                            ? 'bg-blue-50 text-[#002B7F] border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {c.status === 'pendente' ? 'Pendente' :
                           c.status === 'inscrito' ? 'Na Fila' :
                           c.status === 'aprovado' ? 'Aprovado' :
                           c.status === 'reprovado' ? 'Reprovado' : c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          {c.status === 'aprovado' && c.dados_banca && (
                            <Link
                              href={`/exames/boletim/${c.id}`}
                              className="text-[10px] font-bold text-[#002B7F] hover:underline uppercase tracking-wider"
                            >
                              Boletim
                            </Link>
                          )}

                          {/* Admin ou Filial Vinculada: Confirmar candidato pendente na fila */}
                          {(isAdmin || (isExaminador && c.filial_id === usuario?.id)) && c.status === 'pendente' && exame.status !== 'concluido' && exame.status !== 'cancelado' && (
                            <button
                              onClick={() => handleConfirmarCandidato(c.id, 'inscrito')}
                              className="text-[10px] font-bold bg-blue-50 hover:bg-[#002B7F] text-[#002B7F] hover:text-white px-3 py-1.5 rounded-xl transition uppercase tracking-wider border border-blue-200 cursor-pointer"
                            >
                              ✓ Confirmar
                            </button>
                          )}

                          {/* Admin ou Filial Vinculada: Devolver candidato inscrito para pendente */}
                          {(isAdmin || (isExaminador && c.filial_id === usuario?.id)) && c.status === 'inscrito' && exame.status !== 'concluido' && exame.status !== 'cancelado' && (
                            <button
                              onClick={() => handleConfirmarCandidato(c.id, 'pendente')}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-xl transition uppercase tracking-wider border border-slate-200 cursor-pointer"
                            >
                              ↩ Pendente
                            </button>
                          )}

                          {exame.status === 'em_andamento' && c.status === 'inscrito' && canEvaluate && (
                            <Link
                              href={`/exames/${id}/avaliar/${c.id}`}
                              className="text-[10px] font-bold bg-[#002B7F] hover:bg-blue-900 text-white px-3 py-1.5 rounded-xl transition uppercase tracking-wider shadow-xs"
                            >
                              Avaliar
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
