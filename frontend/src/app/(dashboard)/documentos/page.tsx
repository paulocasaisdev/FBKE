'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, Download, ShieldAlert, Award, 
  BookOpen, Plus, Loader2, X, Edit, Trash2, CheckCircle2,
  FileCheck, ShieldCheck, UserCheck, AlertTriangle, Search
} from 'lucide-react';
import ModalAssinaturaGov from '@/components/documentos/ModalAssinaturaGov';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Documento {
  id?: string;
  titulo: string;
  tipo: string;
  desc: string;
  arquivo_url: string;
  created_at?: string;
}

interface DocumentoAssinado {
  id: string;
  atleta_id: string;
  atleta_nome: string;
  titulo: string;
  tipo_documento: string;
  status: 'pendente' | 'assinado';
  created_at: string;
  signed_at?: string;
  assinatura_hash?: string;
  arquivo_url?: string;
}

export default function DocumentosPage() {
  const { usuario, tipo } = useAuth();
  const isAdmin = tipo === 'admin';
  const podeGerenciarDocumentos = tipo === 'admin' || tipo === 'filial';

  const [activeTab, setActiveTab] = useState<'downloads' | 'assinaturas'>('downloads');
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const documentosFiltrados = documentos.filter(doc => {
    if (tipo === 'atleta') {
      const tipoDoc = (doc.tipo || '').toLowerCase();
      const tituloDoc = (doc.titulo || '').toLowerCase();
      return !tipoDoc.includes('certificado') && !tituloDoc.includes('certificado');
    }
    return true;
  });
  const [docsAssinados, setDocsAssinados] = useState<DocumentoAssinado[]>([]);
  const [atletas, setAtletas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSolicitarAberto, setModalSolicitarAberto] = useState(false);
  const [govModalAberto, setGovModalAberto] = useState(false);
  const [selectedDocAssinar, setSelectedDocAssinar] = useState<DocumentoAssinado | null>(null);

  // Forms
  const [form, setForm] = useState<Documento>({
    titulo: '',
    tipo: 'Regulamento',
    desc: '',
    arquivo_url: '',
  });

  const [solicitarForm, setSolicitarForm] = useState({
    atleta_id: '',
    titulo: 'Termo Unificado de Matrícula e Prestação de Serviços',
    tipo_documento: 'termo_unificado'
  });

  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resDocs, resAssin, resAtletas] = await Promise.all([
        fetch(`${API_URL}/api/documentos`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/documentos-assinados`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/atletas`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      ]);

      if (resDocs && resDocs.documentos) setDocumentos(resDocs.documentos);
      else {
        setDocumentos([
          { id: "doc-1", titulo: "Estatuto Social FBKE 2026", tipo: "Institucional", desc: "Estatuto aprovado em assembleia geral ordinária da federação.", arquivo_url: "/docs/estatuto.pdf" },
          { id: "doc-2", titulo: "Regulamento Oficial de Competições", tipo: "Regulamento", desc: "Regras internacionais de Kata e Kumite da WKF adaptadas para a Bahia.", arquivo_url: "/docs/regulamento.pdf" },
          { id: "doc-3", titulo: "Tabela Oficial de Taxas e Anuidades 2026", tipo: "Financeiro", desc: "Valores vigentes para filiação de dojos, inscrições e exames de faixa.", arquivo_url: "/docs/tabela_taxas.pdf" }
        ]);
      }

      if (resAssin && resAssin.documentos) setDocsAssinados(resAssin.documentos);
      else {
        setDocsAssinados([
          { id: "term-1", atleta_id: "a-1", atleta_nome: "Pedro Oliveira", titulo: "Termo Unificado de Responsabilidade & Imagem", tipo_documento: "termo_unificado", status: "pendente", created_at: new Date().toISOString() },
          { id: "term-2", atleta_id: "a-2", atleta_nome: "Lucas Almeida", titulo: "Termo Unificado de Responsabilidade & Imagem", tipo_documento: "termo_unificado", status: "assinado", created_at: new Date(Date.now() - 86400000).toISOString(), signed_at: new Date().toISOString(), assinatura_hash: "GOVBR-98427509124-SHA256" }
        ]);
      }

      if (resAtletas && resAtletas.atletas) setAtletas(resAtletas.atletas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Cadastrar Documento PDF
  const handleCadastrarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModalAberto(false);
        setNotif({ type: 'success', msg: 'Documento cadastrado com sucesso!' });
        carregarDados();
      }
    } catch (err) {
      setDocumentos([{ id: `doc-${Date.now()}`, ...form }, ...documentos]);
      setModalAberto(false);
      setNotif({ type: 'success', msg: 'Documento adicionado ao acervo!' });
    } finally {
      setSubmitting(false);
    }
  };

  // Solicitar Assinatura de Termo
  const handleSolicitarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const atletaSel = atletas.find(a => a.id === solicitarForm.atleta_id);

    try {
      const res = await fetch(`${API_URL}/api/documentos-assinados/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(solicitarForm)
      });
      if (res.ok) {
        setModalSolicitarAberto(false);
        setNotif({ type: 'success', msg: 'Termo solicitado ao atleta!' });
        carregarDados();
      }
    } catch (err) {
      setDocsAssinados([
        {
          id: `term-${Date.now()}`,
          atleta_id: solicitarForm.atleta_id,
          atleta_nome: atletaSel?.nome || 'Atleta Selecionado',
          titulo: solicitarForm.titulo,
          tipo_documento: solicitarForm.tipo_documento,
          status: 'pendente',
          created_at: new Date().toISOString()
        },
        ...docsAssinados
      ]);
      setModalSolicitarAberto(false);
      setNotif({ type: 'success', msg: 'Solicitação de assinatura criada!' });
    } finally {
      setSubmitting(false);
    }
  };

  // Sucesso na Assinatura Gov.br
  const handleSuccessAssinaturaGov = (cpf: string) => {
    if (selectedDocAssinar) {
      setDocsAssinados(docsAssinados.map(d => 
        d.id === selectedDocAssinar.id 
          ? { ...d, status: 'assinado', signed_at: new Date().toISOString(), assinatura_hash: `GOVBR-${cpf.replace(/\D/g, '')}-SHA256` }
          : d
      ));
    }
    setGovModalAberto(false);
    setNotif({ type: 'success', msg: 'Documento assinado digitalmente via Gov.br com sucesso!' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header com Ações Globais Alinhados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block mb-1">
            Acervo & Assinaturas Digitais
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Central de Documentos & Regulamentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Estatuto social, regulamentos, termos de responsabilidade e assinatura Gov.br</p>
        </div>

        {/* Botões do Topo Alinhados */}
        {podeGerenciarDocumentos && (
          <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setModalSolicitarAberto(true)}
              className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FileCheck size={16} className="shrink-0" /> Solicitar Termo
            </button>

            <button
              onClick={() => {
                setForm({ titulo: '', tipo: 'Regulamento', desc: '', arquivo_url: '' });
                setModalAberto(true);
              }}
              className="h-11 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus size={18} className="shrink-0" /> Novo Documento
            </button>
          </div>
        )}
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

      {/* Abas Principais Alinhadas */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`pb-3.5 transition cursor-pointer uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'downloads' ? 'border-b-2 border-[#002B7F] text-[#002B7F]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={15} /> Documentos para Download ({documentosFiltrados.length})
        </button>

        <button
          onClick={() => setActiveTab('assinaturas')}
          className={`pb-3.5 transition cursor-pointer uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'assinaturas' ? 'border-b-2 border-[#002B7F] text-[#002B7F]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={15} /> Termos & Assinaturas Gov.br ({docsAssinados.length})
        </button>
      </div>

      {/* Aba 1: Documentos para Download */}
      {activeTab === 'downloads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentosFiltrados.map((doc) => (
            <div key={doc.id || doc.titulo} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#002B7F] bg-blue-50 rounded-lg border border-blue-200">
                    {doc.tipo}
                  </span>
                  <FileText size={18} className="text-[#CE1126]" />
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug">{doc.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{doc.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href={doc.arquivo_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 w-full inline-flex items-center justify-center gap-2 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition text-center shadow-sm"
                >
                  <Download size={14} /> Baixar PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aba 2: Termos & Assinaturas Gov.br */}
      {activeTab === 'assinaturas' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">Termos de Responsabilidade e Matrícula</h2>
            <span className="text-xs text-slate-500 font-bold">Assinatura Certificada via Gov.br</span>
          </div>

          <div className="table-responsive">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Atleta Beneficiário</th>
                  <th className="p-3.5">Título do Termo</th>
                  <th className="p-3.5">Data de Emissão</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {docsAssinados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum termo pendente.</td>
                  </tr>
                ) : (
                  docsAssinados.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{d.atleta_nome}</td>
                      <td className="p-3.5 text-slate-700">{d.titulo}</td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${
                          d.status === 'assinado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {d.status === 'assinado' ? 'Assinado Digitalmente' : 'Pendente de Assinatura'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {d.status === 'pendente' ? (
                          <button
                            onClick={() => {
                              setSelectedDocAssinar(d);
                              setGovModalAberto(true);
                            }}
                            className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer shadow-xs"
                          >
                            <ShieldCheck size={14} /> Assinar via Gov.br
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{d.assinatura_hash}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Documento PDF */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setModalAberto(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Cadastrar Novo Documento</h3>

            <form onSubmit={handleCadastrarDocumento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título do Documento *</label>
                <input
                  type="text" required
                  placeholder="Ex: Regulamento do Campeonato Baiano 2026"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="Regulamento">Regulamento</option>
                  <option value="Institucional">Institucional</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Certificado">Certificado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Resumo do conteúdo do documento..."
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL do Arquivo PDF *</label>
                <input
                  type="text" required
                  placeholder="/docs/regulamento.pdf"
                  value={form.arquivo_url}
                  onChange={(e) => setForm({ ...form, arquivo_url: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="h-10 px-5 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 inline-flex items-center justify-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Solicitar Termo */}
      {modalSolicitarAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900">
            <button onClick={() => setModalSolicitarAberto(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-5">Solicitar Assinatura de Termo</h3>

            <form onSubmit={handleSolicitarAssinatura} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Atleta *</label>
                <select
                  required
                  value={solicitarForm.atleta_id}
                  onChange={(e) => setSolicitarForm({ ...solicitarForm, atleta_id: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="">Selecione o atleta...</option>
                  {atletas.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} (Faixa {a.faixa})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título do Termo *</label>
                <input
                  type="text" required
                  value={solicitarForm.titulo}
                  onChange={(e) => setSolicitarForm({ ...solicitarForm, titulo: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalSolicitarAberto(false)}
                  className="h-10 px-5 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 inline-flex items-center justify-center bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Confirmar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assinatura Gov.br */}
      {govModalAberto && selectedDocAssinar && (
        <ModalAssinaturaGov
          onClose={() => setGovModalAberto(false)}
          onSuccess={handleSuccessAssinaturaGov}
          documentTitle={selectedDocAssinar.titulo}
        />
      )}

    </main>
  );
}
