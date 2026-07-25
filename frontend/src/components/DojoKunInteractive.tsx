'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Flame, Shield, BookOpen, Award, Volume2, Printer, Compass as CompassIcon, Award as AwardIcon } from 'lucide-react';

const preceitos = [
  {
    numero: 'I',
    kanji: '礼儀を重んずること',
    jp: 'Hitotsu — Reigi o omonzuru koto',
    pt: 'Respeitar a etiqueta e a cortesia acima de tudo',
    phonetic: 'Hee-toh-tsoo — Ray-ghee oh oh-mohn-zoo-roo koh-toh',
    icon: Compass,
    philosophy: 'O Karatê começa e termina com respeito (Rei). Este princípio nos ensina que a cortesia e a humildade não são fraquezas, mas sim as maiores forças de um praticante. A etiqueta no Dojo serve para polir o nosso ego e nos conectar com a linhagem espiritual dos mestres.',
    dojo: 'Cumprimentar (Rei) ao entrar e sair do dojo, respeitar todos os parceiros de treino (independentemente da graduação), ouvir atentamente as correções dos instrutores e manter o dogi (uniforme) sempre limpo e alinhado.',
    life: 'Tratar todas as pessoas com empatia, cortesia e dignidade no ambiente de trabalho, familiar e social. Agir com integridade e retidão ética mesmo quando não houver ninguém observando.'
  },
  {
    numero: 'II',
    kanji: '勇気を養うこと',
    jp: 'Hitotsu — Yuki o yashinau koto',
    pt: 'Cultivar a coragem e a força interior',
    phonetic: 'Hee-toh-tsoo — Yoo-kee oh yah-shee-nah-oo koh-toh',
    icon: Flame,
    philosophy: 'A verdadeira coragem (Yuki) não reside na ausência de medo, mas na determinação inabalável de agir corretamente apesar dele. Ela se desenvolve ao enfrentarmos nossos limites físicos e mentais no tatame, expandindo nossos horizontes pessoais.',
    dojo: 'Não recuar perante treinos intensivos, aceitar os desafios de kumite (combate livre) com oponentes mais graduados e manter a postura focada mesmo diante de fadiga extrema.',
    life: 'Tomar decisões difíceis porém éticas, defender causas justas e os mais vulneráveis, admitir honestamente os próprios erros e ter a audácia de persistir em seus projetos contra a correnteza das dificuldades.'
  },
  {
    numero: 'III',
    kanji: '伝統空手を守り日々の鍛錬を怠らざること',
    jp: 'Hitotsu — Dento karate o mamori hibi no tanren o okotarazu koto',
    pt: 'Proteger o Karatê tradicional e praticar diariamente sem falhar',
    phonetic: 'Hee-toh-tsoo — Den-toh kah-rah-teh oh mah-moh-ree hee-bee noh tahn-ren oh oh-koh-tah-rah-zoo koh-toh',
    icon: Shield,
    philosophy: 'O treinamento cotidiano e rigoroso (Tanren) é o fogo lento que purifica e forja o caráter do praticante. O Karatê tradicional não é um esporte de resultados efêmeros, mas uma arte de aprimoramento contínuo. Preservar a tradição significa treinar com máxima intenção e respeito às técnicas fundamentais.',
    dojo: 'Executar cada repetição de kihon ou kata como se fosse única, buscar a precisão milimétrica dos ângulos e posturas, e enxergar na repetição a chave secreta para a excelência motora e mental.',
    life: 'Aplicar consistência e paciência na busca de metas pessoais e profissionais de longo prazo, entendendo que grandes conquistas são construídas através de pequenos esforços diários contínuos.'
  },
  {
    numero: 'IV',
    kanji: '心身を練磨し剛柔流空手の真髄を極めること',
    jp: 'Hitotsu — Shinshin o renma shi Goju-Ryu Karate no shinzui o kiwameru koto',
    pt: 'Treinar o corpo e a mente para alcançar a essência do Goju-Ryu',
    phonetic: 'Hee-toh-tsoo — Sheen-sheen oh ren-mah shee goh-joo ryoo kah-rah-teh noh sheen-zoo-ee oh kee-wah-meh-roo koh-toh',
    icon: BookOpen,
    philosophy: 'Goju-Ryu traduz-se como o caminho do "Forte e Suave". A sua essência (Shinzui) repousa em harmonizar o impacto firme e estruturado (Go) com a esquiva fluida e adaptável (Ju). A unificação do desenvolvimento físico e mental (Shinshin) nos ensina a fluir entre essas forças sem perder o eixo.',
    dojo: 'Dominar a técnica de contração muscular no Sanchin com a respiração profunda (Ibuki) e a flexibilidade circular do Tensho. Saber dosar a força de impacto com a suavidade na defesa.',
    life: 'Desenvolver resiliência para ser firme e assertivo nos momentos que exigem firmeza, mas mantendo-se flexível, paciente e acolhedor nas relações humanas. Equilibrar mente racional e intuição diante de crises.'
  },
  {
    numero: 'V',
    kanji: '不撓不屈の精神を養うこと',
    jp: 'Hitotsu — Futo fukutsu no seishin o yashinau koto',
    pt: 'Nutrir um espírito indomável e de perseverança eterna',
    phonetic: 'Hee-toh-tsoo — Foo-toh foo-koo-tsoo noh say-sheen oh yah-shee-nah-oo koh-toh',
    icon: Award,
    philosophy: 'Futo Fukutsu simboliza o princípio oriental da resiliência máxima: cair sete vezes, levantar-se oito. O espírito indomável garante que nenhuma adversidade material, cansaço ou dúvida possa desviar o karateca de sua busca pelo autoaperfeiçoamento (Do).',
    dojo: 'Persistir no treino mesmo quando os movimentos parecem difíceis de dominar, aceitar com humildade a necessidade de repetir exames de faixa e aprender com as derrotas.',
    life: 'Encarar crises de saúde, perdas emocionais e revezes financeiros com paciência ativa e esperança. Manter seus princípios éticos intocados perante qualquer provação externa.'
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function DojoKunInteractive() {
  const [activeTab, setActiveTab] = useState(0);
  const [subTab, setSubTab] = useState<'filosofia' | 'dojo' | 'vida'>('filosofia');
  const [isPlaying, setIsPlaying] = useState(false);
  const [preceitosList, setPreceitosList] = useState(preceitos);
  const [preambulo, setPreambulo] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.config?.dojo_kun?.preambulo) {
            setPreambulo(data.config.dojo_kun.preambulo);
          }
          if (data.config?.dojo_kun?.preceitos && data.config.dojo_kun.preceitos.length === 5) {
            const iconMap = [Compass, Flame, Shield, BookOpen, Award];
            const listComIcones = data.config.dojo_kun.preceitos.map((p: any, idx: number) => ({
              ...p,
              icon: iconMap[idx] || Award
            }));
            setPreceitosList(listComIcones);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar Dojo Kun configurável:", err);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  const currentPrecept = preceitosList[activeTab] || preceitos[activeTab];
  const Icon = currentPrecept.icon || Award;

  const handlePlayAudio = () => {
    if (typeof window === 'undefined') return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(true);

      // Pronuncia "Hitotsu" (一) antes do preceito, mantendo a tradição do Dojo
      const textToSpeak = `一、${currentPrecept.kanji}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8; // Velocidade tradicional mais pausada

      // Tenta selecionar uma voz japonesa ja-JP nativa
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.startsWith('ja') || v.lang === 'ja-JP');
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback de simulação visual se a API de síntese de voz não for suportada
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8 animate-fade-in print:bg-white print:text-black">
      
      {/* Barra de Ações Rápidas (não imprimível) */}
      <div className="flex justify-end gap-3 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 text-xs font-cinzel text-zinc-400 hover:text-primary hover:border-primary/40 bg-zinc-900/40 border border-zinc-800 rounded-xl transition duration-300 cursor-pointer"
        >
          <Printer size={13} />
          Imprimir Dojo Kun
        </button>
      </div>

      {preambulo && (
        <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-2xl print:hidden max-w-4xl">
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
            {preambulo}
          </p>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Lado Esquerdo: O Menu de Placas Tradicionais (Nafuda) - 5 Colunas (no desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-4 print:hidden">
          <p className="text-zinc-500 font-cinzel text-[10px] uppercase tracking-widest pl-2">Selecione um Preceito</p>
          <div className="space-y-3">
            {preceitosList.map((p, idx) => {
              const PIcon = p.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(idx);
                    setIsPlaying(false);
                  }}
                  className={`w-full text-left relative group rounded-2xl border p-5 transition-all duration-500 flex items-center justify-between cursor-pointer overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-zinc-900 to-zinc-900/80 border-primary/40 shadow-lg shadow-red-950/10 translate-x-1.5' 
                      : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/20'
                  }`}
                >
                  {/* Gold/Red Line Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                    isActive ? 'bg-primary scale-y-100' : 'bg-zinc-800 scale-y-0 group-hover:scale-y-100 origin-center'
                  }`} />
                  
                  <div className="flex items-center gap-4">
                    {/* Badge Circular do Número */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-cinzel font-black transition-all duration-500 ${
                      isActive 
                        ? 'bg-primary/10 border-primary/40 text-primary scale-105' 
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 group-hover:text-zinc-300'
                    }`}>
                      {p.numero}
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-widest mb-0.5">
                        {p.jp.split(' — ')[0]}
                      </span>
                      <h4 className={`text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 font-cinzel ${
                        isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                      }`}>
                        {p.pt.length > 38 ? p.pt.substring(0, 38) + '...' : p.pt}
                      </h4>
                    </div>
                  </div>

                  <PIcon size={16} className={`transition-all duration-500 ${
                    isActive ? 'text-primary scale-110 rotate-12' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Display de Detalhes Premium (Makimono Scroll) - 7 Colunas */}
        <div className="lg:col-span-7 flex flex-col">
          
          <div className="flex-1 relative rounded-3xl border border-zinc-900 bg-zinc-950/50 p-6 sm:p-8 md:p-10 space-y-6 overflow-hidden flex flex-col justify-between backdrop-blur-md shadow-2xl">
            
            {/* Watermark do Selo Inkan em Vermelho no fundo */}
            <div className="absolute right-6 top-6 opacity-[0.03] pointer-events-none select-none transition-transform duration-1000 rotate-12 group-hover:rotate-0">
              <svg width="220" height="220" viewBox="0 0 100 100" className="text-primary">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="50" y="44" textAnchor="middle" dominantBaseline="middle" className="font-cinzel text-[26px] font-black" fill="currentColor">剛</text>
                <text x="50" y="66" textAnchor="middle" dominantBaseline="middle" className="font-cinzel text-[26px] font-black" fill="currentColor">柔</text>
              </svg>
            </div>

            {/* Glowing background blob */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="space-y-6">
              
              {/* Cabeçalho do Preceito Selecionado */}
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-6 border-b border-zinc-900/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-cinzel text-[10px] font-bold tracking-widest uppercase">
                      Preceito {currentPrecept.numero}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      一 (Hitotsu)
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide leading-tight pt-1">
                    {currentPrecept.pt}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 italic font-medium pt-1">
                    {currentPrecept.jp}
                  </p>
                </div>

                {/* Caligrafia Japonesa Vertical (Incrível Wow Factor) */}
                <div className="shrink-0 flex items-center justify-center md:border-l md:border-zinc-900 md:pl-6 pt-4 md:pt-0">
                  <div className="flex flex-col items-center justify-center bg-zinc-900/20 border border-zinc-900 rounded-2xl px-4 py-3 min-w-[70px] hover:border-primary/20 transition duration-300">
                    <span className="text-xs text-primary font-cinzel tracking-widest uppercase font-bold text-[9px] mb-2">Kanji</span>
                    <div 
                      className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-300 to-zinc-600 font-serif leading-none tracking-widest py-1 select-all"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      {currentPrecept.kanji}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reprodutor de Pronúncia Japonesa (Simulação) */}
              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest block">Guia de Pronúncia Fonética</span>
                  <p className="text-xs font-mono text-zinc-300 tracking-wide font-medium bg-zinc-950/40 p-2 rounded-lg border border-zinc-950">
                    "{currentPrecept.phonetic}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Wave Animation */}
                  {isPlaying && (
                    <div className="flex items-center gap-1.5 px-3">
                      {[0.4, 0.9, 0.6, 1.2, 0.5, 0.8].map((val, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary rounded-full animate-bounce"
                          style={{
                            height: '16px',
                            animationDuration: `${0.4 + (i * 0.1)}s`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-cinzel uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                      isPlaying
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-white border border-primary/10 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-102'
                    }`}
                  >
                    <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} />
                    {isPlaying ? 'Ouvindo...' : 'Pronunciar'}
                  </button>
                </div>
              </div>

              {/* Tabs Internas para Filosofia, Dojo e Vida */}
              <div className="space-y-4">
                <div className="flex gap-2 border-b border-zinc-900/60 pb-px">
                  {[
                    { key: 'filosofia', label: 'Filosofia', icon: BookOpen },
                    { key: 'dojo', label: 'Aplicação no Dojo', icon: Shield },
                    { key: 'vida', label: 'Aplicação na Vida', icon: CompassIcon }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isTabActive = subTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setSubTab(tab.key as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-cinzel uppercase tracking-widest border-b-2 transition-all duration-300 cursor-pointer ${
                          isTabActive
                            ? 'border-primary text-primary font-bold bg-primary/[0.02]'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <TabIcon size={12} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Conteúdo da Tab Ativa */}
                <div className="min-h-[140px] text-zinc-350 text-sm leading-relaxed p-2 font-sans transition-all duration-300 animate-slide-in">
                  {subTab === 'filosofia' && (
                    <div className="space-y-2">
                      <p className="font-semibold text-white font-cinzel text-xs uppercase tracking-widest text-zinc-400">O Sentido Filosófico</p>
                      <p>{currentPrecept.philosophy}</p>
                    </div>
                  )}
                  {subTab === 'dojo' && (
                    <div className="space-y-2">
                      <p className="font-semibold text-white font-cinzel text-xs uppercase tracking-widest text-zinc-400">Dentro do Dojo (Prática)</p>
                      <p>{currentPrecept.dojo}</p>
                    </div>
                  )}
                  {subTab === 'vida' && (
                    <div className="space-y-2">
                      <p className="font-semibold text-white font-cinzel text-xs uppercase tracking-widest text-zinc-400">Fora do Dojo (Cotidiano)</p>
                      <p>{currentPrecept.life}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Rodapé Interno do Painel */}
            <div className="pt-6 border-t border-zinc-900/60 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center shrink-0">
                  <span className="font-cinzel text-primary text-[10px] font-bold">I</span>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">Linhagem de Okinawa</span>
                  <span className="text-xs text-zinc-400 font-cinzel">Mestre Chojun Miyagi</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 italic text-right sm:max-w-xs">
                "Karate-do wa rei ni hajimari, rei ni owaru koto o wasureruna." (Não esqueça que o Karatê começa e termina com respeito).
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Seção Imprimível - Apenas visível em mídia print */}
      <div className="hidden print:block space-y-8 p-12 max-w-4xl mx-auto">
        <div className="text-center space-y-3 pb-8 border-b-2 border-black">
          <h1 className="text-4xl font-bold font-serif uppercase tracking-widest">DOJO KUN — 道場訓</h1>
          <h2 className="text-lg font-serif tracking-widest uppercase">Goju-Ryu Karate-Do</h2>
          <p className="text-sm italic">Associação Goju-Ryu Karate Kai</p>
        </div>
        
        <div className="space-y-6 pt-6">
          {preceitosList.map((p, idx) => (
            <div key={idx} className="space-y-1 page-break-inside-avoid">
              <h3 className="text-lg font-bold">
                {p.numero}. {p.pt}
              </h3>
              <p className="text-sm font-serif italic text-zinc-700 pl-4">{p.jp}</p>
              <p className="text-sm text-zinc-800 pl-4 pt-1">{p.philosophy}</p>
            </div>
          ))}
        </div>

        <div className="pt-12 text-center text-xs border-t border-zinc-400 mt-12">
          <p>© Goju-Ryu Karate Kai — Filiada à IOGKF Brasil</p>
        </div>
      </div>

    </div>
  );
}
