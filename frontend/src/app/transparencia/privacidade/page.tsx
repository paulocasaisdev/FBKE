'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacidadePage() {
  const [content, setContent] = useState({
    titulo: 'Aviso de Privacidade',
    desc: 'Política de tratamento de dados pessoais.',
    s1_titulo: '1. Dados Coletados',
    s1_texto: 'Podemos coletar as seguintes informações pessoais:',
    s1_lista: 'Nome completo, e-mail e telefone\nDados de cadastro (CPF, data de nascimento, endereço)\nInformações sobre saúde (alergias, restrições) fornecidas voluntariamente\nDados de navegação (cookies, IP, páginas acessadas)',
    s2_titulo: '2. Finalidade do Tratamento',
    s2_texto: 'Seus dados são utilizados para:',
    s2_lista: 'Gerenciar sua conta e cadastro na associação\nViabilizar a participação em exames, eventos e atividades\nEnviar comunicados institucionais e administrativos\nCumprir obrigações legais e regulatórias\nMelhorar a experiência no Portal',
    s3_titulo: '3. Compartilhamento de Dados',
    s3_texto: 'Seus dados não serão comercializados. Podemos compartilhar informações com:',
    s3_lista: 'Entidades esportivas oficiais (federações, confederações)\nAutoridades judiciais ou governamentais, quando exigido por lei\nPrestadores de serviço que atuam em nome da GRKK',
    s4_titulo: '4. Segurança dos Dados',
    s4_texto: 'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição, incluindo criptografia e controles de acesso.',
    s5_titulo: '5. Seus Direitos (LGPD)',
    s5_texto: 'Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui os seguintes direitos:',
    s5_lista: 'Confirmar a existência de tratamento de seus dados\nAcessar seus dados pessoais\nCorrigir dados incompletos, inexatos ou desatualizados\nSolicitar a anonimização, bloqueio ou eliminação de dados desnecessários\nRevogar o consentimento a qualquer momento\nSolicitar a portabilidade dos dados',
    s6_titulo: '6. Cookies',
    s6_texto: 'Utilizamos cookies essenciais para o funcionamento do Portal e cookies analíticos para melhorar sua experiência. Você pode configurar seu navegador para recusar cookies, mas algumas funcionalidades podem ser afetadas.',
    s7_titulo: '7. Contato do Encarregado (DPO)',
    s7_texto: 'Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato pelo e-mail: privacidade@gojuryukaratekai.com.br.',
    s8_titulo: '8. Alterações',
    s8_texto: 'Este Aviso de Privacidade pode ser atualizado periodicamente. Recomendamos a consulta regular desta página para conhecimento de eventuais alterações.',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/cms/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.config?.doc_privacidade) {
          setContent(prev => ({ ...prev, ...data.config.doc_privacidade }));
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
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s1_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
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
