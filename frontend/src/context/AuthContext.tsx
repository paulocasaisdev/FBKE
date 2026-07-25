'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'admin' | 'atleta' | 'filial';
  status: string;
  tambem_atleta?: boolean;
  dados_atleta?: Record<string, any>;
  [key: string]: any;
}

interface AuthContextType {
  usuario: UserProfile | null;
  tipo: 'admin' | 'atleta' | 'filial' | null;
  tipoReal: 'admin' | 'atleta' | 'filial' | null;
  carregando: boolean;
  autenticado: boolean;
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAtleta: boolean;
  isFilial: boolean;
  isFiliado: boolean;
  isPerfilUnificado: boolean;
  perfilAtivo: 'filial' | 'atleta';
  alternarPerfil: () => void;
  cadastroIncompleto: boolean;
  login: (tipoLogin: 'atleta' | 'filial', credenciais: any) => Promise<any>;
  loginLegado: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  recarregarSessao: () => Promise<void>;
  atualizarUsuario: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  temAcesso: (...papeis: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function parseJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.error('[AuthContext] Resposta não-JSON recebida:', res.status, text.slice(0, 200));
    throw new Error(`O servidor retornou uma resposta inválida (HTTP ${res.status}). Verifique se a API backend está rodando.`);
  }
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [tipo, setTipo] = useState<'admin' | 'atleta' | 'filial' | null>(null);
  const [perfilAtivo, setPerfilAtivo] = useState<'filial' | 'atleta'>('filial');
  const [carregando, setCarregando] = useState(true);

  const isAdmin = tipo === 'admin';
  const isAtleta = tipo === 'atleta';
  const isFilial = tipo === 'filial';
  const isFiliado = tipo === 'atleta'; // Alias para compatibilidade
  const autenticado = !!usuario;
  const isPerfilUnificado = !!(usuario?.tambem_atleta);
  const tipoReal = usuario?.tipo || null;

  // Validação de cadastro incompleto (Falta CPF ou Endereço ou Dados obrigatórios)
  let cadastroIncompleto = false;
  if (usuario && tipo !== 'admin') {
    if (tipo === 'atleta') {
      const temCpf = !!((usuario.cpf && usuario.cpf.trim() !== '') || (usuario.dados_atleta?.cpf && usuario.dados_atleta.cpf.trim() !== '') || (usuario.cpf_responsavel && usuario.cpf_responsavel.trim() !== '') || (usuario.cnpj_cpf && usuario.cnpj_cpf.trim() !== ''));
      const temEndereco = !!((usuario.endereco || usuario.rua || usuario.dados_atleta?.endereco) && (usuario.cidade || usuario.municipio || usuario.dados_atleta?.cidade));
      // Se for conta unificada (filial + atleta), herda a liberação se tiver CPF e Endereço da filial
      const temDataNasc = usuario.tambem_atleta ? true : !!(usuario.data_nascimento && usuario.data_nascimento.trim() !== '');
      cadastroIncompleto = !temCpf || !temDataNasc || !temEndereco;
    } else if (tipo === 'filial') {
      const temCnpjCpf = !!((usuario.cnpj_cpf && usuario.cnpj_cpf.trim() !== '') || (usuario.cpf_responsavel && usuario.cpf_responsavel.trim() !== ''));
      const temGradResp = !!(usuario.graduacao_responsavel && usuario.graduacao_responsavel.trim() !== '');
      const temEndereco = !!((usuario.rua || usuario.endereco) && (usuario.municipio || usuario.cidade));
      cadastroIncompleto = !temCnpjCpf || !temGradResp || !temEndereco;
    }
  }

  const aplicarPerfilAtivo = useCallback((u: UserProfile) => {
    if (u.tambem_atleta) {
      const cpfFallback = u.cpf || u.dados_atleta?.cpf || u.cpf_responsavel || u.cnpj_cpf || '';
      const nomeFallback = u.nome || u.dados_atleta?.nome || u.nome_fantasia || '';
      const endFallback = u.endereco || u.rua || u.dados_atleta?.endereco || '';
      const cidFallback = u.cidade || u.municipio || u.dados_atleta?.cidade || '';
      const ufFallback = u.uf || u.estado || u.dados_atleta?.uf || '';

      const valAutoriza = u.dados_atleta?.autoriza_uso_imagem !== undefined
        ? u.dados_atleta.autoriza_uso_imagem
        : u.autoriza_uso_imagem;

      if (!u.cpf) u.cpf = cpfFallback;
      if (!u.nome) u.nome = nomeFallback;
      if (!u.endereco) u.endereco = endFallback;
      if (!u.cidade) u.cidade = cidFallback;
      if (!u.uf) u.uf = ufFallback;
      if (valAutoriza !== undefined) u.autoriza_uso_imagem = valAutoriza;

      if (u.dados_atleta) {
        u.dados_atleta.cpf = u.dados_atleta.cpf || cpfFallback;
        u.dados_atleta.nome = u.dados_atleta.nome || nomeFallback;
        u.dados_atleta.endereco = u.dados_atleta.endereco || endFallback;
        u.dados_atleta.cidade = u.dados_atleta.cidade || cidFallback;
        u.dados_atleta.uf = u.dados_atleta.uf || ufFallback;
        if (valAutoriza !== undefined) u.dados_atleta.autoriza_uso_imagem = valAutoriza;
      }

      const saved = typeof window !== 'undefined' ? localStorage.getItem('grkk_perfil_ativo') : null;
      const ativo = saved === 'atleta' ? 'atleta' : 'filial';
      setPerfilAtivo(ativo);
      setTipo(ativo);
    } else {
      setTipo((u.tipo as string) === 'filiado' ? 'atleta' : u.tipo);
    }
  }, []);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar sessão');
      const data = await parseJsonResponse(res);

