import React from 'react';
import AvaliarAtletaClient from './AvaliarAtletaClient';

type Params = Promise<{ id: string; inscricaoId: string }>;

export async function generateStaticParams() {
  return [
    { id: 'exame-1', inscricaoId: 'cand-1' },
    { id: 'exame-3', inscricaoId: 'cand-2' },
  ];
}

export default async function AvaliarAtletaPage({ params }: { params: Params }) {
  return <AvaliarAtletaClient params={params} />;
}
