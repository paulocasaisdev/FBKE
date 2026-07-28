'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, ShieldAlert, Loader2, Search, CheckCircle2, User, Trophy, Mail, Phone, Printer, FileText, X } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (rawApiUrl && rawApiUrl.startsWith('http')) ? rawApiUrl.replace(/\/$/, '') : '';

interface Atleta {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  faixa: string;
  status: 'ativo' | 'pendente' | 'inativo';
  filial_nome?: string;
  cidade?: string;
  cpf?: string;
  sexo?: string;
  data_nascimento?: string;
  nome_professor?: string;
  cep?: string;
  endereco?: string;
  uf?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  medico_alergias?: string;
  medico_plano?: string;
  medico_restricoes?: string;
  medico_diagnosticos?: string;
  arte_marcial?: string;
  estilo?: string;
  academia_clube?: string;
  medico_tipo_sanguineo?: string;
  medico_fator_rh?: string;
  medico_sus?: string;
  medico_emergencia_nome?: string;
  medico_emergencia_telefone?: string;
  medico_medicacao_uso?: string;
  medico_medicacao_lista?: string;
  medico_alergia_medicamento?: string;
  fisico_peso?: string;
  fisico_altura?: string;
  autoriza_uso_imagem?: boolean;
  registro_federacao?: string;
  documentos_entregues?: boolean;
  ja_praticou_artes_marciais?: string;
  federacao?: string;
}

