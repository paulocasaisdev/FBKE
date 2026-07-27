'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, UserPlus, Building2 } from 'lucide-react';

export default function EntrarPage() {
  const router = useRouter();
  const { loginLegado } = useAuth();
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
      await loginLegado(form.email, form.password);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-[#CE1126] selection:text-white">
      
      {/* ================= LEFT DECORATIVE PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-gradient-to-b from-blue-950 via-[#002B7F] to-slate-900 text-white justify-center items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CE1126]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col justify-center items-center text-center p-10 w-full z-10 space-y-5">
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

          <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-2xl p-4 max-w-xs text-center space-y-1.5">
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
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#002B7F] transition">
            ← Voltar ao site principal
          </Link>

          <div className="space-y-2">
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Área Restrita
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Acessar Plataforma
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Digite suas credenciais registradas no portal FBKE.
            </p>
          </div>



          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            
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

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-2.5 shadow-xs">
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
