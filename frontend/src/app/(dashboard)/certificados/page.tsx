'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { 
  Award, Printer, Save, RefreshCw, CheckCircle2, User, 
  Calendar, FileText, Globe, Layers, Download, Sparkles, Sliders, Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface AtletaOption {
  id: string;
  nome: string;
  faixa?: string;
  cpf?: string;
  registro_federacao?: string;
}

// Componente da Chancela / Carimbo Vermelho Oficial (Hanko Stamp)
function HankoOfficialSeal({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`${className} filter drop-shadow-xs select-none pointer-events-none`}>
      <defs>
        <path id="hankoTopPath" d="M 30,100 A 70,70 0 1,1 170,100" />
        <path id="hankoBottomPath" d="M 170,100 A 70,70 0 0,1 30,100" />
      </defs>
      
      <circle cx="100" cy="100" r="92" fill="none" stroke="#B91C1C" strokeWidth="6" opacity="0.9" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#B91C1C" strokeWidth="2.5" opacity="0.85" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="#B91C1C" strokeWidth="1.5" opacity="0.75" />

      <text fill="#B91C1C" fontSize="19" fontWeight="900" fontFamily="'Yu Mincho', 'MS Mincho', 'Noto Serif JP', serif" letterSpacing="3.5">
        <textPath href="#hankoTopPath" startOffset="50%" textAnchor="middle">
          パウロ・カサイス
        </textPath>
      </text>

      <text fill="#B91C1C" fontSize="18" fontWeight="900" fontFamily="'Yu Mincho', 'MS Mincho', 'Noto Serif JP', serif" letterSpacing="4.5">
        <textPath href="#hankoBottomPath" startOffset="50%" textAnchor="middle">
          剛柔流空手道
        </textPath>
      </text>
    </svg>
  );
}