      if (data.autenticado && data.usuario) {
        setUsuario(data.usuario);
        aplicarPerfilAtivo(data.usuario);
      } else {
        setUsuario(null);
        setTipo(null);
      }
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar sessão:', err);
      setUsuario(null);
      setTipo(null);
    } finally {
      setCarregando(false);
    }
  }, [aplicarPerfilAtivo]);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const alternarPerfil = useCallback(() => {
    if (!usuario?.tambem_atleta) return;
    const novo = perfilAtivo === 'filial' ? 'atleta' : 'filial';
    setPerfilAtivo(novo);
    setTipo(novo);

    // Garante consolidação e fusão dos dados do usuário ao alternar de perfil
    const cpfFallback = usuario.cpf || usuario.dados_atleta?.cpf || usuario.cpf_responsavel || usuario.cnpj_cpf || '';
    const nomeFallback = usuario.nome || usuario.dados_atleta?.nome || usuario.nome_fantasia || '';
    const endFallback = usuario.endereco || usuario.rua || usuario.dados_atleta?.endereco || '';
    const cidFallback = usuario.cidade || usuario.municipio || usuario.dados_atleta?.cidade || '';
    const ufFallback = usuario.uf || usuario.estado || usuario.dados_atleta?.uf || '';
    const valAutoriza = usuario.dados_atleta?.autoriza_uso_imagem !== undefined
      ? usuario.dados_atleta.autoriza_uso_imagem
      : usuario.autoriza_uso_imagem;

    setUsuario(prev => prev ? ({
      ...prev,
      nome: prev.nome || nomeFallback,
      cpf: prev.cpf || cpfFallback,
      endereco: prev.endereco || endFallback,
      rua: prev.rua || endFallback,
      cidade: prev.cidade || cidFallback,
      municipio: prev.municipio || cidFallback,
      uf: prev.uf || ufFallback,
      estado: prev.estado || ufFallback,
      autoriza_uso_imagem: valAutoriza,
      dados_atleta: prev.dados_atleta ? {
        ...prev.dados_atleta,
        nome: prev.dados_atleta.nome || nomeFallback,
        cpf: prev.dados_atleta.cpf || cpfFallback,
        endereco: prev.dados_atleta.endereco || endFallback,
        cidade: prev.dados_atleta.cidade || cidFallback,
        uf: prev.dados_atleta.uf || ufFallback,
        autoriza_uso_imagem: valAutoriza
      } : prev.dados_atleta
    }) : prev);

    if (typeof window !== 'undefined') {
      localStorage.setItem('grkk_perfil_ativo', novo);
    }
  }, [usuario, perfilAtivo]);

  async function login(tipoLogin: 'atleta' | 'filial', credenciais: any) {
    setCarregando(true);
    try {
      const body =
        tipoLogin === 'filial'
          ? { tipo: 'filial', email: credenciais.email, password: credenciais.senha }
          : { tipo: 'atleta', email: credenciais.telefone, password: credenciais.senha };

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

      setUsuario(data.usuario);
      aplicarPerfilAtivo(data.usuario);
      return data;
    } finally {
      setCarregando(false);
    }
  }

  async function loginLegado(email: string, pass: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
    setUsuario(data.usuario);
    aplicarPerfilAtivo(data.usuario);
    return data;
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('[AuthContext] Erro no logout:', err);
    } finally {
      setUsuario(null);
      setTipo(null);
    }
  }

  function temAcesso(...papeis: string[]) {
    return tipo ? papeis.includes(tipo) : false;
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        tipo,
        tipoReal,
        carregando,
        autenticado,
        user: usuario,
        loading: carregando,
        isAdmin,
        isAtleta,
        isFilial,
        isFiliado,
        isPerfilUnificado,
        perfilAtivo,
        alternarPerfil,
        cadastroIncompleto,
        login,
        loginLegado,
        logout,
        recarregarSessao: carregarSessao,
        atualizarUsuario: setUsuario,
        temAcesso,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
