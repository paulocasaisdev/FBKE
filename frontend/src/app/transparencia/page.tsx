'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Download, Shield, Eye, ShieldCheck, ArrowRight, Loader2, BookOpen, Award, CheckCircle2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Documento {
  id?: string;
  titulo: string;
  tipo: string;
  desc: string;
  arquivo_url: string;
}

function getIcon(tipo: string) {
  switch (tipo) {
    case 'Regulamento': return <BookOpen size={18} className="text-[#002B7F]" />;
    case 'Regras': return <FileText size={18} className="text-[#002B7F]" />;
    case 'Institucional': return <Shield size={18} className="text-[#CE1126]" />;
    case 'Financeiro': return <Award size={18} className="text-amber-600" />;
    default: return <FileText size={18} className="text-[#002B7F]" />;
  }
}

export default function TransparenciaPage() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();
  
  const [siteConfig, setSiteConfig] = useState({
    hero_title: 'PORTAL DA TRANSPARÊNCIA',
    hero_subtitle: 'A FBKE atua com ética, responsabilidade pública e governança digital.',
    hero_breadcrumb: 'Transparência',
    intro_text: 'A Federação Baiana de Karate-do Esportivo disponibiliza seu estatuto social, ata da diretoria, CNPJ, regulamentos técnicos e documentos institucionais para consulta pública, reafirmando seu compromisso com a transparência e a lisura no esporte.',
    compromisso_title: 'Nosso Compromisso com a Bahia',
    compromisso_text: 'A FBKE opera de forma organizada, descentralizada e auditável, promovendo o desenvolvimento do Karate esportivo e garantindo a autenticidade de todos os títulos e graduações emitidos.',
    doc_estatuto: { titulo: 'Estatuto Social FBKE', desc: 'Documento constitutivo da FBKE com suas normas e diretrizes.', tipo: 'Institucional', arquivo_url: '' },
    doc_diretoria: { titulo: 'Diretoria Vigente (2026)', desc: 'Composição oficial da diretoria executiva e conselho fiscal.', tipo: 'Institucional', arquivo_url: '' },
    doc_cnpj: { titulo: 'Comprovante de CNPJ', desc: 'Dados cadastrais da pessoa jurídica junto à Receita Federal.', tipo: 'Institucional', arquivo_url: '' },
    doc_regulamentos: { titulo: 'Regulamento Técnico de Arbitragem', desc: 'Normas técnicas e regulamentos de competição oficial.', tipo: 'Regulamento', arquivo_url: '' },
    doc_docs_institucionais: { titulo: 'Atas e Balancetes Oficiais', desc: 'Documentação administrativa e prestações de contas.', tipo: 'Institucional', arquivo_url: '' },
    doc_termos: { titulo: 'Termos de Uso do Portal', desc: 'Condições de uso da plataforma FBKE.', tipo: 'Institucional', arquivo_url: '/transparencia/termos' },
    doc_privacidade: { titulo: 'Política de Privacidade (LGPD)', desc: 'Diretrizes de tratamento e proteção de dados pessoais.', tipo: 'Institucional', arquivo_url: '/transparencia/privacidade' },
    doc_defesa_marca: { titulo: 'Proteção & Registro de Marca FBKE', desc: 'Diretrizes sobre o uso e propriedade da marca oficial.', tipo: 'Institucional', arquivo_url: '/transparencia/defesa-marca' },
  });

  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    document.title = 'Portal da Transparência - FBKE Federação Baiana de Karate';
    
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setSiteConfig(prev => ({
              ...prev,
              ...(data.config.transparencia || {}),
              doc_estatuto: data.config.doc_estatuto || prev.doc_estatuto,
              doc_diretoria: data.config.doc_diretoria || prev.doc_diretoria,
              doc_cnpj: data.config.doc_cnpj || prev.doc_cnpj,
              doc_regulamentos: data.config.doc_regulamentos || prev.doc_regulamentos,
              doc_docs_institucionais: data.config.doc_docs_institucionais || prev.doc_docs_institucionais,
              doc_termos: data.config.doc_termos || prev.doc_termos,
              doc_privacidade: data.config.doc_privacidade || prev.doc_privacidade,
              doc_defesa_marca: data.config.doc_defesa_marca || prev.doc_defesa_marca,
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do CMS:", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    carregarConfig();
  }, []);

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      router.push(`/transparencia/validar-certificado?hash=${encodeURIComponent(codigo.trim())}`);
    }
  };

  const documentosExibidos: Documento[] = [
    siteConfig.doc_estatuto,
    siteConfig.doc_diretoria,
    siteConfig.doc_cnpj,
    ...(Array.isArray(siteConfig.doc_regulamentos) ? siteConfig.doc_regulamentos : [siteConfig.doc_regulamentos].filter(Boolean)),
    ...(Array.isArray(siteConfig.doc_docs_institucionais) ? siteConfig.doc_docs_institucionais : [siteConfig.doc_docs_institucionais].filter(Boolean)),
    siteConfig.doc_termos,
    siteConfig.doc_privacidade,
    siteConfig.doc_defesa_marca,
  ].filter(Boolean);

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
              <ShieldCheck size={14} className="text-emerald-400" />
              Gestão Pública & Governança Esportiva
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {siteConfig.hero_title}
            </h1>

            <div className="w-20 h-1.5 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {siteConfig.hero_subtitle}
            </p>
          </div>
        </section>

        {/* ================= SEÇÃO DE AUTENTICAÇÃO ================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto -mt-8 relative z-20">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#002B7F] flex items-center justify-center mx-auto border border-blue-200">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Validar Certificado / Diploma por Hash</h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira a chave Hash de autenticação para validar certificados de faixas pretas e cursos emitidos pela FBKE.
              </p>
            </div>

            <form onSubmit={handleValidar} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              <input
                type="text"
                required
                placeholder="Chave Hash (Ex: 5d8a9e4b7c...)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                Validar <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </section>

        {/* ================= DOCUMENTOS INSTITUCIONAIS ================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Consulta Pública Livre
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Estatuto, Regulamentos e Documentos Oficiais
            </h2>
            <div className="w-16 h-1 bg-[#002B7F] rounded-full mx-auto mt-2"></div>
            <p className="text-xs text-slate-500 max-w-xl mx-auto pt-1">
              {siteConfig.intro_text}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentosExibidos.map((doc, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                      {getIcon(doc.tipo)}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-[#002B7F] border border-blue-200">
                      {doc.tipo}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{doc.titulo}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {doc.arquivo_url ? (
                    <a
                      href={doc.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      <Download size={13} /> Visualizar / Baixar
                    </a>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 italic">Disponível em breve</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
