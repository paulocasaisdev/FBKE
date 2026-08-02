"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wifi, WifiOff, Volume2, Award, ShieldAlert } from "lucide-react";

function ScoreboardDisplayContent() {
  const searchParams = useSearchParams();
  const defaultIp = searchParams.get("ip") || "localhost";

  // IP do servidor websocket
  const [wsIp, setWsIp] = useState(defaultIp);
  const [connected, setConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  // Estado da luta sincronizado
  const [state, setState] = useState({
    match_id: null,
    category_name: "Aguardando Conexão...",
    athlete_red: "Aka",
    athlete_blue: "Ao",
    score_red: 0,
    score_blue: 0,
    senshu: null as 'red' | 'blue' | null,
    penalties_red: 0,
    penalties_blue: 0,
    timer_seconds: 180,
    timer_active: false,
    is_finished: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializa áudio no primeiro clique/interação para satisfazer política de autoplay do navegador
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Reproduz som de campainha de forma sintética (buzzer)
  const playBuzzer = (duration: number) => {
    initAudio();
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Erro ao emitir som:", e);
    }
  };

  // Conecta ao WebSocket do operador
  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsUrl = `ws://${wsIp}:8080`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setShowConfig(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "state_sync") {
            setState(data.state);
          } else if (data.type === "audio_signal") {
            const isLong = data.signal === "long";
            playBuzzer(isLong ? 1.5 : 0.5);
          }
        } catch (e) {
          console.error("Erro ao ler mensagem WS:", e);
        }
      };
    } catch (e) {
      setConnected(false);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsIp]);

  // Formatação do tempo MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Renderiza blocos de penalidade WKF (Chui 1, Chui 2, Chui 3, Hansoku)
  const renderPenalties = (level: number, align: 'left' | 'right') => {
    const blocks = [];
    // 4 níveis de penalidades: C1, C2, C3, H (Hansoku)
    for (let i = 1; i <= 4; i++) {
      const isActive = level >= i;
      const isHansoku = i === 4;
      
      let colorClass = "bg-slate-900 border-slate-800 text-slate-700";
      if (isActive) {
        colorClass = isHansoku 
          ? "bg-red-600 border-red-500 text-white font-black animate-pulse" 
          : "bg-amber-500 border-amber-400 text-slate-950 font-black";
      }

      blocks.push(
        <div
          key={i}
          className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl text-xs font-black uppercase transition-all shadow-md ${colorClass}`}
        >
          {isHansoku ? "H" : `C${i}`}
        </div>
      );
    }

    if (align === 'right') {
      return <div className="flex gap-2.5 justify-end">{blocks.reverse()}</div>;
    }
    return <div className="flex gap-2.5">{blocks}</div>;
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none overflow-hidden font-sans"
      onClick={initAudio}
    >
      {/* Barra Superior - Metadados e Conexão */}
      <div className="bg-slate-900/80 border-b border-slate-900 px-8 py-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase bg-[#002B7F] text-blue-200 border border-blue-900 px-3 py-1 rounded-lg tracking-widest">
            Placar Oficial Kumite
          </span>
          <h1 className="text-2xl font-black text-slate-100 mt-2 uppercase tracking-wide">
            {state.category_name}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {connected ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-900 px-4 py-2 rounded-xl text-emerald-400 text-xs font-black uppercase">
              <Wifi className="w-4 h-4 text-emerald-400" />
              Sincronizado
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-950/60 border border-red-900 px-4 py-2 rounded-xl text-red-400 text-xs font-black uppercase animate-pulse">
              <WifiOff className="w-4 h-4 text-red-400" />
              Sem Conexão
            </div>
          )}
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 text-xs font-bold uppercase transition"
          >
            Ajustes
          </button>
        </div>
      </div>

      {/* Janela de Configuração flutuante */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full space-y-6 text-slate-200">
            <h3 className="text-lg font-black uppercase text-slate-100 border-b border-slate-855 pb-3">
              Configurar IP do Operador
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Insira o IP LAN do computador do operador (ex: 192.168.1.50) para conectar este placar em tempo real via rede local.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">IP do Servidor:</label>
              <input
                type="text"
                value={wsIp}
                onChange={(e) => setWsIp(e.target.value)}
                placeholder="localhost"
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-slate-200 outline-none focus:border-[#CE1126]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  initAudio();
                  connect();
                }}
                className="flex-1 py-3 bg-[#CE1126] hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Conectar e Ativar Som
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel Central do Placar */}
      <div className="flex-grow grid grid-cols-5 items-stretch relative">
        
        {/* AKA Lado Esquerdo (Vermelho) */}
        <div className="col-span-2 bg-red-950/15 flex flex-col justify-between p-12 border-r border-slate-900 relative">
          <div className="absolute top-0 left-0 w-3 h-full bg-[#CE1126]" />
          
          {/* Nome e Dojo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase text-[#CE1126] tracking-widest bg-red-950/60 border border-red-900 px-4 py-1.5 rounded-xl">
                Aka (Vermelho)
              </span>
              {state.senshu === "red" && (
                <span className="text-xs font-black uppercase bg-amber-500 text-amber-950 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                  <Award className="w-4 h-4 fill-amber-950" />
                  Senshu
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black text-slate-100 tracking-wide uppercase truncate max-w-[400px]">
              {state.athlete_red}
            </h2>
          </div>

          {/* Pontos Gigantes */}
          <div className="text-center my-6 flex-grow flex items-center justify-center">
            <span className="text-[250px] font-black text-red-500 leading-none tracking-tighter tabular-nums drop-shadow-[0_0_40px_rgba(206,17,38,0.4)]">
              {state.score_red}
            </span>
          </div>

          {/* Penalidades */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-red-400 block tracking-widest">
              Penalidades WKF (Aka)
            </span>
            {renderPenalties(state.penalties_red, 'left')}
          </div>
        </div>

        {/* Painel do Timer (Centro) */}
        <div className="col-span-1 bg-slate-950 flex flex-col justify-center items-center p-6 border-x border-slate-900 relative">
          
          {/* Cronômetro Circular/Gigante */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tempo</span>
            
            <div className="bg-slate-900 border-2 border-slate-800 rounded-[40px] px-8 py-10 shadow-2xl">
              <span 
                className={`text-7xl font-black font-mono tracking-wider tabular-nums ${
                  state.timer_active ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                }`}
              >
                {formatTime(state.timer_seconds)}
              </span>
            </div>
            
            {state.is_finished && (
              <span className="text-xs font-black uppercase tracking-widest text-[#CE1126] bg-red-950/40 border border-red-900/60 px-4 py-2 rounded-xl animate-pulse">
                Luta Finalizada
              </span>
            )}
          </div>
        </div>

        {/* AO Lado Direito (Azul) */}
        <div className="col-span-2 bg-blue-950/15 flex flex-col justify-between p-12 relative text-right">
          <div className="absolute top-0 right-0 w-3 h-full bg-[#002B7F]" />
          
          {/* Nome e Dojo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {state.senshu === "blue" && (
                <span className="text-xs font-black uppercase bg-amber-500 text-amber-950 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                  <Award className="w-4 h-4 fill-amber-950" />
                  Senshu
                </span>
              )}
              <span className="text-sm font-extrabold uppercase text-blue-400 bg-blue-950/60 border border-blue-900 px-4 py-1.5 rounded-xl ml-auto">
                Ao (Azul)
              </span>
            </div>
            <h2 className="text-4xl font-black text-slate-100 tracking-wide uppercase truncate max-w-[400px]">
              {state.athlete_blue}
            </h2>
          </div>

          {/* Pontos Gigantes */}
          <div className="text-center my-6 flex-grow flex items-center justify-center">
            <span className="text-[250px] font-black text-blue-400 leading-none tracking-tighter tabular-nums drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              {state.score_blue}
            </span>
          </div>

          {/* Penalidades */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-blue-400 block tracking-widest">
              Penalidades WKF (Ao)
            </span>
            {renderPenalties(state.penalties_blue, 'right')}
          </div>
        </div>

      </div>



      {/* Footer Fino de Créditos */}
      <div className="bg-slate-950 border-t border-slate-900 px-8 py-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        Sistema de Gestão de Karatê FBKE — Scoreboard Real-time LAN
      </div>
    </div>
  );
}

export default function ScoreboardDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#CE1126] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando placar de exibição...</p>
      </div>
    }>
      <ScoreboardDisplayContent />
    </Suspense>
  );
}
