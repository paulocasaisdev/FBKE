"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Wifi, WifiOff, CloudLightning, ShieldAlert, Award } from "lucide-react";
import { karateDb, OfflineMatch, OfflineMatchLog } from "@/utils/indexedDb";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const matchId = searchParams.get("match_id");
  const categoryName = searchParams.get("category_name") || "Kumite Categoria";

  // Estados principais da Luta
  const [match, setMatch] = useState<OfflineMatch | null>(null);
  const [invertSides, setInvertSides] = useState(false);
  const [scoreRed, setScoreRed] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [senshu, setSenshu] = useState<'red' | 'blue' | null>(null);
  const [penaltiesRed, setPenaltiesRed] = useState(0); // 0=Nenhuma, 1=Chui 1, 2=Chui 2, 3=Chui 3, 4=Hansoku
  const [penaltiesBlue, setPenaltiesBlue] = useState(0);
  
  // Timer
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 minutos padrão
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Áudio
  const [audioVolume, setAudioVolume] = useState(0.8);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Conectividade e LAN Sync
  const [isOnline, setIsOnline] = useState(true);
  const [lanIp, setLanIp] = useState("localhost");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Monitora conexão de internet
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const goOnline = () => {
        setIsOnline(true);
        triggerSync();
      };
      const goOffline = () => setIsOnline(false);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  // Inicializa o AudioContext de forma preguiçosa no clique do usuário
  const initAudio = () => {
    if (!audioContextRef.current && typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Carrega partida
  useEffect(() => {
    const loadMatchData = async () => {
      if (!matchId) return;
      try {
        const localMatch = await karateDb.getMatch(matchId);
        if (localMatch) {
          setMatch(localMatch);
          setScoreRed(localMatch.score_red);
          setScoreBlue(localMatch.score_blue);
          
          // Se já terminou localmente
          if (localMatch.status === "finished") {
            setTimerSeconds(0);
          }
        } else if (navigator.onLine) {
          // Busca do servidor se não tiver local
          const res = await fetch(`${API_URL}/api/tournaments/matches/${matchId}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setMatch(data);
            setScoreRed(data.score_red || 0);
            setScoreBlue(data.score_blue || 0);
            await karateDb.saveMatches([data]);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados da luta:", err);
      }
    };
    loadMatchData();
  }, [matchId]);

  // Conectar ao WebSocket Server local (LAN) para exibição em tempo real
  const connectLanWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsUrl = `ws://${lanIp}:8080`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        syncStateToWS();
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      setWsConnected(false);
    }
  };

  useEffect(() => {
    connectLanWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [lanIp]);

  // Sincroniza o estado atual com o WebSocket local LAN
  const syncStateToWS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "update_scoreboard",
        state: {
          match_id: matchId,
          category_id: match?.category_id || searchParams.get("category_id"),
          category_name: categoryName,
          athlete_red: match?.athlete_red_name || "Aka",
          athlete_blue: match?.athlete_blue_name || "Ao",
          score_red: scoreRed,
          score_blue: scoreBlue,
          senshu,
          penalties_red: penaltiesRed,
          penalties_blue: penaltiesBlue,
          timer_seconds: timerSeconds,
          timer_active: timerActive,
          is_finished: match?.status === "finished",
          invert_sides: invertSides
        }
      }));
    }
  };

  // Dispara sincronização com o banco de dados cloud quando voltar online
  const triggerSync = async () => {
    if (!navigator.onLine) return;
    try {
      const queue = await karateDb.getSyncQueue();
      if (queue.length === 0) return;

      const matchesToSync = queue.filter(item => item.type === "match_update").map(item => item.payload);
      const logsToSync = queue.filter(item => item.type === "match_log").map(item => item.payload);

      const res = await fetch(`${API_URL}/api/tournaments/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches: matchesToSync, logs: logsToSync }),
        credentials: "include"
      });

      if (res.ok) {
        // Limpa a fila local
        for (const item of queue) {
          await karateDb.removeSyncQueueItem(item.id);
        }
        console.log("Sincronização offline-first realizada com sucesso!");
      }
    } catch (e) {
      console.error("Erro ao sincronizar fila offline:", e);
    }
  };

  // Sempre que o estado da luta mudar, salva local e envia para o WS
  useEffect(() => {
    syncStateToWS();
    if (matchId && match) {
      // Salva progresso temporário localmente
      karateDb.saveMatches([{
        ...match,
        score_red: scoreRed,
        score_blue: scoreBlue,
        status: match.status
      }]);
    }
  }, [scoreRed, scoreBlue, senshu, penaltiesRed, penaltiesBlue, timerSeconds, timerActive, match, invertSides]);

  // Controle do Timer
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            playBuzzerSound(1.5); // Som longo de fim de luta
            handleFinalizeMatch();
            return 0;
          }
          if (prev === 16) {
            playBuzzerSound(0.5); // Som curto de 15s (Atoshi Baraku)
          }
          return prev - 1;
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
  }, [timerActive]);

  // Emite sinal sonoro sintético robusto (Buzzer)
  const playBuzzerSound = (duration: number) => {
    initAudio();
    if (!audioContextRef.current) return;

    try {
      // Cria oscilador para som estridente
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime); // Tom da buzina clássica
      
      gain.gain.setValueAtTime(audioVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);

      // Avisa via WS para os painéis de exibição tocarem o som também
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "audio_signal",
          signal: duration > 1 ? "long" : "short"
        }));
      }
    } catch (e) {
      console.warn("Erro ao reproduzir áudio:", e);
    }
  };

  // Funções de pontuação
  const handleScore = (color: 'red' | 'blue', value: number) => {
    initAudio();
    
    // Atribuição automática de Senshu
    if (senshu === null && scoreRed === 0 && scoreBlue === 0) {
      setSenshu(color);
    }

    let details = { action: "add_points", value, athlete_color: color };
    
    if (color === 'red') {
      const nextScore = Math.max(0, scoreRed + value);
      setScoreRed(nextScore);
      logEvent("score", details);
    } else {
      const nextScore = Math.max(0, scoreBlue + value);
      setScoreBlue(nextScore);
      logEvent("score", details);
    }

    // Notifica o WebSocket sobre o ponto marcado para a animação do sticker
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const pointType = value === 1 ? 'yuko' : value === 2 ? 'wazaari' : 'ippon';
      wsRef.current.send(JSON.stringify({
        type: "point_scored",
        color,
        point_type: pointType
      }));
    }
  };

  // Funções de penalidades
  const handlePenalty = (color: 'red' | 'blue', action: 'add' | 'remove') => {
    initAudio();
    if (color === 'red') {
      const nextPen = action === 'add' ? Math.min(4, penaltiesRed + 1) : Math.max(0, penaltiesRed - 1);
      setPenaltiesRed(nextPen);
      logEvent("penalty", { action, current_penalties: nextPen, athlete_color: 'red' });
      
      // Hansoku automático (Desclassificação)
      if (nextPen === 4) {
        setTimerActive(false);
        alert("Aka atingiu Hansoku! Fim da luta.");
        handleFinalizeMatch(match?.athlete_blue_id || undefined);
      }
    } else {
      const nextPen = action === 'add' ? Math.min(4, penaltiesBlue + 1) : Math.max(0, penaltiesBlue - 1);
      setPenaltiesBlue(nextPen);
      logEvent("penalty", { action, current_penalties: nextPen, athlete_color: 'blue' });
      
      if (nextPen === 4) {
        setTimerActive(false);
        alert("Ao atingiu Hansoku! Fim da luta.");
        handleFinalizeMatch(match?.athlete_red_id || undefined);
      }
    }
  };

  // Registra logs locais no IndexedDB
  const logEvent = async (type: OfflineMatchLog['log_type'], details: any) => {
    if (!matchId) return;
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const log: OfflineMatchLog = {
      match_id: matchId,
      timestamp: new Date().toISOString(),
      log_type: type,
      details: { ...details, timer_remaining: formatTime(timerSeconds) }
    };

    try {
      await karateDb.saveMatchLogLocal(log);
      
      // Se estiver online, sincroniza imediatamente
      if (navigator.onLine) {
        fetch(`${API_URL}/api/tournaments/matches/${matchId}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log),
          credentials: "include"
        });
      }
    } catch (e) {
      console.warn("Erro ao salvar log no IndexedDB:", e);
    }
  };

  // Finalização da luta e cálculo do vencedor
  const handleFinalizeMatch = async (forcedWinnerId?: string) => {
    if (!matchId || !match) return;

    let winnerId: string | null = null;
    let desc = "";

    if (forcedWinnerId) {
      winnerId = forcedWinnerId;
      desc = "Vitória por desclassificação (Hansoku).";
    } else {
      // Regra padrão Kumite:
      // 1. Quem tem mais pontos
      // 2. Se empate, quem tem Senshu
      // 3. Se empate e sem Senshu, Hantei (decisão dos árbitros, operador escolhe)
      if (scoreRed > scoreBlue) {
        winnerId = match.athlete_red_id;
      } else if (scoreBlue > scoreRed) {
        winnerId = match.athlete_blue_id;
      } else {
        // Empate
        if (senshu === 'red') {
          winnerId = match.athlete_red_id;
          desc = "Vitória por Senshu.";
        } else if (senshu === 'blue') {
          winnerId = match.athlete_blue_id;
          desc = "Vitória por Senshu.";
        } else {
          // Hantei requerido
          const choice = confirm("Luta empatada sem Senshu. Confirmar vitória para AKA (Vermelho)? Cancele para AO (Azul).");
          winnerId = choice ? match.athlete_red_id : match.athlete_blue_id;
          desc = "Vitória por decisão dos árbitros (Hantei).";
        }
      }
    }

    const payload = {
      status: "finished" as const,
      score_red: scoreRed,
      score_blue: scoreBlue,
      winner_id: winnerId
    };

    // Atualiza estado local
    setMatch(prev => prev ? { ...prev, ...payload } : null);
    setTimerActive(false);

    try {
      // Salva no IndexedDB localmente e agenda sync na fila
      await karateDb.updateMatchLocal(matchId, payload);
      await logEvent("system", { message: `Luta finalizada. Vencedor ID: ${winnerId}. ${desc}` });
      
      // Se online, sincroniza imediatamente
      if (navigator.onLine) {
        await fetch(`${API_URL}/api/tournaments/matches/${matchId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        await triggerSync();
      }

      alert("Luta finalizada e salva com sucesso!");
      router.back();
    } catch (e) {
      console.error(e);
      alert("Erro ao finalizar luta. Salvo offline.");
      router.back();
    }
  };

  // Formata os segundos em MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getPenaltyLabels = (level: number) => {
    if (level === 0) return "Sem Faltas";
    if (level === 1) return "Chui 1";
    if (level === 2) return "Chui 2";
    if (level === 3) return "Chui 3";
    return "Hansoku";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra superior de status */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-200 uppercase tracking-widest">{categoryName}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mesa de Controle do Operador</p>
          </div>
        </div>

        {/* LAN Websocket Setup */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl">
          <div className="flex items-center gap-1.5 px-3">
            {wsConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-emerald-500">WS LAN Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black uppercase text-red-500">WS LAN Offline</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-extrabold uppercase text-slate-500">Servidor IP:</span>
            <input
              type="text"
              value={lanIp}
              onChange={(e) => setLanIp(e.target.value)}
              placeholder="localhost"
              className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs font-bold text-slate-200 outline-none focus:border-red-600 w-32"
            />
            <button
              onClick={connectLanWebSocket}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase rounded-lg transition cursor-pointer"
            >
              Reconectar
            </button>
          </div>
        </div>
      </div>

      {/* Grid de controle do placar */}
      <div className="flex-grow max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel AKA (Red) - Lado Esquerdo */}
        <div className={`bg-red-950/10 border-2 border-red-900/40 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden ${invertSides ? 'order-3' : 'order-1'}`}>
          <div className="absolute top-0 left-0 w-2.5 h-full bg-red-600" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-950/80 px-3 py-1 rounded-lg border border-red-900">
                AKA (Vermelho)
              </span>
              {senshu === "red" && (
                <span className="text-[9px] font-black uppercase bg-amber-500 text-amber-950 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Award className="w-3 h-3 fill-amber-950" />
                  Senshu
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-100 truncate">{match?.athlete_red_name || "Vermelho"}</h2>
            <p className="text-[10px] text-red-400 font-bold uppercase">{match?.dojo_name || "Filial"}</p>
          </div>

          {/* Pontos Digitais Gigantes */}
          <div className="my-8 text-center">
            <span className="text-8xl font-black text-red-500 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              {scoreRed}
            </span>
          </div>

          {/* Controles de Pontos e Faltas */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleScore('red', 1)}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +1 Yuko
              </button>
              <button
                onClick={() => handleScore('red', 2)}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +2 Waza
              </button>
              <button
                onClick={() => handleScore('red', 3)}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +3 Ippon
              </button>
            </div>
            
            <div className="flex items-center justify-between border-t border-red-900/30 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-red-400">Penalidades:</span>
                <span className="text-xs font-bold text-red-500 bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                  {getPenaltyLabels(penaltiesRed)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePenalty('red', 'remove')}
                  disabled={penaltiesRed === 0}
                  className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 rounded-lg border border-slate-800 cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handlePenalty('red', 'add')}
                  disabled={penaltiesRed === 4}
                  className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => setScoreRed(prev => Math.max(0, prev - 1))}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-[10px] uppercase rounded-xl cursor-pointer"
            >
              Corrigir Pontuação (-1)
            </button>
          </div>
        </div>

        {/* Painel Central - Timer e Controles Globais */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-6 order-2">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cronômetro</span>
            <div className="bg-slate-950 border border-slate-850 rounded-2xl py-6 px-4 inline-block min-w-[200px]">
              <span className={`text-6xl font-black font-mono tracking-wider tabular-nums ${timerActive ? "text-emerald-500" : "text-amber-500 animate-pulse"}`}>
                {formatTime(timerSeconds)}
              </span>
            </div>
          </div>

          {/* Botões do Cronômetro */}
          <div className="grid grid-cols-2 gap-4">
            {timerActive ? (
              <button
                onClick={() => setTimerActive(false)}
                className="py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" />
                Pausar
              </button>
            ) : (
              <button
                onClick={() => {
                  initAudio();
                  setTimerActive(true);
                }}
                disabled={timerSeconds === 0}
                className="py-4 bg-emerald-600 hover:bg-emerald-750 text-white disabled:bg-slate-850 disabled:text-slate-600 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Iniciar
              </button>
            )}
            
            <button
              onClick={() => {
                if (confirm("Resetar cronômetro para 3 minutos?")) {
                  setTimerSeconds(180);
                  setTimerActive(false);
                }
              }}
              className="py-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>
          </div>

          {/* Configuração de tempo manual */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTimerSeconds(120)} className="py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold text-[10px] uppercase rounded-xl cursor-pointer">
              2 Minutos
            </button>
            <button onClick={() => setTimerSeconds(180)} className="py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold text-[10px] uppercase rounded-xl cursor-pointer">
              3 Minutos
            </button>
            <button
              onClick={() => {
                const manual = prompt("Insira os segundos:", timerSeconds.toString());
                if (manual && !isNaN(Number(manual))) setTimerSeconds(Number(manual));
              }}
              className="py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold text-[10px] uppercase rounded-xl cursor-pointer"
            >
              Ajustar
            </button>
          </div>

          {/* Sinais sonoros e volume */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-black uppercase text-slate-500">Sinal Sonoro Manual</span>
              <button
                onClick={() => playBuzzerSound(1.0)}
                className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-300 flex items-center gap-1.5 font-bold uppercase text-[9px] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Tocar Campainha
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-black uppercase text-slate-500">Volume Buzzer:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioVolume}
                onChange={(e) => setAudioVolume(Number(e.target.value))}
                className="w-24 accent-red-600 bg-slate-950 h-1.5 rounded-lg outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Senshu Geral */}
          <div className="flex justify-around items-center pt-4 border-t border-slate-800 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-500">Senshu:</span>
            <button
              onClick={() => setSenshu(senshu === 'red' ? null : 'red')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer border ${
                senshu === 'red' 
                  ? 'bg-red-600 border-red-700 text-white' 
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Aka
            </button>
            <button
              onClick={() => setSenshu(senshu === 'blue' ? null : 'blue')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer border ${
                senshu === 'blue' 
                  ? 'bg-blue-600 border-blue-700 text-white' 
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Ao
            </button>
          </div>

          {/* Lados Aka / Ao */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-500">Lado do Aka / Ao:</span>
            <button
              onClick={() => setInvertSides(!invertSides)}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer border ${
                invertSides 
                  ? 'bg-amber-500 border-amber-600 text-slate-950' 
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {invertSides ? "Ao / Aka (Invertido)" : "Aka / Ao (Padrão)"}
            </button>
          </div>

          {/* Finalização manual */}
          <button
            onClick={() => handleFinalizeMatch()}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-2xl tracking-widest transition cursor-pointer shadow-lg shadow-red-900/10"
          >
            Encerrar e Salvar Luta
          </button>
        </div>

        {/* Painel AO (Blue) - Lado Direito */}
        <div className={`bg-blue-950/10 border-2 border-blue-900/40 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden ${invertSides ? 'order-1' : 'order-3'}`}>
          <div className="absolute top-0 right-0 w-2.5 h-full bg-blue-600" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {senshu === "blue" && (
                <span className="text-[9px] font-black uppercase bg-amber-500 text-amber-950 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Award className="w-3 h-3 fill-amber-950" />
                  Senshu
                </span>
              )}
              <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-900 ml-auto">
                AO (Azul)
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-100 truncate text-right">{match?.athlete_blue_name || "Azul"}</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase text-right">{match?.dojo_name || "Filial"}</p>
          </div>

          {/* Pontos Digitais Gigantes */}
          <div className="my-8 text-center">
            <span className="text-8xl font-black text-blue-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              {scoreBlue}
            </span>
          </div>

          {/* Controles de Pontos e Faltas */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleScore('blue', 1)}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +1 Yuko
              </button>
              <button
                onClick={() => handleScore('blue', 2)}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +2 Waza
              </button>
              <button
                onClick={() => handleScore('blue', 3)}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
              >
                +3 Ippon
              </button>
            </div>
            
            <div className="flex items-center justify-between border-t border-blue-900/30 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-blue-400">Penalidades:</span>
                <span className="text-xs font-bold text-blue-500 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">
                  {getPenaltyLabels(penaltiesBlue)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePenalty('blue', 'remove')}
                  disabled={penaltiesBlue === 0}
                  className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 rounded-lg border border-slate-800 cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handlePenalty('blue', 'add')}
                  disabled={penaltiesBlue === 4}
                  className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => setScoreBlue(prev => Math.max(0, prev - 1))}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-[10px] uppercase rounded-xl cursor-pointer"
            >
              Corrigir Pontuação (-1)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ScoreboardConsolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando painel do placar...</p>
      </div>
    }>
      <ScoreboardContent />
    </Suspense>
  );
}
