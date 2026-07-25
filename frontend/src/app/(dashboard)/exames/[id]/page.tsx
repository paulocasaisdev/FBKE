import React from 'react';
import ExameDetalheClient from './ExameDetalheClient';

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  return [
    { id: 'exame-1' },
    { id: 'exame-2' },
    { id: 'exame-3' },
  ];
}

export default async function ExameDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  return <ExameDetalheClient id={id} />;
}
