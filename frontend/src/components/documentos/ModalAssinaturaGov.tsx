'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';

interface ModalAssinaturaGovProps {
  onClose: () => void;
  onSuccess: (cpf: string) => void;
  documentTitle: string;
}

export default function ModalAssinaturaGov({ onClose, onSuccess, documentTitle }: ModalAssinaturaGovProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [codigoSms, setCodigoSms] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState('');
  const [timer, setTimer] = useState(60);

  // Formata CPF automaticamente
  const formatarCpfInput = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  useEffect(() => {
    let interval: any;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleAvancarCpf = (e: React.FormEvent) => {
    e.preventDefault();
    setErros('');
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErros('Digite um CPF válido com 11 dígitos.');
      return;
    }
    if (!senha) {
      setErros('Digite sua senha do Gov.br.');
      return;
    }

    setCarregando(true);
    // Simula validação e envio do código
    setTimeout(() => {
      setCarregando(false);
      setStep(2);
      setTimer(60);
    }, 1500);
  };

  const handleConfirmarAssinatura = (e: React.FormEvent) => {
    e.preventDefault();
    setErros('');
    if (codigoSms.length !== 6) {
      setErros('O código de autorização deve possuir 6 dígitos.');
      return;
    }

    setCarregando(true);
    // Simula a assinatura eletrônica do ITI Gov.br
    setTimeout(() => {
      setCarregando(false);
      setStep(3);
      // Sucesso
      setTimeout(() => {
        onSuccess(cpf.replace(/\D/g, ''));
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col">
        {/* Topbar Gov.br original azul */}
        <div className="bg-[#002d6b] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight font-sans">gov<span className="text-[#00c5ff]">.br</span></span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-sans">Assinatura Eletrônica</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Informações da requisição de assinatura */}
        <div className="bg-zinc-50 border-b border-zinc-150 px-5 py-3.5 text-xs text-zinc-650 flex flex-col gap-1 font-sans">
          <p className="font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Solicitação de Assinatura</p>
          <p className="font-extrabold text-zinc-900 truncate">{documentTitle}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Associação Goju-Ryu Karatê-Kai</p>
        </div>

        {/* Conteúdo dinâmico de etapas */}
        <div className="p-6 flex-1 text-zinc-800 font-sans min-h-[280px] flex flex-col justify-between">
          
          {step === 1 && (
            <form onSubmit={handleAvancarCpf} className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-zinc-900 tracking-tight">Identifique-se no Gov.br</h4>
                  <p className="text-xs text-zinc-500">Insira sua conta de acesso do Governo Federal.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">CPF do Titular</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatarCpfInput(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#002d6b] focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">Senha Gov.br</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#002d6b] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {erros && (
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{erros}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 bg-[#1351b4] hover:bg-[#002d6b] disabled:bg-zinc-200 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
              >
                {carregando ? <Loader2 size={14} className="animate-spin" /> : 'Entrar com Gov.br'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirmarAssinatura} className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-zinc-900 tracking-tight">Autorização de Assinatura</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Um código de autorização foi enviado via SMS para o telefone cadastrado na sua conta Gov.br.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">Código de 6 dígitos</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={codigoSms}
                    onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 px-4 py-3 rounded-xl text-center text-base font-black tracking-[0.4em] outline-none focus:border-[#002d6b] focus:bg-white transition-all"
                  />
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-semibold">
                    <span>Não recebeu o código?</span>
                    {timer > 0 ? (
                      <span>Reenviar em {timer}s</span>
                    ) : (
                      <button type="button" onClick={() => setTimer(60)} className="text-[#1351b4] hover:underline cursor-pointer">
                        Reenviar SMS
                      </button>
                    )}
                  </div>
                </div>

                {erros && (
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{erros}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={carregando || codigoSms.length !== 6}
                className="w-full py-3 bg-[#00c5ff]/20 hover:bg-[#1351b4] border border-[#1351b4]/30 hover:border-transparent text-[#1351b4] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-transparent mt-6"
              >
                {carregando ? <Loader2 size={14} className="animate-spin" /> : 'Assinar Documento'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center flex-1">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                <ShieldCheck size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-zinc-900 tracking-tight">Assinado com Sucesso!</h4>
                <p className="text-xs text-zinc-500">
                  O documento foi assinado digitalmente nos padrões ICP-Brasil com sua chave Gov.br.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
