'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageLightbox from '@/components/ImageLightbox';
import { Camera, Image as ImageIcon, Filter, Loader2 } from 'lucide-react';

interface GalleryItem {
  id: string | number;
  title: string;
  image_url: string;
  type: string;
  category: string;
  order: number;
}

const categorias = ['Todos', 'Treinos', 'Eventos', 'Gasshukus', 'Graduações'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function GaleriaPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch(`${API_URL}/api/galeria`);
        if (!res.ok) throw new Error('Erro ao carregar galeria');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error('Erro ao carregar galeria:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'Todos') return true;

    // Normalização básica de acentos para comparação
    const normActive = activeCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normItem = item.category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    return normActive === normItem;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-[#CE1126] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-slate-100 border border-white/20 backdrop-blur-md">
              <Camera size={14} className="text-[#CE1126]" />
              Memórias & Registros Fotográficos
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              GALERIA DE FOTOS & EVENTOS
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Cobertura oficial dos campeonatos, cursos técnicos, exames de faixa e momentos marcantes da Federação Baiana de Karate-do Esportivo.
            </p>
          </div>
        </section>

        {/* ================= GALERIA & FILTROS ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          {/* Filtros de Categoria */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Filter size={15} className="text-[#002B7F]" />
              <span>Filtrar Categoria:</span>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
                    cat === activeCategory
                      ? 'bg-[#002B7F] text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Imagens */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Loader2 size={32} className="text-[#002B7F] animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carregando acervo de fotos...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Nenhuma foto encontrada</h3>
              <p className="text-xs text-slate-500">
                Não existem registros cadastrados para a categoria <span className="font-semibold text-slate-700">"{activeCategory}"</span> no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="aspect-square bg-white border border-slate-200 rounded-3xl overflow-hidden relative group hover:border-[#002B7F]/40 hover:shadow-lg transition-all duration-300"
                >
                  <ImageLightbox
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-3 bottom-3 pointer-events-none bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                    <p className="text-white text-xs font-bold truncate">{item.title}</p>
                    <p className="text-blue-200 text-[10px] uppercase font-extrabold tracking-wider mt-0.5">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Registros e coberturas fotográficas dos eventos oficiais da Federação Baiana de Karate-do Esportivo.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
