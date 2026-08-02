"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Wifi, WifiOff, Award, Tv, ShieldAlert, Users, Play, Pause, 
  RotateCcw, Volume2, Plus, Minus, CheckCircle, Smartphone 
} from "lucide-react";

type ViewType = "pairing" | "operator" | "display" | "marshall";

interface ScoreboardState {
  match_id: string | null;
  category_name: string;
  athlete_red: string;
  athlete_blue: string;
  score_red: number;
  score_blue: number;
  senshu: "red" | "blue" | null;
  penalties_red: number;
  penalties_blue: number;
  timer_seconds: number;
  timer_active: boolean;
  is_finished: boolean;
}

export default function PairingPage() {
  const [wsIp, setWsIp] = useState("localhost");
  const [connected, setConnected] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("pairing");
  const [assignedTatami, setAssignedTatami] = useState<string>("");
  const [showIpConfig, setShowIpConfig] = useState(true);
  const [reliefRequested, setReliefRequested] = useState(false);
  // Estado da luta para o Placar / Console
  const [state, setState] = useState<ScoreboardState>({
    match_id: null,
    category_name: "Aguardando Categoria...",
    athlete_red: "Aka",
    athlete_blue: "Ao",
    score_red: 0,
    score_blue: 0,
    senshu: null,
    penalties_red: 0,
    penalties_blue: 0,
    timer_seconds: 180,
    timer_active: false,
    is_finished: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializa áudio para campainha/buzzer
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playBuzzer = (duration: number) => {
    initAudio();
    if (!audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Erro ao emitir áudio:", e);
    }
  };

  // Conectar ao WebSocket LAN
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
        setShowIpConfig(false);

        // Tenta recuperar token anterior do localStorage
        const savedToken = localStorage.getItem("fbke_pairing_token");
        if (savedToken) {
          ws.send(JSON.stringify({
            type: "client_reconnect",
            token: savedToken
          }));
        } else {
          ws.send(JSON.stringify({
            type: "get_pairing_code"
          }));
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000); // Tenta reconectar a cada 3s se cair
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "pairing_code") {
            setPairingCode(data.code);
            localStorage.setItem("fbke_pairing_token", data.token);
            setCurrentView("pairing");
            setReliefRequested(false);
          } 
          else if (data.type === "routing") {
            setCurrentView(data.view);
            setAssignedTatami(data.tatami || "");
            setReliefRequested(false);
          } 
          else if (data.type === "state_sync") {
            setState(data.state);
          } 
          else if (data.type === "ping_request") {
            // Responde imediatamente o ping para cálculo de latência RTT
            ws.send(JSON.stringify({
              type: "pong_response",
              timestamp: data.timestamp
            }));
          }
          else if (data.type === "audio_signal") {
            playBuzzer(1.5);
          }
        } catch (e) {
          console.error("Erro ao interpretar dados WS:", e);
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [wsIp]);

  // Solicita substituição ao administrador central
  const handleRequestRelief = () => {
    const confirmChoice = confirm("Solicitar substituição/apoio ao administrador?");
    if (confirmChoice) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "request_relief"
        }));
        setReliefRequested(true);
        alert("Solicitação de substituição enviada com sucesso!");
      } else {
        alert("Erro: Sem conexão com o servidor WebSocket local.");
      }
    }
  };

  // Sincroniza estado local para o servidor WS
  const syncState = (updatedState: Partial<ScoreboardState>) => {
    const newState = { ...state, ...updatedState };
    setState(newState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "update_scoreboard",
        state: updatedState
      }));
    }
  };

  // Envia buzzer acústico para os telões
  const triggerAudioSignal = () => {
    playBuzzer(1.5);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "audio_signal"
      }));
    }
  };

  // Controle local do cronômetro (só para quem opera/console)
  useEffect(() => {
    if (state.timer_active && !state.is_finished) {
      timerIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timer_seconds <= 1) {
            clearInterval(timerIntervalRef.current!);
            triggerAudioSignal();
            const finishedState = { ...prev, timer_seconds: 0, timer_active: false, is_finished: true };
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "update_scoreboard",
                state: { timer_seconds: 0, timer_active: false, is_finished: true }
              }));
            }
            return finishedState;
          }
          const nextSecs = prev.timer_seconds - 1;
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && nextSecs % 5 === 0) {
            wsRef.current.send(JSON.stringify({
              type: "update_scoreboard",
              state: { timer_seconds: nextSecs }
            }));
          }
          return { ...prev, timer_seconds: nextSecs };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state.timer_active, state.is_finished]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Renderização de views auxiliares de acordo com o papel roteado

  // 1. TELA DE EMPARELHAMENTO (Pairing Screen)
  const renderPairingScreen = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-8 shadow-2xl relative overflow-hidden">
        {/* Detalhe de estilo luminoso */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-[#002B7F]/10 border border-blue-950 text-[#002B7F] rounded-2xl flex items-center justify-center shadow-inner">
            <Smartphone className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-200">
            Pareamento de Dispositivo
          </h1>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Abra o painel do administrador em sua rede local e insira este código para alocar o papel do dispositivo.
          </p>
        </div>

        {/* CÓDIGO PIN GRANDE */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl py-6 relative">
          <div className="text-5xl font-mono font-black tracking-widest text-emerald-400 select-all drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]">
            {pairingCode || "---"}
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-2">
            Código PIN LAN
          </span>
        </div>

        {/* STATUS DE CONEXÃO */}
        <div className="flex items-center justify-center gap-3 border-t border-slate-850 pt-6">
          {connected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-full text-[10px] font-extrabold uppercase">
              <Wifi className="w-3.5 h-3.5" /> Conectado LAN
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-full text-[10px] font-extrabold uppercase animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Sem Conexão
            </div>
          )}
          
          <button
            onClick={() => setShowIpConfig(!showIpConfig)}
            className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-250 underline transition"
          >
            Mudar Servidor
          </button>
        </div>
      </div>

      {showIpConfig && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xs w-full space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-100">Endereço IP da LAN:</h3>
            <input
              type="text"
              value={wsIp}
              onChange={(e) => setWsIp(e.target.value)}
              placeholder="localhost"
              className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  initAudio();
                  connect();
                }}
                className="flex-grow py-2.5 bg-[#002B7F] hover:bg-blue-800 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Conectar
              </button>
              <button
                onClick={() => setShowIpConfig(false)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 2. VIEW DO TELÃO (Display UI)
  const renderDisplayView = () => {
    const renderDisplayPenalties = (level: number, align: 'left' | 'right') => {
      const blocks = [];
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
          <div key={i} className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl text-xs font-black uppercase ${colorClass}`}>
            {isHansoku ? "H" : `C${i}`}
          </div>
        );
      }
      return <div className={`flex gap-2 ${align === 'right' ? 'justify-end' : ''}`}>{align === 'right' ? blocks.reverse() : blocks}</div>;
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none overflow-hidden font-sans" onClick={initAudio}>
        {/* Topo */}
        <div className="bg-slate-900/60 border-b border-slate-900 px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase bg-[#002B7F] text-blue-200 border border-blue-900 px-3 py-1 rounded-lg tracking-widest">
              Telão Oficial - {assignedTatami}
            </span>
            <h1 className="text-xl font-black text-slate-150 mt-1 uppercase tracking-wide">
              {state.category_name}
            </h1>
          </div>
          {connected ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-900/50 px-3.5 py-1.5 rounded-lg text-emerald-400 text-[10px] font-black uppercase">
              <Wifi className="w-3.5 h-3.5" /> Sincronizado
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-900/50 px-3.5 py-1.5 rounded-lg text-red-400 text-[10px] font-black uppercase animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Desconectado
            </div>
          )}
        </div>

        {/* Combate */}
        <div className="flex-grow grid grid-cols-5 items-stretch relative">
          {/* AKA (Vermelho) */}
          <div className="col-span-2 bg-red-950/5 flex flex-col justify-between p-10 border-r border-slate-900 relative">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-[#CE1126]" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-widest bg-red-950/50 border border-red-900 px-3 py-1 rounded-lg">Aka</span>
              {state.senshu === "red" && <span className="text-[10px] font-black uppercase bg-amber-500 text-amber-950 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm"><Award className="w-3 h-3 fill-amber-950" /> Senshu</span>}
            </div>
            <h2 className="text-3xl font-black tracking-wide uppercase truncate mt-4">{state.athlete_red}</h2>
            <div className="text-center my-6 flex-grow flex items-center justify-center">
              <span className="text-[180px] font-black text-red-500 leading-none drop-shadow-[0_0_30px_rgba(206,17,38,0.3)]">{state.score_red}</span>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-red-400 block tracking-widest">Penalidades</span>
              {renderDisplayPenalties(state.penalties_red, 'left')}
            </div>
          </div>

          {/* TIMER CENTRAL */}
          <div className="col-span-1 bg-slate-950 flex flex-col justify-center items-center p-4 border-x border-slate-900">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Tempo</span>
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl px-6 py-8 shadow-xl text-center">
              <span className={`text-4xl font-mono font-black tabular-nums tracking-wide ${state.timer_active ? 'text-emerald-400' : 'text-slate-350'} ${state.timer_seconds <= 15 && !state.is_finished ? 'text-red-500 animate-pulse' : ''}`}>
                {formatTime(state.timer_seconds)}
              </span>
            </div>
          </div>

          {/* AO (Azul) */}
          <div className="col-span-2 bg-blue-950/5 flex flex-col justify-between p-10 border-l border-slate-900 relative">
            <div className="absolute top-0 right-0 w-2.5 h-full bg-[#002B7F]" />
            <div className="flex items-center justify-between">
              {state.senshu === "blue" && <span className="text-[10px] font-black uppercase bg-amber-500 text-amber-950 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm"><Award className="w-3 h-3 fill-amber-950" /> Senshu</span>}
              <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-widest bg-blue-950/50 border border-blue-900 px-3 py-1 rounded-lg ml-auto">Ao</span>
            </div>
            <h2 className="text-3xl font-black tracking-wide uppercase truncate mt-4 text-right">{state.athlete_blue}</h2>
            <div className="text-center my-6 flex-grow flex items-center justify-center">
              <span className="text-[180px] font-black text-blue-500 leading-none drop-shadow-[0_0_30px_rgba(0,43,127,0.3)]">{state.score_blue}</span>
            </div>
            <div className="space-y-2 text-right">
              <span className="text-[9px] font-black uppercase text-blue-400 block tracking-widest">Penalidades</span>
              {renderDisplayPenalties(state.penalties_blue, 'right')}
            </div>
          </div>
        </div>


      </div>
    );
  };

  // 3. VIEW DO CONSOLE DO OPERADOR (Operator UI)
  const renderOperatorView = () => {
    const handleAddScore = (color: 'red' | 'blue', pts: number) => {
      if (color === 'red') {
        syncState({ score_red: Math.max(0, state.score_red + pts) });
      } else {
        syncState({ score_blue: Math.max(0, state.score_blue + pts) });
      }
    };

    const handlePenalty = (color: 'red' | 'blue', increment: boolean) => {
      const field = color === 'red' ? 'penalties_red' : 'penalties_blue';
      const cur = state[field];
      const nextVal = increment ? Math.min(4, cur + 1) : Math.max(0, cur - 1);
      syncState({ [field]: nextVal });
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
        {/* Cabeçalho */}
        <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black bg-[#CE1126] text-white px-2 py-0.5 rounded uppercase tracking-wider">
              Mesa do Tatame - {assignedTatami}
            </span>
            <h1 className="text-base font-extrabold text-slate-150 mt-1">{state.category_name}</h1>
          </div>
          <div className="flex gap-2.5 items-center">
            <button 
              onClick={handleRequestRelief}
              className={`h-10 px-4 border rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm ${reliefRequested ? 'bg-amber-950/65 border-amber-900 text-amber-400 cursor-not-allowed animate-pulse' : 'bg-red-950/30 border-red-900/60 text-red-400 hover:bg-[#CE1126] hover:text-white'}`}
              disabled={reliefRequested}
            >
              <ShieldAlert className="w-4 h-4" />
              {reliefRequested ? "Apoio Solicitado" : "Pedir Substituição"}
            </button>

            <button onClick={triggerAudioSignal} className="p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-bold uppercase text-amber-500">
              <Volume2 className="w-4 h-4" /> Buzzer
            </button>
          </div>
        </div>

        {/* Painel do Operador */}
        <div className="flex-grow grid grid-cols-5 items-stretch">
          {/* Controles AKA (Esquerda) */}
          <div className="col-span-2 bg-red-950/5 border-r border-slate-800 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-[#CE1126]">Controles Aka</span>
              <h2 className="text-xl font-bold uppercase truncate">{state.athlete_red}</h2>
              <div className="flex gap-2">
                <button onClick={() => syncState({ senshu: state.senshu === 'red' ? null : 'red' })} className={`flex-1 py-1.5 border text-[10px] font-black uppercase rounded-lg transition ${state.senshu === 'red' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-400'}`}>
                  Senshu
                </button>
              </div>
            </div>

            {/* Placar Aka */}
            <div className="my-4 text-center">
              <div className="text-[90px] font-black text-red-500 leading-none">{state.score_red}</div>
              <div className="flex gap-1.5 justify-center mt-3">
                <button onClick={() => handleAddScore('red', 1)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+1 Yuko</button>
                <button onClick={() => handleAddScore('red', 2)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+2 Waza</button>
                <button onClick={() => handleAddScore('red', 3)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+3 Ippon</button>
                <button onClick={() => handleAddScore('red', -1)} className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-lg uppercase text-slate-400 transition">-1</button>
              </div>
            </div>

            {/* Penalidades Aka */}
            <div className="space-y-2 border-t border-slate-855 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Penalidades WKF (C1-H)</span>
                <span className="text-xs font-black text-slate-300 font-mono">{state.penalties_red} / 4</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePenalty('red', true)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Adicionar</button>
                <button onClick={() => handlePenalty('red', false)} className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-400 transition flex items-center justify-center gap-1"><Minus className="w-3.5 h-3.5" /> Reduzir</button>
              </div>
            </div>
          </div>

          {/* TIMER E STATUS CENTRAL */}
          <div className="col-span-1 bg-slate-950 flex flex-col justify-between p-4 border-x border-slate-800">
            <div className="text-center space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cronômetro</span>
              <div className="text-3xl font-mono font-black tracking-wide text-slate-200 bg-slate-900 border border-slate-850 py-4 rounded-2xl">
                {formatTime(state.timer_seconds)}
              </div>
            </div>

            <div className="space-y-2 my-4">
              <button 
                onClick={() => syncState({ timer_active: !state.timer_active })}
                className={`w-full py-3 text-xs font-black uppercase rounded-xl transition flex items-center justify-center gap-1.5 ${state.timer_active ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {state.timer_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {state.timer_active ? "Pausar" : "Iniciar"}
              </button>
              
              <button 
                onClick={() => syncState({ timer_seconds: 180, timer_active: false, is_finished: false })}
                className="w-full py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-350 text-[10px] font-bold uppercase rounded-lg transition flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reiniciar
              </button>
            </div>

            <div className="border-t border-slate-850 pt-4">
              <button 
                onClick={() => {
                  const confirmChoice = confirm("Finalizar combate oficial?");
                  if (confirmChoice) {
                    syncState({ is_finished: true, timer_active: false });
                  }
                }}
                className={`w-full py-2.5 text-[10px] font-black uppercase rounded-xl transition border ${state.is_finished ? 'bg-slate-900 border-slate-855 text-slate-500' : 'bg-red-950/20 border-red-900 text-red-400 hover:bg-red-900 hover:text-white'}`}
                disabled={state.is_finished}
              >
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                {state.is_finished ? "Luta Concluída" : "Finalizar Luta"}
              </button>
            </div>
          </div>

          {/* Controles AO (Direita) */}
          <div className="col-span-2 bg-blue-950/5 border-l border-slate-800 p-6 flex flex-col justify-between text-right">
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-[#002B7F] block">Controles Ao</span>
              <h2 className="text-xl font-bold uppercase truncate">{state.athlete_blue}</h2>
              <div className="flex gap-2">
                <button onClick={() => syncState({ senshu: state.senshu === 'blue' ? null : 'blue' })} className={`flex-1 py-1.5 border text-[10px] font-black uppercase rounded-lg transition ${state.senshu === 'blue' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-400'}`}>
                  Senshu
                </button>
              </div>
            </div>

            {/* Placar Ao */}
            <div className="my-4 text-center">
              <div className="text-[90px] font-black text-blue-500 leading-none">{state.score_blue}</div>
              <div className="flex gap-1.5 justify-center mt-3">
                <button onClick={() => handleAddScore('blue', 1)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+1 Yuko</button>
                <button onClick={() => handleAddScore('blue', 2)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+2 Waza</button>
                <button onClick={() => handleAddScore('blue', 3)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-lg uppercase transition">+3 Ippon</button>
                <button onClick={() => handleAddScore('blue', -1)} className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-lg uppercase text-slate-400 transition">-1</button>
              </div>
            </div>

            {/* Penalidades Ao */}
            <div className="space-y-2 border-t border-slate-850 pt-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Penalidades WKF (C1-H)</span>
                <span className="text-xs font-black text-slate-300 font-mono">{state.penalties_blue} / 4</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePenalty('blue', true)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Adicionar</button>
                <button onClick={() => handlePenalty('blue', false)} className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-400 transition flex items-center justify-center gap-1"><Minus className="w-3.5 h-3.5" /> Reduzir</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 4. VIEW DO CHAMADOR DE QUADRA (Marshall UI)
  const renderMarshallView = () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase bg-emerald-950 border border-emerald-900 px-3 py-1 rounded-lg text-emerald-400 tracking-widest">
              Marshall Display - {assignedTatami}
            </span>
            <h1 className="text-2xl font-black tracking-wide mt-2 text-slate-150 uppercase">Visualizador de Chaves</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRequestRelief}
              className={`px-3 py-2 border rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 shadow-sm ${reliefRequested ? 'bg-amber-950/65 border-amber-900 text-amber-400 cursor-not-allowed animate-pulse' : 'bg-red-950/30 border-red-900/60 text-red-400 hover:bg-[#CE1126] hover:text-white'}`}
              disabled={reliefRequested}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {reliefRequested ? "Apoio Solicitado" : "Pedir Substituição"}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Wifi className="w-4 h-4 text-emerald-400" /> Sincronizado
            </div>
          </div>
        </div>

        {/* Luta Atual em Destaque */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Disputa Atual no {assignedTatami}</div>
          <div className="text-sm font-extrabold text-amber-500 uppercase">{state.category_name}</div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
            <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-4">
              <span className="text-[8px] font-black uppercase text-red-400 tracking-widest block mb-1">Aka (Vermelho)</span>
              <span className="text-lg font-black uppercase text-slate-200">{state.athlete_red}</span>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/60 rounded-xl p-4 text-right">
              <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block mb-1">Ao (Azul)</span>
              <span className="text-lg font-black uppercase text-slate-200">{state.athlete_blue}</span>
            </div>
          </div>
        </div>

        <div className="text-center py-6 text-slate-500 text-xs italic">
          Acompanhe o andamento das chaves e traga os competidores para a Área de Concentração.
        </div>
      </div>
    </div>
  );

  // Renderizador principal da View roteada sem recarregamento (SPA)
  switch (currentView) {
    case "operator":
      return renderOperatorView();
    case "display":
      return renderDisplayView();
    case "marshall":
      return renderMarshallView();
    case "pairing":
    default:
      return renderPairingScreen();
  }
}
