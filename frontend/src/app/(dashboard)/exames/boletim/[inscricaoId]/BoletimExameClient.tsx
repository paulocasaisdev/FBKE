'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Calendar, Shield, User, FileText, Printer, CheckCircle, Clock, Award, Download } from 'lucide-react';

function calcularDiasUteisDecorridos(dataIso?: string): number {
  if (!dataIso) return 7;
  try {
    const data = new Date(dataIso);
    const hoje = new Date();
    let count = 0;
    const cur = new Date(data.getTime());
    while (cur < hoje) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  } catch {
    return 7;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Exame {
  titulo: string;
  data_exame: string;
  local: string;
  modalidade: string;
  faixa_alvo: string;
}

interface Candidato {
  id: string | number;
  atleta_nome: string;
  faixa_atual: string;
  graduacao_pretendida: string;
  resultado: string;
  status: string;
  pagamento_status: string;
  avaliado_em?: string;
  exame_id?: string | number;
  dados_banca?: {
    criterios?: any[];
    nota_final?: number;
    observacoes?: string;
    passing_count?: number;
    total_tests?: number;
    required_passing?: number;
  };
}

export default function BoletimExameClient({ params }: { params: Promise<{ inscricaoId: string }> }) {
  const { inscricaoId: inscricaoIdProp } = use(params);
  
  // Resolução de ID real para exportação estática (Apache/HostGator)
  let inscricaoId = inscricaoIdProp;
  if (typeof window !== 'undefined' && (inscricaoIdProp === 'cand-1' || inscricaoIdProp === 'cand-2')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'exames' && parts[1] === 'boletim') {
      inscricaoId = parts[2];
    }
  }

  const router = useRouter();
  const { usuario, tipo, isAdmin, carregando } = useAuth();
  const isExaminador = tipo === 'filial';

  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [exame, setExame] = useState<Exame | null>(null);
  const [examinadorNome, setExaminadorNome] = useState('Banca Examinadora');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (carregando) return;

    if (!usuario) {
      router.push('/auth');
      return;
    }

    const carregarDados = async () => {
      try {
        const res = await fetch(`${API_URL}/api/exames/candidatos/${inscricaoId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Não foi possível carregar a ficha.');
        const data = await res.json();
        
        setCandidato(data.candidato);
        setExame(data.exame);
        setExaminadorNome(data.examinador_nome || 'Banca Examinadora');
      } catch (err) {
        console.error(err);
        router.push('/exames');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [inscricaoId, usuario, carregando]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
        <p className="text-slate-500 font-bold text-xs tracking-wider uppercase">Carregando boletim de notas...</p>
      </div>
    );
  }

  if (!candidato || !exame || !candidato.dados_banca) {
    return (
      <div className="p-10 text-center text-slate-400 text-xs">
        Ficha de avaliação ou resultado indisponível para esta inscrição.
      </div>
    );
  }

  const ex = exame;
  const c = candidato;
  const detalhes = c.dados_banca!;

  const outcomeColor: Record<string, string> = {
    aprovado: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    reprovado: 'text-[#CE1126] bg-red-50 border-red-200',
    ausente: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6 pb-12 font-sans text-slate-900 print:p-0 print:bg-white print:text-black">
      
      {/* Voltar (oculto na impressão) */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/exames/${c.exame_id}`} className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <FileText size={20} className="text-[#002B7F]" /> Boletim de Notas
            </h2>
            <p className="text-xs text-slate-500">Detalhamento da avaliação técnica de graduação</p>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-xs"
        >
          <Printer size={13} />
          Imprimir Boletim
        </button>
      </div>

      {/* Banner de Emissão de Certificado Matriz Oficial (Exibido para Aprovados) */}
      {c.status === 'aprovado' && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-slate-50 to-blue-50 border border-emerald-200/90 rounded-3xl space-y-3 print:hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#002B7F] text-white rounded-2xl shrink-0 shadow-xs mt-0.5">
                <Award size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Candidato Aprovado
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> Atualização de Matriz: até 7 dias úteis
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-1">Emissão Automática do Certificado Oficial GRKK / FBKE</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {calcularDiasUteisDecorridos(c.avaliado_em || ex.data_exame) >= 7 || isAdmin ? (
                    <span className="text-emerald-700 font-bold">✓ Homologação técnica e atualização da matriz concluídas. O certificado está liberado para emissão e download.</span>
                  ) : (
                    <span className="text-slate-600">⏳ Cadastro e atualização da matriz oficial em andamento (Prazo de até 7 dias úteis).</span>
                  )}
                </p>
              </div>
            </div>

            <Link
              href={`/certificados?atleta_id=${c.id}&nome=${encodeURIComponent(c.atleta_nome)}&faixa=${encodeURIComponent(c.graduacao_pretendida)}`}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            >
              <Download size={16} /> Emitir & Baixar Certificado
            </Link>
          </div>
        </div>
      )}

      {/* Cartão do Boletim */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden space-y-6 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Informações Cabeçalho */}
        <div className="flex justify-between items-start gap-4 flex-wrap pb-6 border-b border-slate-200 print:border-black">
          <div>
            <h3 className="text-slate-900 text-base sm:text-lg font-black uppercase tracking-wider print:text-black">{ex.titulo}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 print:text-zinc-650">
              <Calendar size={12} className="text-[#002B7F]" /> 
              {ex.data_exame.includes('T') ? ex.data_exame.split('T')[0].split('-').reverse().join('/') : ex.data_exame.split('-').reverse().join('/')} 
              · {ex.local}
            </p>
          </div>
          <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${outcomeColor[c.status] || outcomeColor['aprovado']}`}>
            {c.status}
          </span>
        </div>

        {/* Dados do Atleta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs print:text-black">
          <div>
            <p className="text-slate-500 font-extrabold uppercase tracking-wider print:text-zinc-700">Atleta</p>
            <p className="font-bold text-slate-900 mt-0.5 print:text-black">{c.atleta_nome}</p>
          </div>
          <div>
            <p className="text-slate-500 font-extrabold uppercase tracking-wider print:text-zinc-700">Graduação Atual</p>
            <p className="font-medium text-slate-700 mt-0.5 print:text-zinc-800">{c.faixa_atual}</p>
          </div>
          <div>
            <p className="text-slate-500 font-extrabold uppercase tracking-wider print:text-zinc-700">Modalidade</p>
            <p className="font-bold text-slate-900 mt-0.5 print:text-black">{ex.modalidade}</p>
          </div>
          <div>
            <p className="text-slate-500 font-extrabold uppercase tracking-wider print:text-zinc-700">Graduação Alvo</p>
            <p className="font-extrabold text-[#002B7F] mt-0.5 print:text-black">Faixa {c.graduacao_pretendida}</p>
          </div>
        </div>

        {/* Tabela de Critérios */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden print:border-black print:bg-white print:text-black">
          {/* Cabeçalho */}
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-100 flex justify-between text-xs font-extrabold text-slate-600 uppercase tracking-wider print:border-black print:text-black">
            <span>Critério de Avaliação</span>
            <span>Avaliação</span>
          </div>
          
          <div className="divide-y divide-slate-200 print:divide-zinc-300">
            {detalhes.criterios?.map((crit: any) => {
              const hasConcept = typeof crit.conceito === 'string' && crit.conceito !== '';
              const conceptColors: Record<string, string> = {
                F: 'bg-red-50 text-[#CE1126] border-red-200',
                R: 'bg-amber-50 text-amber-800 border-amber-200',
                B: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                E: 'bg-blue-50 text-[#002B7F] border-blue-200',
              };
              
              return (
                <div key={crit.nome} className="px-5 py-4 space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-slate-900 font-bold text-xs sm:text-sm print:text-black">{crit.nome}</span>
                    <div className="flex items-center gap-2">
                      {hasConcept && (
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border uppercase ${conceptColors[crit.conceito]}`}>
                          Conceito {crit.conceito}
                        </span>
                      )}
                      {crit.nota !== null && crit.nota !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg print:text-black print:border-zinc-300">
                          Nota: {Number(crit.nota).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {crit.observacoes && (
                    <p className="text-xs text-slate-600 italic bg-white px-3.5 py-2 rounded-xl border border-slate-200 mt-1 print:text-zinc-800 print:bg-zinc-50 print:border-zinc-300">
                      "{crit.observacoes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumo da Regra ou Média */}
          <div className="px-5 py-4 bg-slate-100/60 border-t border-slate-200 space-y-2 print:border-black print:text-black">
            {detalhes.passing_count !== undefined && detalhes.total_tests !== undefined && (
              <div className="flex justify-between items-center text-xs text-slate-600 print:text-zinc-800">
                <span>Conceitos Aprovadores (R/B/E):</span>
                <span className="font-bold text-slate-900 print:text-black">
                  {detalhes.passing_count} de {detalhes.total_tests} (Mínimo: {detalhes.required_passing})
                </span>
              </div>
            )}
            {detalhes.nota_final !== null && detalhes.nota_final !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider print:text-zinc-800">Média das Notas</span>
                <span className="text-lg font-mono font-black text-[#002B7F] print:text-black">{Number(detalhes.nota_final).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Parecer do Examinador */}
        {detalhes.observacoes && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 print:border-black print:text-black">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
              <Shield size={13} className="text-[#002B7F]" /> Observações Técnicas do Examinador
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic print:text-black">
              "{detalhes.observacoes}"
            </p>
          </div>
        )}

        {/* Rodapé / Assinatura */}
        <div className="pt-4 flex justify-between items-center text-[10px] text-slate-500 flex-wrap gap-2 border-t border-slate-200 print:border-black print:text-black">
          <p>
            Avaliado em: {c.avaliado_em ? c.avaliado_em.split('T')[0].split('-').reverse().join('/') + ' às ' + c.avaliado_em.split('T')[1].substring(0, 5) : '—'}
          </p>
          {examinadorNome && (
            <p className="flex items-center gap-1">
              <User size={10} /> Examinador: <span className="font-bold text-slate-700 print:text-black">{examinadorNome}</span>
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

// Sub-componente Loader local para simplificar import
function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      width={size || 24} 
      height={size || 24}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
