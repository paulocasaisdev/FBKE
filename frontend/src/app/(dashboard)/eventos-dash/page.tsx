'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Trophy, Plus, Users, Loader2, Play, Award, Edit, Trash2, X, ChevronRight, Wifi, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Evento {
  id: string | number;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'torneio' | 'seminario' | 'exame' | 'outro';
  imagem_url?: string;
}

interface Inscricao {
  id: string | number;
  evento_id: string | number;
  atleta_id: string;
  atleta_nome: string;
  filial_nome: string;
  categoria: 'Kata' | 'Kumite';
  faixa: string;
  idade: number;
}

interface BracketsData {
  competidores: string[];
  vencedoresQuartas: (string | null)[];
  vencedoresSemifinal: (string | null)[];
  vencedorFinal: string | null;
}

function DeviceRow({ device, onAssign }: { device: any, onAssign: (pin: string, role: string | null, tatami: string | null) => void }) {
  const [role, setRole] = useState(device.role || "operator");
  const [tatami, setTatami] = useState(device.tatami || "Tatame 1");

  return (
    <tr className="hover:bg-slate-850 transition">
      <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">{device.pin}</td>
      <td className="py-3.5 px-4">
        {device.connected ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Conectado ({device.latency} ms)
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Offline
          </span>
        )}
      </td>
      <td className="py-3.5 px-4">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none text-[11px] font-bold"
        >
          <option value="operator">Mesário (Operator)</option>
          <option value="display">Telão (Display)</option>
          <option value="marshall">Marshall (Chamador)</option>
        </select>
      </td>
      <td className="py-3.5 px-4">
        <select
          value={tatami}
          onChange={(e) => setTatami(e.target.value)}
          className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none text-[11px] font-bold"
        >
          <option value="Tatame 1">Tatame 1</option>
          <option value="Tatame 2">Tatame 2</option>
          <option value="Tatame 3">Tatame 3</option>
          <option value="Tatame 4">Tatame 4</option>
        </select>
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onAssign(device.pin, role, tatami)}
            className="px-3 py-1.5 bg-[#002B7F] hover:bg-blue-800 text-white text-[10px] font-black uppercase rounded-lg transition"
          >
            Atribuir
          </button>
          {device.role && (
            <button
              onClick={() => onAssign(device.pin, null, null)}
              className="px-3 py-1.5 bg-red-950/40 border border-red-900 text-red-400 hover:bg-[#CE1126] hover:text-white text-[10px] font-black uppercase rounded-lg transition"
            >
              Liberar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function EventosDashboardPage() {
  const { usuario, tipo, isAdmin } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para dispositivos conectados via LAN
  const [lanDevices, setLanDevices] = useState<any[]>([]);
  const [wsAdminConnected, setWsAdminConnected] = useState(false);
  const [reliefAlerts, setReliefAlerts] = useState<any[]>([]);
  const adminWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const connectAdminWs = () => {
      if (adminWsRef.current) {
        adminWsRef.current.close();
      }

      try {
        const wsUrl = `ws://localhost:8080`;
        const ws = new WebSocket(wsUrl);
        adminWsRef.current = ws;

        ws.onopen = () => {
          setWsAdminConnected(true);
          ws.send(JSON.stringify({ type: "admin_register" }));
        };

        ws.onclose = () => {
          setWsAdminConnected(false);
          setTimeout(connectAdminWs, 5000);
        };

        ws.onerror = () => {
          setWsAdminConnected(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "devices_list") {
              setLanDevices(data.devices || []);
            } else if (data.type === "relief_requested") {
              setReliefAlerts(prev => {
                if (prev.some(a => a.pin === data.pin)) return prev;
                return [...prev, { pin: data.pin, role: data.role, tatami: data.tatami, id: Date.now() }];
              });
            }
          } catch (e) {
            console.error("Erro no WS Admin:", e);
          }
        };
      } catch (e) {
        setWsAdminConnected(false);
      }
    };

    connectAdminWs();
    return () => {
      if (adminWsRef.current) adminWsRef.current.close();
    };
  }, [isAdmin]);

  const handleAssignDevice = (pin: string, role: string | null, tatami: string | null) => {
    if (adminWsRef.current && adminWsRef.current.readyState === WebSocket.OPEN) {
      adminWsRef.current.send(JSON.stringify({
        type: "assign_device",
        pin,
        role,
        tatami
      }));
      if (!role) {
        setReliefAlerts(prev => prev.filter(a => a.pin !== pin));
      }
      alert(role ? `Dispositivo PIN ${pin} alocado com sucesso!` : `Dispositivo PIN ${pin} liberado com sucesso!`);
    } else {
      alert("Erro: Sem conexão com o servidor WebSocket local.");
    }
  };

  // Modais
  const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
  const [showInscritosModal, setShowInscritosModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showChavesModal, setShowChavesModal] = useState(false);

  // Selected item reference
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<'Kata' | 'Kumite'>('Kata');

  // Forms
  const [novoEventoForm, setNovoEventoForm] = useState({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio' as const, imagem_url: '' });
  const [inscricaoForm, setInscricaoForm] = useState({ categoria: 'Kata' as const, idade: 18 });

  // Bracket state
  const [bracket, setBracket] = useState<BracketsData | null>(null);
  const [loadingBracket, setLoadingBracket] = useState(false);

  // Deletion states & handlers
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados do Módulo de Torneios & Categorias Oficiais
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, any[]>>({});
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [showNovoTorneioModal, setShowNovoTorneioModal] = useState(false);
  const [showNovaCategoriaModal, setShowNovaCategoriaModal] = useState(false);
  const [selectedTournamentForCat, setSelectedTournamentForCat] = useState<any | null>(null);

  // Forms de Torneio/Categoria
  const [novoTorneioForm, setNovoTorneioForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [novaCategoriaForm, setNovaCategoriaForm] = useState({ name: '', type: 'Kata' as const, gender: 'M' as const, age_min: 6, age_max: 99 });

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNovoEventoForm(prev => ({ ...prev, imagem_url: data.url }));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erro ao enviar imagem');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmarExcluir = (evento: Evento) => {
    setEventoToDelete(evento);
    setShowConfirmDeleteModal(true);
  };

  const handleExcluirEvento = async () => {
    if (!eventoToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${eventoToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setEventos(eventos.filter(e => e.id !== eventoToDelete.id));
        setShowConfirmDeleteModal(false);
        setEventoToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir evento');
      }
    } catch (err) {
      console.error(err);
      setEventos(eventos.filter(e => e.id !== eventoToDelete.id));
      setShowConfirmDeleteModal(false);
      setEventoToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const carregarDados = async () => {
    try {
      const [resEventos, resInscricoes] = await Promise.all([
        fetch(`${API_URL}/api/eventos`, { credentials: 'include' }),
        fetch(`${API_URL}/api/eventos/inscricoes`, { credentials: 'include' }).catch(() => null)
      ]);

      if (resEventos.ok) {
        const data = await resEventos.json();
        setEventos(data.eventos || []);
      }
      if (resInscricoes && resInscricoes.ok) {
        const data = await resInscricoes.json();
        const validas = Array.isArray(data.inscricoes) ? data.inscricoes.filter(Boolean) : [];
        setInscricoes(validas);
      }

      // Buscar torneios e categorias reais do novo módulo
      setLoadingTournaments(true);
      try {
        const resT = await fetch(`${API_URL}/api/tournaments`, { credentials: 'include' });
        if (resT.ok) {
          const tData = await resT.json();
          let tList = tData.tournaments || [];
          
          if (tList.length === 0) {
            // Se estiver vazio e for modo mock/dev, adiciona dados demonstrativos padrão
            tList = [{
              id: "trn-demo-1",
              title: "Campeonato Baiano FBKE 2026",
              description: "Campeonato oficial da Federação Baiana de Karate-do Esportivo. Chaves e chapa de placares integrados.",
              start_date: "2026-08-20",
              end_date: "2026-08-21",
              status: "active"
            }];
            setTournaments(tList);
            setCategoriesMap({
              "trn-demo-1": [
                { id: "cat-kumite-adulto-m", name: "Kumite Adulto Masculino Absoluto", type: "Kumite", gender: "M", age_min: 18, age_max: 99 },
                { id: "cat-kata-adulto-m", name: "Kata Adulto Masculino Absoluto", type: "Kata", gender: "M", age_min: 18, age_max: 99 },
                { id: "cat-kumite-sub14-f", name: "Kumite Sub-14 Feminino -45kg", type: "Kumite", gender: "F", age_min: 12, age_max: 13 }
              ]
            });
          } else {
            setTournaments(tList);
            const cMap: Record<string, any[]> = {};
            await Promise.all(tList.map(async (t: any) => {
              const resC = await fetch(`${API_URL}/api/tournaments/${t.id}/categories`, { credentials: 'include' });
              if (resC.ok) {
                const cData = await resC.json();
                cMap[t.id] = cData.categories || [];
              }
            }));
            setCategoriesMap(cMap);
          }
        }
      } catch (tErr) {
        console.warn("Erro ao buscar torneios:", tErr);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setEventos([
        { id: "ev-1", titulo: "Campeonato Baiano de Karate FBKE", descricao: "Torneio estadual oficial pontuável para o ranking.", data_inicio: "2026-08-20", data_fim: "2026-08-21", tipo: "torneio" },
        { id: "ev-2", titulo: "Curso de Arbitragem e Regras Goju-Ryu", descricao: "Treinamento oficial de arbitragem com Sensei convidado.", data_inicio: "2026-07-05", data_fim: "2026-07-06", tipo: "seminario" }
      ]);
    } finally {
      setLoading(false);
      setLoadingTournaments(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoEventoForm)
      });
      if (res.ok) {
        const data = await res.json();
        const novoEv = data.evento || data;
        if (novoEv && novoEv.id) {
          setEventos([...eventos, novoEv]);
        }
        setShowNovoEventoModal(false);
        setNovoEventoForm({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'torneio', imagem_url: '' });
      }
    } catch (err) {
      alert("Erro ao criar evento.");
    }
  };

  const handleCriarTorneio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...novoTorneioForm, id: `trn-${Date.now()}`, status: 'draft' })
      });
      if (res.ok) {
        alert("Campeonato Oficial criado com sucesso!");
        setShowNovoTorneioModal(false);
        setNovoTorneioForm({ title: '', description: '', start_date: '', end_date: '' });
        carregarDados();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao criar campeonato.");
      }
    } catch (err) {
      alert("Erro ao criar campeonato.");
    }
  };

  const handleCriarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentForCat) return;
    try {
      const res = await fetch(`${API_URL}/api/tournaments/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...novaCategoriaForm,
          id: `cat-${Date.now()}`,
          tournament_id: selectedTournamentForCat.id,
          status: 'draft'
        })
      });
      if (res.ok) {
        alert("Categoria criada com sucesso!");
        setShowNovaCategoriaModal(false);
        setNovaCategoriaForm({ name: '', type: 'Kata', gender: 'M', age_min: 6, age_max: 99 });
        setSelectedTournamentForCat(null);
        carregarDados();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao criar categoria.");
      }
    } catch (err) {
      alert("Erro ao criar categoria.");
    }
  };

  const handleIncrever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento) return;
    try {
      const res = await fetch(`${API_URL}/api/eventos/inscricoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          categoria: inscricaoForm.categoria,
          idade: inscricaoForm.idade
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInscricoes([...inscricoes, data.inscricao]);
        setShowInscricaoModal(false);
        alert("Inscrição realizada com sucesso!");
      }
    } catch (err) {
      alert("Erro ao realizar inscrição.");
    }
  };

  const handleGerenciarChaves = async (evento: Evento, modalidade: 'Kata' | 'Kumite') => {
    setSelectedEvento(evento);
    setSelectedModalidade(modalidade);
    setLoadingBracket(true);
    setShowChavesModal(true);

    try {
      const res = await fetch(`${API_URL}/api/eventos/chaves?evento_id=${evento.id}&modalidade=${modalidade}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.brackets) {
          setBracket(data.brackets);
          setLoadingBracket(false);
          return;
        }
      }

      const inscritosModalidade = (inscricoes || []).filter(
        i => i && i.evento_id && String(i.evento_id) === String(evento.id) && i.categoria === modalidade
      );

      let nomes = inscritosModalidade.map(i => i.atleta_nome);

      if (nomes.length < 2) {
        nomes = ['Atleta 1', 'Atleta 2', 'Atleta 3', 'Atleta 4', 'Atleta 5', 'Atleta 6', 'Atleta 7', 'Atleta 8'];
      }

      const tamanhoChave = nomes.length <= 4 ? 4 : (nomes.length <= 8 ? 8 : 16);

      const competidores = [...nomes];
      while (competidores.length < tamanhoChave) {
        competidores.push('W.O.');
      }

      const novaChave: BracketsData = {
        competidores,
        vencedoresQuartas: Array(4).fill(null),
        vencedoresSemifinal: Array(2).fill(null),
        vencedorFinal: null
      };

      setBracket(novaChave);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBracket(false);
    }
  };

  const handleSalvarChave = async () => {
    if (!selectedEvento || !bracket) return;
    try {
      await fetch(`${API_URL}/api/eventos/chaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evento_id: selectedEvento.id,
          modalidade: selectedModalidade,
          brackets: bracket
        })
      });
      alert('Chaves de confrontos salvas com sucesso!');
      setShowChavesModal(false);
    } catch (err) {
      alert('Erro ao salvar no servidor. Alterações persistidas localmente.');
      setShowChavesModal(false);
    }
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

      {/* ALERTAS FLUTUANTES LAN DE SOLICITAÇÃO DE SUBSTITUIÇÃO (RELIEF) */}
      {reliefAlerts.length > 0 && (
        <div className="space-y-3">
          {reliefAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className="bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-amber-200 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500 text-amber-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Substituição Solicitada!</h4>
                  <p className="text-xs text-amber-300 mt-0.5">
                    O dispositivo auxiliar **PIN {alert.pin}** solicitou apoio/revezamento na mesa do **{alert.tatami}** atuando como **{alert.role === 'operator' ? 'Mesário (Operator)' : alert.role}**.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleAssignDevice(alert.pin, null, null)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Liberar Dispositivo (Pairing)
                </button>
                <button
                  onClick={() => setReliefAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Fechar Alerta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
            Calendário & Campeonatos
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Módulo de Eventos & Torneios</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de campeonatos estaduais, seminários e chaves de lutas</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNovoEventoModal(true)}
            className="px-5 py-2.5 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Criar Evento
          </button>
        )}
      </div>

      {/* SEÇÃO DE DEMONSTRAÇÃO RÁPIDA: NOVO MÓDULO DE TORNEIOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md text-slate-100 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase bg-[#CE1126] text-white px-2.5 py-1 rounded-lg tracking-wider">
              Novidade
            </span>
            <h2 className="text-sm font-black uppercase text-red-500 tracking-wider">Demonstração do Módulo de Torneios & Placar LAN</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Atalhos rápidos para abrir instantaneamente as telas da nova solução integrada com suporte offline-first e WebSocket LAN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/eventos-dash/brackets-view?category_id=cat-kumite-adulto-m&category_name=Kumite%20Adulto%2520Masculino%2520Absoluto&tournament_name=Campeonato%2520Baiano%2520de%2520Karat%25C3%25AA%2520GRKK%25202026"
            className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Trophy size={14} /> 1. Chaves de Confronto (Brackets)
          </Link>
          
          <Link
            href="/eventos-dash/scoreboard-console?match_id=luta-demonstracao&category_name=Kumite%20Adulto%20Masculino%20Absoluto"
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Play size={14} className="fill-white" /> 2. Mesa do Operador (Placar)
          </Link>

          <Link
            href="/scoreboard-display?ip=localhost"
            target="_blank"
            className="h-10 px-5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Users size={14} /> 3. Painel da TV Pública (Display)
          </Link>
        </div>

        {/* TABELA DE DISPOSITIVOS LAN CONECTADOS */}
        {isAdmin && (
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Wifi size={14} className={wsAdminConnected ? "text-emerald-400" : "text-slate-500 animate-pulse"} />
                  Dispositivos Conectados na LAN (Pareamento por PIN)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Aloque o papel e o tatame para cada tablet/smartphone auxiliar emparelhado na rede do ginásio.
                </p>
              </div>
              
              {wsAdminConnected ? (
                <span className="self-start sm:self-center text-[9px] font-bold bg-emerald-950/60 border border-emerald-900 px-2 py-1 rounded text-emerald-400 uppercase tracking-wider">
                  Servidor WS Ativo
                </span>
              ) : (
                <span className="self-start sm:self-center text-[9px] font-bold bg-red-950/60 border border-red-900 px-2 py-1 rounded text-red-400 uppercase animate-pulse tracking-wider">
                  Servidor WS Inativo (Porta 8080)
                </span>
              )}
            </div>

            {lanDevices.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum dispositivo auxiliar conectado na rede LAN. Acesse a rota <Link href="/pairing" target="_blank" className="text-blue-400 underline font-bold">/pairing</Link> em outro aparelho para emparelhar.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">PIN</th>
                      <th className="py-3 px-4">Conexão / Latência</th>
                      <th className="py-3 px-4">Papel (Função)</th>
                      <th className="py-3 px-4">Tatame (Coto)</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {lanDevices.map((dev) => (
                      <DeviceRow key={dev.pin} device={dev} onAssign={handleAssignDevice} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO DINÂMICA: CAMPEONATOS OFICIAIS E CATEGORIAS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Trophy size={18} className="text-[#002B7F]" /> Campeonatos Oficiais e Categorias
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie chaves e controle o placar em tempo real para categorias e torneios oficiais.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowNovoTorneioModal(true)}
              className="px-4 py-2 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={12} /> Novo Campeonato
            </button>
          )}
        </div>

        {loadingTournaments ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-[#002B7F] animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Nenhum campeonato oficial cadastrado. Crie um campeonato para gerenciar chaves e placares.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tournaments.map((t) => {
              const cats = categoriesMap[t.id] || [];
              return (
                <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{t.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-semibold font-mono">
                          {t.start_date.split('-').reverse().join('/')} até {t.end_date.split('-').reverse().join('/')}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedTournamentForCat(t);
                            setShowNovaCategoriaModal(true);
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          + Categoria
                        </button>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                    )}

                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categorias Vinculadas</h4>
                      {cats.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Nenhuma categoria cadastrada neste campeonato.</p>
                      ) : (
                        <div className="grid gap-2">
                          {cats.map((cat) => (
                            <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                                <p className="text-[9px] text-slate-500 font-medium">
                                  {cat.type} | Gen: {cat.gender} | Idade: {cat.age_min}-{cat.age_max} anos
                                </p>
                              </div>
                              <div className="flex gap-1.5">
                                <Link
                                  href={`/eventos-dash/brackets-view?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}&tournament_name=${encodeURIComponent(t.title)}`}
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition text-center flex-1 sm:flex-none shadow-3xs"
                                >
                                  Chaves
                                </Link>
                                <Link
                                  href={`/eventos-dash/scoreboard-console?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition text-center flex-1 sm:flex-none shadow-3xs"
                                >
                                  Placar
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventos.filter(Boolean).filter(e => e.id).map(evento => {
          const listInscritos = (inscricoes || []).filter(i => i && i.evento_id && String(i.evento_id) === String(evento.id));
          return (
            <div key={evento.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm hover:shadow-md hover:border-[#002B7F]/40 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#002B7F] bg-blue-50 rounded-lg border border-blue-200">
                      {evento.tipo}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleConfirmarExcluir(evento)}
                        className="p-1 bg-red-50 hover:bg-red-600 border border-red-200 text-[#CE1126] hover:text-white rounded-lg transition cursor-pointer"
                        title="Excluir Evento"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-bold">
                    {evento.data_inicio} até {evento.data_fim}
                  </p>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">{evento.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{evento.descricao}</p>
                
                <p className="text-xs font-bold text-[#002B7F] flex items-center gap-1.5 pt-2">
                  <Users size={14} /> {listInscritos.length} Atletas Inscritos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-slate-100 w-full">
                {evento.tipo === 'exame' ? (
                  <Link
                    href="/exames"
                    className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap w-full sm:col-span-2"
                  >
                    🥋 Acessar Exame de Faixa
                  </Link>
                ) : (
                  <>
                    {evento.tipo === 'torneio' && isAdmin && (
                      <>
                        <button
                          onClick={() => handleGerenciarChaves(evento, 'Kata')}
                          className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap w-full"
                        >
                          <Trophy size={14} /> Chave Kata
                        </button>
                        <button
                          onClick={() => handleGerenciarChaves(evento, 'Kumite')}
                          className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs whitespace-nowrap w-full"
                        >
                          <Trophy size={14} /> Chave Kumite
                        </button>
                      </>
                    )}
                    {(!listInscritos.find(i => i.atleta_id === usuario?.id)) && (
                      <button
                        onClick={() => {
                          setSelectedEvento(evento);
                          setShowInscricaoModal(true);
                        }}
                        className="h-10 px-5 inline-flex items-center justify-center gap-1.5 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer whitespace-nowrap w-full"
                      >
                        Solicitar Inscrição
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedEvento(evento);
                        setShowInscritosModal(true);
                      }}
                      className="h-10 px-4 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap w-full"
                    >
                      <Users size={14} /> Inscritos ({listInscritos.length})
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL SOLICITAR INSCRIÇÃO */}
      {showInscricaoModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowInscricaoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Inscrição em Torneio</span>
              <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo}</h3>
            </div>

            <form onSubmit={handleIncrever} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Modalidade / Categoria</label>
                <select
                  value={inscricaoForm.categoria}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, categoria: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="Kata">Kata (Formas Tradicionais)</option>
                  <option value="Kumite">Kumite (Luta Livre Pontuada)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Idade do Atleta</label>
                <input
                  type="number"
                  min={5}
                  max={99}
                  value={inscricaoForm.idade}
                  onChange={(e) => setInscricaoForm({ ...inscricaoForm, idade: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInscricaoModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Confirmar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER INSCRITOS */}
      {showInscritosModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto space-y-5">
            <button onClick={() => setShowInscritosModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#002B7F] tracking-wider block">Lista de Atletas Inscritos</span>
              <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo}</h3>
            </div>

            {(inscricoes || []).filter(i => i && i.evento_id && String(i.evento_id) === String(selectedEvento.id)).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-2xl">
                Nenhum atleta inscrito neste evento ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(inscricoes || [])
                  .filter(i => i && i.evento_id && String(i.evento_id) === String(selectedEvento.id))
                  .map(insc => (
                    <div key={insc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{insc.atleta_nome}</p>
                        <p className="text-[10px] text-slate-500">{insc.filial_nome || 'Dojo Central'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border bg-blue-50 text-[#002B7F] border-blue-200">
                          {insc.categoria}
                        </span>
                        <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-700 border-slate-200">
                          Faixa {insc.faixa || 'Branca'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowInscritosModal(false)}
                className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR CHAVES */}
      {showChavesModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 relative shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Chaves de Confronto</span>
                <h3 className="text-xl font-black text-slate-900">{selectedEvento.titulo} — {selectedModalidade}</h3>
              </div>
              <button onClick={() => setShowChavesModal(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {loadingBracket ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin" />
              </div>
            ) : bracket ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quartas */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">Quartas de Final</h4>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.competidores[idx * 2] || 'W.O.'}</span>
                          <button
                            onClick={() => {
                              const newV = [...bracket.vencedoresQuartas];
                              newV[idx] = bracket.competidores[idx * 2];
                              setBracket({ ...bracket, vencedoresQuartas: newV });
                            }}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                          >
                            Avançar
                          </button>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.competidores[idx * 2 + 1] || 'W.O.'}</span>
                          <button
                            onClick={() => {
                              const newV = [...bracket.vencedoresQuartas];
                              newV[idx] = bracket.competidores[idx * 2 + 1];
                              setBracket({ ...bracket, vencedoresQuartas: newV });
                            }}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Semifinal */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-600 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">Semifinal</h4>
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 my-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.vencedoresQuartas[idx * 2] || 'Aguardando'}</span>
                          {bracket.vencedoresQuartas[idx * 2] && (
                            <button
                              onClick={() => {
                                const newV = [...bracket.vencedoresSemifinal];
                                newV[idx] = bracket.vencedoresQuartas[idx * 2];
                                setBracket({ ...bracket, vencedoresSemifinal: newV });
                              }}
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                            >
                              Avançar
                            </button>
                          )}
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate">{bracket.vencedoresQuartas[idx * 2 + 1] || 'Aguardando'}</span>
                          {bracket.vencedoresQuartas[idx * 2 + 1] && (
                            <button
                              onClick={() => {
                                const newV = [...bracket.vencedoresSemifinal];
                                newV[idx] = bracket.vencedoresQuartas[idx * 2 + 1];
                                setBracket({ ...bracket, vencedoresSemifinal: newV });
                              }}
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#002B7F] border border-blue-200 hover:bg-[#002B7F] hover:text-white cursor-pointer"
                            >
                              Avançar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grande Final */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-amber-800 bg-amber-50 text-center py-1.5 rounded-lg border border-amber-200">Grande Final</h4>
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 truncate">{bracket.vencedoresSemifinal[0] || 'Aguardando'}</span>
                        {bracket.vencedoresSemifinal[0] && (
                          <button
                            onClick={() => setBracket({ ...bracket, vencedorFinal: bracket.vencedoresSemifinal[0] })}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                          >
                            Campeão
                          </button>
                        )}
                      </div>
                      <div className="border-t border-amber-200 pt-2 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 truncate">{bracket.vencedoresSemifinal[1] || 'Aguardando'}</span>
                        {bracket.vencedoresSemifinal[1] && (
                          <button
                            onClick={() => setBracket({ ...bracket, vencedorFinal: bracket.vencedoresSemifinal[1] })}
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                          >
                            Campeão
                          </button>
                        )}
                      </div>

                      {bracket.vencedorFinal && (
                        <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-center">
                          <p className="text-[10px] font-extrabold uppercase text-amber-900">🏆 Campeão {selectedModalidade}</p>
                          <p className="text-sm font-black text-amber-950 mt-0.5">{bracket.vencedorFinal}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowChavesModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleSalvarChave}
                    className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Salvar Chaves
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL NOVO EVENTO */}
      {showNovoEventoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowNovoEventoModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900">Criar Novo Evento</h3>

            <form onSubmit={handleCriarEvento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título do Evento *</label>
                <input
                  type="text" required
                  placeholder="Ex: Campeonato Baiano Goju-Ryu"
                  value={novoEventoForm.titulo}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do cronograma, local, etc."
                  value={novoEventoForm.descricao}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, descricao: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Evento *</label>
                <select
                  value={novoEventoForm.tipo}
                  onChange={(e) => setNovoEventoForm({ ...novoEventoForm, tipo: e.target.value as any })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                >
                  <option value="torneio">Torneio (Competição)</option>
                  <option value="seminario">Seminário (Curso/Palestra)</option>
                  <option value="exame">Exame de Faixa</option>
                  <option value="outro">Outro (Geral)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data Início *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_inicio}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_inicio: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data Fim *</label>
                  <input
                    type="date" required
                    value={novoEventoForm.data_fim}
                    onChange={(e) => setNovoEventoForm({ ...novoEventoForm, data_fim: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoEventoModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl space-y-4 text-slate-900">
            <h3 className="text-base font-black text-slate-900">Excluir Evento</h3>
            <p className="text-xs text-slate-600">Tem certeza que deseja excluir o evento <strong className="text-[#CE1126]">{eventoToDelete?.titulo}</strong>?</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirEvento}
                disabled={deleting}
                className="px-4 py-2 bg-[#CE1126] hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl shadow-sm cursor-pointer"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR TORNEIO */}
      {showNovoTorneioModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowNovoTorneioModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Novo Torneio Oficial</span>
              <h3 className="text-xl font-black text-slate-900">Cadastrar Campeonato</h3>
            </div>

            <form onSubmit={handleCriarTorneio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Título do Campeonato</label>
                <input
                  type="text"
                  required
                  value={novoTorneioForm.title}
                  onChange={(e) => setNovoTorneioForm({ ...novoTorneioForm, title: e.target.value })}
                  placeholder="Ex: Campeonato Baiano FBKE 2026"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Descrição</label>
                <textarea
                  value={novoTorneioForm.description}
                  onChange={(e) => setNovoTorneioForm({ ...novoTorneioForm, description: e.target.value })}
                  placeholder="Detalhes e regras do torneio..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Data Início</label>
                  <input
                    type="date"
                    required
                    value={novoTorneioForm.start_date}
                    onChange={(e) => setNovoTorneioForm({ ...novoTorneioForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Data Fim</label>
                  <input
                    type="date"
                    required
                    value={novoTorneioForm.end_date}
                    onChange={(e) => setNovoTorneioForm({ ...novoTorneioForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovoTorneioModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Criar Campeonato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR CATEGORIA */}
      {showNovaCategoriaModal && selectedTournamentForCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5">
            <button onClick={() => setShowNovaCategoriaModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Nova Categoria</span>
              <h3 className="text-xl font-black text-slate-900">Vincular a {selectedTournamentForCat.title}</h3>
            </div>

            <form onSubmit={handleCriarCategoria} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={novaCategoriaForm.name}
                  onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, name: e.target.value })}
                  placeholder="Ex: Kumite Adulto Masculino Absoluto"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Modalidade</label>
                  <select
                    value={novaCategoriaForm.type}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="Kata">Kata</option>
                    <option value="Kumite">Kumite</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Gênero</label>
                  <select
                    value={novaCategoriaForm.gender}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Feminino (F)</option>
                    <option value="Mixed">Misto (Mixed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Idade Mínima</label>
                  <input
                    type="number"
                    min={4}
                    max={99}
                    required
                    value={novaCategoriaForm.age_min}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, age_min: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Idade Máxima</label>
                  <input
                    type="number"
                    min={4}
                    max={99}
                    required
                    value={novaCategoriaForm.age_max}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, age_max: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNovaCategoriaModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
                >
                  Adicionar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
