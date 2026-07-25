import React from 'react';
import BoletimExameClient from './BoletimExameClient';

type Params = Promise<{ inscricaoId: string }>;

export async function generateStaticParams() {
  return [
    { inscricaoId: 'cand-1' },
    { inscricaoId: 'cand-2' },
  ];
}

export default async function BoletimExamePage({ params }: { params: Params }) {
  return <BoletimExameClient params={params} />;
}
