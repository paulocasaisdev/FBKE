export const FAIXAS_INFANTIL = [
  'Branca/Amarela',
  'Amarela',
  'Amarela/Laranja',
  'Laranja',
  'Laranja/Verde',
  'Verde',
  'Verde/Azul',
  'Azul',
  'Azul/Vermelha',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
  'Preta/Branca',
];

export const FAIXAS_ADULTO = [
  'Branca',
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
  'Preta',
  'Preta I',
  'Preta II',
];

// Flat list of all unique belts in logical progression order (Infantil + Adulto Preta)
export const FAIXAS = [
  'Branca',
  'Branca/Amarela',
  'Amarela',
  'Amarela/Laranja',
  'Laranja',
  'Laranja/Verde',
  'Verde',
  'Verde/Azul',
  'Azul',
  'Azul/Vermelha',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
  'Preta/Branca',
  'Preta I',
  'Preta II',
];

export interface BeltStyle {
  bg: string;
  border: string;
  text: string;
  centerStripe?: string; // Cor da listra horizontal no centro (para faixas duplas e preta/branca júnior)
  tipStripe?: string;    // Cor da ponteira na ponta da faixa (ex: Marrom I e II)
  stripe?: string;       // Legado (map para centerStripe ou tipStripe)
  progressClass: string;
}

export const CORES_FAIXAS: Record<string, BeltStyle> = {
  'Branca':          { bg: 'bg-white',        border: 'border-zinc-300',   text: 'text-zinc-950 font-bold', progressClass: 'bg-white border border-gray-300' },
  'Branca/Amarela':  { bg: 'bg-white',        border: 'border-amber-400',  text: 'text-zinc-950 font-bold', centerStripe: 'bg-amber-400', stripe: 'bg-amber-400', progressClass: 'bg-white' },
  'Amarela':         { bg: 'bg-amber-400',    border: 'border-amber-500',  text: 'text-zinc-950 font-bold', progressClass: 'bg-amber-400' },
  'Amarela/Laranja': { bg: 'bg-amber-400',    border: 'border-orange-500', text: 'text-zinc-950 font-bold', centerStripe: 'bg-orange-500', stripe: 'bg-orange-500', progressClass: 'bg-amber-400' },
  'Laranja':         { bg: 'bg-orange-500',   border: 'border-orange-600', text: 'text-white font-bold', progressClass: 'bg-orange-500' },
  'Laranja/Verde':   { bg: 'bg-orange-500',   border: 'border-emerald-600',text: 'text-white font-bold', centerStripe: 'bg-emerald-600', stripe: 'bg-emerald-600', progressClass: 'bg-orange-500' },
  'Verde':           { bg: 'bg-emerald-600',  border: 'border-emerald-700',text: 'text-white font-bold', progressClass: 'bg-emerald-600' },
  'Verde/Azul':      { bg: 'bg-emerald-600',  border: 'border-blue-600',   text: 'text-white font-bold', centerStripe: 'bg-blue-600', stripe: 'bg-blue-600', progressClass: 'bg-emerald-600' },
  'Azul':            { bg: 'bg-blue-600',     border: 'border-blue-700',   text: 'text-white font-bold', progressClass: 'bg-blue-600' },
  'Azul/Vermelha':   { bg: 'bg-blue-600',     border: 'border-red-600',    text: 'text-white font-bold', centerStripe: 'bg-red-500', stripe: 'bg-red-500', progressClass: 'bg-blue-600' },
  'Vermelha':        { bg: 'bg-red-600',      border: 'border-red-700',    text: 'text-white font-bold', progressClass: 'bg-red-500' },
  'Marrom':          { bg: 'bg-amber-900',    border: 'border-amber-700',  text: 'text-amber-100 font-bold', progressClass: 'bg-amber-800' },
  'Marrom I':        { bg: 'bg-amber-900',    border: 'border-amber-700',  text: 'text-amber-100 font-bold', tipStripe: 'bg-white', stripe: 'bg-white', progressClass: 'bg-amber-900' },
  'Marrom II':       { bg: 'bg-amber-900',    border: 'border-amber-700',  text: 'text-amber-100 font-bold', tipStripe: 'bg-amber-400', stripe: 'bg-amber-400', progressClass: 'bg-amber-950' },
  'Preta/Branca':    { bg: 'bg-zinc-950',     border: 'border-zinc-700',   text: 'text-white font-bold', centerStripe: 'bg-white', stripe: 'bg-white', progressClass: 'bg-zinc-950' },
  'Preta (Júnior)':  { bg: 'bg-zinc-950',     border: 'border-zinc-700',   text: 'text-white font-bold', centerStripe: 'bg-white', stripe: 'bg-white', progressClass: 'bg-zinc-950' },
  'Preta':           { bg: 'bg-zinc-950',     border: 'border-amber-500',  text: 'text-amber-400 font-bold', progressClass: 'bg-zinc-950 border border-zinc-700' },
  'Preta I':         { bg: 'bg-zinc-950',     border: 'border-amber-500',  text: 'text-amber-400 font-bold', progressClass: 'bg-zinc-950 border border-zinc-700' },
  'Preta II':        { bg: 'bg-zinc-950',     border: 'border-amber-500',  text: 'text-amber-400 font-bold', progressClass: 'bg-zinc-950 border border-gold/40' },
};

