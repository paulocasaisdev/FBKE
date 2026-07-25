'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, ArrowLeft, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface CertificadoData {
  codigo_validacao: string;
  data_emissao: string;
  atleta_nome: string;
  atleta_faixa: string;
  filial_nome: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function ValidarCertificadoContent() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo') || '';
  const [certificado, setCertificado] = useState<CertificadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) {
      setError('Código de validação ausente.');
      setLoading(false);
      return;
    }

    async function validar() {
      try {
        const res = await fetch(`${API_URL}/api/certificados/validar/${codigo}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.erro || 'Certificado inválido');
        }

        setCertificado(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao validar certificado');
      } finally {
        setLoading(false);
      }
    }
    validar();
  }, [codigo]);

  return (
    <div className="w-full max-w-3xl z-10 space-y-6 print:space-y-0 print:max-w-none">
      {/* Top Back Link */}
      <Link href="/transparencia" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition print:hidden">
        <ArrowLeft size={14} /> Voltar para Transparência
      </Link>

      {loading ? (
        /* Scanner Effect */
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-16 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="w-16 h-16 bg-primary/10 rounded-full border border-primary/30 flex items-center justify-center">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary font-cinzel">Autenticando Documento</h2>
          <p className="text-xs text-gray-500 font-body">Buscando na base de dados da associação...</p>
        </div>
      ) : error ? (
        /* Invalid Warning */
        <div className="bg-zinc-900/40 border border-red-500/20 rounded-3xl p-10 sm:p-14 text-center space-y-5">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-red-400 font-cinzel uppercase tracking-wider">Certificado não localizado</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto font-body">
              O código de verificação <span className="font-mono text-white font-bold bg-zinc-900 px-2 py-0.5 rounded">{codigo}</span> não corresponde a nenhum documento autêntico da nossa Associação.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/transparencia" className="text-xs px-6 py-2.5 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:text-primary text-gray-300 rounded-xl transition font-cinzel">
              Tentar Outro Código
            </Link>
          </div>
        </div>
      ) : certificado ? (
        /* Valid Frame */
        <div className="space-y-6 print:space-y-0">
          
          {/* Success Bar */}
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 font-body">Documento Verificado Online ✅</p>
                <p className="text-[10px] text-emerald-500/80 mt-0.5 font-body">Certificado autêntico registrado no sistema oficial da GRKK.</p>
              </div>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 shrink-0 cursor-pointer"
            >
              <FileText size={14} /> Imprimir / Salvar PDF
            </button>
          </div>

          {/* Premium Certificate Frame */}
          <div className="relative border-4 border-gold/20 bg-zinc-900/20 p-6 sm:p-12 rounded-3xl overflow-hidden shadow-2xl print:border-4 print:border-gold/40 print:bg-white print:text-black print:shadow-none print:p-8">
            {/* Moldura de Canto */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-gold/40" />
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-gold/40" />
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-gold/40" />
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-gold/40" />
            
            {/* Marca D'água */}
            <div className="absolute inset-0 opacity-[0.015] print:opacity-[0.03] flex items-center justify-center pointer-events-none">
              <img src="/logo.png" alt="GRKK" className="w-80 h-80 object-contain" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 sm:space-y-8 print:space-y-6">
              
              {/* Logo Header */}
              <div className="relative w-14 h-14">
                <img src="/logo.png" alt="GRKK" className="w-14 h-14 object-contain" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Associação Goju-Ryu Karatê-Kai</p>
                <h3 className="text-xl sm:text-2xl font-black text-white font-cinzel print:text-black">CERTIFICADO DE AUTENTICIDADE TÉCNICA</h3>
                <div className="w-16 h-0.5 bg-gold/35 mx-auto" />
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl font-body print:text-black">
                Certificamos que o atleta <span className="font-extrabold text-white uppercase font-cinzel tracking-wide print:text-black">{certificado.atleta_nome}</span> está registrado sob a jurisdição da filial <span className="font-bold text-gray-200 print:text-black">{certificado.filial_nome}</span> e foi homologado na graduação de <span className="font-extrabold text-gold font-cinzel tracking-wider print:text-gold-600">{certificado.atleta_faixa}</span>.
              </p>

              {/* Info Block */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md pt-4 border-t border-zinc-800 text-left text-[11px] print:border-black/10">
                <div>
                  <p className="text-gray-500 font-bold uppercase tracking-wider print:text-gray-600">Código de Validação</p>
                  <p className="font-mono font-bold text-gray-300 mt-1 uppercase print:text-black">{certificado.codigo_validacao}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase tracking-wider print:text-gray-600">Data de Emissão</p>
                  <p className="font-bold text-gray-300 mt-1 flex items-center gap-1 print:text-black">
                    <Calendar size={11} /> {new Date(certificado.data_emissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 w-full max-w-md pt-8 text-center text-[10px] text-gray-500 print:text-black">
                <div className="space-y-1">
                  <p className="font-cinzel tracking-wider italic text-gray-300 print:text-black">Shikan Cassio</p>
                  <div className="w-24 h-px bg-zinc-800 mx-auto print:bg-black/20" />
                  <p className="uppercase text-[8px] font-bold tracking-wider print:text-gray-600">Presidente da Banca</p>
                </div>
                <div className="space-y-1">
                  <p className="font-cinzel tracking-wider italic text-gray-300 print:text-black">Associação GRKK</p>
                  <div className="w-24 h-px bg-zinc-800 mx-auto print:bg-black/20" />
                  <p className="uppercase text-[8px] font-bold tracking-wider print:text-gray-600">Secretaria Técnica</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
}

export default function ValidarCertificadoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 print:bg-white print:text-black print:min-h-0 print:p-0 relative">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none print:hidden"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #c8a96e 0%, transparent 60%)' }} />

      <Suspense fallback={
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-16 text-center space-y-4">
          <Loader2 size={24} className="text-primary animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-body">Carregando validador...</p>
        </div>
      }>
        <ValidarCertificadoContent />
      </Suspense>
    </main>
  );
}
