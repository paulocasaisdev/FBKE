'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CURRICULO_ADULTO, CURRICULO_INFANTIL, CurriculoFaixa } from '@/constants/curriculo';
import { FAIXAS_ADULTO, FAIXAS_INFANTIL, CORES_FAIXAS, obterEstiloFaixa } from '@/constants/faixas';
import { BookOpen, Calendar, Shield, Swords, Info, User, CheckCircle2 } from 'lucide-react';

export default function CurriculoPage() {
  const { usuario, tipo, isAdmin, isFilial, isAtleta } = useAuth();
  
  // Estados para seleção da grade
  const [gradeTipo, setGradeTipo] = useState<'adulto' | 'infantil'>('adulto');
  const [faixaSelecionada, setFaixaSelecionada] = useState<string>('Amarela');

  useEffect(() => {
    if (usuario) {
      const userFaixa = usuario.faixa || (usuario as any).dados_atleta?.faixa || 'Amarela';
      
      let eMenorDe13 = false;
      if (usuario.data_nascimento) {
        const nasc = new Date(usuario.data_nascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
          idade--;
        }
        eMenorDe13 = idade < 13;
      } else {
        eMenorDe13 = FAIXAS_INFANTIL.includes(userFaixa) && !FAIXAS_ADULTO.includes(userFaixa);
      }

      const tipoGrade = eMenorDe13 ? 'infantil' : 'adulto';
      setGradeTipo(tipoGrade);

      const listaValida = eMenorDe13 ? FAIXAS_INFANTIL : FAIXAS_ADULTO;
      if (listaValida.includes(userFaixa)) {
        setFaixaSelecionada(userFaixa);
      } else if (userFaixa === 'Preta') {
        setFaixaSelecionada('Preta I');
      } else if (userFaixa.includes('/')) {
        setFaixaSelecionada(userFaixa);
      } else {
        setFaixaSelecionada(listaValida[0]);
      }
    }
  }, [usuario]);

  const podeMudarSelecao = isAdmin || isFilial;
  const faixasDisponiveis = gradeTipo === 'adulto' ? FAIXAS_ADULTO : FAIXAS_INFANTIL;
  const curriculoFonte = gradeTipo === 'adulto' ? CURRICULO_ADULTO : CURRICULO_INFANTIL;
  
  let dadosGrade: CurriculoFaixa | undefined = curriculoFonte[faixaSelecionada];

  if (!dadosGrade) {
    if (faixaSelecionada === 'Preta') {
      dadosGrade = curriculoFonte['Preta I'];
    } else if (faixaSelecionada === 'Preta/Branca') {
      dadosGrade = curriculoFonte['Preta I'] || CURRICULO_INFANTIL['Marrom II'];
    } else if (faixaSelecionada.includes('/')) {
      const partes = faixaSelecionada.split('/');
      dadosGrade = curriculoFonte[partes[1]] || curriculoFonte[partes[0]] || CURRICULO_INFANTIL[faixaSelecionada] || curriculoFonte['Amarela'];
    }
  }

  const beltStyle = obterEstiloFaixa(faixaSelecionada);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#CE1126] selection:text-white">
      {/* Cabeçalho */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#CE1126] mb-1">
              <BookOpen size={20} />
              <span className="text-xs uppercase font-extrabold tracking-widest block">Ensino & Exames</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grade Curricular de Graduação</h1>
            <p className="text-slate-500 text-xs mt-0.5">Requisitos e programas de exame oficiais da Federação Baiana de Karate-do Esportivo</p>
          </div>

          {/* Seletores (Visível para Admin/Sensei) */}
          {podeMudarSelecao && (
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => {
                    setGradeTipo('adulto');
                    setFaixaSelecionada(FAIXAS_ADULTO[0]);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    gradeTipo === 'adulto' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Adulto (13+)
                </button>
                <button
                  onClick={() => {
                    setGradeTipo('infantil');
                    setFaixaSelecionada(FAIXAS_INFANTIL[0]);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    gradeTipo === 'infantil' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Infantil (Até 12)
                </button>
              </div>

              <select
                value={faixaSelecionada}
                onChange={(e) => setFaixaSelecionada(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none cursor-pointer shadow-xs focus:border-[#002B7F]"
              >
                {faixasDisponiveis.map((f) => (
                  <option key={f} value={f}>
                    Faixa {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!podeMudarSelecao && (
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-xs">
              <User size={18} className="text-[#002B7F]" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Sua Graduação Atual</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 border ${beltStyle.border} ${beltStyle.bg}`} />
                  <span className="text-xs font-black text-slate-900">Faixa {faixaSelecionada}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Painel Lateral de Informações Rápidas */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
            <p className="text-[10px] font-extrabold text-[#CE1126] uppercase tracking-widest mb-3">Graduação Alvo</p>
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-6 h-6 rounded-full shrink-0 border-2 ${beltStyle.border} ${beltStyle.bg}`} />
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Faixa {faixaSelecionada}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{dadosGrade?.kyuDan || 'Kyu'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-[#002B7F] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Tempo de Carência Mínimo</p>
                  <p className="text-xs font-bold text-slate-800">{dadosGrade?.carencia || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={16} className="text-[#002B7F] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Chancela Oficial</p>
                  <p className="text-xs font-bold text-slate-800">FBKE • CBK • IOGKF</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex gap-2.5 items-start">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                {isAtleta ? (
                  <p>
                    Esta grade apresenta as técnicas mínimas exigidas pela FBKE para o exame da sua faixa atual. Treine regularmente sob a supervisão do seu sensei para estar apto à graduação.
                  </p>
                ) : (
                  <p>
                    Visualização administrativa da grade curricular. Selecione a faixa e a categoria de idade desejada no topo direito para consultar os critérios oficiais de graduação.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detalhamento das Matérias */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {dadosGrade ? (
            <div className="space-y-6">
              {/* KIHON */}
              {dadosGrade.kihon && dadosGrade.kihon.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
                    <Swords size={18} className="text-[#CE1126]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Kihon (Técnicas Básicas)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kihon.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[#002B7F] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-slate-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KUMITE */}
              {dadosGrade.kumite && dadosGrade.kumite.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
                    <Swords size={18} className="text-[#CE1126]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Kumite (Combates)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kumite.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[#002B7F] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-slate-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KATA */}
              {dadosGrade.kata && dadosGrade.kata.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
                    <Swords size={18} className="text-[#CE1126]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Kata (Formas)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosGrade.kata.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[#002B7F] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.tecnica}</p>
                          {item.detalhe && <p className="text-[10px] text-slate-500 mt-0.5">{item.detalhe}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
              <p className="text-xs text-slate-500">Selecione uma faixa para visualizar a grade curricular.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
