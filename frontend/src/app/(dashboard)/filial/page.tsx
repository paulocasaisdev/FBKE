'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, Mail, Phone, MapPin, ShieldCheck,
  Save, Loader2, CheckCircle2, AlertCircle, Award, User, UserCheck
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
}

function formatarCEP(valor: string) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

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

function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  if (digito2 !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

function formatarCnpjCpf(valor: string) {
  const limpo = valor.replace(/\D/g, '').slice(0, 14);
  if (limpo.length <= 11) {
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  return limpo
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function MinhaFilialPage() {
  const { usuario, recarregarSessao, tipo } = useAuth();
  
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj_cpf: '',
    nome_fantasia: '',
    cpf_responsavel: '',
    graduacao_responsavel: '',
    registro_federativo: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    municipio: '',
    estado: '',
  });

  const [loading, setLoading] = useState(false);
  const [registrandoAtleta, setRegistrandoAtleta] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const handleSelfRegisterAtleta = async () => {
    setRegistrandoAtleta(true);
    setNotif({ type: null, msg: '' });
    try {
      const res = await fetch(`${API_URL}/api/atletas/self-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao solicitar cadastro de atleta.');

      setNotif({
        type: 'success',
        msg: 'Solicitação realizada com sucesso! O cadastro de atleta está aguardando homologação da Federação.'
      });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro ao solicitar cadastro de atleta.' });
    } finally {
      setRegistrandoAtleta(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
        cnpj_cpf: usuario.cnpj_cpf ? formatarCnpjCpf(usuario.cnpj_cpf) : '',
        nome_fantasia: usuario.nome_fantasia || '',
        cpf_responsavel: usuario.cpf_responsavel ? formatarCPF(usuario.cpf_responsavel) : '',
        graduacao_responsavel: usuario.graduacao_responsavel || '',
        registro_federativo: usuario.registro_federativo || '',
        cep: usuario.cep ? formatarCEP(usuario.cep) : '',
        rua: usuario.rua || usuario.endereco || '',
        numero: usuario.numero || '',
        bairro: usuario.bairro || '',
        municipio: usuario.municipio || usuario.cidade || '',
        estado: usuario.estado || usuario.uf || '',
      });
    }
  }, [usuario]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const setFormatado = (field: string, formatter: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: formatter(e.target.value) }));

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = formatarCEP(e.target.value);
    setForm(prev => ({ ...prev, cep: valor }));

    const cepLimpo = valor.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setForm(prev => ({
              ...prev,
              rua: data.logradouro || prev.rua,
              bairro: data.bairro || prev.bairro,
              municipio: data.localidade || prev.municipio,
              estado: data.uf || prev.estado
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    setLoading(true);

    if (form.cpf_responsavel && !validarCPF(form.cpf_responsavel)) {
      setNotif({ type: 'error', msg: 'O CPF do responsável digitado é inválido.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        telefone: form.telefone.replace(/\D/g, ''),
        cnpj_cpf: form.cnpj_cpf.replace(/\D/g, ''),
        cpf_responsavel: form.cpf_responsavel.replace(/\D/g, ''),
        cep: form.cep.replace(/\D/g, ''),
      };

      const res = await fetch(`${API_URL}/api/filiais/${usuario?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados da filial.');

      setNotif({ type: 'success', msg: 'Os dados do dojo/filial foram atualizados com sucesso!' });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  };

  if (tipo !== 'filial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 font-sans">
        <AlertCircle className="w-16 h-16 text-[#CE1126]" />
        <h2 className="text-xl font-black text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-xs max-w-md">Esta tela está disponível apenas para contas credenciadas de Dojo ou Filial.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
          Cadastro Institucional
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="text-[#002B7F]" size={28} /> Dados do Meu Dojo / Filial
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mantenha as informações da sua academia e professor responsável sempre atualizados perante a FBKE.
        </p>
      </div>

      {/* Notificação */}
      {notif.type && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold border ${
          notif.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-[#CE1126]'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notif.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Dados do Dojo */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="text-[#002B7F]" size={18} /> Informações Principais da Filial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Razão Social / Nome Oficial *</label>
                <input
                  required
                  value={form.nome}
                  onChange={set('nome')}
                  placeholder="Ex: Associação de Karate Centro"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome Fantasia (Como aparece no portal)</label>
                <input
                  value={form.nome_fantasia}
                  onChange={set('nome_fantasia')}
                  placeholder="Ex: Dojo Karate Salvador"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CNPJ ou CPF Institucional *</label>
                <input
                  required
                  value={form.cnpj_cpf}
                  onChange={setFormatado('cnpj_cpf', formatarCnpjCpf)}
                  placeholder="00.000.000/0001-00 ou 000.000.000-00"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">E-mail de Contato</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-xs cursor-not-allowed font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Telefone Comercial *</label>
                <input
                  required
                  value={form.telefone}
                  onChange={setFormatado('telefone', formatarTelefone)}
                  placeholder="(71) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Reg. Federativo (FBKE)</label>
                <input
                  value={form.registro_federativo || usuario?.registro_federativo || usuario?.codigo_interno || 'FBKE-F-2026-7FB90'}
                  onChange={set('registro_federativo')}
                  placeholder="FBKE-F-2026-7FB90"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Código de Registro FBKE</label>
                <input
                  value={usuario?.codigo_interno || usuario?.registro_federativo || 'FBKE-F-2026-7FB90'}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs cursor-not-allowed font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Card 2: Responsável Técnico */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="text-[#CE1126]" size={18} /> Professor Responsável Técnico
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CPF do Responsável *</label>
                  <input
                    required
                    value={form.cpf_responsavel}
                    onChange={setFormatado('cpf_responsavel', formatarCPF)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Graduação / Faixa *</label>
                  <input
                    required
                    value={form.graduacao_responsavel}
                    onChange={set('graduacao_responsavel')}
                    placeholder="Ex: Preta 3º Dan"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Endereço */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="text-[#002B7F]" size={18} /> Endereço da Sede do Dojo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CEP</label>
                  <div className="relative">
                    <input
                      value={form.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                    />
                    {buscandoCep && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#002B7F] animate-spin" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Rua / Logradouro</label>
                  <input
                    value={form.rua}
                    onChange={set('rua')}
                    placeholder="Av. Principal, Rua das Flores..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Número</label>
                  <input
                    value={form.numero}
                    onChange={set('numero')}
                    placeholder="123"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Bairro</label>
                  <input
                    value={form.bairro}
                    onChange={set('bairro')}
                    placeholder="Centro"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Cidade / UF</label>
                  <input
                    value={form.municipio ? `${form.municipio} / ${form.estado}` : ''}
                    onChange={set('municipio')}
                    placeholder="Salvador / BA"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F] focus:ring-1 focus:ring-[#002B7F]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={16} /> Salvar Dados da Filial</>
            )}
          </button>
        </div>

      </form>

    </main>
  );
}
