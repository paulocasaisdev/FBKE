'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermosPage() {
  const [content, setContent] = useState({
    titulo: 'Termos de Serviço',
    desc: 'Condições de uso do Portal GRKK.',
    s1_titulo: '1. Aceitação dos Termos',
    s1_texto: 'Ao acessar e utilizar o Portal GRKK, você declara estar de acordo com estes Termos de Serviço. Caso não concorde com qualquer disposição, você não deve utilizar nossos serviços.',
    s2_titulo: '2. Definições',
    s2_def_portal: 'Plataforma digital da Associação Goju-Ryu Karate Kai, incluindo todas as suas funcionalidades, conteúdos e serviços.',
    s2_def_usuario: 'Qualquer pessoa física que acesse ou utilize o Portal, incluindo atletas, filiados, visitantes e administradores.',
    s2_def_atleta: 'Usuário cadastrado que solicita ou possui vínculo com a associação para atividades esportivas.',
    s3_titulo: '3. Cadastro e Conta',
    s3_texto: 'Para acessar determinadas funcionalidades, é necessário realizar cadastro. Você se compromete a fornecer informações verdadeiras, atualizadas e completas. É de sua exclusiva responsabilidade manter a confidencialidade de sua senha.',
    s3_texto2: 'O cadastro de atleta está sujeito a homologação pela administração da GRKK, que pode aprová-lo ou rejeitá-lo a seu critério.',
    s4_titulo: '4. Uso do Portal',
    s4_texto: 'O usuário concorda em utilizar o Portal de acordo com a lei, a moral, os bons costumes e a ordem pública. É vedado:',
    s4_lista: 'Utilizar o Portal para fins ilícitos ou não autorizados\nFornecer informações falsas ou fraudulentas\nTentar acessar áreas restritas sem autorização\nInterferir no funcionamento do sistema',
    s5_titulo: '5. Propriedade Intelectual',
    s5_texto: 'Todo o conteúdo do Portal, incluindo textos, imagens, logotipos e marcas, é propriedade da GRKK ou utilizado sob licença, sendo proibida a reprodução sem autorização prévia.',
    s6_titulo: '6. Homologação de Atletas',
    s6_texto: 'O cadastro de atleta é submetido à análise da administração, que poderá solicitar documentos complementares. A GRKK reserva-se o direito de recusar ou cancelar cadastros que não estejam em conformidade com seus regulamentos internos.',
    s7_titulo: '7. Limitação de Responsabilidade',
    s7_texto: 'A GRKK não se responsabiliza por danos diretos ou indiretos decorrentes do uso indevido do Portal, interrupções temporárias do serviço ou conduta de terceiros.',
    s8_titulo: '8. Disposições Gerais',
    s8_texto: 'Estes Termos podem ser alterados a qualquer momento. O uso continuado do Portal após alterações constitui aceitação dos novos termos. A inação frente a descumprimento não constitui renúncia a direitos.',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/cms/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.config?.doc_termos) {
          setContent(prev => ({ ...prev, ...data.config.doc_termos }));
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
              <FileText size={28} className="text-gold" />
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
                <p><strong className="text-white">Portal GRKK:</strong> {content.s2_def_portal}</p>
                <p className="mt-2"><strong className="text-white">Usuário:</strong> {content.s2_def_usuario}</p>
                <p className="mt-2"><strong className="text-white">Atleta:</strong> {content.s2_def_atleta}</p>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s3_titulo}</h2>
                <p>{content.s3_texto}</p>
                <p className="mt-2">{content.s3_texto2}</p>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s4_titulo}</h2>
                <p>{content.s4_texto}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                  {content.s4_lista?.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-cinzel text-xl text-white font-bold mb-3">{content.s5_titulo}</h2>
                <p>{content.s5_texto}</p>
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
