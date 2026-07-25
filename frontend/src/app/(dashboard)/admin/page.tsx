'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Layout, Settings, Image, Users, Plus, Trash2, ShieldAlert, Loader2, Save, X, MessageSquare, Send, Mail, Phone, Shield, FileText, BookOpen, Bell, AlertTriangle, Minus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Banner {
  id: string | number;
  titulo: string;
  subtitulo: string;
  link?: string;
  imagem_url: string;
}

interface TeamMember {
  id: string | number;
  nome: string;
  cargo: string; // ex: Sensei 4º Dan
  biografia: string;
  foto_url: string;
  order: number;
}

interface GalleryItem {
  id: string | number;
  title: string;
  category: string;
  image_url: string;
  order: number;
}

export default function AdminCMSPage() {
  interface Contato {
    id: string | number;
    name: string;
    email: string;
    message: string;
    phone?: string;
    read?: boolean;
    lida?: boolean;
    created_at: string;
  }

  const { usuario, tipo } = useAuth();
  const [activeGroup, setActiveGroup] = useState<'geral' | 'site' | 'transparencia'>('geral');
  const [activeTab, setActiveTab] = useState<'banners' | 'equipe' | 'galeria' | 'mensagens' | 'paginainicial' | 'sensei-ia' | 'academia' | 'transparencia' | 'contato' | 'avisos' | 'dojo_kun' | 'doc_termos' | 'doc_privacidade' | 'doc_defesa_marca'>('banners');
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [equipe, setEquipe] = useState<TeamMember[]>([]);
  const [galeria, setGaleria] = useState<GalleryItem[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  // Avisos da Diretoria
  interface Aviso {
    id: string | number;
    titulo: string;
    conteudo: string;
    categoria: string;
    destinatario: 'todos' | 'filial' | 'atleta';
    created_at?: string;
  }
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(false);
  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [avisoForm, setAvisoForm] = useState({ titulo: '', conteudo: '', categoria: 'Geral', destinatario: 'todos' });
  const [salvandoAviso, setSalvandoAviso] = useState(false);

  // Formulários de documentos de transparência (persistidos via CMS config)
  const [docTermosForm, setDocTermosForm] = useState({
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
    secoes_extras: [] as Array<{ id: string; titulo: string; texto: string; lista?: string }>
  });
  const [docPrivacidadeForm, setDocPrivacidadeForm] = useState({
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
    secoes_extras: [] as Array<{ id: string; titulo: string; texto: string; lista?: string }>
  });
  const [docDefesaMarcaForm, setDocDefesaMarcaForm] = useState({
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
    secoes_extras: [] as Array<{ id: string; titulo: string; texto: string; lista?: string }>
  });
  const [docDojoKunForm, setDocDojoKunForm] = useState({
    preambulo: 'O Dojo Kun é o código de ética do karatê Goju-Ryu. Deve ser recitado ao início e término de cada treino como compromisso pessoal e coletivo.',
    preceitos: [
      {
        numero: 'I',
        kanji: '礼儀を重んずること',
        jp: 'Hitotsu — Reigi o omonzuru koto',
        pt: 'Respeitar a etiqueta e a cortesia acima de tudo',
        phonetic: 'Hee-toh-tsoo — Ray-ghee oh oh-mohn-zoo-roo koh-toh',
        philosophy: 'O Karatê começa e termina com respeito (Rei). Este princípio nos ensina que a cortesia e a humildade não são fraquezas, mas sim as maiores forças de um praticante. A etiqueta no Dojo serve para polir o nosso ego e nos conectar com a linhagem espiritual dos mestres.',
        dojo: 'Cumprimentar (Rei) ao entrar e sair do dojo, respeitar todos os parceiros de treino (independentemente da graduação), ouvir atentamente as correções dos instrutores e manter o dogi (uniforme) sempre limpo e alinhado.',
        life: 'Tratar todas as pessoas com empatia, cortesia e dignidade no ambiente de trabalho, familiar e social. Agir com integridade e retidão ética mesmo quando não houver ninguém observando.'
      },
      {
        numero: 'II',
        kanji: '勇気を養うこと',
        jp: 'Hitotsu — Yuki o yashinau koto',
        pt: 'Cultivar a coragem e a força interior',
        phonetic: 'Hee-toh-tsoo — Yoo-kee oh yah-shee-nah-oo koh-toh',
        philosophy: 'A verdadeira coragem (Yuki) não reside na ausência de medo, mas na determinação inabalável de agir corretamente apesar dele. Ela se desenvolve ao enfrentarmos nossos limites físicos e mentais no tatame, expandindo nossos horizontes pessoais.',
        dojo: 'Não recuar perante treinos intensivos, aceitar os desafios de kumite (combate livre) com oponentes mais graduados e manter a postura focada mesmo diante de fadiga extrema.',
        life: 'Tomar decisões difíceis porém éticas, defender causas justas e os mais vulneráveis, admitir honestamente os próprios erros e ter a audácia de persistir em seus projetos contra a correnteza das dificuldades.'
      },
      {
        numero: 'III',
        kanji: '伝統空手を守り日々の鍛錬を怠らざること',
        jp: 'Hitotsu — Dento karate o mamori hibi no tanren o okotarazu koto',
        pt: 'Proteger o Karatê tradicional e praticar diariamente sem falhar',
        phonetic: 'Hee-toh-tsoo — Den-toh kah-rah-teh oh mah-moh-ree hee-bee noh tahn-ren oh oh-koh-tah-rah-zoo koh-toh',
        philosophy: 'O treinamento cotidiano e rigoroso (Tanren) é o fogo lento que purifica e forja o caráter do praticante. O Karatê tradicional não é um esporte de resultados efêmeros, mas uma arte de aprimoramento contínuo. Preservar a tradição significa treinar com máxima intenção e respeito às técnicas fundamentais.',
        dojo: 'Executar cada repetição de kihon ou kata como se fosse única, buscar a precisão milimétrica dos ângulos e posturas, e enxergar na repetição a chave secreta para a excelência motora e mental.',
        life: 'Aplicar consistência e paciência na busca de metas pessoais e profissionais de longo prazo, entendendo que grandes conquistas são construídas através de pequenos esforços diários contínuos.'
      },
      {
        numero: 'IV',
        kanji: '心身uを練磨し剛柔流空手の真髄を極めること',
        jp: 'Hitotsu — Shinshin o renma shi Goju-Ryu Karate no shinzui o kiwameru koto',
        pt: 'Treinar o corpo e a mente para alcançar a essência do Goju-Ryu',
        phonetic: 'Hee-toh-tsoo — Sheen-sheen oh ren-mah shee goh-joo ryoo kah-rah-teh noh sheen-zoo-ee oh kee-wah-meh-roo koh-toh',
        philosophy: 'Goju-Ryu traduz-se como o caminho do "Forte e Suave". A sua essência (Shinzui) repousa em harmonizar o impacto firme e estruturado (Go) com a esquiva fluida e adaptável (Ju). A unificação do desenvolvimento físico e mental (Shinshin) nos ensina a fluir entre essas forças sem perder o eixo.',
        dojo: 'Dominar a técnica de contração muscular no Sanchin com a respiração profunda (Ibuki) e a flexibilidade circular do Tensho. Saber dosar a força de impacto com a suavidade na defesa.',
        life: 'Desenvolver resiliência para ser firme e assertivo nos momentos que exigem firmeza, mas mantendo-se flexível, paciente e acolhedor nas relações humanas. Equilibrar mente racional e intuição diante de crises.'
      },
      {
        numero: 'V',
        kanji: '不撓不屈の精神を養うこと',
        jp: 'Hitotsu — Futo fukutsu no seishin o yashinau koto',
        pt: 'Nutrir um espírito indomável e de perseverança eterna',
        phonetic: 'Hee-toh-tsoo — Foo-toh foo-koo-tsoo noh say-sheen oh yah-shee-nah-oo koh-toh',
        philosophy: 'Futo Fukutsu simboliza o princípio oriental da resiliência máxima: cair sete vezes, levantar-se oito. O espírito indomável garante que nenhuma adversidade material, cansaço ou dúvida possa desviar o karateca de sua busca pelo autoaperfeiçoamento (Do).',
        dojo: 'Persistir no treino mesmo quando os movimentos parecem difíceis de dominar, aceitar com humildade a necessidade de repetir exames de faixa e aprender com as derrotas.',
        life: 'Encarar crises de saúde, perdas emocionais e revezes financeiros com paciência activa e esperança. Manter seus princípios éticos intocados perante qualquer provação externa.'
      }
    ]
  });

  // Glossário do Sensei IA
  interface GlossaryTerm {
    termo: string;
    definicao: string;
  }
  const [glossario, setGlossario] = useState<GlossaryTerm[]>([]);
  const [loadingGlossario, setLoadingGlossario] = useState(false);
  const [termoSearch, setTermoSearch] = useState('');
  const [showGlossarioModal, setShowGlossarioModal] = useState(false);
  const [glossarioForm, setGlossarioForm] = useState<GlossaryTerm>({ termo: '', definicao: '' });
  const [salvandoGlossario, setSalvandoGlossario] = useState(false);
  const [isEditingTerm, setIsEditingTerm] = useState(false);

  const [dojoKunActivePrecept, setDojoKunActivePrecept] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Forms
  const [bannerForm, setBannerForm] = useState({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
  const [teamForm, setTeamForm] = useState({ nome: '', cargo: '', biografia: '', foto_url: '', order: 0 });
  const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Treinos', image_url: '', order: 0 });

  // Site configuration states
  interface ConfigInicial {
    hero: { badge: string; titulo: string; descricao: string };
    principios: {
      subtitulo: string;
      go_titulo: string;
      go_desc: string;
      go_itens: string[];
      ju_titulo: string;
      ju_desc: string;
      ju_itens: string[];
    };
    katas: Array<{ nome: string; significado: string; foco: string; desc: string }>;
    academia?: {
      hero_subtitulo: string;
      hero_titulo: string;
      hero_descricao: string;
      desde_subtitulo: string;
      desde_titulo: string;
      desde_paragrafo1: string;
      desde_paragrafo2: string;
      desde_paragrafo3: string;
      missao_desc: string;
      visao_desc: string;
      valores_desc: string;
    };
    transparencia?: {
      hero_title: string;
      hero_subtitle: string;
      hero_breadcrumb: string;
      intro_text: string;
      compromisso_title: string;
      compromisso_text: string;
    };
    contato?: {
      hero_title: string;
      hero_subtitle: string;
      secao_subtitulo: string;
      secao_titulo: string;
      secao_desc: string;
      telefone: string;
      telefone_tel: string;
      email: string;
      endereco: string;
      horarios: string;
    };
    dojo_kun?: {
      preambulo: string;
      preceitos: Array<{
        numero: string;
        kanji: string;
        jp: string;
        pt: string;
        phonetic: string;
        philosophy: string;
        dojo: string;
        life: string;
      }>;
    };
    doc_termos?: {
      titulo: string;
      desc: string;
      s1_titulo: string;
      s1_texto: string;
      s2_titulo: string;
      s2_def_portal: string;
      s2_def_usuario: string;
      s2_def_atleta: string;
      s3_titulo: string;
      s3_texto: string;
      s3_texto2: string;
      s4_titulo: string;
      s4_texto: string;
      s4_lista: string;
      s5_titulo: string;
      s5_texto: string;
      s6_titulo: string;
      s6_texto: string;
      s7_titulo: string;
      s7_texto: string;
      s8_titulo: string;
      s8_texto: string;
      secoes_extras?: Array<{ id: string; titulo: string; texto: string; lista?: string }>;
    };
    doc_privacidade?: {
      titulo: string;
      desc: string;
      s1_titulo: string;
      s1_texto: string;
      s1_lista: string;
      s2_titulo: string;
      s2_texto: string;
      s2_lista: string;
      s3_titulo: string;
      s3_texto: string;
      s3_lista: string;
      s4_titulo: string;
      s4_texto: string;
      s5_titulo: string;
      s5_texto: string;
      s5_lista: string;
      s6_titulo: string;
      s6_texto: string;
      s7_titulo: string;
      s7_texto: string;
      s8_titulo: string;
      s8_texto: string;
      secoes_extras?: Array<{ id: string; titulo: string; texto: string; lista?: string }>;
    };
    doc_defesa_marca?: {
      titulo: string;
      desc: string;
      s1_titulo: string;
      s1_texto: string;
      s2_titulo: string;
      s2_texto: string;
      s2_lista: string;
      s3_titulo: string;
      s3_texto: string;
      s3_lista: string;
      s4_titulo: string;
      s4_texto: string;
      s5_titulo: string;
      s5_texto: string;
      s5_lista: string;
      s6_titulo: string;
      s6_texto: string;
      s7_titulo: string;
      s7_texto: string;
      s7_lista: string;
      s8_titulo: string;
      s8_texto: string;
      secoes_extras?: Array<{ id: string; titulo: string; texto: string; lista?: string }>;
    };
  }

  const [siteConfig, setSiteConfig] = useState<ConfigInicial | null>(null);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const [heroForm, setHeroForm] = useState({
    badge: 'Tradição de Okinawa & IA Moderna',
    titulo: 'Onde a Força (Go) encontra a Suavidade (Ju)',
    descricao: 'O Karate Goju-Ryu harmoniza ataques diretos e bloqueios rígidos com movimentos circulares fluidos, respiração profunda e controle mental. Aprenda a arte marcial tradicional e consulte o nosso Sensei IA para expandir seus horizontes.'
  });
  const [principiosForm, setPrincipiosForm] = useState({
    subtitulo: 'O Goju-Ryu é construído sobre o conceito yin-yang chinês, equilibrando aspectos que parecem opostos, mas são complementares.',
    go_titulo: 'GO (Força / Rigidez)',
    go_desc: 'Refere-se ao endurecimento físico, golpes diretos, posições estáveis de combate e resistência ao impacto. É a força e firmeza necessárias para absorver o impacto e desferir contra-ataques decisivos com coragem implacável.',
    go_itens: 'Katas de fortalecimento como Sanchin, Calejamento de membros (Kote Kitae), Posturas baixas e firmes',
    ju_titulo: 'JU (Suavidade / Flexibilidade)',
    ju_desc: 'Representa movimentos circulares de esquiva, desvios suaves da força adversária, controle respiratório relaxado e agilidade. Ensina a ceder para vencer, redirecionando o fluxo de energia do oponente com precisão.',
    ju_itens: 'Katas de flexibilidade como Tensho, Esquivas circulares e fluidas (Tai Sabaki), Técnicas de agarre e projeção (Kakie)'
  });

  const [academiaForm, setAcademiaForm] = useState({
    hero_subtitulo: 'Nossa História',
    hero_titulo: 'A Academia',
    hero_descricao: 'Conheça a história, missão e valores do Goju-Ryu Karate Kai, uma academia comprometida com a preservação do Karatê Goju-Ryu tradicional de Okinawa.',
    desde_subtitulo: 'Desde o Início',
    desde_titulo: 'Nossa História',
    desde_paragrafo1: 'O Goju-Ryu Karate Kai nasceu com a missão de preservar e difundir o Karatê Goju-Ryu Okinawano em Salvador, Bahia, mantendo viva a tradição secular desta arte marcial.',
    desde_paragrafo2: 'Filiados à IOGKF Brasil — a maior organização de Karatê Goju-Ryu do mundo —, seguimos o currículo técnico e filosófico estabelecido pelos grandes mestres de Okinawa, garantindo a autenticidade do ensinamento.',
    desde_paragrafo3: 'Nossa academia acolhe praticantes de todas as idades e níveis, oferecendo um ambiente de aprendizado respeitoso, disciplinado e transformador.',
    missao_desc: 'Preservar e transmitir o Karatê Goju-Ryu Okinawano em sua forma mais autêntica, promovendo o desenvolvimento humano integral através da arte marcial.',
    visao_desc: 'Ser referência no Karatê Goju-Ryu tradicional em Salvador, formando praticantes técnicos, éticos e comprometidos com os valores do Budo.',
    valores_desc: 'Respeito, disciplina, perseverança, lealdade e autocontrole — os pilares que sustentam cada treino e cada relação dentro do dojo.'
  });

  const [transparenciaForm, setTransparenciaForm] = useState({
    hero_title: 'Transparência',
    hero_subtitle: 'A GRKK atua com ética, responsabilidade e compromisso público.',
    hero_breadcrumb: 'Transparência',
    intro_text: 'A GRKK disponibiliza seu estatuto social, diretoria vigência, CNPJ, regulamentos e documentos institucionais para consulta pública, reafirmando seu compromisso com a transparência e a boa governança esportiva.',
    compromisso_title: 'Nosso Compromisso',
    compromisso_text: 'A GRKK atua como executora de projetos esportivos e sociais, operando de forma organizada, transparente e descentralizada, garantindo a lisura de suas atividades administrativas e esportivas.'
  });

  const [contatoForm, setContatoForm] = useState({
    hero_title: 'Contato',
    hero_subtitle: 'Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer. Onegai shimasu!',
    secao_subtitulo: 'Fale Conosco',
    secao_titulo: 'Entre em Contato',
    secao_desc: 'Tire suas dúvidas, agende uma aula experimental ou venha nos conhecer.',
    telefone: '(71) 9 0000-0000',
    telefone_tel: '+5571900000000',
    email: 'contato@gojoryukaratekai.com.br',
    endereco: 'Salvador, Bahia, Brasil',
    horarios: 'Segunda e Quarta: 19:00 — 21:00\nSábado: 09:00 — 11:00'
  });
  const [katasForm, setKatasForm] = useState<Array<{ nome: string; significado: string; foco: string; desc: string }>>([
    {
      nome: "Sanchin",
      significado: "Três Batalhas",
      foco: "Fortalecimento e Respiração Ibuki",
      desc: "Foca na mente, corpo e espírito em perfeita união. Usa uma postura enraizada e contração isométrica para criar uma defesa impenetrável."
    },
    {
      nome: "Tensho",
      significado: "Mãos Rotativas",
      foco: "Suavidade e Movimento Circular",
      desc: "Criado pelo Mestre Miyagi como a contraparte suave do Sanchin. Foca no trabalho suave de mãos e transições respiratórias tranquilas."
    },
    {
      nome: "Saifa",
      significado: "Destruir e Esmagar",
      foco: "Golpes circulares e esquivas rápidas",
      desc: "O primeiro Kata de combate avançado do estilo. Ensina técnicas de escape de agarres e socos rápidos nas articulações."
    },
    {
      nome: "Seiyunchin",
      significado: "Controlar e Puxar",
      foco: "Posturas baixas de pernas",
      desc: "Não possui chutes. Desenvolve resistência extrema nas pernas utilizando a base Shiko-Dachi e defesas contra agarres por trás."
    }
  ]);

  const carregarSiteConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/config`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data.config || null);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações do site:", err);
    }
  };

  const handleSaveConfig = async (chave: string, valor: any) => {
    setSalvandoConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chave, valor })
      });
      if (res.ok) {
        alert(`Configuração de '${chave}' salva com sucesso!`);
        await carregarSiteConfig();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar configuração.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  useEffect(() => {
    if (siteConfig && Object.keys(siteConfig).length > 0) {
      setHeroForm({
        badge: siteConfig.hero?.badge || 'Tradição de Okinawa & IA Moderna',
        titulo: siteConfig.hero?.titulo || 'Onde a Força (Go) encontra a Suavidade (Ju)',
        descricao: siteConfig.hero?.descricao || 'O Karate Goju-Ryu harmoniza ataques diretos e bloqueios rígidos com movimentos circulares fluidos, respiração profunda e controle mental. Aprenda a arte marcial tradicional e consulte o nosso Sensei IA para expandir seus horizontes.'
      });
      setPrincipiosForm({
        subtitulo: siteConfig.principios?.subtitulo || 'O Goju-Ryu é construído sobre o conceito yin-yang chinês, equilibrando aspectos que parecem opostos, mas são complementares.',
        go_titulo: siteConfig.principios?.go_titulo || 'GO (Força / Rigidez)',
        go_desc: siteConfig.principios?.go_desc || 'Refere-se ao endurecimento físico, golpes diretos, posições estáveis de combate e resistência ao impacto. É a força e firmeza necessárias para absorver o impacto e desferir contra-ataques decisivos com coragem implacável.',
        go_itens: siteConfig.principios?.go_itens?.join(', ') || 'Katas de fortalecimento como Sanchin, Calejamento de membros (Kote Kitae), Posturas baixas e firmes',
        ju_titulo: siteConfig.principios?.ju_titulo || 'JU (Suavidade / Flexibilidade)',
        ju_desc: siteConfig.principios?.ju_desc || 'Representa movimentos circulares de esquiva, desvios suaves da força adversária, controle respiratório relaxado e agilidade. Ensina a ceder para vencer, redirecionando o fluxo de energia do oponente com precisão.',
        ju_itens: siteConfig.principios?.ju_itens?.join(', ') || 'Katas de flexibilidade como Tensho, Esquivas circulares e fluidas (Tai Sabaki), Técnicas de agarre e projeção (Kakie)'
      });
      setKatasForm(siteConfig.katas && siteConfig.katas.length > 0 ? siteConfig.katas : [
        {
          nome: "Sanchin",
          significado: "Três Batalhas",
          foco: "Fortalecimento e Respiração Ibuki",
          desc: "Foca na mente, corpo e espírito em perfeita união. Usa uma postura enraizada e contração isométrica para criar uma defesa impenetrável."
        },
        {
          nome: "Tensho",
          significado: "Mãos Rotativas",
          foco: "Suavidade e Movimento Circular",
          desc: "Criado pelo Mestre Miyagi como a contraparte suave do Sanchin. Foca no trabalho suave de mãos e transições respiratórias tranquilas."
        },
        {
          nome: "Saifa",
          significado: "Destruir e Esmagar",
          foco: "Golpes circulares e esquivas rápidas",
          desc: "O primeiro Kata de combate avançado do estilo. Ensina técnicas de escape de agarres e socos rápidos nas articulações."
        },
        {
          nome: "Seiyunchin",
          significado: "Controlar e Puxar",
          foco: "Posturas baixas de pernas",
          desc: "Não possui chutes. Desenvolve resistência extrema nas pernas utilizando a base Shiko-Dachi e defesas contra agarres por trás."
        }
      ]);
      if (siteConfig.academia) {
        setAcademiaForm({
          hero_subtitulo: siteConfig.academia.hero_subtitulo || 'Nossa História',
          hero_titulo: siteConfig.academia.hero_titulo || 'A Academia',
          hero_descricao: siteConfig.academia.hero_descricao || '',
          desde_subtitulo: siteConfig.academia.desde_subtitulo || 'Desde o Início',
          desde_titulo: siteConfig.academia.desde_titulo || 'Nossa História',
          desde_paragrafo1: siteConfig.academia.desde_paragrafo1 || '',
          desde_paragrafo2: siteConfig.academia.desde_paragrafo2 || '',
          desde_paragrafo3: siteConfig.academia.desde_paragrafo3 || '',
          missao_desc: siteConfig.academia.missao_desc || '',
          visao_desc: siteConfig.academia.visao_desc || '',
          valores_desc: siteConfig.academia.valores_desc || ''
        });
      }
      if (siteConfig.transparencia) {
        setTransparenciaForm({
          hero_title: siteConfig.transparencia.hero_title || 'Transparência',
          hero_subtitle: siteConfig.transparencia.hero_subtitle || '',
          hero_breadcrumb: siteConfig.transparencia.hero_breadcrumb || 'Transparência',
          intro_text: siteConfig.transparencia.intro_text || '',
          compromisso_title: siteConfig.transparencia.compromisso_title || 'Nosso Compromisso',
          compromisso_text: siteConfig.transparencia.compromisso_text || ''
        });
      }
      if (siteConfig.contato) {
        setContatoForm({
          hero_title: siteConfig.contato.hero_title || 'Contato',
          hero_subtitle: siteConfig.contato.hero_subtitle || '',
          secao_subtitulo: siteConfig.contato.secao_subtitulo || 'Fale Conosco',
          secao_titulo: siteConfig.contato.secao_titulo || 'Entre em Contato',
          secao_desc: siteConfig.contato.secao_desc || '',
          telefone: siteConfig.contato.telefone || '(71) 9 0000-0000',
          telefone_tel: siteConfig.contato.telefone_tel || '+5571900000000',
          email: siteConfig.contato.email || '',
          endereco: siteConfig.contato.endereco || '',
          horarios: siteConfig.contato.horarios || 'Segunda e Quarta: 19:00 — 21:00\nSábado: 09:00 — 11:00'
        });
      }
      if (siteConfig.dojo_kun) {
        setDocDojoKunForm({
          preambulo: siteConfig.dojo_kun.preambulo || 'O Dojo Kun é o código de ética do karatê Goju-Ryu. Deve ser recitado ao início e término de cada treino como compromisso pessoal e coletivo.',
          preceitos: siteConfig.dojo_kun.preceitos && siteConfig.dojo_kun.preceitos.length === 5
            ? siteConfig.dojo_kun.preceitos
            : docDojoKunForm.preceitos
        });
      }
      if (siteConfig.doc_termos) {
        const termos = siteConfig.doc_termos;
        setDocTermosForm(prev => ({ ...prev, ...termos, secoes_extras: termos.secoes_extras || [] }));
      }
      if (siteConfig.doc_privacidade) {
        const privacidade = siteConfig.doc_privacidade;
        setDocPrivacidadeForm(prev => ({ ...prev, ...privacidade, secoes_extras: privacidade.secoes_extras || [] }));
      }
      if (siteConfig.doc_defesa_marca) {
        const marca = siteConfig.doc_defesa_marca;
        setDocDefesaMarcaForm(prev => ({ ...prev, ...marca, secoes_extras: marca.secoes_extras || [] }));
      }
    }
  }, [siteConfig]);

  const carregarCMS = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
        setEquipe(data.equipe || []);
        setGaleria(data.galeria || []);
      }
    } catch (err) {
      console.error("Erro ao carregar CMS, usando dados offline:", err);
      // Fallback local
      setBanners([
        { id: 1, titulo: "Karatê Tradicional Goju-Ryu", subtitulo: "Força e suavidade unidas na busca do autodomínio.", imagem_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=1200" }
      ]);
      setEquipe([
        { id: 1, nome: "Sensei Paulo Roberto", cargo: "Faixa Preta 4º Dan", biografia: "Coordenador da Federação com mais de 25 anos de prática.", foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
      setGaleria([
        { id: 1, title: "Treino de Kata", category: "Katas", image_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=300", order: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarContatos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contatos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContatos(data.contatos || []);
      }
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
      // Fallback local
      setContatos([
        { id: 'msg-1', name: 'José Augusto Ramos', email: 'jose.ramos@gmail.com', phone: '(71) 98888-9999', message: 'Olá, gostaria de saber o valor da mensalidade e os horários das turmas infantis no dojo de Salvador Centro.', read: false, created_at: new Date().toISOString() }
      ]);
    }
  };

  const carregarGlossario = async () => {
    setLoadingGlossario(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/glossario`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGlossario(data.glossario || []);
      }
    } catch (err) {
      console.error("Erro ao carregar glossário do Sensei IA:", err);
    } finally {
      setLoadingGlossario(false);
    }
  };

  const handleSalvarGlossario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glossarioForm.termo.trim() || !glossarioForm.definicao.trim()) return;
    setSalvandoGlossario(true);

    try {
      const res = await fetch(`${API_URL}/api/cms/glossario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          termo: glossarioForm.termo,
          definicao: glossarioForm.definicao
        })
      });

      if (res.ok) {
        alert(isEditingTerm ? 'Termo atualizado com sucesso!' : 'Novo termo adicionado com sucesso!');
        setShowGlossarioModal(false);
        setGlossarioForm({ termo: '', definicao: '' });
        await carregarGlossario();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar termo no glossário.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoGlossario(false);
    }
  };

  const handleExcluirGlossario = async (termo: string) => {
    if (!confirm(`Excluir o termo "${termo.toUpperCase()}" do glossário do Sensei IA permanentemente?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/cms/glossario/${encodeURIComponent(termo)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setGlossario(glossario.filter(g => g.termo !== termo));
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir o termo.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const carregarAvisos = async () => {
    setLoadingAvisos(true);
    try {
      const res = await fetch(`${API_URL}/api/avisos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAvisos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar avisos:', err);
    } finally {
      setLoadingAvisos(false);
    }
  };

  const handleSalvarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoForm.titulo.trim() || !avisoForm.conteudo.trim()) return;
    setSalvandoAviso(true);
    try {
      const res = await fetch(`${API_URL}/api/avisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(avisoForm)
      });
      if (res.ok) {
        setShowAvisoModal(false);
        setAvisoForm({ titulo: '', conteudo: '', categoria: 'Geral', destinatario: 'todos' });
        await carregarAvisos();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar aviso.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoAviso(false);
    }
  };

  const handleExcluirAviso = async (id: string | number) => {
    if (!confirm('Excluir este aviso permanentemente?')) return;
    try {
      const res = await fetch(`${API_URL}/api/avisos/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setAvisos(avisos.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tipo === 'admin') {
      carregarCMS();
      carregarContatos();
      carregarSiteConfig();
      carregarGlossario();
      carregarAvisos();
    } else {
      setLoading(false);
    }
  }, [tipo]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedContato) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/contatos/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contatoId: selectedContato.id,
          email: selectedContato.email,
          mensagem: replyText
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao enviar resposta.');
      }

      alert('Resposta enviada com sucesso!');
      setReplyText('');
      carregarContatos();
      setSelectedContato(prev => prev ? { ...prev, read: true } : null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleExcluirContato = async (id: string | number) => {
    if (!confirm("Remover esta mensagem permanentemente?")) return;

    try {
      const res = await fetch(`${API_URL}/api/contatos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setContatos(contatos.filter(c => c.id !== id));
        if (selectedContato?.id === id) setSelectedContato(null);
      }
    } catch (err) {
      setContatos(contatos.filter(c => c.id !== id));
      if (selectedContato?.id === id) setSelectedContato(null);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    let payload = {};
    if (activeTab === 'banners') payload = bannerForm;
    else if (activeTab === 'equipe') payload = teamForm;
    else if (activeTab === 'galeria') payload = galleryForm;

    const getTipoItem = (tab: string) => {
      if (tab === 'banners') return 'banner';
      if (tab === 'equipe') return 'equipe';
      if (tab === 'galeria') return 'galeria';
      return tab;
    };
    const tipoItem = getTipoItem(activeTab);

    try {
      const res = await fetch(`${API_URL}/api/cms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tipo: tipoItem, payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'banners') setBanners([...banners, data]);
        else if (activeTab === 'equipe') setEquipe([...equipe, data]);
        else if (activeTab === 'galeria') setGaleria([...galeria, data]);
        setShowModal(false);
      } else {
        let errorMsg = 'Erro do servidor ao salvar o item.';
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || errorMsg;
          } else {
            const textData = await res.text();
            errorMsg = textData.slice(0, 300) || errorMsg;
          }
        } catch (e) {
          console.error("Erro ao ler resposta de erro:", e);
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro de conexão ou permissão. Salvando localmente para fins de teste...');
      // Fallback local
      const mockItem = { id: Date.now(), ...payload };
      if (activeTab === 'banners') setBanners([...banners, mockItem as any]);
      else if (activeTab === 'equipe') setEquipe([...equipe, mockItem as any]);
      else if (activeTab === 'galeria') setGaleria([...galeria, mockItem as any]);
      setShowModal(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string | number) => {
    if (!confirm("Excluir item permanentemente?")) return;

    const getTipoItem = (tab: string) => {
      if (tab === 'banners') return 'banner';
      if (tab === 'equipe') return 'equipe';
      if (tab === 'galeria') return 'galeria';
      return tab;
    };
    const tipoItem = getTipoItem(activeTab);

    try {
      const res = await fetch(`${API_URL}/api/cms/${tipoItem}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
        else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
        else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
      } else {
        let errorMsg = 'Erro do servidor ao excluir o item.';
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || errorMsg;
          } else {
            const textData = await res.text();
            errorMsg = textData.slice(0, 300) || errorMsg;
          }
        } catch (e) {
          console.error("Erro ao ler resposta de erro:", e);
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro de conexão ou permissão. Excluindo localmente da visualização atual...');
      if (activeTab === 'banners') setBanners(banners.filter(b => b.id !== id));
      else if (activeTab === 'equipe') setEquipe(equipe.filter(e => e.id !== id));
      else if (activeTab === 'galeria') setGaleria(galeria.filter(g => g.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (tipo !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white font-cinzel">Acesso Negado</h2>
        <p className="text-zinc-500 text-sm">Painel restrito para controle do conteúdo do site institucional.</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header com Ação Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block mb-1">
            Gestão de Conteúdo Federativo
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gerenciar Site (CMS)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Administração dinâmica de banners, notícias, equipe, compromissos e páginas públicas</p>
        </div>

        {(activeTab === 'banners' || activeTab === 'equipe' || activeTab === 'galeria' || activeTab === 'sensei-ia' || activeTab === 'avisos' || activeTab === 'transparencia') && (
          <button
            onClick={() => {
              if (activeTab === 'sensei-ia') {
                setGlossarioForm({ termo: '', definicao: '' });
                setIsEditingTerm(false);
                setShowGlossarioModal(true);
              } else if (activeTab === 'avisos') {
                setAvisoForm({ titulo: '', conteudo: '', categoria: 'Geral', destinatario: 'todos' });
                setShowAvisoModal(true);
              } else if (activeTab === 'transparencia') {
                window.location.href = '/documentos';
              } else {
                setBannerForm({ titulo: '', subtitulo: '', link: '', imagem_url: '' });
                setTeamForm({ nome: '', cargo: '', biografia: '', foto_url: '', order: equipe.length + 1 });
                setGalleryForm({ title: '', category: 'Treinos', image_url: '', order: galeria.length + 1 });
                setShowModal(true);
              }
            }}
            className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={18} className="shrink-0" /> {activeTab === 'transparencia' ? 'Novo Documento' : 'Adicionar Item'}
          </button>
        )}
      </div>

      {/* Categorias de Abas Principais (CMS Grouping) */}
      <div className="flex flex-col md:flex-row gap-4 border-b border-slate-200 pb-6 w-full max-w-5xl">
        {[
          { id: 'geral', label: 'Mídia & Mensagens', desc: 'Banners, equipe, galeria e contatos', icon: Layout },
          { id: 'site', label: 'Conteúdo Institucional', desc: 'Home, academia e dojo kun', icon: BookOpen },
          { id: 'transparencia', label: 'Transparência & Avisos', desc: 'Documentos oficiais e avisos', icon: Shield }
        ].map(group => {
          const Icon = group.icon;
          const isSelected = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => {
                setActiveGroup(group.id as any);
                if (group.id === 'geral') setActiveTab('banners');
                else if (group.id === 'site') setActiveTab('paginainicial');
                else if (group.id === 'transparencia') setActiveTab('avisos');
              }}
              className={`flex-1 text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'border-[#002B7F] bg-blue-50/60 text-slate-900 shadow-xs' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition ${
                  isSelected ? 'bg-[#002B7F] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide text-slate-900">{group.label}</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">{group.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Abas do Grupo Ativo */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 border border-slate-200 rounded-2xl w-full max-w-5xl overflow-x-auto whitespace-nowrap scrollbar-none">
        {activeGroup === 'geral' && (
          <>
            <button onClick={() => setActiveTab('banners')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'banners' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Layout size={14} /> Banners
            </button>
            <button onClick={() => setActiveTab('equipe')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'equipe' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Users size={14} /> Equipe
            </button>
            <button onClick={() => setActiveTab('galeria')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'galeria' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Image size={14} /> Galeria
            </button>
            <button onClick={() => setActiveTab('mensagens')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'mensagens' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <MessageSquare size={14} /> Mensagens
            </button>
            <button onClick={() => setActiveTab('contato')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'contato' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Mail size={14} /> Contato Sec.
            </button>
          </>
        )}

        {activeGroup === 'site' && (
          <>
            <button onClick={() => setActiveTab('paginainicial')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'paginainicial' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Settings size={14} /> Página Inicial
            </button>
            <button onClick={() => setActiveTab('academia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'academia' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <BookOpen size={14} /> A Academia
            </button>
            <button onClick={() => setActiveTab('dojo_kun')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'dojo_kun' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <BookOpen size={14} /> Dojo Kun
            </button>
            <button onClick={() => setActiveTab('sensei-ia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'sensei-ia' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <MessageSquare size={14} /> Sensei IA
            </button>
          </>
        )}

        {activeGroup === 'transparencia' && (
          <>
            <button onClick={() => setActiveTab('avisos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'avisos' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Bell size={14} /> Avisos
            </button>
            <button onClick={() => setActiveTab('transparencia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'transparencia' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <FileText size={14} /> Compromissos
            </button>
            <button onClick={() => setActiveTab('doc_termos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'doc_termos' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <FileText size={14} /> Termos
            </button>
            <button onClick={() => setActiveTab('doc_privacidade')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'doc_privacidade' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Shield size={14} /> Privacidade
            </button>
            <button onClick={() => setActiveTab('doc_defesa_marca')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'doc_defesa_marca' ? 'bg-[#002B7F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Shield size={14} /> Marca
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === 'mensagens' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full font-sans">
          {/* List */}
          <div className="lg:col-span-2 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {contatos.map(c => (
              <button key={c.id} onClick={() => setSelectedContato(c)}
                className={`text-left p-4 border transition-all duration-200 relative rounded-2xl cursor-pointer ${
                  selectedContato?.id === c.id 
                    ? 'border-[#002B7F] bg-blue-50/60 shadow-xs' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex items-center justify-between">
                  <p className="text-slate-900 text-sm font-bold truncate pr-3">{c.name}</p>
                  {(!c.read && !c.lida) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126] shrink-0" />
                  )}
                </div>
                <p className="text-slate-600 text-xs mt-1 truncate">{c.message}</p>
                <p className="text-slate-400 text-[10px] mt-2 font-mono">
                  {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </button>
            ))}
            {contatos.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhuma mensagem recebida.
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selectedContato ? (
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-slate-900 text-lg font-black">{selectedContato.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(selectedContato.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => handleExcluirContato(selectedContato.id)} className="text-[#CE1126] hover:bg-red-50 p-2 rounded-xl transition cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-slate-600">
                  <a href={`mailto:${selectedContato.email}`} className="flex items-center gap-2 hover:text-[#002B7F] transition font-medium">
                    <Mail size={14} className="text-[#002B7F]" /> {selectedContato.email}
                  </a>
                  {selectedContato.phone && (
                    <a href={`tel:${selectedContato.phone}`} className="flex items-center gap-2 hover:text-[#002B7F] transition font-medium">
                      <Phone size={14} className="text-[#002B7F]" /> {selectedContato.phone}
                    </a>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">Mensagem Recebida</h4>
                  <p className="text-slate-800 leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs font-sans whitespace-pre-wrap">{selectedContato.message}</p>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-[9px] font-extrabold uppercase text-[#002B7F] tracking-wider">Responder pelo CMS</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 text-xs focus:outline-none focus:border-[#002B7F] transition rounded-2xl resize-none font-sans"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="flex-1 bg-[#002B7F] text-white text-xs font-bold tracking-wider uppercase py-3 hover:bg-blue-900 transition disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-xs"
                    >
                      {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Enviar Resposta
                    </button>
                    <a 
                      href={`mailto:${selectedContato.email}?subject=Re: Goju-Ryu Karate Kai&body=${encodeURIComponent(replyText)}`}
                      className="border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs tracking-wider uppercase px-5 py-3 hover:bg-slate-100 transition text-center flex items-center justify-center gap-2 rounded-xl"
                    >
                      Responder via E-mail Local
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl flex items-center justify-center h-64 text-slate-400 text-xs">
                Selecione uma mensagem para visualizar
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'paginainicial' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Banner Principal (Hero Section)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Badge Superior</label>
                <input
                  type="text"
                  id="hero-badge-input"
                  value={heroForm.badge}
                  onChange={e => setHeroForm({ ...heroForm, badge: e.target.value })}
                  placeholder="Ex: Tradição de Okinawa & IA Moderna"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título Principal</label>
                <input
                  type="text"
                  id="hero-title-input"
                  value={heroForm.titulo}
                  onChange={e => setHeroForm({ ...heroForm, titulo: e.target.value })}
                  placeholder="Ex: Onde a Força (Go) encontra a Suavidade (Ju)"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  id="hero-desc-input"
                  value={heroForm.descricao}
                  onChange={e => setHeroForm({ ...heroForm, descricao: e.target.value })}
                  placeholder="Descrição da associação ou estilo..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-hero-btn"
                  onClick={() => handleSaveConfig('hero', heroForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Hero
                </button>
              </div>
            </div>
          </div>

          {/* 2. PRINCIPIOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings className="text-gold" size={16} /> 2. Os Princípios Fundamentais (Go & Ju)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                <input
                  type="text"
                  id="principles-subtitle-input"
                  value={principiosForm.subtitulo}
                  onChange={e => setPrincipiosForm({ ...principiosForm, subtitulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* GO CARD */}
                <div className="space-y-4 p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-primary font-cinzel uppercase tracking-wider">Card GO (Força)</h4>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Título</label>
                    <input
                      type="text"
                      id="go-title-input"
                      value={principiosForm.go_titulo}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_titulo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id="go-desc-input"
                      value={principiosForm.go_desc}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_desc: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Itens (separados por vírgula)</label>
                    <input
                      type="text"
                      id="go-items-input"
                      value={principiosForm.go_itens}
                      onChange={e => setPrincipiosForm({ ...principiosForm, go_itens: e.target.value })}
                      placeholder="Ex: Item 1, Item 2"
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                </div>

                {/* JU CARD */}
                <div className="space-y-4 p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-zinc-350 font-cinzel uppercase tracking-wider">Card JU (Suavidade)</h4>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Título</label>
                    <input
                      type="text"
                      id="ju-title-input"
                      value={principiosForm.ju_titulo}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_titulo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id="ju-desc-input"
                      value={principiosForm.ju_desc}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_desc: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Itens (separados por vírgula)</label>
                    <input
                      type="text"
                      id="ju-items-input"
                      value={principiosForm.ju_itens}
                      onChange={e => setPrincipiosForm({ ...principiosForm, ju_itens: e.target.value })}
                      placeholder="Ex: Item 1, Item 2"
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-principles-btn"
                  onClick={() => handleSaveConfig('principios', {
                    subtitulo: principiosForm.subtitulo,
                    go_titulo: principiosForm.go_titulo,
                    go_desc: principiosForm.go_desc,
                    go_itens: principiosForm.go_itens.split(',').map(i => i.trim()).filter(Boolean),
                    ju_titulo: principiosForm.ju_titulo,
                    ju_desc: principiosForm.ju_desc,
                    ju_itens: principiosForm.ju_itens.split(',').map(i => i.trim()).filter(Boolean)
                  })}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Princípios
                </button>
              </div>
            </div>
          </div>

          {/* 3. KATAS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Users className="text-emerald-500" size={16} /> 3. Os Katas Tradicionais (Lista de 4)
            </h3>
            <div className="space-y-6">
              {katasForm.map((kata, idx) => (
                <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-gold font-cinzel">Kata {idx + 1}: {kata.nome || 'Novo Kata'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Nome do Kata</label>
                      <input
                        type="text"
                        id={`kata-name-${idx}`}
                        value={kata.nome}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].nome = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Significado</label>
                      <input
                        type="text"
                        id={`kata-meaning-${idx}`}
                        value={kata.significado}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].significado = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Foco Principal</label>
                      <input
                        type="text"
                        id={`kata-focus-${idx}`}
                        value={kata.foco}
                        onChange={e => {
                          const newKatas = [...katasForm];
                          newKatas[idx].foco = e.target.value;
                          setKatasForm(newKatas);
                        }}
                        className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none font-sans"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                    <textarea
                      id={`kata-desc-${idx}`}
                      value={kata.desc}
                      onChange={e => {
                        const newKatas = [...katasForm];
                        newKatas[idx].desc = e.target.value;
                        setKatasForm(newKatas);
                      }}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none font-sans"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  id="save-katas-btn"
                  onClick={() => handleSaveConfig('katas', katasForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Katas
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'sensei-ia' ? (
        <div className="space-y-6 max-w-5xl mx-auto w-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2">
                  <MessageSquare className="text-primary" size={16} /> Base de Conhecimento do Sensei IA
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Gerencie os termos e definições que guiam as respostas da inteligência artificial.</p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Pesquisar termo..."
                  value={termoSearch}
                  onChange={e => setTermoSearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {loadingGlossario ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {glossario
                  .filter(g => g.termo.toLowerCase().includes(termoSearch.toLowerCase()) || g.definicao.toLowerCase().includes(termoSearch.toLowerCase()))
                  .map((item) => (
                    <div key={item.termo} className="bg-zinc-950/40 border border-zinc-855 hover:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 transition group">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded border border-gold/20 inline-block mb-2">
                          {item.termo}
                        </span>
                        <p className="text-zinc-450 text-xs leading-relaxed line-clamp-4 font-sans">{item.definicao}</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-zinc-850 justify-end">
                        <button
                          onClick={() => {
                            setGlossarioForm({ termo: item.termo, definicao: item.definicao });
                            setIsEditingTerm(true);
                            setShowGlossarioModal(true);
                          }}
                          className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition hover:bg-zinc-900 cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleExcluirGlossario(item.termo)}
                          className="px-3 py-1.5 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                {glossario.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-zinc-500 text-xs">
                    Nenhum termo cadastrado no glossário.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'academia' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Banner Superior (Hero Section)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo Superior</label>
                <input
                  type="text"
                  value={academiaForm.hero_subtitulo}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_subtitulo: e.target.value })}
                  placeholder="Ex: Nossa História"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título Principal</label>
                <input
                  type="text"
                  value={academiaForm.hero_titulo}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_titulo: e.target.value })}
                  placeholder="Ex: A Academia"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  value={academiaForm.hero_descricao}
                  onChange={e => setAcademiaForm({ ...academiaForm, hero_descricao: e.target.value })}
                  placeholder="Descrição..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. HISTORIA CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <BookOpen className="text-gold" size={16} /> 2. História da Academia
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                  <input
                    type="text"
                    value={academiaForm.desde_subtitulo}
                    onChange={e => setAcademiaForm({ ...academiaForm, desde_subtitulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                  <input
                    type="text"
                    value={academiaForm.desde_titulo}
                    onChange={e => setAcademiaForm({ ...academiaForm, desde_titulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 1</label>
                <textarea
                  value={academiaForm.desde_paragrafo1}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo1: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 2</label>
                <textarea
                  value={academiaForm.desde_paragrafo2}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo2: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Parágrafo 3</label>
                <textarea
                  value={academiaForm.desde_paragrafo3}
                  onChange={e => setAcademiaForm({ ...academiaForm, desde_paragrafo3: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. PRINCIPIOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="text-emerald-500" size={16} /> 3. Pilares (Missão, Visão e Valores)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Missão</label>
                <textarea
                  value={academiaForm.missao_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, missao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Visão</label>
                <textarea
                  value={academiaForm.visao_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, visao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição dos Valores</label>
                <textarea
                  value={academiaForm.valores_desc}
                  onChange={e => setAcademiaForm({ ...academiaForm, valores_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('academia', academiaForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Academia
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'transparencia' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Hero da Página de Transparência
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Página</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_title}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_subtitle}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Caminho / Breadcrumb</label>
                <input
                  type="text"
                  value={transparenciaForm.hero_breadcrumb}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, hero_breadcrumb: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. INTRODUCAO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="text-gold" size={16} /> 2. Texto de Introdução
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Texto Principal</label>
                <textarea
                  value={transparenciaForm.intro_text}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, intro_text: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. COMPROMISSO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="text-emerald-500" size={16} /> 3. Compromisso da Federação
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                <input
                  type="text"
                  value={transparenciaForm.compromisso_title}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, compromisso_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Texto de Compromisso</label>
                <textarea
                  value={transparenciaForm.compromisso_text}
                  onChange={e => setTransparenciaForm({ ...transparenciaForm, compromisso_text: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('transparencia', transparenciaForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Transparência
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'contato' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 1. HERO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layout className="text-primary" size={16} /> 1. Hero da Página de Contato
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Página</label>
                <input
                  type="text"
                  value={contatoForm.hero_title}
                  onChange={e => setContatoForm({ ...contatoForm, hero_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição do Hero</label>
                <textarea
                  value={contatoForm.hero_subtitle}
                  onChange={e => setContatoForm({ ...contatoForm, hero_subtitle: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 2. SECAO CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="text-gold" size={16} /> 2. Títulos da Seção de Contato
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo da Seção</label>
                  <input
                    type="text"
                    value={contatoForm.secao_subtitulo}
                    onChange={e => setContatoForm({ ...contatoForm, secao_subtitulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                  <input
                    type="text"
                    value={contatoForm.secao_titulo}
                    onChange={e => setContatoForm({ ...contatoForm, secao_titulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Descrição da Seção</label>
                <textarea
                  value={contatoForm.secao_desc}
                  onChange={e => setContatoForm({ ...contatoForm, secao_desc: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. DADOS CONFIG */}
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Phone className="text-emerald-500" size={16} /> 3. Informações de Contato e Horários
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Telefone Exibido</label>
                  <input
                    type="text"
                    value={contatoForm.telefone}
                    onChange={e => setContatoForm({ ...contatoForm, telefone: e.target.value })}
                    placeholder="Ex: (71) 9 0000-0000"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Link de Telefone (tel:...)</label>
                  <input
                    type="text"
                    value={contatoForm.telefone_tel}
                    onChange={e => setContatoForm({ ...contatoForm, telefone_tel: e.target.value })}
                    placeholder="Ex: +5571900000000"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={contatoForm.email}
                    onChange={e => setContatoForm({ ...contatoForm, email: e.target.value })}
                    placeholder="contato@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Endereço Exibido</label>
                  <input
                    type="text"
                    value={contatoForm.endereco}
                    onChange={e => setContatoForm({ ...contatoForm, endereco: e.target.value })}
                    placeholder="Cidade, Estado, País"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Horários de Funcionamento (um por linha, formato: Dia: Hora)</label>
                <textarea
                  value={contatoForm.horarios}
                  onChange={e => setContatoForm({ ...contatoForm, horarios: e.target.value })}
                  placeholder="Segunda e Quarta: 19:00 — 21:00&#10;Sábado: 09:00 — 11:00"
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans"
                />
              </div>
              <div className="flex justify-end pt-2 font-cinzel">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('contato', contatoForm)}
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} /> Salvar Contato
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'avisos' ? (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2">
                  <Bell className="text-primary" size={16} /> Avisos da Diretoria
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Comunicados enviados a atletas, filiais ou toda a associação.</p>
              </div>
            </div>
            {loadingAvisos ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : avisos.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Nenhum aviso publicado ainda.</div>
            ) : (
              <div className="space-y-3">
                {avisos.map(aviso => (
                  <div key={aviso.id} className="bg-zinc-950/50 border border-zinc-850 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white font-cinzel">{aviso.titulo}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          aviso.destinatario === 'todos' ? 'bg-blue-950/30 text-blue-400 border-blue-900/30' :
                          aviso.destinatario === 'filial' ? 'bg-gold/10 text-gold border-gold/20' :
                          'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                        }`}>
                          {aviso.destinatario === 'todos' ? 'Todos' : aviso.destinatario === 'filial' ? 'Filiais' : 'Atletas'}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono border border-zinc-800 px-2 py-0.5 rounded">{aviso.categoria}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{aviso.conteudo}</p>
                      {aviso.created_at && (
                        <p className="text-[10px] text-zinc-600 font-mono">{new Date(aviso.created_at).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                    <button onClick={() => handleExcluirAviso(aviso.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition cursor-pointer shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Modal Novo Aviso */}
          {showAvisoModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-cinzel text-white text-sm font-bold">Novo Aviso da Diretoria</h3>
                  <button onClick={() => setShowAvisoModal(false)} className="text-zinc-500 hover:text-white p-1 rounded cursor-pointer"><X size={16} /></button>
                </div>
                <form onSubmit={handleSalvarAviso} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título *</label>
                    <input required value={avisoForm.titulo} onChange={e => setAvisoForm({...avisoForm, titulo: e.target.value})}
                      placeholder="Ex: Reunião de Diretoria — Julho/2026"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary transition font-sans" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Conteúdo *</label>
                    <textarea required value={avisoForm.conteudo} onChange={e => setAvisoForm({...avisoForm, conteudo: e.target.value})}
                      rows={4} placeholder="Texto do aviso..."
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary transition font-sans resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria</label>
                      <input value={avisoForm.categoria} onChange={e => setAvisoForm({...avisoForm, categoria: e.target.value})}
                        placeholder="Ex: Geral, Técnico, Financeiro"
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none font-sans" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Destinatário</label>
                      <select value={avisoForm.destinatario} onChange={e => setAvisoForm({...avisoForm, destinatario: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none font-sans">
                        <option value="todos">Todos</option>
                        <option value="filial">Filiais</option>
                        <option value="atleta">Atletas</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 font-cinzel">
                    <button type="button" onClick={() => setShowAvisoModal(false)} className="px-4 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={salvandoAviso}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                      {salvandoAviso ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Publicar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'dojo_kun' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <BookOpen className="text-gold" size={16} /> Conteúdo do Dojo Kun
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preâmbulo / Introdução</label>
                <textarea value={docDojoKunForm.preambulo} onChange={e => setDocDojoKunForm({...docDojoKunForm, preambulo: e.target.value})}
                  rows={3} placeholder="Texto introdutório do Dojo Kun..."
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition-colors font-sans" />
              </div>

              <div className="border-t border-zinc-800/80 pt-4">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3">Preceitos do Dojo Kun (道場訓)</label>
                
                {/* Abas para seleção de preceitos */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 font-cinzel">
                  {docDojoKunForm.preceitos?.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDojoKunActivePrecept(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        dojoKunActivePrecept === idx
                          ? 'bg-primary text-white'
                          : 'bg-zinc-950 text-zinc-500 border border-zinc-900 hover:text-white'
                      }`}
                    >
                      Preceito {p.numero}
                    </button>
                  ))}
                </div>

                {/* Formulário do preceito ativo */}
                {docDojoKunForm.preceitos?.[dojoKunActivePrecept] && (
                  <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl space-y-4">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest font-cinzel mb-2">Editar Preceito {docDojoKunForm.preceitos[dojoKunActivePrecept].numero}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Escrita em Japonês (Kanji)</label>
                        <input
                          type="text"
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].kanji || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].kanji = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Pronúncia Tradicional (Romaji)</label>
                        <input
                          type="text"
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].jp || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].jp = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Tradução em Português</label>
                        <input
                          type="text"
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].pt || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].pt = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Ajuda Fonética</label>
                        <input
                          type="text"
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].phonetic || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].phonetic = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Significado / Filosofia</label>
                      <textarea
                        value={docDojoKunForm.preceitos[dojoKunActivePrecept].philosophy || ''}
                        onChange={e => {
                          const newPreceitos = [...docDojoKunForm.preceitos];
                          newPreceitos[dojoKunActivePrecept].philosophy = e.target.value;
                          setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                        }}
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Aplicação no Dojo</label>
                        <textarea
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].dojo || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].dojo = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          rows={3}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Aplicação no Dia a Dia / Vida</label>
                        <textarea
                          value={docDojoKunForm.preceitos[dojoKunActivePrecept].life || ''}
                          onChange={e => {
                            const newPreceitos = [...docDojoKunForm.preceitos];
                            newPreceitos[dojoKunActivePrecept].life = e.target.value;
                            setDocDojoKunForm({ ...docDojoKunForm, preceitos: newPreceitos });
                          }}
                          rows={3}
                          className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 font-cinzel border-t border-zinc-800/80">
                <button type="button" onClick={() => handleSaveConfig('dojo_kun', docDojoKunForm)} disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                  <Save size={13} /> Salvar Dojo Kun
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'doc_termos' ? (
        <div className="space-y-8 max-w-4xl mx-auto font-sans text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="text-[#002B7F]" size={18} /> Termos de Serviço — Conteúdo da Página
            </h3>
            <p className="text-xs text-slate-500">Edite as seções da página pública de termos. Clique no botão de expandir para abrir os campos.</p>
            
            <div className="space-y-4">
              {/* Cabeçalho do Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Título do Documento</label>
                  <input value={docTermosForm.titulo} onChange={e => setDocTermosForm({...docTermosForm, titulo: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#002B7F] transition font-sans font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Descrição</label>
                  <input value={docTermosForm.desc} onChange={e => setDocTermosForm({...docTermosForm, desc: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#002B7F] transition font-sans font-semibold" />
                </div>
              </div>

              {/* Seções Colapsáveis */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'termos_s1',
                    label: 'Seção 1: Aceitação dos Termos',
                    fields: [
                      { label: 'Título da Seção', key: 's1_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's1_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s2',
                    label: 'Seção 2: Definições',
                    fields: [
                      { label: 'Título da Seção', key: 's2_titulo', type: 'input' },
                      { label: 'Definição de Portal', key: 's2_def_portal', type: 'textarea' },
                      { label: 'Definição de Usuário', key: 's2_def_usuario', type: 'textarea' },
                      { label: 'Definição de Atleta', key: 's2_def_atleta', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s3',
                    label: 'Seção 3: Cadastro e Conta',
                    fields: [
                      { label: 'Título da Seção', key: 's3_titulo', type: 'input' },
                      { label: 'Texto do Parágrafo 1', key: 's3_texto', type: 'textarea' },
                      { label: 'Texto do Parágrafo 2', key: 's3_texto2', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s4',
                    label: 'Seção 4: Uso do Portal',
                    fields: [
                      { label: 'Título da Seção', key: 's4_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's4_texto', type: 'textarea' },
                      { label: 'Itens da Lista (um por linha)', key: 's4_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'termos_s5',
                    label: 'Seção 5: Propriedade Intelectual',
                    fields: [
                      { label: 'Título da Seção', key: 's5_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's5_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s6',
                    label: 'Seção 6: Homologação de Atletas',
                    fields: [
                      { label: 'Título da Seção', key: 's6_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's6_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s7',
                    label: 'Seção 7: Limitação de Responsabilidade',
                    fields: [
                      { label: 'Título da Seção', key: 's7_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's7_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'termos_s8',
                    label: 'Seção 8: Disposições Gerais',
                    fields: [
                      { label: 'Título da Seção', key: 's8_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's8_texto', type: 'textarea' }
                    ]
                  }
                ].map(sec => {
                  const isOpen = expandedSection === sec.id;
                  return (
                    <div key={sec.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-100 transition-colors text-left cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-900">{sec.label}</span>
                        {isOpen ? <Minus size={14} className="text-[#002B7F]" /> : <Plus size={14} className="text-slate-400" />}
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
                          {sec.fields.map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-1">{f.label}</label>
                              {f.type === 'textarea' ? (
                                <textarea
                                  value={(docTermosForm as any)[f.key] || ''}
                                  onChange={e => setDocTermosForm({ ...docTermosForm, [f.key]: e.target.value })}
                                  rows={f.rows || 3}
                                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none resize-none focus:border-[#002B7F] transition font-sans"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={(docTermosForm as any)[f.key] || ''}
                                  onChange={e => setDocTermosForm({ ...docTermosForm, [f.key]: e.target.value })}
                                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#002B7F] transition font-sans"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Seções Adicionais Dinâmicas */}
                {docTermosForm.secoes_extras?.map((sec, idx) => {
                  const isOpen = expandedSection === `termos_extra_${idx}`;
                  return (
                    <div key={sec.id || idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                      <div className="w-full flex items-center justify-between px-4 py-3 bg-white transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleSection(`termos_extra_${idx}`)}
                          className="flex-1 text-left cursor-pointer text-xs font-bold text-slate-900"
                        >
                          {sec.titulo || `Seção Adicional ${idx + 1}`}
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const extras = [...(docTermosForm.secoes_extras || [])];
                              extras.splice(idx, 1);
                              setDocTermosForm({ ...docTermosForm, secoes_extras: extras });
                            }}
                            className="text-[#CE1126] hover:bg-red-50 p-1 rounded-lg transition cursor-pointer"
                            title="Remover Seção"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isOpen ? (
                            <Minus size={14} className="text-[#002B7F] cursor-pointer" onClick={() => toggleSection(`termos_extra_${idx}`)} />
                          ) : (
                            <Plus size={14} className="text-slate-400 cursor-pointer" onClick={() => toggleSection(`termos_extra_${idx}`)} />
                          )}
                        </div>
                      </div>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-1">Título da Seção</label>
                            <input
                              type="text"
                              value={sec.titulo || ''}
                              onChange={e => {
                                const extras = [...(docTermosForm.secoes_extras || [])];
                                extras[idx].titulo = e.target.value;
                                setDocTermosForm({ ...docTermosForm, secoes_extras: extras });
                              }}
                              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#002B7F] transition font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-1">Conteúdo do Texto</label>
                            <textarea
                              value={sec.texto || ''}
                              onChange={e => {
                                const extras = [...(docTermosForm.secoes_extras || [])];
                                extras[idx].texto = e.target.value;
                                setDocTermosForm({ ...docTermosForm, secoes_extras: extras });
                              }}
                              rows={3}
                              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 outline-none resize-none focus:border-[#002B7F] transition font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    const extras = [...(docTermosForm.secoes_extras || [])];
                    extras.push({ id: Math.random().toString(), titulo: '', texto: '', lista: '' });
                    setDocTermosForm({ ...docTermosForm, secoes_extras: extras });
                  }}
                  className="w-full py-3 border border-dashed border-slate-300 hover:border-[#002B7F] bg-slate-50 hover:bg-blue-50/50 rounded-2xl text-slate-600 hover:text-[#002B7F] text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Adicionar Seção Adicional
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => handleSaveConfig('doc_termos', docTermosForm)} disabled={salvandoConfig}
                  className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-[#002B7F] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs">
                  <Save size={14} /> Salvar Termos
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'doc_privacidade' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="text-emerald-500" size={16} /> Política de Privacidade — Conteúdo da Página
            </h3>
            <p className="text-[11px] text-zinc-500">Edite as seções da página. Clique no botão <code className="bg-zinc-950 px-1 rounded font-mono text-gold">+</code> para abrir os campos de cada seção.</p>
            
            <div className="space-y-4">
              {/* Cabeçalho do Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Título do Documento</label>
                  <input value={docPrivacidadeForm.titulo} onChange={e => setDocPrivacidadeForm({...docPrivacidadeForm, titulo: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                  <input value={docPrivacidadeForm.desc} onChange={e => setDocPrivacidadeForm({...docPrivacidadeForm, desc: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans" />
                </div>
              </div>

              {/* Seções Colapsáveis */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'priv_s1',
                    label: 'Seção 1: Dados Coletados',
                    fields: [
                      { label: 'Título da Seção', key: 's1_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's1_texto', type: 'textarea' },
                      { label: 'Itens Coletados (um por linha)', key: 's1_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'priv_s2',
                    label: 'Seção 2: Finalidade do Tratamento',
                    fields: [
                      { label: 'Título da Seção', key: 's2_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's2_texto', type: 'textarea' },
                      { label: 'Finalidades (uma por linha)', key: 's2_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'priv_s3',
                    label: 'Seção 3: Compartilhamento de Dados',
                    fields: [
                      { label: 'Título da Seção', key: 's3_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's3_texto', type: 'textarea' },
                      { label: 'Compartilhados com (um por linha)', key: 's3_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'priv_s4',
                    label: 'Seção 4: Segurança dos Dados',
                    fields: [
                      { label: 'Título da Seção', key: 's4_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's4_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'priv_s5',
                    label: 'Seção 5: Seus Direitos (LGPD)',
                    fields: [
                      { label: 'Título da Seção', key: 's5_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's5_texto', type: 'textarea' },
                      { label: 'Direitos da LGPD (um por linha)', key: 's5_lista', type: 'textarea', rows: 5 }
                    ]
                  },
                  {
                    id: 'priv_s6',
                    label: 'Seção 6: Cookies',
                    fields: [
                      { label: 'Título da Seção', key: 's6_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's6_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'priv_s7',
                    label: 'Seção 7: Contato do Encarregado (DPO)',
                    fields: [
                      { label: 'Título da Seção', key: 's7_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto (ex: e-mail de contato)', key: 's7_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'priv_s8',
                    label: 'Seção 8: Alterações na Política',
                    fields: [
                      { label: 'Título da Seção', key: 's8_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's8_texto', type: 'textarea' }
                    ]
                  }
                ].map(sec => {
                  const isOpen = expandedSection === sec.id;
                  return (
                    <div key={sec.id} className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/20">
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white font-cinzel">{sec.label}</span>
                        {isOpen ? <Minus size={14} className="text-gold" /> : <Plus size={14} className="text-zinc-500 hover:text-white" />}
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-zinc-950/60 border-t border-zinc-800/60">
                          {sec.fields.map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">{f.label}</label>
                              {f.type === 'textarea' ? (
                                <textarea
                                  value={(docPrivacidadeForm as any)[f.key] || ''}
                                  onChange={e => setDocPrivacidadeForm({ ...docPrivacidadeForm, [f.key]: e.target.value })}
                                  rows={f.rows || 3}
                                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={(docPrivacidadeForm as any)[f.key] || ''}
                                  onChange={e => setDocPrivacidadeForm({ ...docPrivacidadeForm, [f.key]: e.target.value })}
                                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Seções Adicionais Dinâmicas */}
                {docPrivacidadeForm.secoes_extras?.map((sec, idx) => {
                  const isOpen = expandedSection === `priv_extra_${idx}`;
                  return (
                    <div key={sec.id || idx} className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/20">
                      <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleSection(`priv_extra_${idx}`)}
                          className="flex-1 text-left cursor-pointer font-cinzel text-xs font-bold text-white"
                        >
                          {sec.titulo || `Seção Adicional ${idx + 1}`}
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const extras = [...(docPrivacidadeForm.secoes_extras || [])];
                              extras.splice(idx, 1);
                              setDocPrivacidadeForm({ ...docPrivacidadeForm, secoes_extras: extras });
                            }}
                            className="text-red-400 hover:text-red-500 p-1 cursor-pointer transition"
                            title="Remover Seção"
                          >
                            <Trash2 size={13} />
                          </button>
                          {isOpen ? (
                            <Minus size={14} className="text-gold cursor-pointer" onClick={() => toggleSection(`priv_extra_${idx}`)} />
                          ) : (
                            <Plus size={14} className="text-zinc-500 hover:text-white cursor-pointer" onClick={() => toggleSection(`priv_extra_${idx}`)} />
                          )}
                        </div>
                      </div>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-zinc-950/60 border-t border-zinc-800/60">
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                            <input
                              type="text"
                              value={sec.titulo || ''}
                              onChange={e => {
                                const extras = [...(docPrivacidadeForm.secoes_extras || [])];
                                extras[idx].titulo = e.target.value;
                                setDocPrivacidadeForm({ ...docPrivacidadeForm, secoes_extras: extras });
                              }}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Conteúdo do Texto</label>
                            <textarea
                              value={sec.texto || ''}
                              onChange={e => {
                                const extras = [...(docPrivacidadeForm.secoes_extras || [])];
                                extras[idx].texto = e.target.value;
                                setDocPrivacidadeForm({ ...docPrivacidadeForm, secoes_extras: extras });
                              }}
                              rows={3}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Itens da Lista (um por linha - opcional)</label>
                            <textarea
                              value={sec.lista || ''}
                              onChange={e => {
                                const extras = [...(docPrivacidadeForm.secoes_extras || [])];
                                extras[idx].lista = e.target.value;
                                setDocPrivacidadeForm({ ...docPrivacidadeForm, secoes_extras: extras });
                              }}
                              rows={3}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    const extras = [...(docPrivacidadeForm.secoes_extras || [])];
                    extras.push({ id: Math.random().toString(), titulo: '', texto: '', lista: '' });
                    setDocPrivacidadeForm({ ...docPrivacidadeForm, secoes_extras: extras });
                  }}
                  className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-gold/40 hover:bg-zinc-950/40 rounded-xl text-zinc-500 hover:text-gold text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 font-cinzel"
                >
                  <Plus size={14} /> Adicionar Seção Adicional
                </button>
              </div>

              <div className="flex justify-end pt-2 font-cinzel border-t border-zinc-800/80">
                <button type="button" onClick={() => handleSaveConfig('doc_privacidade', docPrivacidadeForm)} disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                  <Save size={13} /> Salvar Privacidade
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'doc_defesa_marca' ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-cinzel flex items-center gap-2 border-b border-zinc-800 pb-3">
              <AlertTriangle className="text-amber-500" size={16} /> Defesa de Marca — Conteúdo da Página
            </h3>
            <p className="text-[11px] text-zinc-500">Edite as seções da página. Clique no botão <code className="bg-zinc-950 px-1 rounded font-mono text-gold">+</code> para abrir os campos de cada seção.</p>
            
            <div className="space-y-4">
              {/* Cabeçalho do Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Título do Documento</label>
                  <input value={docDefesaMarcaForm.titulo} onChange={e => setDocDefesaMarcaForm({...docDefesaMarcaForm, titulo: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Descrição</label>
                  <input value={docDefesaMarcaForm.desc} onChange={e => setDocDefesaMarcaForm({...docDefesaMarcaForm, desc: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans" />
                </div>
              </div>

              {/* Seções Colapsáveis */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'marca_s1',
                    label: 'Seção 1: O que é Defesa de Marca?',
                    fields: [
                      { label: 'Título da Seção', key: 's1_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's1_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'marca_s2',
                    label: 'Seção 2: Identidade da Marca',
                    fields: [
                      { label: 'Título da Seção', key: 's2_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's2_texto', type: 'textarea' },
                      { label: 'Itens da Identidade (um por linha)', key: 's2_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'marca_s3',
                    label: 'Seção 3: Registro e Propriedade',
                    fields: [
                      { label: 'Título da Seção', key: 's3_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's3_texto', type: 'textarea' },
                      { label: 'Itens de Registro (um por linha)', key: 's3_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'marca_s4',
                    label: 'Seção 4: Uso Autorizado',
                    fields: [
                      { label: 'Título da Seção', key: 's4_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's4_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'marca_s5',
                    label: 'Seção 5: Diretrizes de Branding',
                    fields: [
                      { label: 'Título da Seção', key: 's5_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's5_texto', type: 'textarea' },
                      { label: 'Itens das Diretrizes (um por linha)', key: 's5_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'marca_s6',
                    label: 'Seção 6: Monitoramento e Fiscalização',
                    fields: [
                      { label: 'Título da Seção', key: 's6_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's6_texto', type: 'textarea' }
                    ]
                  },
                  {
                    id: 'marca_s7',
                    label: 'Seção 7: Penalidades',
                    fields: [
                      { label: 'Título da Seção', key: 's7_titulo', type: 'input' },
                      { label: 'Texto de Introdução', key: 's7_texto', type: 'textarea' },
                      { label: 'Itens das Penalidades (um por linha)', key: 's7_lista', type: 'textarea', rows: 4 }
                    ]
                  },
                  {
                    id: 'marca_s8',
                    label: 'Seção 8: Contato para Autorização',
                    fields: [
                      { label: 'Título da Seção', key: 's8_titulo', type: 'input' },
                      { label: 'Conteúdo do Texto', key: 's8_texto', type: 'textarea' }
                    ]
                  }
                ].map(sec => {
                  const isOpen = expandedSection === sec.id;
                  return (
                    <div key={sec.id} className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/20">
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white font-cinzel">{sec.label}</span>
                        {isOpen ? <Minus size={14} className="text-gold" /> : <Plus size={14} className="text-zinc-500 hover:text-white" />}
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-zinc-950/60 border-t border-zinc-800/60">
                          {sec.fields.map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">{f.label}</label>
                              {f.type === 'textarea' ? (
                                <textarea
                                  value={(docDefesaMarcaForm as any)[f.key] || ''}
                                  onChange={e => setDocDefesaMarcaForm({ ...docDefesaMarcaForm, [f.key]: e.target.value })}
                                  rows={f.rows || 3}
                                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={(docDefesaMarcaForm as any)[f.key] || ''}
                                  onChange={e => setDocDefesaMarcaForm({ ...docDefesaMarcaForm, [f.key]: e.target.value })}
                                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Seções Adicionais Dinâmicas */}
                {docDefesaMarcaForm.secoes_extras?.map((sec, idx) => {
                  const isOpen = expandedSection === `marca_extra_${idx}`;
                  return (
                    <div key={sec.id || idx} className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/20">
                      <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleSection(`marca_extra_${idx}`)}
                          className="flex-1 text-left cursor-pointer font-cinzel text-xs font-bold text-white"
                        >
                          {sec.titulo || `Seção Adicional ${idx + 1}`}
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const extras = [...(docDefesaMarcaForm.secoes_extras || [])];
                              extras.splice(idx, 1);
                              setDocDefesaMarcaForm({ ...docDefesaMarcaForm, secoes_extras: extras });
                            }}
                            className="text-red-400 hover:text-red-500 p-1 cursor-pointer transition"
                            title="Remover Seção"
                          >
                            <Trash2 size={13} />
                          </button>
                          {isOpen ? (
                            <Minus size={14} className="text-gold cursor-pointer" onClick={() => toggleSection(`marca_extra_${idx}`)} />
                          ) : (
                            <Plus size={14} className="text-zinc-500 hover:text-white cursor-pointer" onClick={() => toggleSection(`marca_extra_${idx}`)} />
                          )}
                        </div>
                      </div>
                      
                      {isOpen && (
                        <div className="p-4 space-y-3 bg-zinc-950/60 border-t border-zinc-800/60">
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Título da Seção</label>
                            <input
                              type="text"
                              value={sec.titulo || ''}
                              onChange={e => {
                                const extras = [...(docDefesaMarcaForm.secoes_extras || [])];
                                extras[idx].titulo = e.target.value;
                                setDocDefesaMarcaForm({ ...docDefesaMarcaForm, secoes_extras: extras });
                              }}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-gold transition font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Conteúdo do Texto</label>
                            <textarea
                              value={sec.texto || ''}
                              onChange={e => {
                                const extras = [...(docDefesaMarcaForm.secoes_extras || [])];
                                extras[idx].texto = e.target.value;
                                setDocDefesaMarcaForm({ ...docDefesaMarcaForm, secoes_extras: extras });
                              }}
                              rows={3}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Itens da Lista (um por linha - opcional)</label>
                            <textarea
                              value={sec.lista || ''}
                              onChange={e => {
                                const extras = [...(docDefesaMarcaForm.secoes_extras || [])];
                                extras[idx].lista = e.target.value;
                                setDocDefesaMarcaForm({ ...docDefesaMarcaForm, secoes_extras: extras });
                              }}
                              rows={3}
                              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-gold transition font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    const extras = [...(docDefesaMarcaForm.secoes_extras || [])];
                    extras.push({ id: Math.random().toString(), titulo: '', texto: '', lista: '' });
                    setDocDefesaMarcaForm({ ...docDefesaMarcaForm, secoes_extras: extras });
                  }}
                  className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-gold/40 hover:bg-zinc-950/40 rounded-xl text-zinc-500 hover:text-gold text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 font-cinzel"
                >
                  <Plus size={14} /> Adicionar Seção Adicional
                </button>
              </div>

              <div className="flex justify-end pt-2 font-cinzel border-t border-zinc-800/80">
                <button type="button" onClick={() => handleSaveConfig('doc_defesa_marca', docDefesaMarcaForm)} disabled={salvandoConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                  <Save size={13} /> Salvar Defesa de Marca
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {activeTab === 'banners' && banners.map(banner => (
            <div key={banner.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-40 bg-zinc-950 relative">
                {banner.imagem_url ? (
                  <img src={banner.imagem_url} alt={banner.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600"><Image size={32} /></div>
                )}
              </div>
              <div className="p-5 space-y-2.5">
                <h3 className="text-sm font-bold text-white font-cinzel">{banner.titulo}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{banner.subtitulo}</p>
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleExcluir(banner.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'equipe' && equipe.map(member => (
            <div key={member.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-44 bg-zinc-950 relative flex items-center justify-center pt-4">
                <img src={member.foto_url} alt={member.nome} className="w-28 h-28 rounded-full object-cover border-2 border-primary" />
              </div>
              <div className="p-5 text-center space-y-2">
                <h3 className="text-sm font-bold text-white font-cinzel">{member.nome}</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded border border-gold/20 inline-block">
                  {member.cargo}
                </span>
                <p className="text-xs text-zinc-500 line-clamp-3 pt-2">{member.biografia}</p>
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleExcluir(member.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'galeria' && galeria.map(img => (
            <div key={img.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="h-40 bg-zinc-950 relative">
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white bg-black/60 rounded">
                  {img.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-xs font-bold text-white truncate">{img.title}</h4>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleExcluir(img.id)}
                  className="w-full py-2 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* MODAL ADICIONAR ITEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5 uppercase tracking-wide">
              Adicionar Novo {activeTab === 'banners' ? 'Banner' : activeTab === 'equipe' ? 'Membro da Equipe' : activeTab === 'galeria' ? 'Item da Galeria' : activeTab}
            </h3>

            <form onSubmit={handleSalvar} className="space-y-4">
              
              {activeTab === 'banners' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Título do Slide *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Treine Goju-Ryu Karate"
                      value={bannerForm.titulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, titulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtítulo *</label>
                    <input
                      type="text" required
                      placeholder="Subtexto curto descritivo"
                      value={bannerForm.subtitulo}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitulo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Link de destino (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: /sobre"
                      value={bannerForm.link}
                      onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem de Fundo *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={bannerForm.imagem_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, imagem_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'equipe' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome Completo *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei João da Silva"
                      value={teamForm.nome}
                      onChange={(e) => setTeamForm({ ...teamForm, nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Cargo / Graduação *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Sensei 3º Dan"
                      value={teamForm.cargo}
                      onChange={(e) => setTeamForm({ ...teamForm, cargo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Breve Biografia *</label>
                    <textarea
                      required rows={3}
                      placeholder="Histórico técnico e conquistas..."
                      value={teamForm.biografia}
                      onChange={(e) => setTeamForm({ ...teamForm, biografia: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Foto de Perfil *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={teamForm.foto_url}
                      onChange={(e) => setTeamForm({ ...teamForm, foto_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'galeria' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Legenda da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="Ex: Exame de Faixas em Salvador"
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoria *</label>
                      <select
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      >
                        <option value="Treinos">Treinos</option>
                        <option value="Eventos">Eventos</option>
                        <option value="Gasshukus">Gasshukus</option>
                        <option value="Graduações">Graduações</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Ordem Visual *</label>
                      <input
                        type="number" required
                        value={galleryForm.order}
                        onChange={(e) => setGalleryForm({ ...galleryForm, order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">URL da Imagem *</label>
                    <input
                      type="text" required
                      placeholder="https://images.unsplash.com/..."
                      value={galleryForm.image_url}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SENSEI IA GLOSSARIO */}
      {showGlossarioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-855 rounded-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowGlossarioModal(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white font-cinzel mb-5 uppercase tracking-wide">
              {isEditingTerm ? 'Editar Termo do Glossário' : 'Adicionar Termo ao Glossário'}
            </h3>

            <form onSubmit={handleSalvarGlossario} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Termo (Palavra-chave ou conceito) *</label>
                <input
                  type="text" required
                  disabled={isEditingTerm}
                  placeholder="Ex: sanchin"
                  value={glossarioForm.termo}
                  onChange={(e) => setGlossarioForm({ ...glossarioForm, termo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                />
                {!isEditingTerm && (
                  <span className="text-[9px] text-zinc-500 mt-1 block">Escreva o termo em letras minúsculas (ex: "sanchin", "makiwara").</span>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Definição Oficial / Conteúdo *</label>
                <textarea
                  required rows={6}
                  placeholder="Descreva o significado, a história ou a aplicação técnica para alimentar o prompt da IA..."
                  value={glossarioForm.definicao}
                  onChange={(e) => setGlossarioForm({ ...glossarioForm, definicao: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none resize-none focus:border-primary font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGlossarioModal(false)}
                  className="flex-1 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoGlossario}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer flex items-center justify-center"
                >
                  {salvandoGlossario ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
