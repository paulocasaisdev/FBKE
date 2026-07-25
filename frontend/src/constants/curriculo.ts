export interface CurriculoItem {
  tecnica: string;
  detalhe?: string;
}

export interface CurriculoFaixa {
  faixa: string;
  kyuDan: string;
  carencia: string;
  kihon: CurriculoItem[];
  kumite: CurriculoItem[];
  sandangi: CurriculoItem[];
  kata: CurriculoItem[];
  teoria: CurriculoItem[];
}

export const CURRICULO_ADULTO: Record<string, CurriculoFaixa> = {
  'Branca': {
    faixa: 'Branca',
    kyuDan: 'Iniciante',
    carencia: 'Sem carência',
    kihon: [
      { tecnica: 'Etiqueta do Dojo (Reigi-Saho)', detalhe: 'Como se portar, cumprimentos e postura básica' },
      { tecnica: 'Snoba Kihon Básico', detalhe: 'Socos e defesas simples (Zuki e Uke)' }
    ],
    kumite: [],
    sandangi: [],
    kata: [
      { tecnica: 'Introdução e Exercícios de Coordenação', detalhe: 'Bases e movimentação básica' }
    ],
    teoria: [
      { tecnica: 'Regras do Dojo e do estilo Goju-Ryu', detalhe: 'Princípios morais e disciplina' }
    ]
  },
  'Amarela': {
    faixa: 'Amarela',
    kyuDan: '8º Kyu',
    carencia: '4 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual' },
      { tecnica: 'Ippon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual' },
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Laranja': {
    faixa: 'Laranja',
    kyuDan: '7º Kyu',
    carencia: '4 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Sanbon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Verde': {
    faixa: 'Verde',
    kyuDan: '6º Kyu',
    carencia: '6 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Sanbon Kumite', detalhe: 'Execução em dupla' },
      { tecnica: 'Gohon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Renzoku Bunkai Geikisai-Dai-Ichi', detalhe: 'Execução individual' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Azul': {
    faixa: 'Azul',
    kyuDan: '5º Kyu',
    carencia: '6 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Sanbon Kumite', detalhe: 'Execução em dupla' },
      { tecnica: 'Gohon Kumite', detalhe: 'Execução em dupla' },
      { tecnica: 'Ippon Kumite avançado', detalhe: 'Aplicações simples' },
      { tecnica: 'Randori', detalhe: 'Troca de técnicas de combate' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual e em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução, aplicações (Bunkai) and Renzoku Bunkai (individual)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução and aplicações (Bunkai)' },
      { tecnica: 'Saifa', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Vermelha': {
    faixa: 'Vermelha',
    kyuDan: '4º Kyu',
    carencia: '6 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução completa' },
      { tecnica: 'Sanbon, Gohon e Randori', detalhe: 'Execução em dupla e combate' },
      { tecnica: 'Ippon Kumite avançado', detalhe: 'Aplicações simples e complexas' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual, em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução, aplicações (Bunkai) e Renzoku Bunkai (individual/dupla)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Saifa', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Seiyunchin', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Marrom': {
    faixa: 'Marrom',
    kyuDan: '3º Kyu',
    carencia: '8 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado (simples/complexo)' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual, em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Katas Anteriores', detalhe: 'Geikisai Dai Ichi/Ni, Saifa (execução e aplicações)' },
      { tecnica: 'Seiyunchin', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Marrom I': {
    faixa: 'Marrom I',
    kyuDan: '2º Kyu',
    carencia: '10 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado (simples/complexo)' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual, em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Katas Anteriores', detalhe: 'Geikisai Dai Ichi/Ni, Saifa' },
      { tecnica: 'Seiyunchin', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Marrom II': {
    faixa: 'Marrom II',
    kyuDan: '1º Kyu',
    carencia: '12 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução completa e aplicações' }
    ],
    kata: [
      { tecnica: 'Katas Anteriores', detalhe: 'Geikisai, Saifa, Seiyunchin' },
      { tecnica: 'Shisochin', detalhe: 'Execução completa do Kata' },
      { tecnica: 'Sanchin', detalhe: 'Execução completa do Kata' }
    ],
    teoria: [
      { tecnica: 'História do Goju-Ryu e linhagem IOGKF', detalhe: 'Avaliação teórica oral ou escrita' }
    ]
  },
  'Preta I': {
    faixa: 'Preta I',
    kyuDan: '1º Dan',
    carencia: '18 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Execução completa de todos os Kumites e Randori' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução e aplicações completas' }
    ],
    kata: [
      { tecnica: 'Katas de Kyu', detalhe: 'Geikisai, Saifa, Seiyunchin, Shisochin' },
      { tecnica: 'Sanchin', detalhe: 'Execução do Kata' }
    ],
    teoria: [
      { tecnica: 'História do Goju-Ryu e linhagem IOGKF', detalhe: 'Domínio teórico aprofundado' }
    ]
  },
  'Preta II': {
    faixa: 'Preta II',
    kyuDan: '2º Dan',
    carencia: '24 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Execução completa de todos os Kumites e Randori' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução e aplicações completas' }
    ],
    kata: [
      { tecnica: 'Katas de Kyu', detalhe: 'Execução e aplicações (Bunkai) de todos os Katas anteriores' },
      { tecnica: 'Shisochin', detalhe: 'Aplicações (Bunkai)' },
      { tecnica: 'Sanseru', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Sanchin', detalhe: 'Execução' },
      { tecnica: 'Tensho', detalhe: 'Execução completa do Kata' }
    ],
    teoria: [
      { tecnica: 'História do Goju-Ryu e linhagem IOGKF', detalhe: 'Domínio teórico e linhagem' }
    ]
  }
};

