'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, Sparkles, User, MessageSquare, 
  HelpCircle, Trash2, Award, Clock, ArrowRight, Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { text: 'O que significa Sanchin?', label: 'Kata Sanchin' },
  { text: 'Quem fundou o estilo Goju-Ryu?', label: 'Fundador' },
  { text: 'Qual a diferença entre Go e Ju?', label: 'Go vs Ju' },
  { text: 'Qual a importância da respiração Ibuki?', label: 'Ibuki' },
];

export default function SenseiIAPage() {
  const { usuario } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Olá, ${usuario?.nome || 'praticante'}! Sou o Sensei Virtual da Federação Baiana de Karate-do Esportivo. Estou aqui para guiar você na filosofia, nos Katas (como Sanchin e Tensho) e nas tradições do Karate. O que deseja aprender hoje sobre o Caminho (Do)?`,
        timestamp: new Date()
      }
    ]);
  }, [usuario]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    if (!textToSend) setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_URL}/api/ia-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: query })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.resposta,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Falha no processamento da IA');
      }
    } catch (err) {
      setTimeout(() => {
        let responseText = '';
        const lowerText = query.toLowerCase();
        
        if (lowerText.includes('sanchin')) {
          responseText = "Sanchin (Três Batalhas) é o Kata fundamental do Goju-Ryu. Ele foca na respiração ibuki, postura estável (Sanchin-dachi) e fortalecimento corporal através de contração isométrica rígida (Go). O objetivo é unir mente, corpo e espírito.";
        } else if (lowerText.includes('origem') || lowerText.includes('fundador') || lowerText.includes('criador') || lowerText.includes('miyagi')) {
          responseText = "O Karate Goju-Ryu foi fundado pelo Mestre Chojun Miyagi (1888-1953) em Okinawa, Japão. Ele combinou técnicas tradicionais de Okinawa (Naha-te) com estilos chineses de Kung Fu para criar o estilo.";
        } else if (lowerText.includes('goju') || lowerText.includes('diferença') || lowerText.includes('suavidade') || lowerText.includes('força')) {
          responseText = "No Goju-Ryu, o 'Go' significa força/rigidez e o 'Ju' significa suavidade/flexibilidade. O estilo baseia-se no equilíbrio yin-yang, onde ataques lineares e firmes (Go) alternam-se com desvios e movimentos circulares e fluidos (Ju).";
        } else if (lowerText.includes('ibuki') || lowerText.includes('respiração')) {
          responseText = "A respiração Ibuki é a respiração abdominal ruidosa e profunda característica do Goju-Ryu. Ela serve para contrair os órgãos internos, proteger o corpo de impactos no abdômen e canalizar a energia (Ki) durante os golpes.";
        } else if (lowerText.includes('tensho')) {
          responseText = "Tensho (Mãos Rotativas) é a contraparte suave do Kata Sanchin. Desenvolvido pelo Mestre Chojun Miyagi, foca em defesas de mão aberta (Ju) e transições respiratórias fluidas e suaves.";
        } else {
          responseText = `Compreendo sua busca sobre "${query}". No Karate-do, o constante aprimoramento técnico e moral deve andar junto com a disciplina diária (Hitotsu - Reigi o omonzuru koto). Recomendo praticar os fundamentos sob orientação do seu Sensei no dojo!`;
        }

        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date()
        }]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 w-full max-w-5xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-[#002B7F] rounded-2xl flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
              Inteligência Artificial FBKE
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sensei IA — Assistente de Filosofia & Katas</h1>
            <p className="text-xs text-slate-500 mt-0.5">Tire dúvidas sobre nomenclatura japonesa, kata, arbitragem e história do Karate</p>
          </div>
        </div>
      </div>

      {/* Sugestões Rápidas */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sug.text)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#002B7F] hover:border-[#002B7F] shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-[#CE1126]" /> {sug.label}
          </button>
        ))}
      </div>

      {/* Janela de Chat */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 min-h-[450px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                m.sender === 'user' ? 'bg-[#CE1126] text-white' : 'bg-[#002B7F] text-white'
              }`}>
                {m.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-50 border border-blue-200 text-slate-900'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}>
                <p className="font-semibold">{m.text}</p>
                <span className="text-[9px] text-slate-400 mt-2 block font-mono">
                  {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-xs">
              <div className="w-8 h-8 rounded-xl bg-[#002B7F] text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                <Sparkles size={14} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#002B7F]" /> Meditando na resposta do Sensei...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input de Mensagem */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-4 border-t border-slate-100"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre katas, filosofia ou termos do Karate..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B7F]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[#002B7F] hover:bg-blue-900 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Send size={14} /> Enviar
          </button>
        </form>
      </div>

    </main>
  );
}
