'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, ArrowLeft } from 'lucide-react';

export default function DefesaMarcaPage() {
  const [content, setContent] = useState({
    titulo: 'Defesa de Marca – Goju-Ryu Karate-Kai',
    desc: 'Apresentação desenvolvida sob a perspectiva de branding.',
    s1_titulo: '1. O que é Defesa de Marca?',
    s1_texto: 'Defesa de Marca é o conjunto de estratégias jurídicas e de branding adotadas para proteger a identidade, reputação e ativos intangíveis da marca Goju-Ryu Karate-Kai no mercado.',
    s2_titulo: '2. Identidade da Marca',
    s2_texto: 'A marca Goju-Ryu Karate-Kai representa:',
    s2_lista: 'Tradição do Karatê Okinawano\nQualidade técnica reconhecida\nCompromisso com a cultura e disciplina\nExcelência no ensino marcial',
    s3_titulo: '3. Registro e Propriedade',
    s3_texto: 'O nome, logotipo e símbolos associados à Goju-Ryu Karate-Kai são protegidos como marca registrada, garantindo à associação o direito exclusivo de uso em todo o território nacional.',
    s3_lista: 'Registro junto ao INPI\nDireitos de uso exclusivo\nProteção contra uso indevido\nAção legal contra infratores',
    s4_titulo: '4. Uso Autorizado',
    s4_texto: 'O uso da marca Goju-Ryu Karate-Kai por terceiros é permitido apenas mediante autorização expressa da associação, respeitando as diretrizes estabelecidas.',
    s5_titulo: '5. Diretrizes de Branding',
    s5_texto: 'Toda comunicação visual da marca deve seguir as diretrizes de branding estabelecidas:',
    s5_lista: 'Cores institucionais: vermelho, dourado e preto\nTipografia oficial: Cinzel (títulos) e sans-serif (corpo)\nLogotipo: uso exclusivo em fundo que garanta legibilidade\nTom de voz: formal, respeitoso e acolhedor',
    s6_titulo: '6. Monitoramento e Fiscalização',
    s6_texto: 'A GRKK realiza monitoramento contínuo do mercado para identificar usos não autorizados da marca, adotando medidas administrativas e judiciais quando necessário.',
    s7_titulo: '7. Penalidades',
    s7_texto: 'O uso não autorizado da marca sujeita o infrator às penalidades previstas em lei, incluindo:',
    s7_lista: 'Notificação extrajudicial\nPedido de indenização por danos morais e materiais\nRepresentação criminal por violação de direito de marca\nPerda de vínculo com a associação',
    s8_titulo: '8. Contato para Autorização',
    s8_texto: 'Para solicitar autorização de uso da marca ou reportar uso indevido, entre em contato pelo e-mail: contato@gojuryukaratekai.com.br.',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/cms/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.config?.doc_defesa_marca) {
          setContent(prev => ({ ...prev, ...data.config.doc_defesa_marca }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 pt-20">
        <section className="bg-zinc-950 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/transparencia" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8 font-body">
              <ArrowLeft size={14} /> Voltar para Transparência
            </Link>

            <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={28} className="text-gold" />
            </div>

            <h1 className="font-cinzel text-4xl text-white font-bold mb-2">{content.titulo}</h1>
            <p className="text-gray-500 text-sm font-body mb-4">Última atualização: Junho de 2026</p>
            <div className="w-12 h-0.5 bg-gold mb-8" />

            <div className="space-y-8 text-gray-400 text-sm font-body leading-relaxed">
              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s1_titulo}</h2>
                <p>{content.s1_texto}</p>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s2_titulo}</h2>
                <p>{content.s2_texto}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s2_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s3_titulo}</h2>
                <p>{content.s3_texto}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s3_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s4_titulo}</h2>
                <p>{content.s4_texto}</p>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s5_titulo}</h2>
                <p>{content.s5_texto}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s5_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s6_titulo}</h2>
                <p>{content.s6_texto}</p>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s7_titulo}</h2>
                <p>{content.s7_texto}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s7_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s8_titulo}</h2>
                <p>{content.s8_texto}</p>
              </section>

              {/* Seções Extras Adicionadas Dinamicamente pelo CMS */}
              {(content as any).secoes_extras?.map((sec: any, idx: number) => (
                <section key={sec.id || idx}>
                  <h2 className="font-cinzel text-xl text-white font-bold mb-3">{sec.titulo}</h2>
                  <p className="whitespace-pre-line text-zinc-400">{sec.texto}</p>
                  {sec.lista && (
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                      {sec.lista.split('\n').map((item: string, j: number) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