export function obterEstiloFaixa(faixa: string): BeltStyle {
  if (!faixa) {
    return { bg: 'bg-white', border: 'border-zinc-300', text: 'text-zinc-950 font-bold', progressClass: 'bg-white' };
  }

  const fTrim = faixa.trim();

  // 1. Busca exata no dicionário
  if (CORES_FAIXAS[fTrim]) {
    return CORES_FAIXAS[fTrim];
  }

  // 2. Fallbacks baseados em padrões do nome da faixa
  const fLower = fTrim.toLowerCase();
  if (fLower.includes('preta/branca') || fLower.includes('preta branca') || fLower.includes('preta júnior') || fLower.includes('preta jr') || fLower.includes('preta junior')) {
    return CORES_FAIXAS['Preta/Branca'];
  }
  if (fLower.includes('branca/amarela') || fLower.includes('branca amarela')) {
    return CORES_FAIXAS['Branca/Amarela'];
  }
  if (fLower.includes('amarela/laranja') || fLower.includes('amarela laranja')) {
    return CORES_FAIXAS['Amarela/Laranja'];
  }
  if (fLower.includes('laranja/verde') || fLower.includes('laranja verde')) {
    return CORES_FAIXAS['Laranja/Verde'];
  }
  if (fLower.includes('verde/azul') || fLower.includes('verde azul')) {
    return CORES_FAIXAS['Verde/Azul'];
  }
  if (fLower.includes('azul/vermelha') || fLower.includes('azul vermelha')) {
    return CORES_FAIXAS['Azul/Vermelha'];
  }
  if (fLower.includes('preta') || fLower.includes('dan')) {
    return { bg: 'bg-zinc-950', border: 'border-amber-500', text: 'text-amber-400 font-bold', progressClass: 'bg-zinc-950' };
  }
  if (fLower.includes('amarela')) {
    return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-zinc-950 font-bold', progressClass: 'bg-amber-400' };
  }
  if (fLower.includes('laranja')) {
    return { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white font-bold', progressClass: 'bg-orange-500' };
  }
  if (fLower.includes('verde')) {
    return { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white font-bold', progressClass: 'bg-emerald-600' };
  }
  if (fLower.includes('azul')) {
    return { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white font-bold', progressClass: 'bg-blue-600' };
  }
  if (fLower.includes('vermelha')) {
    return { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white font-bold', progressClass: 'bg-red-600' };
  }
  if (fLower.includes('marrom')) {
    return { bg: 'bg-amber-900', border: 'border-amber-700', text: 'text-amber-100 font-bold', progressClass: 'bg-amber-800' };
  }
  if (fLower.includes('branca')) {
    return { bg: 'bg-white', border: 'border-zinc-300', text: 'text-zinc-950 font-bold', progressClass: 'bg-white' };
  }

  return { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-white font-bold', progressClass: 'bg-zinc-800' };
}

