'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function ContatoSection() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const [siteConfig, setSiteConfig] = useState({
    secao_subtitulo: 'Atendimento Oficial',
    secao_titulo: 'Entre em Contato com a FBKE',
    secao_desc: 'Tire dúvidas sobre filiações, carteirinhas de atletas, torneios e exames de graduação.',
    telefone: '(71) 98811-0000',
    telefone_tel: '+5571988110000',
    email: 'contato@fbke.com.br',
    endereco: 'Salvador, Bahia, Brasil',
    horarios: 'Segunda a Sexta: 14:00 – 21:00\nSábado: 08:00 – 12:00'
  });

  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cms/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config && data.config.contato) {
            setSiteConfig(prev => ({
              ...prev,
              ...data.config.contato
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar contato config:", err);
      }
    };
    carregarConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/contatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem');
      
      setEnviado(true);
      setForm({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Coluna 1: Informações da Sede (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-bahia-blue transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-bahia-blue-light text-bahia-blue">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Sede da Federação</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {siteConfig.endereco}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-bahia-blue transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-bahia-red-light text-bahia-red">
                <Phone size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Telefone / WhatsApp</h3>
                <a href={`tel:${siteConfig.telefone_tel}`} className="text-xs text-slate-600 mt-1 hover:text-bahia-blue transition-colors block">
                  {siteConfig.telefone}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-bahia-blue transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-bahia-blue-light text-bahia-blue">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">E-mail</h3>
                <a href={`mailto:${siteConfig.email}`} className="text-xs text-slate-600 mt-1 font-medium hover:text-bahia-blue transition-colors block break-all">
                  {siteConfig.email}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-bahia-blue transition">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-bahia-gold">
                <Clock size={22} />
              </div>
              <div className="w-full">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Horário de Atendimento</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {siteConfig.horarios.split('\n').map((line) => {
                    const parts = line.split(':');
                    const dia = parts[0]?.trim() || '';
                    const hora = parts.slice(1).join(':')?.trim() || '';
                    return { dia, hora };
                  }).filter(h => h.dia && h.hora).map((h, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                      <span>{h.dia}</span>
                      <span className="font-semibold text-slate-900">{h.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Formulário Claro (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Envie sua mensagem</h2>
          <p className="text-xs text-slate-500 mb-6">Preencha os campos e retornaremos em breve.</p>

          {enviado ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Mensagem Enviada!</h3>
              <p className="text-xs text-slate-600">Sua mensagem foi registrada em nosso sistema. Onegai shimasu!</p>
              <button onClick={() => setEnviado(false)} className="text-xs text-bahia-blue font-bold underline cursor-pointer">
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-bahia-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-bahia-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(71) 98811-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-bahia-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Mensagem *</label>
                <textarea
                  name="mensagem"
                  value={form.mensagem}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-bahia-blue resize-none"
                ></textarea>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-bahia-red hover:bg-bahia-red-hover text-white font-bold text-xs uppercase py-3 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={14} /> Enviar Mensagem</>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
