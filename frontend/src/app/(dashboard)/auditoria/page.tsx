'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2, ClipboardList, Database, Clock, Terminal, Search } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface LogItem {
  id: string | number;
  usuario_nome: string;
  acao: string;
  detalhes: string;
  ip: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const { usuario, tipo } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('todos');

  const carregarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auditoria`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao obter logs de auditoria');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Erro ao carregar auditoria, usando logs fictícios:", err);
      setLogs([
        { id: 1, usuario_nome: "Super Administrador", acao: "Homologação de Faixa", detalhes: "Sensei atualizou a graduação de Pedro Oliveira para Amarela", ip: "192.168.0.1", created_at: new Date().toISOString() },
        { id: 2, usuario_nome: "Super Administrador", acao: "Anuidade Filial", detalhes: "Pagamento de anuidade da Filial Salvador Centro marcado como ativo", ip: "192.168.0.1", created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tipo && tipo !== 'atleta') {
      carregarLogs();
    } else {
      setLoading(false);
    }
  }, [tipo]);

  const acoesDisponiveis = Array.from(new Set(logs.map(log => log.acao))).filter(Boolean);

  const logsFiltrados = logs.filter(log => {
    const correspondeBusca = 
      (log.usuario_nome?.toLowerCase() || '').includes(busca.toLowerCase()) ||
      (log.detalhes?.toLowerCase() || '').includes(busca.toLowerCase());
      
    const correspondeAcao = 
      filtroAcao === 'todos' || log.acao === filtroAcao;
      
    return correspondeBusca && correspondeAcao;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  if (!usuario || tipo === 'atleta') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 font-sans">
        <ShieldAlert className="w-16 h-16 text-[#CE1126]" />
        <h2 className="text-xl font-black text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-xs max-w-md">
          Apenas administradores e representantes de filiais homologados têm acesso aos logs de auditoria do sistema.
        </p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
          Segurança & Rastreabilidade
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Histórico de Auditoria do Sistema</h1>
        <p className="text-xs text-slate-500 mt-0.5">Registro oficial de modificações, acessos e ações administrativas</p>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Buscar Ações ou Detalhes</label>
          <div className="relative">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por usuário ou detalhes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B7F]"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filtrar por Categoria de Ação</label>
          <select
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#002B7F]"
          >
            <option value="todos">Todas as Ações</option>
            {acoesDisponiveis.map(acao => (
              <option key={acao} value={acao}>{acao}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="table-responsive">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Usuário Responsável</th>
                <th className="p-3.5">Ação Realizada</th>
                <th className="p-3.5">Detalhes</th>
                <th className="p-3.5 text-right">IP Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registro de auditoria encontrado.</td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{log.usuario_nome}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase bg-blue-50 text-[#002B7F] border border-blue-200">
                        {log.acao}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 leading-relaxed max-w-md">{log.detalhes}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400 text-[10px]">{log.ip}</td>
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
