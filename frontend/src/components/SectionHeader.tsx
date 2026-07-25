import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  gold?: boolean;
}

export default function SectionHeader({ title, subtitle, align = "center", gold = false }: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${align === "center" ? "text-center" : "text-left"}`}>
      <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-3">{title}</h2>
      <div className={`w-16 h-0.5 ${gold ? 'bg-gold' : 'bg-primary'} mb-4 ${align === "center" ? "mx-auto" : ""}`} />
      {subtitle && (
        <p className={`text-gray-400 text-sm max-w-lg font-body ${align === "center" ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
