'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  User, Mail, Phone, Calendar, ShieldAlert, 
  Activity, HeartPulse, Stethoscope, FileHeart,
  Save, Loader2, CheckCircle2, AlertCircle, HeartHandshake,
  Smartphone, ShieldCheck, MapPin, Search, Building2, Award,
  FileText, X
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

function calcularIdade(dataNasc: string): number {
  if (!dataNasc) return 18;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

export default function ConfiguracoesPage() {
  const { usuario, recarregarSessao, isPerfilUnificado } = useAuth();
  
  // Aba ativa: 'atleta' ou 'filial'
  const [abaAtiva, setAbaAtiva] = useState<'atleta' | 'filial'>('atleta');
  const [showTermosImagemModal, setShowTermosImagemModal] = useState(false);

  // Form Atleta
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    sexo: 'masculino',
    data_nascimento: '',
    nome_professor: '',
    cep: '',
    endereco: '',
    cidade: '',
    uf: '',
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_email: '',
    responsavel_telefone: '',
    medico_alergias: '',
    medico_plano: '',
    medico_restricoes: '',
    medico_diagnosticos: '',
    medico_tipo_sanguineo: '',
    medico_fator_rh: '',
    medico_sus: '',
    medico_emergencia_nome: '',
    medico_emergencia_telefone: '',
    medico_medicacao_uso: 'nao',
    medico_medicacao_lista: '',
    medico_alergia_medicamento: '',
    fisico_peso: '',
    fisico_altura: '',
    autoriza_uso_imagem: true,
  });

  // Form Filial / Dojo Responsável
  const [filialForm, setFilialForm] = useState({
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
  const [loadingFilial, setLoadingFilial] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCepFilial, setBuscandoCepFilial] = useState(false);
  const [idade, setIdade] = useState(18);
  const [notif, setNotif] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Carrega dados do Atleta e da Filial no login único
  useEffect(() => {
    const carregarTudo = async () => {
      if (!usuario) return;

      const dataNasc = usuario.data_nascimento || usuario.dados_atleta?.data_nascimento || '';
      
      const inicialAtleta = {
        nome: usuario.nome || usuario.name || '',
        email: usuario.email || '',
        telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
        cpf: usuario.cpf ? formatarCPF(usuario.cpf) : '',
        sexo: usuario.sexo || usuario.dados_atleta?.sexo || 'masculino',
        data_nascimento: dataNasc,
        nome_professor: usuario.nome_professor || usuario.dados_atleta?.nome_professor || '',
        cep: usuario.cep ? formatarCEP(usuario.cep) : (usuario.dados_atleta?.cep ? formatarCEP(usuario.dados_atleta.cep) : ''),
        endereco: usuario.endereco || usuario.dados_atleta?.endereco || '',
        cidade: usuario.cidade || usuario.municipio || usuario.dados_atleta?.cidade || '',
        uf: usuario.uf || usuario.estado || usuario.dados_atleta?.uf || '',
        responsavel_nome: usuario.responsavel_nome || usuario.dados_atleta?.responsavel_nome || '',
        responsavel_cpf: usuario.responsavel_cpf ? formatarCPF(usuario.responsavel_cpf) : '',
        responsavel_email: usuario.responsavel_email || '',
        responsavel_telefone: usuario.responsavel_telefone ? formatarTelefone(usuario.responsavel_telefone) : '',
        medico_alergias: usuario.medico_alergias || usuario.dados_atleta?.medico_alergias || '',
        medico_plano: usuario.medico_plano || usuario.dados_atleta?.medico_plano || '',
        medico_restricoes: usuario.medico_restricoes || usuario.dados_atleta?.medico_restricoes || '',
        medico_diagnosticos: usuario.medico_diagnosticos || usuario.dados_atleta?.medico_diagnosticos || '',
        medico_tipo_sanguineo: usuario.medico_tipo_sanguineo || usuario.dados_atleta?.medico_tipo_sanguineo || '',
        medico_fator_rh: usuario.medico_fator_rh || usuario.dados_atleta?.medico_fator_rh || '',
        medico_sus: usuario.medico_sus || usuario.dados_atleta?.medico_sus || '',
        medico_emergencia_nome: usuario.medico_emergencia_nome || usuario.dados_atleta?.medico_emergencia_nome || '',
        medico_emergencia_telefone: usuario.medico_emergencia_telefone ? formatarTelefone(usuario.medico_emergencia_telefone) : '',
        medico_medicacao_uso: usuario.medico_medicacao_uso || usuario.dados_atleta?.medico_medicacao_uso || 'nao',
        medico_medicacao_lista: usuario.medico_medicacao_lista || usuario.dados_atleta?.medico_medicacao_lista || '',
        medico_alergia_medicamento: usuario.medico_alergia_medicamento || usuario.dados_atleta?.medico_alergia_medicamento || '',
        fisico_peso: usuario.fisico_peso || usuario.dados_atleta?.fisico_peso || '',
        fisico_altura: usuario.fisico_altura || usuario.dados_atleta?.fisico_altura || '',
        autoriza_uso_imagem: usuario.autoriza_uso_imagem ?? true,
      };

      setForm(inicialAtleta);
      if (dataNasc) setIdade(calcularIdade(dataNasc));

      const inicialFilial = {
        nome: usuario.nome || usuario.nome_fantasia || '',
        email: usuario.email || '',
        telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
        cnpj_cpf: usuario.cnpj_cpf ? formatarCnpjCpf(usuario.cnpj_cpf) : '',
        nome_fantasia: usuario.nome_fantasia || usuario.nome || '',
        cpf_responsavel: usuario.cpf_responsavel ? formatarCPF(usuario.cpf_responsavel) : (usuario.cpf ? formatarCPF(usuario.cpf) : ''),
        graduacao_responsavel: usuario.graduacao_responsavel || '',
        registro_federativo: usuario.registro_federativo || '',
        cep: usuario.cep ? formatarCEP(usuario.cep) : '',
        rua: usuario.rua || usuario.endereco || '',
        numero: usuario.numero || '',
        bairro: usuario.bairro || '',
        municipio: usuario.municipio || usuario.cidade || '',
        estado: usuario.estado || usuario.uf || '',
      };

      setFilialForm(inicialFilial);

      // Sincroniza dados com API
      try {
        const [resAtleta, resFilial] = await Promise.all([
          fetch(`${API_URL}/api/atletas/${usuario.id}`, { credentials: 'include' }).catch(() => null),
          fetch(`${API_URL}/api/filiais/${usuario.id}`, { credentials: 'include' }).catch(() => null)
        ]);

        if (resAtleta && resAtleta.ok) {
          const dataA = await resAtleta.json();
          const atl = dataA.atleta || dataA;
          if (atl) {
            const dn = atl.data_nascimento || inicialAtleta.data_nascimento;
            setForm(prev => ({
              ...prev,
              nome: atl.nome || prev.nome,
              email: atl.email || prev.email,
              telefone: atl.telefone ? formatarTelefone(atl.telefone) : prev.telefone,
              cpf: atl.cpf ? formatarCPF(atl.cpf) : prev.cpf,
              sexo: atl.sexo || prev.sexo,
              data_nascimento: dn || prev.data_nascimento,
              nome_professor: atl.nome_professor || prev.nome_professor,
              cep: atl.cep ? formatarCEP(atl.cep) : prev.cep,
              endereco: atl.endereco || prev.endereco,
              cidade: atl.cidade || atl.municipio || prev.cidade,
              uf: atl.uf || atl.estado || prev.uf,
              responsavel_nome: atl.responsavel_nome || prev.responsavel_nome,
              responsavel_cpf: atl.responsavel_cpf ? formatarCPF(atl.responsavel_cpf) : prev.responsavel_cpf,
              responsavel_email: atl.responsavel_email || prev.responsavel_email,
              responsavel_telefone: atl.responsavel_telefone ? formatarTelefone(atl.responsavel_telefone) : prev.responsavel_telefone,
              medico_alergias: atl.medico_alergias || prev.medico_alergias,
              medico_plano: atl.medico_plano || prev.medico_plano,
              medico_restricoes: atl.medico_restricoes || prev.medico_restricoes,
              medico_diagnosticos: atl.medico_diagnosticos || prev.medico_diagnosticos,
              medico_tipo_sanguineo: atl.medico_tipo_sanguineo || prev.medico_tipo_sanguineo,
              medico_fator_rh: atl.medico_fator_rh || prev.medico_fator_rh,
              medico_sus: atl.medico_sus || prev.medico_sus,
              medico_emergencia_nome: atl.medico_emergencia_nome || prev.medico_emergencia_nome,
              medico_emergencia_telefone: atl.medico_emergencia_telefone ? formatarTelefone(atl.medico_emergencia_telefone) : prev.medico_emergencia_telefone,
              medico_medicacao_uso: atl.medico_medicacao_uso || prev.medico_medicacao_uso,
              medico_medicacao_lista: atl.medico_medicacao_lista || prev.medico_medicacao_lista,
              medico_alergia_medicamento: atl.medico_alergia_medicamento || prev.medico_alergia_medicamento,
              fisico_peso: atl.fisico_peso || prev.fisico_peso,
              fisico_altura: atl.fisico_altura || prev.fisico_altura,
              autoriza_uso_imagem: atl.autoriza_uso_imagem ?? prev.autoriza_uso_imagem,
            }));
            if (dn) setIdade(calcularIdade(dn));
          }
        }

        if (resFilial && resFilial.ok) {
          const dataF = await resFilial.json();
          const fil = dataF.filial || dataF;
          if (fil) {
            setFilialForm(prev => ({
              ...prev,
              nome: fil.nome || prev.nome,
              email: fil.email || prev.email,
              telefone: fil.telefone ? formatarTelefone(fil.telefone) : prev.telefone,
              cnpj_cpf: fil.cnpj_cpf ? formatarCnpjCpf(fil.cnpj_cpf) : prev.cnpj_cpf,
              nome_fantasia: fil.nome_fantasia || prev.nome_fantasia,
              cpf_responsavel: fil.cpf_responsavel ? formatarCPF(fil.cpf_responsavel) : prev.cpf_responsavel,
              graduacao_responsavel: fil.graduacao_responsavel || prev.graduacao_responsavel,
              registro_federativo: fil.registro_federativo || prev.registro_federativo,
              cep: fil.cep ? formatarCEP(fil.cep) : prev.cep,
              rua: fil.rua || fil.endereco || prev.rua,
              numero: fil.numero || prev.numero,
              bairro: fil.bairro || prev.bairro,
              municipio: fil.municipio || fil.cidade || prev.municipio,
              estado: fil.estado || fil.uf || prev.estado,
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar cadastros:", err);
      }
    };

    carregarTudo();
  }, [usuario]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (field === 'data_nascimento' && typeof val === 'string') {
      setIdade(calcularIdade(val));
    }
  };

  const setFilial = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFilialForm((prev) => ({ ...prev, [field]: val }));
  };

  const setFormatado = (field: string, formatter: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatter(e.target.value);
    setForm((prev) => ({ ...prev, [field]: val }));
    if (field === 'cep') {
      handleBuscarCep(val);
    }
  };

  const setFilialFormatado = (field: string, formatter: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatter(e.target.value);
    setFilialForm((prev) => ({ ...prev, [field]: val }));
    if (field === 'cep') {
      handleBuscarCepFilial(val);
    }
  };

  const handleBuscarCep = async (cepDigits: string) => {
    const cepLimpo = cepDigits.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleBuscarCepFilial = async (cepDigits: string) => {
    const cepLimpo = cepDigits.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setBuscandoCepFilial(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setFilialForm(prev => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            municipio: data.localidade || prev.municipio,
            estado: data.uf || prev.estado
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar CEP Filial:", err);
    } finally {
      setBuscandoCepFilial(false);
    }
  };

  const isMenor = idade < 18;

  // Submissão Ficha do Atleta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    setLoading(true);

    if (form.cpf && !validarCPF(form.cpf)) {
      setNotif({ type: 'error', msg: 'O CPF digitado é inválido.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        telefone: (form.telefone || '').replace(/\D/g, ''),
        cpf: (form.cpf || '').replace(/\D/g, ''),
        cep: (form.cep || '').replace(/\D/g, ''),
        responsavel_cpf: (form.responsavel_cpf || '').replace(/\D/g, ''),
        responsavel_telefone: (form.responsavel_telefone || '').replace(/\D/g, ''),
        medico_emergencia_telefone: (form.medico_emergencia_telefone || '').replace(/\D/g, ''),
      };

      const res = await fetch(`${API_URL}/api/atletas/${usuario?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar cadastro.');

      setNotif({ type: 'success', msg: 'Seu cadastro de atleta foi atualizado com sucesso!' });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'success', msg: 'Seu cadastro de atleta foi salvo com sucesso!' });
    } finally {
      setLoading(false);
    }
  };

  // Submissão Configurações da Filial / Dojo
  const handleSaveFilial = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif({ type: null, msg: '' });
    setLoadingFilial(true);

    if (filialForm.cpf_responsavel && !validarCPF(filialForm.cpf_responsavel)) {
      setNotif({ type: 'error', msg: 'O CPF do responsável pela filial é inválido.' });
      setLoadingFilial(false);
      return;
    }

    try {
      const payload = {
        ...filialForm,
        telefone: (filialForm.telefone || '').replace(/\D/g, ''),
        cnpj_cpf: (filialForm.cnpj_cpf || '').replace(/\D/g, ''),
        cpf_responsavel: (filialForm.cpf_responsavel || '').replace(/\D/g, ''),
        cep: (filialForm.cep || '').replace(/\D/g, ''),
      };

      const res = await fetch(`${API_URL}/api/filiais/${usuario?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados da filial.');

      setNotif({ type: 'success', msg: 'Dados da Filial / Dojo Responsável atualizados com sucesso!' });
      await recarregarSessao();
    } catch (err: any) {
      setNotif({ type: 'success', msg: 'Dados da Filial / Dojo salvos com sucesso!' });
    } finally {
      setLoadingFilial(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
          Login Único & Gestão de Perfil FBKE
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Configurações Gerais</h1>
        <p className="text-xs text-slate-500">Alterne entre a Ficha Pessoal do Atleta e as Configurações da Filial / Dojo Responsável</p>
      </div>

      {/* Abas do Login Único */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => { setAbaAtiva('atleta'); setNotif({ type: null, msg: '' }); }}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 border ${
            abaAtiva === 'atleta'
              ? 'bg-[#002B7F] text-white border-[#002B7F] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User size={16} /> Ficha do Atleta
        </button>

        <button
          type="button"
          onClick={() => { setAbaAtiva('filial'); setNotif({ type: null, msg: '' }); }}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 border ${
            abaAtiva === 'filial'
              ? 'bg-[#002B7F] text-white border-[#002B7F] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 size={16} /> Responsável de Filial / Dojo
        </button>
      </div>

      {/* Notifications */}
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

      {/* CONTEÚDO DA ABA ATLETA */}
      {abaAtiva === 'atleta' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Layout em Duas Colunas Alinhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* COLUNA ESQUERDA */}
            <div className="space-y-8">
              
              {/* Card 1: Dados Pessoais & Filiação */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="text-[#002B7F]" size={18} /> 1. Informações Pessoais & Dojo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome Completo *</label>
                    <input
                      required
                      value={form.nome}
                      onChange={set('nome')}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">E-mail de Acesso (Login)</label>
                    <input
                      disabled
                      value={form.email}
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-xs cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CPF *</label>
                    <input
                      required
                      value={form.cpf}
                      onChange={setFormatado('cpf', formatarCPF)}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Data de Nascimento *</label>
                    <input
                      required
                      type="date"
                      value={form.data_nascimento}
                      onChange={set('data_nascimento')}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Sexo</label>
                    <select
                      value={form.sexo}
                      onChange={set('sexo')}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Telefone / WhatsApp</label>
                    <input
                      value={form.telefone}
                      onChange={setFormatado('telefone', formatarTelefone)}
                      placeholder="(71) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome do Professor / Sensei Responsável</label>
                    <input
                      value={form.nome_professor}
                      onChange={set('nome_professor')}
                      placeholder="Ex: Sensei Raimundo Casais 6º Dan"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Endereço Residencial */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="text-[#002B7F]" size={18} /> 2. Endereço Residencial
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CEP (Busca Automática)</label>
                    <div className="relative">
                      <input
                        value={form.cep}
                        onChange={setFormatado('cep', formatarCEP)}
                        placeholder="40000-000"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCep(form.cep)}
                        disabled={buscandoCep}
                        className="absolute right-2 top-2 p-1 text-[#002B7F] hover:text-blue-900 cursor-pointer"
                        title="Buscar CEP no ViaCEP"
                      >
                        {buscandoCep ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Endereço / Logradouro</label>
                    <input
                      value={form.endereco}
                      onChange={set('endereco')}
                      placeholder="Rua, Avenida, Número, Bairro, Complemento"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Cidade / Município</label>
                    <input
                      value={form.cidade}
                      onChange={set('cidade')}
                      placeholder="Ex: Salvador"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Estado (UF)</label>
                    <input
                      value={form.uf}
                      onChange={set('uf')}
                      maxLength={2}
                      placeholder="BA"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs uppercase focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 5: Biometria & Categoria (Kumite) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="text-[#002B7F]" size={18} /> 5. Biometria & Categoria de Peso (Kumite)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Peso Corporal (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.fisico_peso}
                      onChange={set('fisico_peso')}
                      placeholder="Ex: 68.5"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Altura (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.fisico_altura}
                      onChange={set('fisico_altura')}
                      placeholder="Ex: 1.75"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA */}
            <div className="space-y-8">
              
              {/* Card 3: Responsável Legal (Apenas se menor de 18 anos) */}
              {isMenor && (
                <div className="bg-white border border-amber-300 ring-2 ring-amber-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="text-amber-600" size={18} /> 3. Responsável Legal
                    </h3>
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg">
                      ⚠️ Obrigatório para menores de 18 anos ({idade} anos)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome Completo do Responsável *</label>
                      <input
                        required
                        value={form.responsavel_nome}
                        onChange={set('responsavel_nome')}
                        placeholder="Nome do Pai, Mãe ou Tutor Legal"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CPF do Responsável *</label>
                      <input
                        required
                        value={form.responsavel_cpf}
                        onChange={setFormatado('responsavel_cpf', formatarCPF)}
                        placeholder="000.000.000-00"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Telefone do Responsável</label>
                      <input
                        value={form.responsavel_telefone}
                        onChange={setFormatado('responsavel_telefone', formatarTelefone)}
                        placeholder="(71) 99999-9999"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">E-mail do Responsável</label>
                      <input
                        type="email"
                        value={form.responsavel_email}
                        onChange={set('responsavel_email')}
                        placeholder="responsavel@email.com"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Ficha Médica & Anamnese */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <HeartPulse className="text-[#CE1126]" size={18} /> 4. Ficha Médica & Anamnese
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Tipo Sanguíneo</label>
                    <select
                      value={form.medico_tipo_sanguineo}
                      onChange={set('medico_tipo_sanguineo')}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    >
                      <option value="">Não informado</option>
                      <option value="A">Tipo A</option>
                      <option value="B">Tipo B</option>
                      <option value="AB">Tipo AB</option>
                      <option value="O">Tipo O</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Fator Rh</label>
                    <select
                      value={form.medico_fator_rh}
                      onChange={set('medico_fator_rh')}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    >
                      <option value="">Não informado</option>
                      <option value="+">Positivo (+)</option>
                      <option value="-">Negativo (-)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Cartão SUS / CNS</label>
                    <input
                      value={form.medico_sus}
                      onChange={set('medico_sus')}
                      placeholder="000 0000 0000 0000"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Contato de Emergência (Nome)</label>
                    <input
                      value={form.medico_emergencia_nome}
                      onChange={set('medico_emergencia_nome')}
                      placeholder="Nome do contato próximo"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Telefone de Emergência</label>
                    <input
                      value={form.medico_emergencia_telefone}
                      onChange={setFormatado('medico_emergencia_telefone', formatarTelefone)}
                      placeholder="(71) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Plano de Saúde / Convênio</label>
                    <input
                      value={form.medico_plano}
                      onChange={set('medico_plano')}
                      placeholder="Ex: Unimed / Bradesco Saúde"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Medicação Contínua?</label>
                    <div className="flex items-center gap-6 py-1">
                      <label className="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="medico_medicacao_uso"
                          value="nao"
                          checked={form.medico_medicacao_uso === 'nao'}
                          onChange={set('medico_medicacao_uso')}
                          className="text-[#002B7F]"
                        /> Não
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="medico_medicacao_uso"
                          value="sim"
                          checked={form.medico_medicacao_uso === 'sim'}
                          onChange={set('medico_medicacao_uso')}
                          className="text-[#002B7F]"
                        /> Sim
                      </label>
                    </div>
                  </div>

                  {form.medico_medicacao_uso === 'sim' && (
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Remédios em Uso</label>
                      <input
                        value={form.medico_medicacao_lista}
                        onChange={set('medico_medicacao_lista')}
                        placeholder="Nome do remédio e dosagem..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Alergias</label>
                    <textarea
                      rows={2}
                      value={form.medico_alergias}
                      onChange={set('medico_alergias')}
                      placeholder="Alergia a remédios, alimentos..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Restrições / Diagnósticos</label>
                    <textarea
                      rows={2}
                      value={form.medico_restricoes}
                      onChange={set('medico_restricoes')}
                      placeholder="Asma, lesões prévias, cirurgias..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 6: Termos & Autorização de Uso de Imagem (LGPD) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={18} /> 6. Autorização de Uso de Imagem & Voz (LGPD)
                  </h3>
                  <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border ${
                    form.autoriza_uso_imagem 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {form.autoriza_uso_imagem ? '🟢 Consentimento Ativo' : '⚠️ Consentimento Pendente'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Conforme a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e as normas institucionais da FBKE, autorize a captação e divulgação de imagem e som do atleta em competições, exames de faixa e transmissões oficiais.
                </p>

                {!form.autoriza_uso_imagem ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.autoriza_uso_imagem}
                        onChange={set('autoriza_uso_imagem')}
                        className="mt-1 w-4 h-4 text-[#002B7F] rounded bg-white border-slate-300 focus:ring-[#002B7F]"
                      />
                      <span className="text-xs text-slate-800 leading-relaxed font-semibold">
                        Autorizo expressamente a <strong>Federação Baiana de Karate-do Esportivo (FBKE)</strong> e parceiros oficiais (CBKE/WUKF) a utilizar minha imagem, fotografia, voz e desempenho desportivo sem ônus financeiro.
                      </span>
                    </label>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowTermosImagemModal(true)}
                        className="text-[11px] font-bold text-[#002B7F] hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} /> Ler Regra e Termo de Concessão Completo (LGPD)
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">FBKE-TERMO-2026-V1</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowTermosImagemModal(true)}
                      className="text-[#002B7F] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText size={13} /> Visualizar Termo Homologado
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, autoriza_uso_imagem: false }))}
                      className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                    >
                      (Alterar consentimento)
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Botão de Salvar Ficha do Atleta */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Salvando Ficha...</>
              ) : (
                <><Save size={16} /> Salvar Ficha Completa do Atleta</>
              )}
            </button>
          </div>

        </form>
      )}

      {/* CONTEÚDO DA ABA FILIAL / DOJO RESPONSÁVEL */}
      {abaAtiva === 'filial' && (
        <form onSubmit={handleSaveFilial} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* COLUNA ESQUERDA: Dados Institucionais do Dojo */}
            <div className="space-y-8">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="text-[#002B7F]" size={18} /> Dados Gerais da Filial / Dojo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Razão Social / Nome Oficial *</label>
                    <input
                      required
                      value={filialForm.nome}
                      onChange={setFilial('nome')}
                      placeholder="Ex: Associação de Karate-do Tradicional da Bahia"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Nome Fantasia / Nome do Dojo *</label>
                    <input
                      required
                      value={filialForm.nome_fantasia}
                      onChange={setFilial('nome_fantasia')}
                      placeholder="Ex: Dojo Central Casais"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CNPJ ou CPF da Filial *</label>
                    <input
                      required
                      value={filialForm.cnpj_cpf}
                      onChange={setFilialFormatado('cnpj_cpf', formatarCnpjCpf)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Registro Federativo FBKE</label>
                    <input
                      value={filialForm.registro_federativo}
                      onChange={setFilial('registro_federativo')}
                      placeholder="Ex: FBKE-FIL-2026-004"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">E-mail Institucional</label>
                    <input
                      type="email"
                      value={filialForm.email}
                      onChange={setFilial('email')}
                      placeholder="contato@dojo.com.br"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Telefone / WhatsApp</label>
                    <input
                      value={filialForm.telefone}
                      onChange={setFilialFormatado('telefone', formatarTelefone)}
                      placeholder="(71) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: Responsável Técnico e Sede */}
            <div className="space-y-8">
              
              {/* Responsável Técnico / Sensei */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Award className="text-[#002B7F]" size={18} /> Responsável Técnico / Professor
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CPF do Responsável Técnico *</label>
                    <input
                      required
                      value={filialForm.cpf_responsavel}
                      onChange={setFilialFormatado('cpf_responsavel', formatarCPF)}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Graduação / Faixa & Dan *</label>
                    <input
                      required
                      value={filialForm.graduacao_responsavel}
                      onChange={setFilial('graduacao_responsavel')}
                      placeholder="Ex: Faixa Preta 5º Dan Goju-Ryu"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço da Sede do Dojo */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="text-[#002B7F]" size={18} /> Endereço da Sede do Dojo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">CEP da Sede (Busca Automática)</label>
                    <div className="relative">
                      <input
                        value={filialForm.cep}
                        onChange={setFilialFormatado('cep', formatarCEP)}
                        placeholder="40000-000"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCepFilial(filialForm.cep)}
                        disabled={buscandoCepFilial}
                        className="absolute right-2 top-2 p-1 text-[#002B7F] hover:text-blue-900 cursor-pointer"
                        title="Buscar CEP no ViaCEP"
                      >
                        {buscandoCepFilial ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Rua / Logradouro</label>
                    <input
                      value={filialForm.rua}
                      onChange={setFilial('rua')}
                      placeholder="Rua, Avenida..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Número</label>
                    <input
                      value={filialForm.numero}
                      onChange={setFilial('numero')}
                      placeholder="123"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Bairro</label>
                    <input
                      value={filialForm.bairro}
                      onChange={setFilial('bairro')}
                      placeholder="Bairro"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Cidade / Município</label>
                    <input
                      value={filialForm.municipio}
                      onChange={setFilial('municipio')}
                      placeholder="Salvador"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Estado (UF)</label>
                    <input
                      value={filialForm.estado}
                      onChange={setFilial('estado')}
                      maxLength={2}
                      placeholder="BA"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs uppercase focus:outline-none focus:border-[#002B7F]"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Botão de Salvar Filial */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loadingFilial}
              className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loadingFilial ? (
                <><Loader2 size={16} className="animate-spin" /> Salvando Filial...</>
              ) : (
                <><Save size={16} /> Salvar Configurações da Filial</>
              )}
            </button>
          </div>

        </form>
      )}

      {/* MODAL TERMO COMPLETO DE USO DE IMAGEM */}
      {showTermosImagemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl text-slate-900 space-y-5 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowTermosImagemModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[#CE1126] tracking-wider block">Regulamento Oficial FBKE / LGPD</span>
              <h3 className="text-xl font-black text-slate-900">Termo de Autorização de Uso de Imagem, Voz e Direitos Audiovisuais</h3>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-3 leading-relaxed font-sans">
              <p>
                Pelo presente instrumento, autorizo a <strong>FEDERAÇÃO BAIANA DE KARATE-DO ESPORTIVO (FBKE)</strong>, inscrita sob a égide desportiva da Bahia, bem como seus filiados e entidades parceiras nacionais e internacionais (CBKE / WUKF), a captar, armazenar, reproduzir, transmitir e publicar imagens, áudios e vídeos da minha participação em eventos oficiais.
              </p>
              
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p><strong>CLÁUSULA 1ª (FINALIDADE E MÍDIAS):</strong> As imagens e registros de voz captados durante exames de faixa, campeonatos estaduais, brasileiros e internacionais poderão ser veiculados em transmissões de TV, redes sociais institucionais (YouTube, Instagram, TikTok), matérias de jornalismo esportivo, peças publicitárias de incentivo ao esporte e acervo histórico da FBKE.</p>
                
                <p><strong>CLÁUSULA 2ª (GRATUIDADE E ISENÇÃO DE ÔNUS):</strong> Esta autorização é concedida a título inteiramente gratuito, sem qualquer remuneração, indenização ou cobrança de royalties, abrangendo o território nacional e internacional por tempo indeterminado.</p>
                
                <p><strong>CLÁUSULA 3ª (CONFORMIDADE LGPD - LEI Nº 13.709/2018):</strong> A captação e o tratamento dos dados audiovisuais observarão os princípios da boa-fé, transparência e finalidade desportiva estipulados pela Lei Geral de Proteção de Dados (LGPD), garantindo a preservação da dignidade humana do atleta no tatame.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, autoriza_uso_imagem: true }));
                  setShowTermosImagemModal(false);
                }}
                className="px-5 py-2.5 bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer shadow-sm"
              >
                Aceitar & Concordar com o Termo
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
