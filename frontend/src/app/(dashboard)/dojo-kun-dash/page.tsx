'use client';

import React from 'react';
import DojoKunInteractive from '@/components/DojoKunInteractive';

export default function DojoKunDashboardPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-[#CE1126] font-extrabold text-xs uppercase tracking-widest block">
            Código Moral & Tradição
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dojo Kun — Preceitos de Conduta</h1>
          <p className="text-slate-500 text-xs mt-0.5">Valores fundamentais da Federação Baiana de Karate-do Esportivo</p>
        </div>
        
        <div className="text-right">
          <span className="text-3xl font-black text-slate-300 font-cinzel leading-none select-none tracking-widest block">
            道場訓
          </span>
        </div>
      </div>

      {/* Interactive content */}
      <DojoKunInteractive />

    </main>
  );
}
