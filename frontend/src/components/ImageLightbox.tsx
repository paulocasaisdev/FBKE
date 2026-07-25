'use client';

import React, { useState, useEffect } from "react";
import { X, Maximize2 } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageLightbox({ src, alt, className = "" }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fecha o modal ao pressionar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Desativa scroll da página
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Reativa scroll
    };
  }, [isOpen]);

  return (
    <>
      {/* Container da Imagem com Efeito de Hover Premium */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`relative group cursor-pointer overflow-hidden ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay com ícone de zoom */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-black/60 backdrop-blur-sm p-3 rounded-full text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Maximize2 size={20} className="animate-pulse" />
          </div>
        </div>
      </div>

      {/* Modal Lightbox */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
        >
          {/* Botão de Fechar */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 z-[10000] border border-white/10 cursor-pointer"
            aria-label="Fechar visualização"
          >
            <X size={24} />
          </button>

          {/* Container do Banner */}
          <div 
            onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar no banner
            className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-200"
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/5"
            />
          </div>
        </div>
      )}
    </>
  );
}
