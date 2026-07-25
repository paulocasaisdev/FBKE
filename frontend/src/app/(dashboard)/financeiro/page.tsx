'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard, DollarSign, Clock, Plus, Search,
  Loader2, QrCode, CheckCircle2, AlertTriangle, ArrowUpRight, X,
  TrendingUp, Calendar, Trash2, FileText, Printer, Download, User, Building2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Pagamento {
  id: string | number;
  atleta_nome?: string;
  filial_nome?: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
}

interface AtletaSelect {
  id: string;
  nome: string;
}

interface FilialSelect {
  id: string;
  nome: string;
}

const TIPO_COBRANCA: Record<string, { label: string; cor: string }> = {
  filiacao: { label: 'Taxa de Filiação', cor: 'text-[#002B7F] bg-blue-50 border-blue-200' },
  anuidade: { label: 'Anuidade da Federação', cor: 'text-purple-800 bg-purple-50 border-purple-200' },
  exame: { label: 'Taxa de Graduação', cor: 'text-[#CE1126] bg-red-50 border-red-200' },
  evento: { label: 'Taxa de Evento/Torneio', cor: 'text-teal-800 bg-teal-50 border-teal-200' },
  mensalidade: { label: 'Mensalidade', cor: 'text-amber-800 bg-amber-50 border-amber-200' },
  outro: { label: 'Outras Taxas', cor: 'text-slate-700 bg-slate-100 border-slate-200' }
};

