'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldAlert, Loader2, Building2, Search, Check, X, ShieldCheck, 
  Eye, Mail, Phone, MapPin, CreditCard, Award, FileText, User, Printer 
} from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (rawApiUrl && rawApiUrl.startsWith('http')) ? rawApiUrl.replace(/\/$/, '') : '';

interface Filial {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  nome_fantasia?: string;
  cnpj_cpf?: string;
  cpf_responsavel?: string;
  graduacao_responsavel?: string;
  registro_federativo?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  estado?: string;
  status: 'ativo' | 'pendente' | 'inativo' | 'reprovado';
  codigo_interno?: string;
  motivo_reprovacao?: string;
}

function formatarCPF(valor?: string) {
  if (!valor) return 'Não informado';
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
}

function formatarCNPJ(valor?: string) {
  if (!valor) return 'Não informado';
  const limpo = valor.replace(/\D/g, '').slice(0, 14);
  if (limpo.length <= 11) {
    return formatarCPF(limpo);
  }
  return limpo
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCEP(valor?: string) {
  if (!valor) return 'Não informado';
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

function formatarTelefone(valor?: string) {
  if (!valor) return 'Não informado';
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

export default function FiliaisPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filialSelecionada, setFilialSelecionada] = useState<Filial | null>(null);

  const carregarFiliais = async () => {
    try {
      const res = await fetch(`${API_URL}/api/filiais`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter filiais da API');
      const data = await res.json();
      setFiliais(data.filiais || []);
    } catch (err) {
      console.error("Erro ao carregar filiais, usando dados mock:", err);
      setFiliais([
        { id: "7513aa27-452f-462e-8f5a-b3f2052612f0", nome: "Filial Salvador Centro", nome_fantasia: "Goju-Ryu Salvador", email: "filial@fbke.com.br", status: "ativo", codigo_interno: "BA-SSA-01", graduacao_responsavel: "Preta 3º Dan", municipio: "Salvador", estado: "BA" },
        { id: "pending-filial-id", nome: "Filial Pendente de Teste", nome_fantasia: "Goju-Ryu Pendente", email: "filial-pendente@fbke.com.br", status: "pendente", codigo_interno: "BA-SSA-02", graduacao_responsavel: "Preta 1º Dan", municipio: "Salvador", estado: "BA" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFiliais();
  }, []);

  const handleStatusChange = async (filialId: string, novoStatus: 'ativo' | 'reprovado' | 'inativo') => {
    try {
      const res = await fetch(`${API_URL}/api/filiais/${filialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setFiliais(filiais.map(f => f.id === filialId ? { ...f, status: novoStatus } : f));
      if (filialSelecionada && filialSelecionada.id === filialId) {
        setFilialSelecionada({ ...filialSelecionada, status: novoStatus });
      }
    } catch (err) {
      setFiliais(filiais.map(f => f.id === filialId ? { ...f, status: novoStatus } : f));
      if (filialSelecionada && filialSelecionada.id === filialId) {
        setFilialSelecionada({ ...filialSelecionada, status: novoStatus });
      }
    }
  };

  const handleExcluir = async (filialId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta filial?")) return;
    try {
      const res = await fetch(`${API_URL}/api/filiais/${filialId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao excluir filial');
      setFiliais(filiais.filter(f => f.id !== filialId));
      if (filialSelecionada && filialSelecionada.id === filialId) {
        setFilialSelecionada(null);
      }
    } catch (err) {
      setFiliais(filiais.filter(f => f.id !== filialId));
      if (filialSelecionada && filialSelecionada.id === filialId) {
        setFilialSelecionada(null);
      }
    }
  };

  const filiaisFiltradas = filiais.filter(filial => {
    const nome = filial.nome_fantasia || filial.nome;
    return nome.toLowerCase().includes(busca.toLowerCase()) || filial.email.toLowerCase().includes(busca.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-[#CE1126]" />
        <h2 className="text-xl font-black text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-xs max-w-md">Apenas administradores homologados pela Federação podem gerenciar as filiais cadastradas.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      <div className="space-y-8 no-print">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Credenciamento & Homologação
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gestão de Filiais & Dojos</h1>
            <p className="text-xs text-slate-500 mt-0.5">Academias e associações credenciadas na Federação Baiana de Karate-do Esportivo</p>
          </div>

          <div className="relative w-full sm:max-w-xs">
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

        {/* Grid de Filiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filiaisFiltradas.map(filial => (
            <div key={filial.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-200 text-[#002B7F] rounded-2xl flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{filial.nome_fantasia || filial.nome}</h3>
                      <p className="text-[10px] font-mono text-slate-400">Cód: {filial.codigo_interno || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border ${
                      filial.status === 'ativo' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                      filial.status === 'pendente' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-[#CE1126] border-red-200'
                    }`}>
                      {filial.status}
                    </span>
                    {filial.status === 'pendente' && !filial.cpf_responsavel && (
                      <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-red-50 text-red-700 border border-red-200">
                        Falta CPF
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <p>E-mail: <strong className="text-slate-900 font-mono">{filial.email}</strong></p>
                  <p>Responsável: <strong className="text-slate-900">{filial.graduacao_responsavel ? `Sensei (${filial.graduacao_responsavel})` : 'Não informado'}</strong></p>
                  <p>Localização: <strong className="text-slate-900">{filial.municipio ? `${filial.municipio} - ${filial.estado}` : 'Não cadastrada'}</strong></p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  {filial.status === 'pendente' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(filial.id, 'ativo')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Check size={13} /> Aprovar
                      </button>
                      <button
                        onClick={() => handleStatusChange(filial.id, 'reprovado')}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-[#CE1126] border border-red-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X size={13} /> Negar
                      </button>
                    </>
                  )}
                  {filial.status === 'ativo' && (
                    <button
                      onClick={() => handleStatusChange(filial.id, 'inativo')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Suspender Filial
                    </button>
                  )}
                  {filial.status === 'inativo' && (
                    <button
                      onClick={() => handleStatusChange(filial.id, 'ativo')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <ShieldCheck size={13} /> Re-homologar
                    </button>
                  )}
                  {filial.status === 'reprovado' && (
                    <button
                      onClick={() => handleStatusChange(filial.id, 'ativo')}
                      className="w-full py-2 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <ShieldCheck size={13} /> Re-homologar
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilialSelecionada(filial)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-[#002B7F] hover:text-white border border-blue-200 text-[#002B7F] rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> Ficha Cadastral
                  </button>
                  <button
                    onClick={() => handleExcluir(filial.id)}
                    className="px-3 py-2 bg-red-50 hover:bg-[#CE1126] hover:text-white border border-red-200 text-[#CE1126] rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes Cadastrais */}
      {filialSelecionada && (
        <div id="printable-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setFilialSelecionada(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition no-print"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#002B7F] text-white flex items-center justify-center font-black text-xl border-b-2 border-[#CE1126] shadow-sm">
                FBKE
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Ficha Oficial de Filiação</span>
                <h2 className="text-xl font-black text-slate-900">{filialSelecionada.nome_fantasia || filialSelecionada.nome}</h2>
                <p className="text-xs text-slate-500 font-mono">Código FBKE: {filialSelecionada.codigo_interno || 'Pendente'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">Razão Social / Nome</p>
                <p className="font-bold text-slate-900">{filialSelecionada.nome}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">CNPJ / CPF Institucional</p>
                <p className="font-bold text-slate-900 font-mono">{formatarCNPJ(filialSelecionada.cnpj_cpf)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">E-mail Oficial</p>
                <p className="font-bold text-slate-900 font-mono">{filialSelecionada.email}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-400 font-extrabold uppercase text-[9px]">Telefone Contato</p>
                <p className="font-bold text-slate-900">{formatarTelefone(filialSelecionada.telefone)}</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-[#002B7F]">Dados do Professor Responsável</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase">Graduação / Faixa</p>
                  <p className="font-bold text-slate-900">{filialSelecionada.graduacao_responsavel || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase">CPF do Responsável</p>
                  <p className="font-bold text-slate-900 font-mono">{formatarCPF(filialSelecionada.cpf_responsavel)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase">Reg. CBK (Confederação)</p>
                  <p className="font-bold text-slate-900 font-mono">{filialSelecionada.registro_federativo || 'Pendente'}</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h3 className="text-xs font-black uppercase text-[#002B7F]">Endereço da Sede do Dojo</h3>
              <p className="text-slate-700">
                {filialSelecionada.rua ? `${filialSelecionada.rua}, Nº ${filialSelecionada.numero || 'S/N'}` : 'Endereço não cadastrado'}
                {filialSelecionada.bairro ? ` - Bairro ${filialSelecionada.bairro}` : ''}
              </p>
              <p className="text-slate-500 font-medium">
                {filialSelecionada.municipio ? `${filialSelecionada.municipio} / ${filialSelecionada.estado}` : ''} 
                {filialSelecionada.cep ? ` — CEP: ${formatarCEP(filialSelecionada.cep)}` : ''}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 no-print">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Printer size={14} /> Imprimir Ficha
              </button>
              <button
                onClick={() => setFilialSelecionada(null)}
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
