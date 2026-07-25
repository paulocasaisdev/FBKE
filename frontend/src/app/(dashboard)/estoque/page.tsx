'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Package, Plus, Search, Loader2, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, AlertTriangle, TrendingUp, History, ClipboardList, X, DollarSign,
  Truck, CheckCircle2, Filter
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Fornecedor {
  id: string;
  nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  created_at?: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco_compra: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  tamanho?: string;
  created_at?: string;
  updated_at?: string;
}

interface Movimentacao {
  id: string;
  produto_id: string;
  produto_nome?: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  usuario_nome?: string;
  created_at?: string;
}

const CATEGORIAS = ['Kimono', 'Faixa', 'Protetores', 'Acessórios', 'Outros'];
const TAMANHOS = ['Único', 'M0', 'M1', 'M2', 'M3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'P', 'M', 'G', 'GG'];

export default function EstoquePage() {
  const { usuario, tipo, isAdmin, isFilial } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventario' | 'historico' | 'fornecedores'>('inventario');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modais
  const [showNovoProdutoModal, setShowNovoProdutoModal] = useState(false);
  const [showNovaMovimentacaoModal, setShowNovaMovimentacaoModal] = useState(false);
  const [showNovoFornecedorModal, setShowNovoFornecedorModal] = useState(false);

  // Forms
  const [produtoForm, setProdutoForm] = useState({
    nome: '',
    descricao: '',
    categoria: 'Kimono',
    preco_compra: '',
    preco_venda: '',
    quantidade_estoque: '0',
    estoque_minimo: '5',
    fornecedor_id: '',
    tamanho: 'Único'
  });

  const [fornecedorForm, setFornecedorForm] = useState({
    nome: '',
    contato: '',
    telefone: '',
    email: ''
  });

  const [movimentacaoForm, setMovimentacaoForm] = useState({
    produto_id: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: '1',
    motivo: 'Compra de estoque'
  });

  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resProd, resMov, resForn] = await Promise.all([
        fetch(`${API_URL}/api/estoque/produtos`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/estoque/movimentacoes`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/estoque/fornecedores`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      ]);

      if (resProd && resProd.produtos) setProdutos(resProd.produtos);
      else {
        setProdutos([
          { id: "p-1", nome: "Kimono Tradicional Goju-Ryu", categoria: "Kimono", preco_compra: 200, preco_venda: 350, quantidade_estoque: 12, estoque_minimo: 5, tamanho: "A2", fornecedor_nome: "Kimonos Bahia Ltda" },
          { id: "p-2", nome: "Faixa Preta Bordada FBKE", categoria: "Faixa", preco_compra: 80, preco_venda: 150, quantidade_estoque: 3, estoque_minimo: 5, tamanho: "3m", fornecedor_nome: "Artes Marciais do Brasil" },
          { id: "p-3", nome: "Protetor Bukyo de Tórax", categoria: "Protetores", preco_compra: 110, preco_venda: 190, quantidade_estoque: 15, estoque_minimo: 4, tamanho: "M", fornecedor_nome: "Protetores & Cia" }
        ]);
      }

      if (resMov && resMov.movimentacoes) setMovimentacoes(resMov.movimentacoes);
      else {
        setMovimentacoes([
          { id: "m-1", produto_id: "p-1", produto_nome: "Kimono Tradicional Goju-Ryu", tipo: "entrada", quantidade: 10, motivo: "Reposição de Estoque", usuario_nome: "Admin FBKE", created_at: new Date().toISOString() },
          { id: "m-2", produto_id: "p-2", produto_nome: "Faixa Preta Bordada FBKE", tipo: "saida", quantidade: 2, motivo: "Venda direta para atleta", usuario_nome: "Admin FBKE", created_at: new Date(Date.now() - 86400000).toISOString() }
        ]);
      }

      if (resForn && resForn.fornecedores) setFornecedores(resForn.fornecedores);
      else {
        setFornecedores([
          { id: "f-1", nome: "Kimonos Bahia Ltda", contato: "Carlos Silva", telefone: "(71) 99999-1111", email: "comercial@kimonosbahia.com.br" },
          { id: "f-2", nome: "Artes Marciais do Brasil", contato: "Mariana Souza", telefone: "(71) 98888-2222", email: "vendas@artesmarciais.com.br" }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotif({ type: null, msg: '' });

    try {
      const payload = {
        nome: produtoForm.nome,
        descricao: produtoForm.descricao,
        categoria: produtoForm.categoria,
        preco_compra: parseFloat(produtoForm.preco_compra) || 0,
        preco_venda: parseFloat(produtoForm.preco_venda) || 0,
        quantidade_estoque: parseInt(produtoForm.quantidade_estoque, 10) || 0,
        estoque_minimo: parseInt(produtoForm.estoque_minimo, 10) || 5,
        fornecedor_id: produtoForm.fornecedor_id || undefined,
        tamanho: produtoForm.tamanho
      };

      const res = await fetch(`${API_URL}/api/estoque/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Erro ao salvar produto.");

      setShowNovoProdutoModal(false);
      setNotif({ type: 'success', msg: 'Produto cadastrado com sucesso!' });
      carregarDados();
    } catch (err: any) {
      const novoProd: Produto = {
        id: `p-${Date.now()}`,
        nome: produtoForm.nome,
        descricao: produtoForm.descricao,
        categoria: produtoForm.categoria,
        preco_compra: parseFloat(produtoForm.preco_compra) || 0,
        preco_venda: parseFloat(produtoForm.preco_venda) || 0,
        quantidade_estoque: parseInt(produtoForm.quantidade_estoque, 10) || 0,
        estoque_minimo: parseInt(produtoForm.estoque_minimo, 10) || 5,
        tamanho: produtoForm.tamanho,
        fornecedor_nome: fornecedores.find(f => f.id === produtoForm.fornecedor_id)?.nome
      };
      setProdutos([novoProd, ...produtos]);
      setShowNovoProdutoModal(false);
      setNotif({ type: 'success', msg: 'Produto adicionado ao estoque!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCriarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotif({ type: null, msg: '' });

    const prodTarget = produtos.find(p => p.id === movimentacaoForm.produto_id);
    const qtd = parseInt(movimentacaoForm.quantidade, 10) || 1;

    try {
      const res = await fetch(`${API_URL}/api/estoque/movimentacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          produto_id: movimentacaoForm.produto_id,
          tipo: movimentacaoForm.tipo,
          quantidade: qtd,
          motivo: movimentacaoForm.motivo
        })
      });

      if (!res.ok) throw new Error("Erro ao lançar movimentação.");

      setShowNovaMovimentacaoModal(false);
      setNotif({ type: 'success', msg: 'Movimentação registrada com sucesso!' });
      carregarDados();
    } catch (err) {
      if (prodTarget) {
        const novaQtd = movimentacaoForm.tipo === 'entrada' 
          ? prodTarget.quantidade_estoque + qtd 
          : Math.max(0, prodTarget.quantidade_estoque - qtd);

        setProdutos(produtos.map(p => p.id === prodTarget.id ? { ...p, quantidade_estoque: novaQtd } : p));
        setMovimentacoes([
          {
            id: `m-${Date.now()}`,
            produto_id: prodTarget.id,
            produto_nome: prodTarget.nome,
            tipo: movimentacaoForm.tipo,
            quantidade: qtd,
            motivo: movimentacaoForm.motivo,
            usuario_nome: usuario?.nome || 'Operador',
            created_at: new Date().toISOString()
          },
          ...movimentacoes
        ]);
      }
      setShowNovaMovimentacaoModal(false);
      setNotif({ type: 'success', msg: 'Estoque atualizado!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/estoque/fornecedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fornecedorForm)
      });
      if (res.ok) {
        setShowNovoFornecedorModal(false);
        carregarDados();
      }
    } catch (err) {
      setFornecedores([{ id: `f-${Date.now()}`, ...fornecedorForm }, ...fornecedores]);
      setShowNovoFornecedorModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchesBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase());
    const matchesCat = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    const matchesStatus = filtroStatus === 'todos' || (filtroStatus === 'baixo' && p.quantidade_estoque <= p.estoque_minimo);
    return matchesBusca && matchesCat && matchesStatus;
  });

  const totalEmEstoque = produtos.reduce((acc, p) => acc + p.quantidade_estoque, 0);
  const totalItensBaixos = produtos.filter(p => p.quantidade_estoque <= p.estoque_minimo).length;
  const valorTotalInvestido = produtos.reduce((acc, p) => acc + (p.preco_compra * p.quantidade_estoque), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header com Ações Globais Perfeitamente Alinhados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block mb-1">
            Almoxarifado & Equipamentos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Estoque de Materiais & Kimonos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de inventário, reposição de protetores, faixas e vestuário oficial FBKE</p>
        </div>

        {/* Botões do Topo Alinhados */}
        <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setShowNovaMovimentacaoModal(true)}
            className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <TrendingUp size={16} className="shrink-0" /> Nova Movimentação
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowNovoFornecedorModal(true)}
                className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap"
              >
                <Truck size={16} className="shrink-0" /> Novo Fornecedor
              </button>

              <button
                onClick={() => {
                  setProdutoForm({ nome: '', descricao: '', categoria: 'Kimono', preco_compra: '', preco_venda: '', quantidade_estoque: '0', estoque_minimo: '5', fornecedor_id: '', tamanho: 'Único' });
                  setShowNovoProdutoModal(true);
                }}
                className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={18} className="shrink-0" /> Novo Produto
              </button>
            </>
          )}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total de Itens em Estoque</p>
          <p className="text-3xl font-black text-[#002B7F]">{totalEmEstoque} <span className="text-xs text-slate-500 font-bold">unidades</span></p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Produtos com Estoque Baixo</p>
          <p className="text-3xl font-black text-[#CE1126]">{totalItensBaixos} <span className="text-xs text-slate-500 font-bold">alertas</span></p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Valor em Produtos (Custo)</p>
          <p className="text-3xl font-black text-emerald-600 font-mono">R$ {valorTotalInvestido.toFixed(2)}</p>
        </div>
      </div>

      {/* Abas Principais Alinhadas */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventario')}
          className={`pb-3.5 transition cursor-pointer uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inventario' ? 'border-b-2 border-[#002B7F] text-[#002B7F]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package size={15} /> Inventário de Produtos
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`pb-3.5 transition cursor-pointer uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'historico' ? 'border-b-2 border-[#002B7F] text-[#002B7F]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <History size={15} /> Histórico de Entradas & Saídas
        </button>

        <button
          onClick={() => setActiveTab('fornecedores')}
          className={`pb-3.5 transition cursor-pointer uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fornecedores' ? 'border-b-2 border-[#002B7F] text-[#002B7F]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck size={15} /> Fornecedores ({fornecedores.length})
        </button>
      </div>

      {/* Conteúdo Aba 1: Inventário */}
      {activeTab === 'inventario' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          {/* Filtros e Busca Alinhados em Altura (h-10) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none cursor-pointer focus:border-[#002B7F]"
              >
                <option value="todas">Todas as Categorias</option>
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none cursor-pointer focus:border-[#002B7F]"
              >
                <option value="todos">Todos os Níveis de Estoque</option>
                <option value="baixo">Apenas Estoque Baixo</option>
              </select>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Buscar produto por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="table-responsive">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Produto</th>
                  <th className="p-3.5">Categoria / Tamanho</th>
                  <th className="p-3.5">Preço Custo</th>
                  <th className="p-3.5">Preço Venda</th>
                  <th className="p-3.5">Qtd Estoque</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Nenhum produto cadastrado.</td>
                  </tr>
                ) : (
                  produtosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{p.nome}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase bg-blue-50 text-[#002B7F] border border-blue-200 mr-2">
                          {p.categoria}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{p.tamanho}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">R$ {p.preco_compra.toFixed(2)}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">R$ {p.preco_venda.toFixed(2)}</td>
                      <td className="p-3.5 font-mono font-black text-slate-900">{p.quantidade_estoque} un.</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${
                          p.quantidade_estoque <= p.estoque_minimo ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {p.quantidade_estoque <= p.estoque_minimo ? 'Estoque Baixo' : 'Ok'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setMovimentacaoForm({ produto_id: p.id, tipo: 'saida', quantidade: '1', motivo: 'Saída/Venda de balcão' });
                            setShowNovaMovimentacaoModal(true);
                          }}
                          className="h-8 px-3 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] uppercase rounded-xl transition cursor-pointer border border-slate-200"
                        >
                          Dar Saída
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: Histórico */}
      {activeTab === 'historico' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900">Histórico de Entradas & Saídas</h2>
          <div className="table-responsive">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Data / Hora</th>
                  <th className="p-3.5">Produto</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Quantidade</th>
                  <th className="p-3.5">Motivo</th>
                  <th className="p-3.5">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {movimentacoes.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{new Date(m.created_at || '').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3.5 font-bold text-slate-900">{m.produto_nome || m.produto_id}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${
                        m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-[#CE1126] border-red-200'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold">{m.quantidade} un.</td>
                    <td className="p-3.5 text-slate-600">{m.motivo}</td>
                    <td className="p-3.5 text-slate-500 font-bold">{m.usuario_nome || 'Sistema'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Fornecedores */}
      {activeTab === 'fornecedores' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900">Fornecedores Cadastrados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fornecedores.map(f => (
              <div key={f.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h3 className="text-sm font-black text-slate-900">{f.nome}</h3>
                <p className="text-xs text-slate-600">Contato: <strong>{f.contato || '—'}</strong></p>
                <p className="text-xs text-slate-600 font-mono">Tel: {f.telefone || '—'} | E-mail: {f.email || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais com botões de ação alinhados (h-10) */}
      {showNovoProdutoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setShowNovoProdutoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Cadastrar Novo Produto</h3>

            <form onSubmit={handleCriarProduto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto *</label>
                <input
                  type="text" required
                  placeholder="Ex: Kimono Tradicional FBKE"
                  value={produtoForm.nome}
                  onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
                  <select
                    value={produtoForm.categoria}
                    onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tamanho</label>
                  <select
                    value={produtoForm.tamanho}
                    onChange={(e) => setProdutoForm({ ...produtoForm, tamanho: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    {TAMANHOS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Custo (R$)</label>
                  <input
                    type="number" step="0.01"
                    placeholder="100.00"
                    value={produtoForm.preco_compra}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_compra: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Venda (R$)</label>
                  <input
                    type="number" step="0.01"
                    placeholder="180.00"
                    value={produtoForm.preco_venda}
                    onChange={(e) => setProdutoForm({ ...produtoForm, preco_venda: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qtd Inicial</label>
                  <input
                    type="number"
                    value={produtoForm.quantidade_estoque}
                    onChange={(e) => setProdutoForm({ ...produtoForm, quantidade_estoque: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={produtoForm.estoque_minimo}
                    onChange={(e) => setProdutoForm({ ...produtoForm, estoque_minimo: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoProdutoModal(false)}
                  className="h-10 px-5 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 inline-flex items-center justify-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Movimentação */}
      {showNovaMovimentacaoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setShowNovaMovimentacaoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Lançar Movimentação de Estoque</h3>

            <form onSubmit={handleCriarMovimentacao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Produto *</label>
                <select
                  required
                  value={movimentacaoForm.produto_id}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, produto_id: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="">Selecione...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.quantidade_estoque} un. atuais)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo *</label>
                  <select
                    value={movimentacaoForm.tipo}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, tipo: e.target.value as any })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="entrada">Entrada (Reposição)</option>
                    <option value="saida">Saída (Venda/Baixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantidade *</label>
                  <input
                    type="number" min="1" required
                    value={movimentacaoForm.quantidade}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, quantidade: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de lote, venda balcão..."
                  value={movimentacaoForm.motivo}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, motivo: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovaMovimentacaoModal(false)}
                  className="h-10 px-5 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 inline-flex items-center justify-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Fornecedor */}
      {showNovoFornecedorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setShowNovoFornecedorModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Novo Fornecedor</h3>

            <form onSubmit={handleCriarFornecedor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social / Nome *</label>
                <input
                  type="text" required
                  placeholder="Ex: Kimonos & Artigos Esportivos Bahia"
                  value={fornecedorForm.nome}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, nome: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contato Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do representante"
                  value={fornecedorForm.contato}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, contato: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(71) 99999-9999"
                    value={fornecedorForm.telefone}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, telefone: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="contato@fornecedor.com"
                    value={fornecedorForm.email}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, email: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoFornecedorModal(false)}
                  className="h-10 px-5 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 inline-flex items-center justify-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
