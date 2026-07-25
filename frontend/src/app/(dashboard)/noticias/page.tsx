'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Newspaper, Plus, Search, Edit2, Trash2, X, Loader2, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Noticia {
  id: string | number;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  categoria: string;
  imagem_url?: string;
  publicado: boolean;
  created_at: string;
}

export default function NoticiasPage() {
  const { usuario, isAdmin } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [form, setForm] = useState({ titulo: '', subtitulo: '', conteudo: '', categoria: 'Eventos', imagem_url: '', publicado: true });
  const [salvando, setSalvando] = useState(false);

  const carregarNoticias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/noticias`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNoticias(data.noticias || []);
      }
    } catch (err) {
      console.error("Erro ao carregar notícias, usando dados mock:", err);
      setNoticias([
        { id: 1, titulo: "Exame Geral de Faixas Pretas 2026", subtitulo: "Abertura oficial de inscrições de Kyu e Dan", conteudo: "Inscrições abertas até dia 20 de Junho...", categoria: "Graduações", publicado: true, created_at: new Date().toISOString() },
        { id: 2, titulo: "Seminário Técnico com Sensei Tanaka", subtitulo: "Treinamento intensivo de Kata tradicional", conteudo: "O seminário ocorrerá no Dojo Central no dia 15 de Julho...", categoria: "Treinamentos", publicado: true, created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNoticias();
  }, []);

  const handleOpenCreate = () => {
    setEditingNoticia(null);
    setForm({ titulo: '', subtitulo: '', conteudo: '', categoria: 'Eventos', imagem_url: '', publicado: true });
    setShowModal(true);
  };

  const handleOpenEdit = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setForm({
      titulo: noticia.titulo,
      subtitulo: noticia.subtitulo,
      conteudo: noticia.conteudo,
      categoria: noticia.categoria,
      imagem_url: noticia.imagem_url || '',
      publicado: noticia.publicado
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const method = editingNoticia ? 'PATCH' : 'POST';
      const endpoint = editingNoticia ? `${API_URL}/api/noticias/${editingNoticia.id}` : `${API_URL}/api/noticias`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (editingNoticia) {
          setNoticias(noticias.map(n => n.id === editingNoticia.id ? { ...n, ...form } : n));
        } else {
          setNoticias([data.noticia || data, ...noticias]);
        }
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      if (editingNoticia) {
        setNoticias(noticias.map(n => n.id === editingNoticia.id ? { ...n, ...form } : n));
      } else {
        const mockNew: Noticia = {
          id: Date.now(),
          ...form,
          created_at: new Date().toISOString()
        };
        setNoticias([mockNew, ...noticias]);
      }
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string | number) => {
    if (!confirm("Deseja realmente excluir esta notícia?")) return;

    try {
      const res = await fetch(`${API_URL}/api/noticias/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setNoticias(noticias.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
      setNoticias(noticias.filter(n => n.id !== id));
    }
  };

  const noticiasFiltradas = noticias.filter(n => 
    n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    n.subtitulo.toLowerCase().includes(busca.toLowerCase()) ||
    n.categoria.toLowerCase().includes(busca.toLowerCase())
  );

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
            Comunicação & Imprensa
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Módulo de Notícias & Comunicados</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerenciamento de informativos públicos e matérias institucionais</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Nova Notícia
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Buscar notícias por título ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#002B7F]"
        />
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Grid de Notícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticiasFiltradas.map(noticia => (
          <div key={noticia.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#002B7F] bg-blue-50 rounded-lg border border-blue-200">
                  {noticia.categoria}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(noticia.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-snug">{noticia.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{noticia.subtitulo}</p>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(noticia)}
                  className="px-3 py-1.5 bg-blue-50 text-[#002B7F] hover:bg-[#002B7F] hover:text-white rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 border border-blue-200"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => handleExcluir(noticia.id)}
                  className="px-3 py-1.5 bg-red-50 text-[#CE1126] hover:bg-[#CE1126] hover:text-white rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 border border-red-200"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Criar / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">
              {editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título *</label>
                <input
                  type="text" required
                  placeholder="Ex: Exame Geral de Faixas Pretas 2026"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtítulo / Resumo</label>
                <input
                  type="text"
                  placeholder="Breve resumo informativo"
                  value={form.subtitulo}
                  onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Conteúdo Completo *</label>
                <textarea
                  rows={4} required
                  placeholder="Escreva a matéria ou comunicado aqui..."
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="Eventos">Eventos</option>
                  <option value="Graduações">Graduações</option>
                  <option value="Treinamentos">Treinamentos</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Notícia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
