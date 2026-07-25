'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function DocumentoPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSlug(params.get('slug'));
  }, []);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    fetch(`${API_URL}/api/cms/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.config) { setErro('Configuração não encontrada.'); return; }
        const buscar = (arr: any[]) => arr?.find((d: any) => d.slug === slug);
        const encontrado = buscar(data.config.doc_docs_institucionais) || buscar(data.config.doc_regulamentos);
        if (encontrado) { setDoc(encontrado); }
        else { setErro('Documento não encontrado.'); }
      })
      .catch(() => setErro('Erro ao carregar documento.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const Secao = ({ titulo, texto, lista }: { titulo?: string; texto?: string; lista?: string }) => {
    if (!titulo && !texto) return null;
    return (
      <section>
        {titulo && <h2 className="font-cinzel text-xl text-white font-bold mb-3">{titulo}</h2>}
        {texto && <p>{texto}</p>}
        {lista && (
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
            {lista.split('\n').map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
      </section>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-zinc-950 pt-20 min-h-screen flex items-center justify-center">
          <p className="text-zinc-500 text-sm">Carregando documento...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (erro || !doc) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-zinc-950 pt-20">
          <section className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Link href="/transparencia" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8 font-body">
                <ArrowLeft size={14} /> Voltar para Transparência
              </Link>
              <p className="text-zinc-500 text-sm mt-8">{erro || 'Documento não encontrado.'}</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <section className="bg-zinc-950 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/transparencia" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8 font-body">
              <ArrowLeft size={14} /> Voltar para Transparência
            </Link>

            <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-6">
              <FileText size={28} className="text-gold" />
            </div>

            <h1 className="font-cinzel text-4xl text-white font-bold mb-2">{doc.titulo}</h1>
            {doc.desc && <p className="text-gray-500 text-sm font-body mb-4">{doc.desc}</p>}
            <div className="w-12 h-0.5 bg-gold mb-8" />

            <div className="space-y-8 text-gray-400 text-sm font-body leading-relaxed">
              {[1,2,3,4,5,6,7,8].map(n => (
                <Secao key={n} titulo={doc[`s${n}_titulo`]} texto={doc[`s${n}_texto`]} lista={doc[`s${n}_lista`]} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