export const CURRICULO_INFANTIL: Record<string, CurriculoFaixa> = {
  'Branca': {
    faixa: 'Branca',
    kyuDan: 'Iniciante',
    carencia: 'Sem carência',
    kihon: [
      { tecnica: 'Etiqueta do Dojo (Reigi-Saho)', detalhe: 'Bons modos, saudações básicas e postura' },
      { tecnica: 'Snoba Kihon Básico', detalhe: 'Socos e defesas simples (Zuki e Uke)' }
    ],
    kumite: [],
    sandangi: [],
    kata: [
      { tecnica: 'Exercícios e Jogos de Coordenação', detalhe: 'Estímulo à motricidade' }
    ],
    teoria: [
      { tecnica: 'Comportamento e Respeito no Dojo', detalhe: 'Regras fundamentais de convivência' }
    ]
  },
  'Branca/Amarela': {
    faixa: 'Branca/Amarela',
    kyuDan: '9º Kyu',
    carencia: '3 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual' }
    ],
    kata: [],
    teoria: []
  },
  'Amarela': {
    faixa: 'Amarela',
    kyuDan: '8º Kyu',
    carencia: '3 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon Kumite', detalhe: 'Execução individual e em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução individual e em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução básica' }
    ],
    teoria: []
  },
  'Amarela/Laranja': {
    faixa: 'Amarela/Laranja',
    kyuDan: '8º/7º Kyu',
    carencia: '3 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução' }
    ],
    teoria: []
  },
  'Laranja': {
    faixa: 'Laranja',
    kyuDan: '7º Kyu',
    carencia: '4 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução' }
    ],
    teoria: []
  },
  'Laranja/Verde': {
    faixa: 'Laranja/Verde',
    kyuDan: '7º/6º Kyu',
    carencia: '4 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução básica' }
    ],
    teoria: []
  },
  'Verde': {
    faixa: 'Verde',
    kyuDan: '6º Kyu',
    carencia: '5 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução e aplicações (Bunkai)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Verde/Azul': {
    faixa: 'Verde/Azul',
    kyuDan: '6º/5º Kyu',
    carencia: '6 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' },
      { tecnica: 'Ippon Kumite avançado', detalhe: 'Aplicações simples' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução, Bunkai e Renzoku Bunkai (individual)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Azul': {
    faixa: 'Azul',
    kyuDan: '5º Kyu',
    carencia: '7 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Ippon, Sanbon e Gohon Kumite', detalhe: 'Execução em dupla' },
      { tecnica: 'Ippon Kumite avançado', detalhe: 'Aplicações simples e complexas' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi e Geikisai-Dai-Ni', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Saifa', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Azul/Vermelha': {
    faixa: 'Azul/Vermelha',
    kyuDan: '5º/4º Kyu',
    carencia: '8 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi', detalhe: 'Execução, Bunkai e Renzoku Bunkai (individual/dupla)' },
      { tecnica: 'Geikisai-Dai-Ni', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Saifa', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Vermelha': {
    faixa: 'Vermelha',
    kyuDan: '4º Kyu',
    carencia: '9 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' },
      { tecnica: 'Nihon San Dan Gi', detalhe: 'Execução em dupla' }
    ],
    kata: [
      { tecnica: 'Geikisai Dai Ichi e Geikisai-Dai-Ni', detalhe: 'Execução, Bunkai e Renzoku' },
      { tecnica: 'Saifa', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Seiyunchin', detalhe: 'Execução completa do Kata' }
    ],
    teoria: []
  },
  'Marrom': {
    faixa: 'Marrom',
    kyuDan: '3º Kyu',
    carencia: '10 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' }
    ],
    kata: [
      { tecnica: 'Geikisai, Saifa e Seiyunchin', detalhe: 'Execução e aplicações (Bunkai)' }
    ],
    teoria: []
  },
  'Marrom I': {
    faixa: 'Marrom I',
    kyuDan: '2º Kyu',
    carencia: '11 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' }
    ],
    kata: [
      { tecnica: 'Geikisai, Saifa, Seiyunchin', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Shisochin', detalhe: 'Execução completa do Kata' },
      { tecnica: 'Sanchin', detalhe: 'Execução básica' }
    ],
    teoria: []
  },
  'Marrom II': {
    faixa: 'Marrom II',
    kyuDan: '1º Kyu',
    carencia: '12 meses',
    kihon: [
      { tecnica: 'Snoba Kihon', detalhe: 'Técnicas de braços e pernas - parado' },
      { tecnica: 'Ido Kihon', detalhe: 'Técnicas de braços e pernas - andamentos' }
    ],
    kumite: [
      { tecnica: 'Kumite Geral', detalhe: 'Ippon, Sanbon, Gohon, Randori e Ippon Kumite Avançado' }
    ],
    sandangi: [
      { tecnica: 'San Dan Gi', detalhe: 'Execução em dupla e aplicações' }
    ],
    kata: [
      { tecnica: 'Geikisai, Saifa, Seiyunchin', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Shisochin', detalhe: 'Execução e Bunkai' },
      { tecnica: 'Bunkai Shisochin', detalhe: 'Execução em dupla' },
      { tecnica: 'Sanchin', detalhe: 'Execução completa' }
    ],
    teoria: [
      { tecnica: 'História do Goju-Ryu e linhagem IOGKF', detalhe: 'Avaliação teórica' }
    ]
  }
};
