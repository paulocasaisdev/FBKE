import React from 'react';
import AvaliarBancaClient from './AvaliarBancaClient';

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  return [
    { id: 'exame-1' },
    { id: 'exame-2' },
    { id: 'exame-3' },
  ];
}

export default async function AvaliarBancaPage({ params }: { params: Params }) {
  return <AvaliarBancaClient params={params} />;
}