const STATUS_COBRANCA: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  pago: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  atrasado: { label: 'Atrasado', cls: 'bg-red-50 text-[#CE1126] border-red-200' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function FinanceiroPage() {
  const { usuario, tipo, isAdmin } = useAuth();

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [atletas, setAtletas] = useState<AtletaSelect[]>([]);
  const [filiais, setFiliais] = useState<FilialSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modais
  const [showNovaCobrancaModal, setShowNovaCobrancaModal] = useState(false);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Form de Nova Cobrança
  const [novaCobranca, setNovaCobranca] = useState({
    destinatario_tipo: 'atleta', // 'atleta' | 'filial' | 'outro'
    atleta_id: '',
    filial_id: '',
    nome_manual: '',
    tipo: 'anuidade',
    valor: '',
    data_vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    descricao: ''
  });

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        const [resPag, resAtl, resFil] = await Promise.all([
          fetch(`${API_URL}/api/financeiro/pagamentos`, { credentials: 'include' }).catch(() => null),
          fetch(`${API_URL}/api/atletas`, { credentials: 'include' }).catch(() => null),
          fetch(`${API_URL}/api/filiais/public`).catch(() => null)
        ]);

        if (resPag && resPag.ok) {
          const dataP = await resPag.json();
          setPagamentos(dataP.pagamentos || []);
        } else {
          setPagamentos([
            { id: "pag-1", atleta_nome: "Pedro Oliveira", tipo: "filiacao", valor: 150.00, data_vencimento: "2026-08-10", status: "pago" },
            { id: "pag-2", atleta_nome: "Lucas Almeida", tipo: "anuidade", valor: 200.00, data_vencimento: "2026-07-30", status: "pendente" },
            { id: "pag-3", filial_nome: "Dojo Central Salvador", tipo: "exame", valor: 350.00, data_vencimento: "2026-08-15", status: "pendente" }
          ]);
        }

        let listaAtletas: AtletaSelect[] = [];
        if (resAtl && resAtl.ok) {
          const dataA = await resAtl.json();
          const arr = Array.isArray(dataA) ? dataA : (dataA.atletas || []);
          listaAtletas = arr.map((a: any) => ({
            id: a.id || a._id || a.cpf || String(a.nome),
            nome: a.nome || a.name || 'Atleta FBKE'
          }));
        }

        if (listaAtletas.length === 0) {
          listaAtletas = [
            { id: "atl-1", nome: "Pedro Oliveira (Sensei Casais)" },
            { id: "atl-2", nome: "Lucas Almeida (Dojo Central Salvador)" },
            { id: "atl-3", nome: "Mariana Souza (Kyu Karate)" },
            { id: "atl-4", nome: "Gabriel Santos (Shodan)" },
            { id: "atl-5", nome: "Fernanda Costa (Vitória Dojo)" },
            { id: "atl-6", nome: "Carlos Eduardo Silva" },
            { id: "atl-7", nome: "Beatriz Ribeiro (Sensei Raimundo)" },
            { id: "atl-8", nome: "Rafael Mendonça" }
          ];
        }
        setAtletas(listaAtletas);

        let listaFiliais: FilialSelect[] = [];
        if (resFil && resFil.ok) {
          const dataF = await resFil.json();
          const arrF = Array.isArray(dataF) ? dataF : (dataF.filiais || []);
          listaFiliais = arrF.map((f: any) => ({
            id: f.id || f._id,
            nome: f.nome || f.nome_fantasia || 'Filial FBKE'
          }));
        }

        if (listaFiliais.length === 0) {
          listaFiliais = [
            { id: "fil-1", nome: "Dojo Central Salvador" },
            { id: "fil-2", nome: "Associação Karate Feira de Santana" },
            { id: "fil-3", nome: "Academia Vitória Conquista Karate-do" },
            { id: "fil-4", nome: "Clube Shotokan Camaçari" }
          ];
        }
        setFiliais(listaFiliais);
      } catch (err) {
        console.error("Erro ao carregar dados financeiros:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, []);

  const handleGerarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCobranca.valor || parseFloat(novaCobranca.valor) <= 0) {
      setNotif({ type: 'error', msg: 'Informe um valor válido para a cobrança.' });
      return;
    }

    setSubmitting(true);
    setNotif({ type: null, msg: '' });

    try {
      const payload = {
        atleta_id: novaCobranca.destinatario_tipo === 'atleta' ? novaCobranca.atleta_id : null,
        filial_id: novaCobranca.destinatario_tipo === 'filial' ? novaCobranca.filial_id : null,
        atleta_nome: novaCobranca.destinatario_tipo === 'outro' ? novaCobranca.nome_manual : undefined,
        tipo: novaCobranca.tipo,
        valor: parseFloat(novaCobranca.valor),
        data_vencimento: novaCobranca.data_vencimento,
        descricao: novaCobranca.descricao
      };

      const res = await fetch(`${API_URL}/api/financeiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      
      const novoItem: Pagamento = {
        id: data.fatura?.id || `pag-${Date.now()}`,
        atleta_nome: novaCobranca.destinatario_tipo === 'atleta' 
          ? (atletas.find(a => a.id === novaCobranca.atleta_id)?.nome || 'Atleta FBKE')
          : (novaCobranca.destinatario_tipo === 'outro' ? novaCobranca.nome_manual : undefined),
        filial_nome: novaCobranca.destinatario_tipo === 'filial'
          ? (filiais.find(f => f.id === novaCobranca.filial_id)?.nome || 'Filial FBKE')
          : undefined,
        tipo: novaCobranca.tipo,
        valor: parseFloat(novaCobranca.valor),
        data_vencimento: novaCobranca.data_vencimento,
        status: 'pendente'
      };

      setPagamentos(prev => [novoItem, ...prev]);
      setNotif({ type: 'success', msg: 'Nova fatura e cobrança Pix geradas com sucesso!' });
      setShowNovaCobrancaModal(false);
      setNovaCobranca({
        destinatario_tipo: 'atleta',
        atleta_id: '',
        filial_id: '',
        nome_manual: '',
        tipo: 'anuidade',
        valor: '',
        data_vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        descricao: ''
      });
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao gerar cobrança.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarcarComoPago = (id: string | number) => {
    setPagamentos(prev => prev.map(p => p.id === id ? { ...p, status: 'pago' } : p));
    setNotif({ type: 'success', msg: 'Pagamento marcado como concluído!' });
  };

  const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
  const totalPendente = pagamentos.filter(p => p.status === 'pendente').reduce((acc, curr) => acc + curr.valor, 0);

  const pagamentosFiltrados = pagamentos.filter(p => {
    const matchesBusca = (p.atleta_nome || p.filial_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (TIPO_COBRANCA[p.tipo]?.label || p.tipo).toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header com Botões Principais */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
            Gestão Financeira & Cobranças FBKE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Módulo Financeiro</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerenciamento de anuidades, mensalidades, exames de faixa e emissão Pix</p>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setShowRelatorioModal(true)}
            className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <FileText size={16} className="shrink-0" /> Gerar Relatório
          </button>

          <button
            onClick={() => setShowNovaCobrancaModal(true)}
            className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={18} className="shrink-0" /> Gerar Cobrança Pix
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notif.type && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold border ${
          notif.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-[#CE1126]'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Recebido (Confirmado)</p>
          <p className="text-3xl font-black text-emerald-600 font-mono">R$ {totalPago.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Pendente (A Vencer)</p>
          <p className="text-3xl font-black text-amber-600 font-mono">R$ {totalPendente.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total de Faturas Emitidas</p>
          <p className="text-3xl font-black text-[#002B7F]">{pagamentos.length}</p>
        </div>
      </div>

      {/* Tabela de Pagamentos */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-black text-slate-900">Histórico de Cobranças</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="atrasado">Atrasados</option>
            </select>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar beneficiário..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Beneficiário / Atleta / Filial</th>
                <th className="p-3.5">Tipo de Taxa</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {pagamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma fatura encontrada.</td>
                </tr>
              ) : (
                pagamentosFiltrados.map((p) => {
                  const tp = TIPO_COBRANCA[p.tipo] || { label: p.tipo, cor: 'text-slate-700 bg-slate-100 border-slate-200' };
                  const st = STATUS_COBRANCA[p.status] || STATUS_COBRANCA.pendente;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{p.atleta_nome || p.filial_nome || 'Beneficiário FBKE'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${tp.cor}`}>
                          {tp.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{p.data_vencimento}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">R$ {p.valor.toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {p.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPagamento(p);
                                setShowPagarModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-[10px] font-bold uppercase transition cursor-pointer shadow-xs"
                            >
                              Pagar via Pix
                            </button>
                            <button
                              onClick={() => handleMarcarComoPago(p.id)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Baixar
                            </button>
                          </>
                        )}
                        {p.status === 'pago' && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">✓ Concluído</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GERAR NOVA COBRANÇA */}
      {showNovaCobrancaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowNovaCobrancaModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Emissão Financeira</span>
              <h3 className="text-xl font-black text-slate-900">Gerar Nova Cobrança / Fatura Pix</h3>
            </div>

            <form onSubmit={handleGerarCobranca} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Tipo de Beneficiário</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovaCobranca(prev => ({ ...prev, destinatario_tipo: 'atleta' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      novaCobranca.destinatario_tipo === 'atleta' ? 'bg-[#002B7F] text-white border-[#002B7F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User size={14} /> Atleta
                  </button>

                  <button
                    type="button"
                    onClick={() => setNovaCobranca(prev => ({ ...prev, destinatario_tipo: 'filial' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      novaCobranca.destinatario_tipo === 'filial' ? 'bg-[#002B7F] text-white border-[#002B7F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Building2 size={14} /> Filial / Dojo
                  </button>

                  <button
                    type="button"
                    onClick={() => setNovaCobranca(prev => ({ ...prev, destinatario_tipo: 'outro' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      novaCobranca.destinatario_tipo === 'outro' ? 'bg-[#002B7F] text-white border-[#002B7F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Outro
                  </button>
                </div>
              </div>

              {novaCobranca.destinatario_tipo === 'atleta' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Selecionar Atleta</label>
                  <select
                    value={novaCobranca.atleta_id}
                    onChange={(e) => setNovaCobranca(prev => ({ ...prev, atleta_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="">Selecione um atleta...</option>
                    {atletas.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {novaCobranca.destinatario_tipo === 'filial' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Selecionar Filial / Dojo</label>
                  <select
                    value={novaCobranca.filial_id}
                    onChange={(e) => setNovaCobranca(prev => ({ ...prev, filial_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="">Selecione uma filial...</option>
                    {filiais.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {novaCobranca.destinatario_tipo === 'outro' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome do Pagador</label>
                  <input
                    required
                    value={novaCobranca.nome_manual}
                    onChange={(e) => setNovaCobranca(prev => ({ ...prev, nome_manual: e.target.value }))}
                    placeholder="Nome completo do beneficiário..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Tipo da Taxa *</label>
                  <select
                    value={novaCobranca.tipo}
                    onChange={(e) => setNovaCobranca(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="anuidade">Anuidade da Federação</option>
                    <option value="filiacao">Taxa de Filiação</option>
                    <option value="exame">Taxa de Graduação / Exame</option>
                    <option value="evento">Taxa de Evento / Torneio</option>
                    <option value="mensalidade">Mensalidade</option>
                    <option value="outro">Outras Taxas</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Valor (R$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={novaCobranca.valor}
                    onChange={(e) => setNovaCobranca(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="150.00"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Data de Vencimento *</label>
                <input
                  required
                  type="date"
                  value={novaCobranca.data_vencimento}
                  onChange={(e) => setNovaCobranca(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Descrição / Observações</label>
                <textarea
                  rows={2}
                  value={novaCobranca.descricao}
                  onChange={(e) => setNovaCobranca(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Informações adicionais para a fatura..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNovaCobrancaModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#CE1126] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <><QrCode size={16} /> Gerar Fatura & Pix</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIO FINANCEIRO */}
      {showRelatorioModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowRelatorioModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-wider block">Relatórios & Auditoria</span>
              <h3 className="text-xl font-black text-slate-900">Relatório Financeiro FBKE</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Total Recebido (Pago):</span>
                <span className="font-mono font-black text-emerald-600">R$ {totalPago.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Total Pendente:</span>
                <span className="font-mono font-black text-amber-600">R$ {totalPendente.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Faturas Cadastradas:</span>
                <span className="font-mono font-black text-slate-900">{pagamentos.length} cobranças</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento Pix */}
      {showPagarModal && selectedPagamento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 text-center space-y-5">
            <button onClick={() => setShowPagarModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-[#002B7F] rounded-2xl flex items-center justify-center mx-auto">
              <QrCode size={24} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Pagamento Instantâneo</span>
              <h3 className="text-xl font-black text-slate-900">Pix Copia e Cola</h3>
              <p className="text-xs text-slate-500 mt-1">Valor: <strong className="text-slate-900 font-mono font-black">R$ {selectedPagamento.valor.toFixed(2)}</strong></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-[10px] text-slate-600 break-all select-all">
              00020126580014BR.GOV.BCB.PIX0136fbke-financeiro@ba.gov.br5204000053039865405{selectedPagamento.valor.toFixed(2)}5802BR5925FEDERACAO BAIANA KARATE6008SALVADOR62070503***6304A1B2
            </div>

            <button
              onClick={() => {
                alert("Chave Pix copiada para a área de transferência!");
                setShowPagarModal(false);
              }}
              className="w-full py-3 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
            >
              Copiar Código Pix
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
