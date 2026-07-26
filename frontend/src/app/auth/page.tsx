'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, UserPlus, Building2, Crown, Sparkles, UserCheck } from 'lucide-react';

export default function EntrarPage() {
  const router = useRouter();
  const { loginLegado, atualizarUsuario } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginLegado(form.email, form.password);
      if (data?.usuario?.tipo === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de Auto Login Demo para teste online no Vercel
  const handleAutoLogin = async (role: 'admin' | 'filial' | 'atleta') => {
    setLoading(true);
    setError('');

    const credenciais = {
      admin: { email: 'admin@fbke.com.br', pass: 'admin123' },
      filial: { email: 'sensei@fbke.com.br', pass: 'sensei123' },
      atleta: { email: 'atleta@fbke.com.br', pass: 'atleta123' }
    };

    const target = credenciais[role];
    setForm({ email: target.email, password: target.pass });

    try {
      const data = await loginLegado(target.email, target.pass);
      if (data?.usuario?.tipo === 'admin' || role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (err) {
      console.warn('[Demo Auto Login] Servidor remoto ocupado. Iniciando sessão demo simulada para teste online no Vercel:', role);

      const mockProfiles: Record<string, any> = {
        admin: {
          id: 'admin-demo-1',
          nome: 'Paulo Casais (Presidência FBKE)',
          email: 'admin@fbke.com.br',
          tipo: 'admin',
          status: 'ativo'
        },
        filial: {
          id: 'filial-demo-2',
          nome: 'Sensei Paulo Carvalho (Dojo Central)',
          email: 'sensei@fbke.com.br',
          tipo: 'filial',
          status: 'ativo',
          cnpj_cpf: '12.345.678/0001-90',
          graduacao_responsavel: '6º Dan',
          rua: 'Av. Sete de Setembro',
          municipio: 'Salvador',
          uf: 'BA'
        },
        atleta: {
          id: 'atleta-demo-3',
          nome: 'Atleta Lucas Almeida',
          email: 'atleta@fbke.com.br',
          tipo: 'atleta',
          status: 'ativo',
          faixa: '1º Dan (Faixa Preta)',
          cpf: '123.456.789-00',
          data_nascimento: '1998-05-15',
          endereco: 'Rua do Karate 100',
          cidade: 'Salvador',
          uf: 'BA'
        }
      };

      const mockUser = mockProfiles[role];
      if (atualizarUsuario) {
        atualizarUsuario(mockUser);
      }

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-[#CE1126] selection:text-white">
      
      {/* ================= LEFT DECORATIVE PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white justify-center items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col justify-center items-center text-center p-16 w-full z-10 space-y-6">
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
              Portal Oficial de Membros & Filiais
            </p>
          </div>

          <div className="w-16 h-1 bg-gradient-to-r from-[#CE1126] via-white to-[#002B7F] rounded-full mx-auto"></div>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xs leading-relaxed">
            Acesso restrito para atletas federados, diretores de dojos e comissão técnica homologada.
          </p>

          <div className="mt-8 border border-white/20 bg-white/10 backdrop-blur-md rounded-2xl p-5 max-w-xs text-center space-y-2">
            <p className="text-slate-200 italic text-xs leading-relaxed">
              "Hitotsu – Dento karate o mamori hibi no tanren o okotarazu"
            </p>
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              Preservar a tradição e treinar diariamente
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-6">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#002B7F] transition">
            ← Voltar ao site principal
          </Link>

          <div className="space-y-1">
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Área Restrita
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Acessar Plataforma
            </h2>
            <p className="text-xs text-slate-500">
              Digite suas credenciais registradas no portal FBKE.
            </p>
          </div>

          {/* ================= BOTÕES DEMO AUTO LOGIN (MODO TESTE ONLINE VERCEL) ================= */}
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-blue-950 p-4 rounded-3xl border border-amber-500/30 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">Modo Teste Online • Auto Login Demo</span>
              </div>
              <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 uppercase">Vercel</span>
            </div>
            
            <p className="text-[11px] text-slate-300">
              Clique em um dos perfis abaixo para testar instantaneamente todas as funcionalidades no Vercel:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAutoLogin('admin')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-[#CE1126] to-red-900 hover:from-red-600 hover:to-red-950 text-white text-xs font-extrabold transition shadow-sm border border-red-400/40 cursor-pointer active:scale-95"
              >
                <Crown size={16} className="mb-1 text-amber-300" />
                <span>Super Admin</span>
                <span className="text-[9px] font-normal opacity-80">Presidência</span>
              </button>

              <button
                type="button"
                onClick={() => handleAutoLogin('filial')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-[#002B7F] to-blue-950 hover:from-blue-700 hover:to-blue-900 text-white text-xs font-extrabold transition shadow-sm border border-blue-400/40 cursor-pointer active:scale-95"
              >
                <Building2 size={16} className="mb-1 text-sky-300" />
                <span>Sensei ADM</span>
                <span className="text-[9px] font-normal opacity-80">Filial / Dojo</span>
              </button>

              <button
                type="button"
                onClick={() => handleAutoLogin('atleta')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-emerald-700 to-emerald-950 hover:from-emerald-600 hover:to-emerald-900 text-white text-xs font-extrabold transition shadow-sm border border-emerald-400/40 cursor-pointer active:scale-95"
              >
                <UserCheck size={16} className="mb-1 text-emerald-300" />
                <span>Atleta</span>
                <span className="text-[9px] font-normal opacity-80">Aluno / Filiado</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                  placeholder="seu-email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-10 py-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F] transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'} <ArrowRight size={15} />
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-3 shadow-xs">
            <p className="text-slate-500 text-xs font-semibold">
              Ainda não possui conta cadastrada?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/auth/cadastro-atleta"
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl transition border border-slate-200"
              >
                <UserPlus size={13} className="text-[#002B7F]" /> Atleta
              </Link>
              <Link
                href="/auth/cadastro-filial"
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl transition border border-slate-200"
              >
                <Building2 size={13} className="text-[#CE1126]" /> Filial / Dojo
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
