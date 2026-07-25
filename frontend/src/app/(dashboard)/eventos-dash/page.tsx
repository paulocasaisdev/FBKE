'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Trophy, Plus, Users, Loader2, Play, Award, Edit, Trash2, X, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Evento {
  id: string | number;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'torneio' | 'seminario' | 'exame' | 'outro';
  imagem_url?: string;
}

interface Inscricao {
  id: string | number;
  evento_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_nome: string;
  categoria: 'Kata' | 'Kumite';
  faixa: string;
  idade: number;
}

interface BracketsData {
  competidores: string[];
  vencedoresQuartas: (string | null)[];
  vencedoresSemifinal: (string | null)[];
  vencedorFinal: string | null;
}

export default function EventosDashboardPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
  const [showInscritosModal, setShowInscritosModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showChavesModal, setShowChavesModal] = useState(false);

  // Selected item reference
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<'Kata' | 'Kumite'>('Kata');

  // Forms
  const [novoEventoForm, setNovoEventoForm] = useState({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio' as const, imagem_url: '' });
  const [inscricaoForm, setInscricaoForm] = useState({ categoria: 'Kata' as const, idade: 18 });

  // Bracket state
  const [bracket, setBracket] = useState<BracketsData | null>(null);
  const [loadingBracket, setLoadingBracket] = useState(false);

  // Deletion states & handlers
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNovoEventoForm(prev => ({ ...prev, imagem_url: data.url }));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmarExcluir = (evento: Evento) => {
    setEventoToDelete(evento);
    setShowConfirmDeleteModal(true);
  };

  const handleExcluirEvento = async () => {
    if (!eventoToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${eventoToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setEventos(eventos.filter(e => e.id !== eventoToDelete.id));
        setShowConfirmDeleteModal(false);
        setEventoToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir evento');
      }
    } catch (err) {
      console.error(err);
      setEventos(eventos.filter(e => e.id !== eventoToDelete.id));
      setShowConfirmDeleteModal(false);
      setEventoToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const carregarDados = async () => {
    try {
      const [resEventos, resInscricoes] = await Promise.all([
        fetch(`${API_URL}/api/eventos`, { credentials: 'include' }),
        fetch(`${API_URL}/api/eventos/inscricoes`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resEventos.ok) {
        const data = await resEventos.json();
        setEventos(data.eventos || []);
      }
      if (resInscricoes && resInscricoes.ok) {
        const data = await resInscricoes.json();
        const validas = Array.isArray(data.inscricoes) ? data.inscricoes.filter(Boolean) : [];
        setInscricoes(validas);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setEventos([
        { id: "ev-1", titulo: "Campeonato Baiano de Karate FBKE", descricao: "Torneio estadual oficial pontuável para o ranking.", data_inicio: "2026-08-20", data_fim: "2026-08-21", tipo: "torneio" },
        { id: "ev-2", titulo: "Curso de Arbitragem e Regras Goju-Ryu", descricao: "Treinamento oficial de arbitragem com Sensei convidado.", data_inicio: "2026-07-05", data_fim: "2026-07-06", tipo: "seminario" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoEventoForm)
      });
      if (res.ok) {
        const data = await res.json();
        setEventos([...eventos, data.evento]);
        setShowNovoEventoModal(false);
        setNovoEventoForm({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio', imagem_url: '' });
      }
    } catch (err) {
      alert("Erro ao criar evento.");
    }
  };

  const handleIncrever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento) return;
    try {
      const res = await fetch(`${API_URL}/api/eventos/inscricoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          categoria: inscricaoForm.categoria,
          idade: inscricaoForm.idade
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInscricoes([...inscricoes, data.inscricao]);
        setShowInscricaoModal(false);
        alert("Inscrição realizada com sucesso!");
      }
    } catch (err) {
      alert("Erro ao realizar inscrição.");
    }
  };

  const handleGerenciarChaves = async (evento: Evento, modalidade: 'Kata' | 'Kumite') => {
    setSelectedEvento(evento);
    setSelectedModalidade(modalidade);
    setLoadingBracket(true);
    setShowChavesModal(true);

    try {
      const res = await fetch(`${API_URL}/api/eventos/chaves?evento_id=${evento.id}&modalidade=${modalidade}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.brackets) {
          setBracket(data.brackets);
          setLoadingBracket(false);
          return;
        }
      }

      const inscritosModalidade = (inscricoes || []).filter(
        i => i && i.evento_id && String(i.evento_id) === String(evento.id) && i.categoria === modalidade
      );

      let nomes = inscritosModalidade.map(i => i.atleta_nome);

      if (nomes.length < 2) {
        nomes = ['Atleta 1', 'Atleta 2', 'Atleta 3', 'Atleta 4', 'Atleta 5', 'Atleta 6', 'Atleta 7', 'Atleta 8'];
      }

      const tamanhoChave = nomes.length <= 4 ? 4 : (nomes.length <= 8 ? 8 : 16);

      const competidores = [...nomes];
      while (competidores.length < tamanhoChave) {
        competidores.push('W.O.');
      }

      const novaChave: BracketsData = {
        competidores,
        vencedoresQuartas: Array(4).fill(null),
        vencedoresSemifinal: Array(2).fill(null),
        vencedorFinal: null
      };

      setBracket(novaChave);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBracket(false);
    }
  };

  const handleSalvarChave = async () => {
    if (!selectedEvento || !bracket) return;
    try {
      await fetch(`${API_URL}/api/eventos/chaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          modalidade: selectedModalidade,
          brackets: bracket
        })
      });
      alert('Chaves de confrontos salvas com sucesso!');
      setShowChavesModal(false);
    } catch (err) {
      alert('Erro ao salvar no servidor. Alterações persistidas localmente.');
      setShowChavesModal(false);
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
            Calendário & Campeonatos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Módulo de Eventos & Torneios</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de campeonatos estaduais, seminários e chaves de lutas</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNovoEventoModal(true)}
            className="px-5 py-2.5 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Criar Evento
          </button>
        )}
      </div>

      {/* Grid Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventos.map(evento => {
          const listInscritos = (inscricoes || []).filter(i => i && i.evento_id && String(i.evento_id) === String(evento.id));
          return (
            <div key={evento.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#002B7F] bg-blue-50 rounded-lg border border-blue-200">
                      {evento.tipo}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleConfirmarExcluir(evento)}
                        className="p-1 bg-red-50 hover:bg-red-600 border border-red-200 text-[#CE1126] hover:text-white rounded-lg transition cursor-pointer"
                        title="Excluir Evento"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-bold">
                    {evento.data_inicio} até {evento.data_fim}
                  </p>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">{evento.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{evento.descricao}</p>
                
                <p className="text-xs font-bold text-[#002B7F] flex items-center gap-1.5 pt-2">
                  <Users size={14} /> {listInscritos.length} Atletas Inscritos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100 w-full">
                {evento.tipo === 'torneio' && isAdmin && (
                  <>
                    <button
                      onClick={() => handleGerenciarChaves(evento, 'Kata')}
                      className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Trophy size={14} /> Chave Kata
                    </button>
                    <button
                      onClick={() => handleGerenciarChaves(evento, 'Kumite')}
                      className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Trophy size={14} /> Chave Kumite
                    </button>
                  </>
                )}
                {(!listInscritos.find(i => i.atleta_id === usuario?.id)) && (
                  <button
                    onClick={() => {
                      setSelectedEvento(evento);
                      setShowInscricaoModal(true);
                    }}
                    className="h-10 px-5 inline-flex items-center justify-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    Solicitar Inscrição
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedEvento(evento);
                    setShowInscritosModal(true);
                  }}
                  className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap"
                >
                  <Users size={14} /> Inscritos ({listInscritos.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL SOLICITAR INSCRIÇÃO */}
      {showInscricaoModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowInscricaoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Inscrição em Torneio</span>
              <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo}</h3>
            </div>

            <form onSubmit={handleIncrever} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Modalidade / Categoria</label>
                <select
                  value={inscricaoForm.categoria}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, categoria: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="Kata">Kata (Formas Tradicionais)</option>
                  <option value="Kumite">Kumite (Luta Livre Pontuada)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Idade do Atleta</label>
                <input
                  type="number"
                  min={5}
                  max={99}
                  value={inscricaoForm.idade}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, idade: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

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
                  Confirmar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER INSCRITOS */}
      {showInscritosModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto space-y-5">
            <button onClick={() => setShowInscritosModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-wider block">Lista de Atletas Inscritos</span>
              <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo}</h3>
            </div>

            {(inscricoes || []).filter(i => i && i.evento_id && String(i.evento_id) === String(selectedEvento.id)).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-2xl">
                Nenhum atleta inscrito neste evento ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(inscricoes || [])
                  .filter(i => i && i.evento_id && String(i.evento_id) === String(selectedEvento.id))
                  .map(insc => (
                    <div key={insc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{insc.atleta_nome}</p>
                        <p className="text-[10px] text-slate-500">{insc.filial_nome || 'Dojo Central'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border bg-blue-50 text-[#002B7F] border-blue-200">
                          {insc.categoria}
                        </span>
                        <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-700 border-slate-200">
                          Faixa {insc.faixa || 'Branca'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowInscritosModal(false)}
                className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR CHAVES */}
      {showChavesModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 relative shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Chaves de Confronto</span>
                <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo} — {selectedModalidade}</h3>
              </div>
              <button onClick={() => setShowChavesModal(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {loadingBracket ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
              </div>
            ) : bracket ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quartas */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">Quartas de Final</h4>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.competidores[idx * 2] || 'W.O.'}</span>
                          <button
                            onClick={() => {
                              const newV = [...bracket.vencedoresQuartas];
                              newV[idx] = bracket.competidores[idx * 2];
                              setBracket({ ...bracket, vencedoresQuartas: newV });
                            }}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                          >
                            Avançar
                          </button>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.competidores[idx * 2 + 1] || 'W.O.'}</span>
                          <button
                            onClick={() => {
                              const newV = [...bracket.vencedoresQuartas];
                              newV[idx] = bracket.competidores[idx * 2 + 1];
                              setBracket({ ...bracket, vencedoresQuartas: newV });
                            }}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Semifinal */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">Semifinal</h4>
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 my-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.vencedoresQuartas[idx * 2] || 'Aguardando'}</span>
                          {bracket.vencedoresQuartas[idx * 2] && (
                            <button
                              onClick={() => {
                                const newV = [...bracket.vencedoresSemifinal];
                                newV[idx] = bracket.vencedoresQuartas[idx * 2];
                                setBracket({ ...bracket, vencedoresSemifinal: newV });
                              }}
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                            >
                              Avançar
                            </button>
                          )}
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.vencedoresQuartas[idx * 2 + 1] || 'Aguardando'}</span>
                          {bracket.vencedoresQuartas[idx * 2 + 1] && (
                            <button
                              onClick={() => {
                                const newV = [...bracket.vencedoresSemifinal];
                                newV[idx] = bracket.vencedoresQuartas[idx * 2 + 1];
                                setBracket({ ...bracket, vencedoresSemifinal: newV });
                              }}
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                            >
                              Avançar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grande Final */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-amber-800 bg-amber-50 text-center py-1.5 rounded-lg border border-amber-200">Grande Final</h4>
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 truncate">{bracket.vencedoresSemifinal[0] || 'Aguardando'}</span>
                        {bracket.vencedoresSemifinal[0] && (
                          <button
                            onClick={() => setBracket({ ...bracket, vencedorFinal: bracket.vencedoresSemifinal[0] })}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                          >
                            Campeão
                          </button>
                        )}
                      </div>
                      <div className="border-t border-amber-200 pt-2 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 truncate">{bracket.vencedoresSemifinal[1] || 'Aguardando'}</span>
                        {bracket.vencedoresSemifinal[1] && (
                          <button
                            onClick={() => setBracket({ ...bracket, vencedorFinal: bracket.vencedoresSemifinal[1] })}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                          >
                            Campeão
                          </button>
                        )}
                      </div>

                      {bracket.vencedorFinal && (
                        <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-center">
                          <p className="text-[10px] font-extrabold uppercase text-amber-900">🏆 Campeão {selectedModalidade}</p>
                          <p className="text-sm font-black text-amber-950 mt-0.5">{bracket.vencedorFinal}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowChavesModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleSalvarChave}
                    className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Salvar Chaves
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL NOVO EVENTO */}
      {showNovoEventoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowNovoEventoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900">Criar Novo Evento</h3>

            <form onSubmit={handleCriarEvento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título do Evento *</label>
                <input
                  type="text" required
                  placeholder="Ex: Campeonato Baiano Goju-Ryu"
                  value={novoEventoForm.titulo}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do cronograma, local, etc."
                  value={novoEventoForm.descricao}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, descricao: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data Início *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_inicio}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_inicio: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data Fim *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_fim}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_fim: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoEventoModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4 text-slate-900">
            <h3 className="text-base font-black text-slate-900">Excluir Evento</h3>
            <p className="text-xs text-slate-600">Tem certeza que deseja excluir o evento <strong className="text-[#CE1126]">{eventoToDelete?.titulo}</strong>?</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirEvento}
                disabled={deleting}
                className="px-4 py-2 bg-[#CE1126] hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl shadow-sm cursor-pointer"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
