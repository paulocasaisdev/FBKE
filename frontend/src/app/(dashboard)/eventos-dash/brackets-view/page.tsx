"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Award, Zap, RefreshCw, Layers } from "lucide-react";
import Link from "next/link";
import { karateDb, OfflineMatch } from "@/utils/indexedDb";

// URL base da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function BracketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryId = searchParams.get("category_id");
  const categoryName = searchParams.get("category_name") || "Categoria do Torneio";
  const tournamentName = searchParams.get("tournament_name") || "Campeonato";

  const [matches, setMatches] = useState<OfflineMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Monitora conectividade
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Carrega chaves (matches)
  const loadMatches = async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);

    // 1. Tenta carregar localmente do IndexedDB primeiro (offline-first)
    try {
      const localMatches = await karateDb.getMatchesByCategory(categoryId);
      if (localMatches && localMatches.length > 0) {
        setMatches(localMatches);
        setLoading(false);
        
        // Se estiver online, atualiza em segundo plano a partir do servidor
        if (navigator.onLine) {
          fetchMatchesFromServer();
        }
        return;
      }
    } catch (err) {
      console.warn("Erro ao ler IndexedDB:", err);
    }

    // 2. Se não houver dados locais, carrega do servidor
    fetchMatchesFromServer();
  };

  const fetchMatchesFromServer = async () => {
    if (!categoryId) return;
    try {
      const res = await fetch(`${API_URL}/api/tournaments/categories/${categoryId}/matches`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Erro ao carregar confrontos do servidor.");
      const data = await res.json();
      
      const serverMatches = data.matches || [];
      setMatches(serverMatches);
      
      // Salva no IndexedDB localmente para cache offline
      if (serverMatches.length > 0) {
        await karateDb.saveMatches(serverMatches);
      }
    } catch (err: any) {
      console.error(err);
      if (matches.length === 0) {
        setError("Não foi possível carregar as chaves. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [categoryId]);

  // Gera a chave usando a API
  const handleGenerateBracket = async () => {
    if (isOffline) {
      alert("A geração inicial de chaves requer uma conexão com a internet para carregar e processar as inscrições oficiais.");
      return;
    }

    if (!confirm("Isso excluirá quaisquer chaves existentes para esta categoria e gerará novas chaves de confrontos. Confirmar?")) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/tournaments/categories/${categoryId}/generate-bracket`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao gerar chave.");
      }
      const data = await res.json();
      setMatches(data.matches || []);
      await karateDb.saveMatches(data.matches || []);
      alert("Chave gerada com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao gerar chave.");
    } finally {
      setGenerating(false);
    }
  };

  // Agrupa as lutas por número de rodada
  const roundsMap: { [key: number]: OfflineMatch[] } = {};
  matches.forEach(m => {
    roundsMap[m.round_number] = roundsMap[m.round_number] || [];
    roundsMap[m.round_number].push(m);
  });

  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-red-950 text-red-500 border border-red-800 px-2 py-0.5 rounded-md tracking-widest">
                Chaves de Luta
              </span>
              {isOffline && (
                <span className="text-[10px] font-black uppercase bg-amber-950 text-amber-500 border border-amber-800 px-2 py-0.5 rounded-md tracking-widest animate-pulse">
                  Modo Offline
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-100 mt-1">{categoryName}</h1>
            <p className="text-xs text-slate-400">{tournamentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMatches}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
          
          <button
            onClick={handleGenerateBracket}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-lg shadow-red-900/20"
          >
            <Layers className="w-3.5 h-3.5" />
            {generating ? "Gerando..." : "Gerar Confrontos"}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Buscando chaveamento...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <Zap className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-200">Falha ao carregar confrontos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <button
              onClick={loadMatches}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-6">
            <Award className="w-16 h-16 text-slate-700 mx-auto animate-bounce" />
            <div>
              <h3 className="text-lg font-black text-slate-200">Nenhum confronto gerado ainda</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                As inscrições foram confirmadas! Gere a chave de confrontos de eliminação simples com proteção de dojo clicando no botão abaixo.
              </p>
            </div>
            <button
              onClick={handleGenerateBracket}
              disabled={generating}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl tracking-wider transition cursor-pointer"
            >
              {generating ? "Processando..." : "Gerar Chave de Confrontos"}
            </button>
          </div>
        ) : (
          /* Tree View */
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-12 min-w-max px-4 py-8 items-stretch justify-around">
              {rounds.map((roundNum, roundIdx) => {
                const roundMatches = roundsMap[roundNum] || [];
                const isFinal = roundIdx === rounds.length - 1;
                const roundTitle = isFinal 
                  ? "Grande Final" 
                  : roundIdx === rounds.length - 2 
                    ? "Semifinal" 
                    : roundIdx === rounds.length - 3 
                      ? "Quartas de Final"
                      : `Rodada ${roundNum}`;

                return (
                  <div key={roundNum} className="flex flex-col w-72">
                    <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest text-center mb-6 bg-slate-900/80 border border-slate-800/80 py-2 rounded-xl">
                      {roundTitle}
                    </h2>
                    
                    <div className="flex flex-col justify-around flex-grow gap-8">
                      {roundMatches.map(match => {
                        const isRedWinner = match.winner_id === match.athlete_red_id && match.winner_id !== null;
                        const isBlueWinner = match.winner_id === match.athlete_blue_id && match.winner_id !== null;
                        const isBye = match.status === "bye";

                        return (
                          <div
                            key={match.id}
                            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl hover:border-slate-700 transition flex flex-col justify-between gap-3 relative"
                          >
                            {/* Número da Luta */}
                            <span className="absolute -top-3 left-3 bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 px-2 py-0.5 rounded-md">
                              Luta {match.match_order}
                            </span>

                            {/* Competidores */}
                            <div className="space-y-2 mt-1">
                              {/* AKA (Red) */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate max-w-[180px]">
                                  <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                                  <span className={`font-semibold truncate ${
                                    isRedWinner ? "text-red-500 font-extrabold" : 
                                    isBlueWinner ? "text-slate-600 line-through" : "text-slate-200"
                                  }`}>
                                    {match.athlete_red_name || (isBye ? "BYE" : "Aguardando")}
                                  </span>
                                </div>
                                <span className={`font-black text-xs ${isRedWinner ? "text-red-500 scale-110" : "text-slate-400"}`}>
                                  {isBye && !match.athlete_red_name ? "-" : match.score_red}
                                </span>
                              </div>

                              {/* Divisor */}
                              <div className="border-t border-slate-800/60" />

                              {/* AO (Blue) */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate max-w-[180px]">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                                  <span className={`font-semibold truncate ${
                                    isBlueWinner ? "text-blue-400 font-extrabold" : 
                                    isRedWinner ? "text-slate-600 line-through" : "text-slate-200"
                                  }`}>
                                    {match.athlete_blue_name || (isBye ? "BYE" : "Aguardando")}
                                  </span>
                                </div>
                                <span className={`font-black text-xs ${isBlueWinner ? "text-blue-400 scale-110" : "text-slate-400"}`}>
                                  {isBye && !match.athlete_blue_name ? "-" : match.score_blue}
                                </span>
                              </div>
                            </div>

                            {/* Status e Ação */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[10px]">
                              <span className={`font-bold uppercase tracking-wider ${
                                match.status === "finished" ? "text-green-500" :
                                match.status === "ongoing" ? "text-amber-500 animate-pulse" :
                                match.status === "bye" ? "text-slate-500" : "text-slate-400"
                              }`}>
                                {match.status === "finished" ? "Finalizada" :
                                 match.status === "ongoing" ? "Em Andamento" :
                                 match.status === "bye" ? "W.O. / BYE" : "Agendada"}
                              </span>

                              {/* Apenas libera botão de iniciar se tiver atletas definidos e não for finalizada/bye */}
                              {match.status !== "finished" && match.status !== "bye" && match.athlete_red_id && match.athlete_blue_id ? (
                                <Link
                                  href={`/eventos-dash/scoreboard-console?match_id=${match.id}&category_name=${encodeURIComponent(categoryName)}`}
                                  className="flex items-center gap-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold px-2.5 py-1 rounded-lg border border-red-900/30 transition cursor-pointer"
                                >
                                  <Play className="w-2.5 h-2.5 fill-red-500" />
                                  Placar
                                </Link>
                              ) : match.status === "finished" ? (
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fim</span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BracketsViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando chaveamento...</p>
      </div>
    }>
      <BracketsContent />
    </Suspense>
  );
}