import { FAIXAS, FAIXAS_INFANTIL, FAIXAS_ADULTO, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';

function renderFaixaBadge(faixa: string) {
  const cor = obterEstiloFaixa(faixa);

  return (
    <div className={`relative flex items-center justify-between px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${cor.bg} ${cor.border} ${cor.text} shadow-xs overflow-hidden h-[22px] min-w-[95px] select-none`}>
      {cor.centerStripe && (
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 ${cor.centerStripe} pointer-events-none opacity-90`} />
      )}
      <span className="relative z-10 truncate pr-1">{faixa || 'Branca'}</span>
      {cor.tipStripe ? (
        <div className={`relative z-10 w-2.5 h-full ${cor.tipStripe}`} title="Ponteira de Graduação" />
      ) : !cor.centerStripe ? (
        <div className="relative z-10 w-1 h-full bg-black/20" />
      ) : null}
    </div>
  );
}

export default function AtletasPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'pendente'>('todos');
  
  interface Filial {
    id: string;
    nome: string;
  }
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [viewingAtleta, setViewingAtleta] = useState<Atleta | null>(null);
  const [novaFaixa, setNovaFaixa] = useState('');
  const [novaFilialId, setNovaFilialId] = useState('');
  const [novaFederacao, setNovaFederacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarAtletas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter atletas da API');
      const data = await res.json();
      setAtletas(data.atletas || []);
    } catch (err) {
      console.error("Erro ao carregar atletas, usando dados emulados:", err);
      setAtletas([
        { id: "st-1", nome: "Pedro Oliveira", email: "pedro.oliveira@fbke.com.br", telefone: "(71) 98888-2001", faixa: "Branca", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "st-2", nome: "Lucas Almeida", email: "lucas.almeida@fbke.com.br", telefone: "(71) 98888-2002", faixa: "Amarela", status: "ativo", filial_nome: "Filial Salvador Centro" },
        { id: "pending-athlete-id", nome: "Atleta Pendente de Teste", email: "atleta-pendente@fbke.com.br", telefone: "(71) 98888-8888", faixa: "Branca", status: "pendente", filial_nome: "FBKE CABULA" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarFiliais = async () => {
    try {
      const res = await fetch(`${API_URL}/api/filiais`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFiliais(data.filiais || []);
      }
    } catch (err) {
      console.error("Erro ao carregar filiais na área administrativa:", err);
    }
  };

  useEffect(() => {
    carregarAtletas();
    carregarFiliais();
  }, []);

  const handleStatusChange = async (atletaId: string, novoStatus: 'ativo' | 'inativo' | 'pendente') => {
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status do atleta');
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: novoStatus } : a));
    } catch (err) {
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, status: novoStatus } : a));
    }
  };

  const handleToggleDocumentos = async (atletaId: string, entregues: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentos_entregues: entregues })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status dos documentos do atleta');
      setAtletas(atletas.map(a => a.id === atletaId ? { ...a, documentos_entregues: entregues } : a));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar documentos');
    }
  };

  const handleImprimirFicha = (atleta: Atleta) => {
    const dataNasc = atleta.data_nascimento 
      ? atleta.data_nascimento.split('-').reverse().join('/') 
      : 'Não informada';
    const cpf = atleta.cpf 
      ? atleta.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') 
      : 'Não informado';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Ficha Cadastral e Médica - ${atleta.nome}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #111;
            background-color: #fff;
            padding: 20px;
            font-size: 10px;
            line-height: 1.35;
          }
          .header-container {
            display: flex;
            align-items: center;
            justify-[#002B7F];
            border-bottom: 2px solid #002B7F;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header-text {
            text-align: center;
            flex: 1;
            margin: 0 15px;
          }
          .header-text h1 {
            font-family: 'Cinzel', serif;
            font-size: 16px;
            margin: 0 0 3px 0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-weight: 800;
            color: #002B7F;
          }
          .header-text p {
            font-size: 8.5px;
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #CE1126;
          }
          .section-title {
            font-family: 'Cinzel', serif;
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px solid #002B7F;
            padding-bottom: 2px;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #002B7F;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          .grid-full-3 {
            grid-column: span 3;
          }
          .field {
            display: flex;
            flex-direction: column;
          }
          .label {
            font-size: 7.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 2px;
          }
          .value {
            font-size: 10px;
            font-weight: 600;
            color: #000;
            padding: 5px 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            min-height: 12px;
          }
          @media print {
            body { padding: 10px; }
            .section-title { margin-top: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-text">
            <h1>Federação Baiana de Karate-do Esportivo</h1>
            <p>Ficha Oficial de Matrícula do Atleta</p>
          </div>
        </div>

        <div class="section-title">Dados Gerais do Atleta</div>
        <div class="grid grid-3">
          <div class="field grid-full-3">
            <span class="label">Nome Completo</span>
            <span class="value">${atleta.nome}</span>
          </div>
          <div class="field">
            <span class="label">Nº de Registro da Federação</span>
            <span class="value">${atleta.registro_federacao || 'Pendente de homologação'}</span>
          </div>
          <div class="field">
            <span class="label">Graduação Atual</span>
            <span class="value">${atleta.faixa}</span>
          </div>
          <div class="field">
            <span class="label">Filial / Dojo</span>
            <span class="value">${atleta.filial_nome || 'Dojo Central'}</span>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleExcluir = async (atletaId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este atleta?")) return;
    try {
      const res = await fetch(`${API_URL}/api/atletas/${atletaId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao excluir atleta');
      setAtletas(atletas.filter(a => a.id !== atletaId));
    } catch (err) {
      setAtletas(atletas.filter(a => a.id !== atletaId));
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtleta) return;
    setSalvando(true);
    try {
      const filialSelecionada = filiais.find(f => f.id === novaFilialId);
      const filialNome = filialSelecionada ? filialSelecionada.nome : 'Dojo Central / Sem Filial';

      const res = await fetch(`${API_URL}/api/atletas/${selectedAtleta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          faixa: novaFaixa,
          filial_id: novaFilialId || null,
          filial_nome: novaFilialId ? filialNome : null,
          federacao: novaFederacao || null
        })
      });
      if (res.ok) {
        setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { 
          ...a, 
          faixa: novaFaixa,
          filial_id: novaFilialId || undefined,
          filial_nome: novaFilialId ? filialNome : 'Dojo Central / Sem Filial',
          federacao: novaFederacao || undefined
        } : a));
        setSelectedAtleta(null);
      }
    } catch (err) {
      const filialSelecionada = filiais.find(f => f.id === novaFilialId);
      const filialNome = filialSelecionada ? filialSelecionada.nome : 'Dojo Central / Sem Filial';
      setAtletas(atletas.map(a => a.id === selectedAtleta.id ? { 
        ...a, 
        faixa: novaFaixa,
        filial_id: novaFilialId || undefined,
        filial_nome: novaFilialId ? filialNome : 'Dojo Central / Sem Filial',
        federacao: novaFederacao || undefined
      } : a));
      setSelectedAtleta(null);
    } finally {
      setSalvando(false);
    }
  };

  const atletasFiltrados = atletas.filter(atleta => {
    const matchesBusca = atleta.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         atleta.email.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = statusFiltro === 'todos' || atleta.status === statusFiltro;
    return matchesBusca && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin' && tipo !== 'filial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-[#CE1126]" />
        <h2 className="text-xl font-black text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-xs max-w-md">Apenas administradores e filiais homologadas podem gerenciar atletas.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
          Registro Federativo
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gestão de Atletas Filiados</h1>
        <p className="text-xs text-slate-500 mt-0.5">Homologação de fichas, conferência de documentos e atualização de graduações</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl w-full md:w-auto shadow-xs">
          {(['todos', 'ativo', 'pendente'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFiltro(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                statusFiltro === f ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {f === 'todos' ? 'Todos os Atletas' : f === 'ativo' ? 'Ativos / Homologados' : 'Pendentes'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Grid de Atletas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atletasFiltrados.map(atleta => (
          <div key={atleta.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 border border-red-200 text-[#CE1126] rounded-2xl flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">{atleta.nome}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">{atleta.filial_nome || 'Dojo Central'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border ${
                    atleta.status === 'ativo' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                    atleta.status === 'pendente' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-[#CE1126] border-red-200'
                  }`}>
                    {atleta.status}
                  </span>
                  {atleta.status === 'pendente' && !atleta.cpf && (
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-red-50 text-red-700 border border-red-200">
                      Falta CPF
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                  <Mail size={13} className="text-slate-400" /> {atleta.email}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                  <Phone size={13} className="text-slate-400" /> {atleta.telefone || 'Não informado'}
                </p>
                <div className="text-xs text-slate-700 flex items-center justify-between gap-1.5 pt-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Trophy size={13} className="text-[#002B7F]" /> Faixa:
                  </span>
                  {renderFaixaBadge(atleta.faixa)}
                </div>
                <div className="text-xs text-slate-700 flex items-center justify-between gap-1.5 pt-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileText size={13} className="text-slate-400" /> Documentação:
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleToggleDocumentos(atleta.id, !atleta.documentos_entregues)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border transition cursor-pointer ${
                      atleta.documentos_entregues 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {atleta.documentos_entregues ? 'Entregues' : 'Pendentes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
              {atleta.status === 'pendente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(atleta.id, 'ativo')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 size={13} /> Homologar
                  </button>
                  <button
                    onClick={() => handleStatusChange(atleta.id, 'inativo')}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-[#CE1126] border border-red-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                  >
                    Negar
                  </button>
                </div>
              )}
              {atleta.status === 'ativo' && (
                <button
                  onClick={() => handleStatusChange(atleta.id, 'inativo')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Inativar Atleta
                </button>
              )}
              {atleta.status === 'inativo' && (
                <button
                  onClick={() => handleStatusChange(atleta.id, 'ativo')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={13} /> Reativar Atleta
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setSelectedAtleta(atleta);
                    setNovaFaixa(atleta.faixa);
                    setNovaFilialId(filiais.find(f => f.nome === atleta.filial_nome)?.id || '');
                    setNovaFederacao(atleta.federacao || '');
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-[9px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Editar
                </button>
                <button
                  onClick={() => setViewingAtleta(atleta)}
                  className="py-1.5 bg-blue-50 hover:bg-[#002B7F] hover:text-white text-[#002B7F] border border-blue-200 rounded-xl text-[9px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Ficha
                </button>
                <button
                  onClick={() => handleExcluir(atleta.id)}
                  className="py-1.5 bg-red-50 hover:bg-[#CE1126] hover:text-white text-[#CE1126] border border-red-200 rounded-xl text-[9px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição de Atleta */}
      {selectedAtleta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-slate-900">
            <button
              onClick={() => setSelectedAtleta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Atualização Técnica</span>
              <h2 className="text-xl font-black text-slate-900">Editar Atleta: {selectedAtleta.nome}</h2>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Graduação / Faixa</label>
                <select
                  value={novaFaixa}
                  onChange={(e) => setNovaFaixa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                >
                  {FAIXAS.map(f => (
                    <option key={f} value={f}>Faixa {f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Filial / Dojo Filiado</label>
                <select
                  value={novaFilialId}
                  onChange={(e) => setNovaFilialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="">Dojo Central / Sem Filial</option>
                  {filiais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAtleta(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ficha do Atleta */}
      {viewingAtleta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setViewingAtleta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#CE1126] text-white flex items-center justify-center font-black text-xl shadow-sm">
                FBKE
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Ficha Cadastral do Atleta</span>
                <h2 className="text-xl font-black text-slate-900">{viewingAtleta.nome}</h2>
                <p className="text-xs text-slate-500 font-mono">Registro FBKE: {viewingAtleta.registro_federacao || 'Pendente'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">E-mail</p>
                <p className="font-bold text-slate-900 font-mono">{viewingAtleta.email}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">Telefone</p>
                <p className="font-bold text-slate-900">{viewingAtleta.telefone || 'Não informado'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">Graduação / Faixa</p>
                <p className="font-bold text-slate-900">Faixa {viewingAtleta.faixa}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">Dojo / Filial</p>
                <p className="font-bold text-slate-900">{viewingAtleta.filial_nome || 'Dojo Central'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleImprimirFicha(viewingAtleta)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Printer size={14} /> Imprimir Ficha
              </button>
              <button
                onClick={() => setViewingAtleta(null)}
                className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
