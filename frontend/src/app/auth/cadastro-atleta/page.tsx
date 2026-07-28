'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield, User, Mail, Lock, Phone, ArrowRight,
  Eye, EyeOff, Loader2, UserCheck, CheckCircle2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

export default function CadastroAtletaPage() {
  interface Filial {
    id: string;
    nome: string;
  }

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    filial_id: '',
    aceita_termos: false
  });

  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loadingFiliais, setLoadingFiliais] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    const carregarFiliais = async () => {
      try {
        const res = await fetch(`${API_URL}/api/filiais/public`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setFiliais(data.filiais || []);
        }
      } catch (err) {
        console.error("Erro ao carregar filiais públicas:", err);
      } finally {
        setLoadingFiliais(false);
      }
    };
    carregarFiliais();
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setFormatado = (field: string, formatter: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: formatter(e.target.value) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (form.senha !== form.confirmarSenha) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    if (form.senha.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!form.aceita_termos) {
      setErrorMsg('É necessário aceitar os Termos de Serviço e Aviso de Privacidade do Portal FBKE.');
      return;
    }

    setLoading(true);
    try {
      const filialSelecionada = filiais.find(f => f.id === form.filial_id);
      const filialNome = filialSelecionada ? filialSelecionada.nome : null;

      const res = await fetch(`${API_URL}/api/atletas/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone.replace(/\D/g, ''),
          senha: form.senha,
          filial_id: form.filial_id || null,
          filial_nome: filialNome,
          aceita_termos: form.aceita_termos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao realizar cadastro.');

      setSucesso(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-[#CE1126] selection:text-white">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-[#002B7F] rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Solicitação Registrada
            </span>
            <h2 className="text-2xl font-black text-slate-900">Cadastro Enviado!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Olá <strong className="text-slate-900">{form.nome}</strong>! Seus dados foram recebidos com sucesso.
            </p>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-4 rounded-2xl leading-relaxed">
            Sua solicitação de filiação de atleta está aguardando homologação da secretaria da FBKE. Assim que aprovada, você poderá acessar a Área Restrita.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/auth"
              className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase py-3 rounded-xl transition text-center shadow-sm"
            >
              Ir para o Login
            </Link>
            <Link
              href="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase py-3 rounded-xl transition text-center border border-slate-200"
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-[#CE1126] selection:text-white">
      
      {/* ================= LEFT DECORATIVE PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white justify-center items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col justify-center items-center text-center p-10 w-full z-10 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-white text-[#002B7F] font-black flex items-center justify-center text-2xl border-b-4 border-[#CE1126] shadow-xl">
            FBKE
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              FEDERAÇÃO BAIANA DE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-100 to-white">
                KARATE-DO ESPORTIVO
              </span>
            </h1>
            <p className="text-xs font-extrabold uppercase text-amber-400 tracking-widest">
              Cadastro de Atleta Filiado
            </p>
          </div>

          <div className="w-16 h-1 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

          <p className="text-slate-300 text-xs sm:text-base max-w-xs leading-relaxed">
            Faça seu registro de praticante e conecte-se ao seu dojo/filial credenciado no Estado da Bahia.
          </p>

          <div className="mt-4 border border-white/20 bg-white/10 backdrop-blur-md rounded-2xl p-4 max-w-xs text-center space-y-1">
            <p className="text-slate-200 italic text-xs leading-relaxed">
              "Hitotsu – Dento karate o mamori hibi no tanren o okotarazu"
            </p>
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              Praticar com dedicação e constância
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          
          <Link href="/auth" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#002B7F] transition">
            ← Voltar para a tela de login
          </Link>

          <div className="space-y-1">
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Formulário de Filiação
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Filiar-se como Atleta
            </h2>
            <p className="text-xs text-slate-500">
              Preencha seus dados cadastrais obrigatórios para requerer a carteira de atleta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
            
            <div className="space-y-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Nome Completo *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={set('nome')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">E-mail *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="email"
                  placeholder="exemplo@email.com"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Telefone / WhatsApp *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="tel"
                  placeholder="(71) 99999-9999"
                  value={form.telefone}
                  onChange={setFormatado('telefone', formatarTelefone)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                />
              </div>
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Senha *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mín. 6 dígitos"
                    value={form.senha}
                    onChange={set('senha')}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-9 py-2 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Confirmar *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={form.confirmarSenha}
                    onChange={set('confirmarSenha')}
                    className="w-full bg-slate-50 border text-slate-900 pl-9 pr-9 py-2 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition border-slate-200"
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer">
                    {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Aceite dos Termos */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="aceitaTermosAtleta"
                checked={form.aceita_termos}
                onChange={(e) => setForm((prev) => ({ ...prev, aceita_termos: e.target.checked }))}
                className="w-4 h-4 mt-0.5 accent-[#002B7F] rounded cursor-pointer shrink-0"
              />
              <label htmlFor="aceitaTermosAtleta" className="text-slate-600 text-xs cursor-pointer leading-relaxed">
                Li e aceito os{' '}
                <Link href="/transparencia/termos" target="_blank" className="text-[#002B7F] font-bold underline">
                  Termos de Serviço
                </Link>
                {' '}e o{' '}
                <Link href="/transparencia/privacidade" target="_blank" className="text-[#002B7F] font-bold underline">
                  Aviso de Privacidade
                </Link>
                {' '}da FBKE *
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <Link
                href="/auth"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase py-3 rounded-xl transition text-center border border-slate-200"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#CE1126] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                ) : (
                  <>Cadastrar <ArrowRight size={14} /></>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