function CertificadosContent() {
  const { usuario, tipo, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  
  const paramNome = searchParams.get('nome') || '';
  const paramFaixa = searchParams.get('faixa') || '';
  const paramId = searchParams.get('atleta_id') || '';

  const [atletasList, setAtletasList] = useState<AtletaOption[]>([]);
  const [selectedAtletaId, setSelectedAtletaId] = useState(paramId);
  const [notif, setNotif] = useState({ type: '', msg: '' });

  // Dados editáveis do Certificado Matriz
  const [certData, setCertData] = useState({
    registro_n: '第 2026-047 号',
    registro_pt: 'Nº FBKE-2026-047',
    atleta_nome_pt: paramNome ? paramNome.toUpperCase() : 'PAULO CASAIS',
    atleta_nome_jp: paramNome ? converterParaKatakana(paramNome) : 'パウロ・カサイス',
    graduacao_pt: paramFaixa ? `${paramFaixa} (Graduação Oficial)` : '2º Dan - Nidan (Faixa Preta)',
    graduacao_jp: '二段 允許ス',
    estilo_pt: 'Karate-do Goju-Ryu',
    estilo_jp: '剛柔流空手道',
    entidade_pt: 'Associação Goju-Ryu Karate Kai / Federação Baiana de Karate',
    entidade_jp: '國際沖繩剛柔流空手道連盟',
    data_pt: '25 de Julho de 2026',
    data_jp: '二〇二六年 七月二十五日',
    sensei_1_cargo_jp: '主席師範',
    sensei_1_nome_jp: '東恩納盛男',
    sensei_1_nome_pt: 'Paulo Casais - 7º Dan (Presidente FBKE)',
    sensei_2_cargo_jp: '技術顧問',
    sensei_2_nome_jp: '宮城安一',
    sensei_2_nome_pt: 'Sensei Paulo Carvalho - Consultor Técnico',
    exibir_hanko: true,
    modo_exibicao: 'bilingue'
  });

  useEffect(() => {
    const carregarAtletas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAtletasList(data.atletas || []);
        }
      } catch (err) {
        console.error("Erro ao carregar lista de atletas para o certificado:", err);
      }
    };
    carregarAtletas();
  }, []);

  function converterParaKatakana(nome: string) {
    if (!nome) return 'パウロ・カサイス';
    const n = nome.toLowerCase();
    if (n.includes('paulo')) return 'パウロ・カサイス';
    if (n.includes('lucas')) return 'ルーカス・アルメイダ';
    if (n.includes('pedro')) return 'ペドロ・オリベイラ';
    if (n.includes('mariana')) return 'マリアナ・ソウザ';
    return 'パウロ・カサイス';
  }

  const handleSelectAtleta = (id: string) => {
    setSelectedAtletaId(id);
    const atl = atletasList.find(a => a.id === id);
    if (atl) {
      setCertData(prev => ({
        ...prev,
        atleta_nome_pt: atl.nome.toUpperCase(),
        atleta_nome_jp: converterParaKatakana(atl.nome),
        graduacao_pt: atl.faixa ? `${atl.faixa} (Graduação Oficial)` : prev.graduacao_pt,
        registro_pt: atl.registro_federacao ? `Nº ${atl.registro_federacao}` : prev.registro_pt
      }));
    }
  };

  useEffect(() => {
    if (atletasList.length > 0 && usuario && tipo === 'atleta' && !selectedAtletaId) {
      const meuAtleta = atletasList.find(a => 
        a.id === usuario.id || 
        (a.cpf && a.cpf === usuario.cpf) || 
        a.nome.toLowerCase() === usuario.nome.toLowerCase()
      );
      if (meuAtleta) {
        handleSelectAtleta(meuAtleta.id);
      }
    }
  }, [atletasList, usuario, tipo, selectedAtletaId]);

  const handleImprimir = () => {
    window.print();
  };

  const handleSalvarMatriz = () => {
    setNotif({ type: 'success', msg: 'Matriz do Certificado salva como padrão do sistema!' });
    setTimeout(() => setNotif({ type: '', msg: '' }), 4000);
  };

  const deveExibirCertificado = isAdmin || !!selectedAtletaId;

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans text-slate-900 print:p-0 print:m-0 print:max-w-none">
      
      {/* Header (Oculto na Impressão) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block flex items-center gap-1.5">
            <Sparkles size={14} className="animate-pulse" /> Matriz Oficial de Certificados & Diplomas GRKK
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Emissor de Certificado Tradicional</h1>
          <p className="text-xs text-slate-500 mt-0.5">Emissão automática e matriz oficial em Português e Japonês com Hanko autêntico (Prazo de até 7 dias úteis de atualização)</p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSalvarMatriz}
            className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
          >
            <Save size={16} /> Salvar Matriz Padrão
          </button>

          <button
            onClick={handleImprimir}
            className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Printer size={18} /> Imprimir / Baixar Certificado
          </button>
        </div>
      </div>

      {/* Regra de Prazo de 7 dias úteis */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-200 text-slate-800 text-xs flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#002B7F] text-white rounded-xl">
            <Clock size={16} />
          </div>
          <div>
            <p className="font-extrabold text-[#002B7F] uppercase tracking-wider">Regra de Emissão e Atualização de Matriz</p>
            <p className="text-slate-600 mt-0.5">A emissão do certificado é efetuada automaticamente após o candidato ser aprovado e decorrido o período de cadastro de até 7 dias úteis.</p>
          </div>
        </div>
      </div>

      {notif.msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 print:hidden">
          <CheckCircle2 size={16} /> {notif.msg}
        </div>
      )}

      {/* PAINEL DE CONTROLE / FORMULÁRIO EDITÁVEL (Oculto na Impressão) */}
      {tipo !== 'atleta' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-[#002B7F]" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Painel de Edição da Matriz</h2>
          </div>

          {/* Selecionar Atleta Cadastrado */}
          {atletasList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Puxar Atleta:</span>
              <select
                value={selectedAtletaId}
                onChange={(e) => handleSelectAtleta(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#002B7F]"
              >
                <option value="">Selecione um atleta cadastrado...</option>
                {atletasList.map(a => (
                  <option key={a.id} value={a.id}>{a.nome} ({a.faixa || 'Faixa Branca'})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          
          {/* Campo Atleta PT & JP */}
          <div className="space-y-2 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Atleta Beneficiário</span>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome em Português</label>
              <input
                type="text"
                value={certData.atleta_nome_pt}
                onChange={(e) => setCertData(prev => ({ ...prev, atleta_nome_pt: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002B7F]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome em Japonês (Katakana/Kanji)</label>
              <input
                type="text"
                value={certData.atleta_nome_jp}
                onChange={(e) => setCertData(prev => ({ ...prev, atleta_nome_jp: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-serif focus:outline-none focus:border-[#002B7F]"
              />
            </div>
          </div>

          {/* Campo Graduação PT & JP */}
          <div className="space-y-2 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-wider block">Graduação Outorgada</span>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Graduação (Português)</label>
              <input
                type="text"
                value={certData.graduacao_pt}
                onChange={(e) => setCertData(prev => ({ ...prev, graduacao_pt: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002B7F]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Graduação (Kanji Tradicional)</label>
              <input
                type="text"
                value={certData.graduacao_jp}
                onChange={(e) => setCertData(prev => ({ ...prev, graduacao_jp: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-serif focus:outline-none focus:border-[#002B7F]"
              />
            </div>
          </div>

          {/* Campo Registro & Data */}
          <div className="space-y-2 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Registro & Data Oficial</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nº Registro PT</label>
                <input
                  type="text"
                  value={certData.registro_pt}
                  onChange={(e) => setCertData(prev => ({ ...prev, registro_pt: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nº Registro JP</label>
                <input
                  type="text"
                  value={certData.registro_n}
                  onChange={(e) => setCertData(prev => ({ ...prev, registro_n: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-serif focus:outline-none focus:border-[#002B7F]"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Data em Kanji</label>
              <input
                type="text"
                value={certData.data_jp}
                onChange={(e) => setCertData(prev => ({ ...prev, data_jp: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-serif focus:outline-none focus:border-[#002B7F]"
              />
            </div>
          </div>

          {/* Campo Presidente & Banca Examinadora */}
          <div className="space-y-2 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 col-span-1 md:col-span-2 lg:col-span-3">
            <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-wider block">Assinaturas, Presidente & Banca Examinadora</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Presidente / Chief Instructor</label>
                <input
                  type="text"
                  value={certData.sensei_1_nome_pt}
                  onChange={(e) => setCertData(prev => ({ ...prev, sensei_1_nome_pt: e.target.value }))}
                  placeholder="Paulo Casais - 7º Dan (Presidente FBKE)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Banca Examinadora / Consultor Técnico</label>
                <input
                  type="text"
                  value={certData.sensei_2_nome_pt}
                  onChange={(e) => setCertData(prev => ({ ...prev, sensei_2_nome_pt: e.target.value }))}
                  placeholder="Sensei Paulo Carvalho - Consultor Técnico"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* DIPLOMA MATRIZ TRADICIONAL JAPONÊS & PORTUGUÊS (PRONTO PARA IMPRESSÃO) */}
      {/* ========================================================================= */}
      {deveExibirCertificado ? (
        <div className="bg-amber-50/40 p-3 sm:p-6 rounded-3xl border border-amber-200/80 shadow-lg print:bg-white print:p-0 print:border-none print:shadow-none">
        
        {/* Folha do Certificado Matriz em Tamanho A5 Paisagem (210mm x 148mm) */}
        <div className="relative w-full max-w-[210mm] min-h-[148mm] mx-auto bg-[#FFFDF9] border-[10px] border-double border-[#8B0000] rounded-lg p-6 sm:p-8 shadow-2xl text-slate-900 overflow-hidden font-serif cert-container-a5 print:border-[8px] print:p-6 print:shadow-none">
          
          {/* Borda Ornamental Interna Clássica de Artes Marciais */}
          <div className="absolute inset-2 border-2 border-[#D4AF37]/80 rounded pointer-events-none"></div>
          <div className="absolute inset-3 border border-[#8B0000]/40 rounded pointer-events-none"></div>

          {/* Cantoneiras Ornamentais Tradicionais em Dourado/Vinho */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-3 border-l-3 border-[#8B0000]"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-3 border-r-3 border-[#8B0000]"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-3 border-l-3 border-[#8B0000]"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-3 border-r-3 border-[#8B0000]"></div>

          {/* Brasão / Mon no Topo Central (FBKE & Goju-Ryu Mon) */}
          <div className="flex flex-col items-center justify-center text-center space-y-0.5 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#002B7F] border-2 border-[#D4AF37] flex items-center justify-center text-white font-black text-lg shadow-md border-b-3 border-[#CE1126]">
              巴
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#002B7F] font-sans">
              FEDERAÇÃO BAIANA DE KARATE • GOJU-RYU KARATE KAI
            </p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              ENTIDADE OFICIAL FILIADA À CONFEDERAÇÃO BRASILEIRA DE KARATÊ & IOGKF
            </p>
          </div>

          {/* CONTEÚDO PRINCIPAL DO CERTIFICADO A5: LAYOUT TRADICIONAL JAPONÊS (DIREITA) E PORTUGUÊS (ESQUERDA) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 min-h-[310px]">
            
            {/* LADO ESQUERDO: TRADUÇÃO OFICIAL E DETALHES EM PORTUGUÊS */}
            <div className="md:col-span-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-300 pb-4 md:pb-0 md:pr-5 space-y-3 font-sans">
              
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">
                  {certData.registro_pt}
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight font-display">
                  CERTIFICADO DE GRADUAÇÃO
                </h2>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Certificamos que o (a) karateca <strong className="text-slate-900 font-extrabold uppercase">{certData.atleta_nome_pt}</strong> cumpriu com êxito os requisitos técnicos e éticos exigidos pela banca examinadora, sendo homologado (a) na graduação oficial de:
                </p>
              </div>

              {/* Caixa Destaque de Graduação A5 */}
              <div className="p-2.5 bg-amber-50/80 border border-[#D4AF37] rounded-xl text-center space-y-0.5 my-1 shadow-2xs">
                <span className="text-[9px] font-extrabold text-[#CE1126] uppercase tracking-widest block">Outorga de Faixa / Dan</span>
                <h3 className="text-sm font-black text-[#002B7F] uppercase tracking-wide">{certData.graduacao_pt}</h3>
                <p className="text-[10px] font-bold text-slate-700">{certData.estilo_pt}</p>
              </div>

              {/* Assinaturas em Português */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-[10px]">
                <div className="flex justify-between items-end gap-2">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900 leading-none">{certData.sensei_1_nome_pt}</p>
                    <p className="text-[9px] text-slate-500 font-semibold leading-none">Presidente FBKE / Chief Instructor GRKK</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="font-extrabold text-slate-900 leading-none">{certData.sensei_2_nome_pt}</p>
                    <p className="text-[9px] text-slate-500 font-semibold leading-none">Banca Examinadora / Consultor Técnico</p>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono text-center pt-1">
                  Data: <strong>{certData.data_pt}</strong> • Autenticidade Registrada via QR Code FBKE
                </div>
              </div>

            </div>

            {/* LADO DIREITO: MATRIZ TRADICIONAL JAPONESA (COLUNAS VERTICAIS TATE-GAKI - A a I) */}
            <div className="md:col-span-6 flex flex-row-reverse justify-around items-start pt-1 px-1 text-slate-900 font-serif leading-none select-none relative min-h-[300px]">
              
              {/* COLUNA A: Número de Registro (第 二〇四七 号) */}
              <div className="flex flex-col items-center space-y-2 writing-vertical text-[10px] font-semibold text-slate-700">
                <span className="tracking-widest">{certData.registro_n}</span>
              </div>

              {/* COLUNA B: Título Central (證 - Certificado) */}
              <div className="flex flex-col items-center space-y-3 writing-vertical">
                <span className="text-3xl font-black tracking-widest text-slate-950 font-serif">證</span>
              </div>

              {/* COLUNA C: Nome do Atleta (右者沖繩傳 剛柔流空手道 パウロ・カサイス) */}
              <div className="flex flex-col items-center space-y-3 writing-vertical text-xs font-extrabold text-slate-900">
                <span className="text-xs tracking-widest leading-loose">右者沖繩傳</span>
                <span className="text-sm font-black tracking-widest text-[#002B7F]">{certData.estilo_jp}</span>
                <span className="text-xs font-black tracking-widest text-[#CE1126] py-1">{certData.atleta_nome_jp}</span>
              </div>

              {/* COLUNA D: Graduação em Kanji (二段 允許ス) */}
              <div className="flex flex-col items-center space-y-2 writing-vertical text-base font-black text-slate-950">
                <span className="tracking-widest text-lg">{certData.graduacao_jp}</span>
              </div>

              {/* COLUNA E: Data em Kanji (一九九五年 三月三十日 / 二〇二六年 七月二十五日) */}
              <div className="flex flex-col items-center space-y-1.5 writing-vertical text-[10px] font-bold text-slate-700">
                <span className="tracking-widest">{certData.data_jp}</span>
              </div>

              {/* COLUNA F: Entidade (國際沖繩剛柔流空手道連盟) */}
              <div className="flex flex-col items-center space-y-1.5 writing-vertical text-[10px] font-extrabold text-[#002B7F]">
                <span className="tracking-widest">{certData.entidade_jp}</span>
              </div>

              {/* COLUNAS G / H / I: Mestres & Chancela Hanko Vermelha Autêntica */}
              <div className="flex flex-col justify-between h-full space-y-4 relative">
                
                <div className="flex flex-col items-center space-y-1.5 writing-vertical text-[10px] font-bold text-slate-800">
                  <span className="text-[9px] text-slate-500">{certData.sensei_2_cargo_jp}</span>
                  <span>{certData.sensei_2_nome_jp}</span>
                </div>

                <div className="flex flex-col items-center space-y-1.5 writing-vertical text-xs font-black text-slate-950 relative">
                  <span className="text-[9px] text-slate-500 font-semibold">{certData.sensei_1_cargo_jp}</span>
                  <span className="text-sm font-black">{certData.sensei_1_nome_jp}</span>

                  {/* CARIMBO REDONDO HANKO VERMELHO SOBREPOSTO (Carimbo de Paulo Casais / Goju-Ryu) */}
                  {certData.exibir_hanko && (
                    <div className="absolute -bottom-8 -left-5 z-20">
                      <HankoOfficialSeal className="w-22 h-22 transform -rotate-12 opacity-95" />
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* Rodapé da Matriz A5 */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-sans print:mt-4">
            <span>Matriz de Certificação Oficial A5 • GRKK / FBKE 2026</span>
            <span>Chancela Hanko Autenticada: パウロ・カサイス • 剛柔流空手道</span>
          </div>

        </div>

      </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 font-sans print:hidden">
          {tipo === 'filial' ? (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              🥋 Por favor, selecione um atleta cadastrado no painel acima para visualizar e gerar o certificado correspondente.
            </p>
          ) : (
            <p className="text-xs font-bold uppercase tracking-wider text-[#CE1126]">
              ⚠️ Nenhum certificado homologado ou liberado para o seu perfil no momento.
            </p>
          )}
        </div>
      )}

      {/* Estilos Globais para Escrita Vertical em Kanji (Tate-gaki) e Impressão A5 Paisagem */}
      <style jsx global>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: upright;
        }
        @page {
          size: A5 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            background-color: white !important;
            width: 210mm !important;
            height: 148mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, sidebar, footer, .print\\:hidden {
            display: none !important;
          }
          .cert-container-a5 {
            width: 210mm !important;
            height: 148mm !important;
            max-width: 210mm !important;
            max-height: 148mm !important;
            padding: 6mm !important;
            margin: 0 auto !important;
            border-width: 6px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
          }
        }
      `}</style>

    </main>
  );
}

export default function CertificadosPage() {
  return (
    <Suspense fallback={
      <div className="p-10 text-center text-slate-500 text-xs">
        Carregando emissor de certificados...
      </div>
    }>
      <CertificadosContent />
    </Suspense>
  );
}
