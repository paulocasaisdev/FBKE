'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, ClipboardCheck, Calendar, User, Search, 
  Check, X, AlertCircle, Save, Clock, Award, ChevronRight 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Atleta {
  id: string;
  nome: string;
  email: string;
  faixa: string;
  filial_id: string;
}

interface PresencaRegistro {
  id: string;
  atleta_id: string;
  data: string;
  status: 'presente' | 'falta' | 'justificado';
}

export default function FrequenciaPage() {
  const { usuario, isFilial, isAdmin } = useAuth();
  const [dataAula, setDataAula] = useState<string>(new Date().toISOString().split('T')[0]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [busca, setBusca] = useState('');
  
  // Status de presença atual mapeado por atleta_id
  const [folhaPresenca, setFolhaPresenca] = useState<Record<string, 'presente' | 'falta' | 'justificado'>>({});
  
  // Histórico de chamadas salvas
  const [datasLancadas, setDatasLancadas] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carrega atletas da filial e histórico de chamadas
  const inicializarDados = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resAtletas = await fetch(`${API_URL}/api/atletas`, { credentials: 'include' });
      if (!resAtletas.ok) throw new Error("Erro ao carregar atletas.");
      const dataAtl = await resAtletas.json();
      const atletasLista = dataAtl.atletas || [];
      setAtletas(atletasLista);

      const folhaInicial: Record<string, 'presente' | 'falta' | 'justificado'> = {};
      atletasLista.forEach((a: Atleta) => {
        folhaInicial[a.id] = 'presente';
      });
      setFolhaPresenca(folhaInicial);

      const resPresencas = await fetch(`${API_URL}/api/presencas`, { credentials: 'include' });
      if (resPresencas.ok) {
        const dataPres = await resPresencas.json();
        const listaPres: PresencaRegistro[] = dataPres.presencas || [];
        
        const datasUnicas = Array.from(new Set(listaPres.map(p => p.data.split('T')[0])));
        datasUnicas.sort((a, b) => b.localeCompare(a));
        setDatasLancadas(datasUnicas);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const carregarChamadaNaData = async (dataSelecionada: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/presencas?data=${dataSelecionada}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const presencasData: PresencaRegistro[] = data.presencas || [];
        
        if (presencasData.length > 0) {
          const novaFolha: Record<string, 'presente' | 'falta' | 'justificado'> = {};
          atletas.forEach(a => { novaFolha[a.id] = 'presente'; });
          
          presencasData.forEach(p => {
            novaFolha[p.atleta_id] = p.status;
          });
          setFolhaPresenca(novaFolha);
          setSuccessMsg(`Chamada de ${formatarDataExibicao(dataSelecionada)} carregada para visualização/edição.`);
        } else {
          const folhaPadrao: Record<string, 'presente' | 'falta' | 'justificado'> = {};
          atletas.forEach(a => { folhaPadrao[a.id] = 'presente'; });
          setFolhaPresenca(folhaPadrao);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    inicializarDados();
  }, []);

  useEffect(() => {
    if (dataAula) {
      carregarChamadaNaData(dataAula);
    }
  }, [dataAula]);

  const handleStatusChange = (atletaId: string, status: 'presente' | 'falta' | 'justificado') => {
    setFolhaPresenca(prev => ({ ...prev, [atletaId]: status }));
  };

  const handleSalvarChamada = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const presencasPayload = Object.entries(folhaPresenca).map(([atleta_id, status]) => ({
        atleta_id,
        status
      }));

      const res = await fetch(`${API_URL}/api/presencas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          data: dataAula,
          presencas: presencasPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar lista de chamada.");

      setSuccessMsg(`Chamada do dia ${formatarDataExibicao(dataAula)} registrada com sucesso!`);
      if (!datasLancadas.includes(dataAula)) {
        setDatasLancadas(prev => [dataAula, ...prev].sort((a, b) => b.localeCompare(a)));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro de conexão ao salvar presença.");
    } finally {
      setSaving(false);
    }
  };

  const formatarDataExibicao = (isoString: string) => {
    if (!isoString) return '';
    const [ano, mes, dia] = isoString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const atletasFiltrados = atletas.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase()) ||
    a.faixa.toLowerCase().includes(busca.toLowerCase())
  );

  if (!isFilial && !isAdmin) {
    return (
      <main className="p-6 max-w-4xl mx-auto text-center mt-12 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#CE1126] mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900">Acesso Restrito</h2>
          <p className="text-xs text-slate-500 mt-2">Apenas Filiais (Dojos) e Administradores podem registrar frequência de atletas.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Cabeçalho de Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-[#002B7F]">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Controle de Treinos
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Frequência e Presença de Atletas</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Lançamento de Chamada Diária e Diário de Treino do Dojo</p>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-[#CE1126] font-semibold">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-semibold">
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal de Chamada */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* Header do Lançamento */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-[#002B7F]" size={18} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Selecionar Data do Treino</span>
              </div>
              <input 
                type="date" 
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#002B7F] font-mono font-bold"
              />
            </div>

            {/* Busca rápida */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Pesquisar atleta por nome, e-mail ou faixa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B7F]"
                />
              </div>
            </div>

            {/* Listagem dos Atletas */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-[#002B7F] animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-bold tracking-wider">Carregando lista de alunos...</p>
                </div>
              ) : atletasFiltrados.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <User size={24} className="mx-auto mb-3 text-slate-300" />
                  Nenhum atleta localizado.
                </div>
              ) : (
                atletasFiltrados.map((atleta) => {
                  const status = folhaPresenca[atleta.id] || 'presente';
                  return (
                    <div key={atleta.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shrink-0 select-none">
                          {atleta.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{atleta.nome}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{atleta.email}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
                            <span className="text-[10px] font-extrabold uppercase text-[#002B7F] flex items-center gap-0.5 shrink-0">
                              <Award size={10} /> Faixa {atleta.faixa}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles de chamada */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'presente')}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
                            status === 'presente'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Check size={12} /> Presente
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'falta')}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
                            status === 'falta'
                              ? 'bg-[#CE1126] text-white border-[#CE1126] shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <X size={12} /> Falta
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(atleta.id, 'justificado')}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition cursor-pointer ${
                            status === 'justificado'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Justificado
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé Salvar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {atletasFiltrados.length} atleta(s) nesta lista
              </span>
              <button
                type="button"
                onClick={handleSalvarChamada}
                disabled={saving || loading}
                className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                ) : (
                  <><Save size={14} /> Salvar Frequência</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Painel Lateral de Histórico */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={16} className="text-[#002B7F]" /> Histórico de Aulas
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {datasLancadas.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Nenhuma aula registrada anteriormente.</p>
              ) : (
                datasLancadas.map(d => (
                  <button
                    key={d}
                    onClick={() => setDataAula(d)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      dataAula === d
                        ? 'bg-blue-50 border-blue-200 text-[#002B7F]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#002B7F]" />
                      <span className="text-xs font-bold font-mono">{formatarDataExibicao(d)}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
