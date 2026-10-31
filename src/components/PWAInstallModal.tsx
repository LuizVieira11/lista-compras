/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  WifiOff,
  Check,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        onClose();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalar Aplicativo SuperLista"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-zinc-100 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header with App Brand Banner */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex flex-col items-center text-center">
          <button
            onClick={onClose}
            aria-label="Fechar modal de instalação"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-zinc-950 p-1 shadow-xl mb-3 flex items-center justify-center">
            <img src="/icon.svg" alt="SuperLista" className="w-full h-full object-contain rounded-xl" />
          </div>

          <h2 className="text-lg font-black tracking-tight">Instalar o SuperLista</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs">
            Tenha a experiência de um aplicativo nativo diretamente na tela inicial do seu celular!
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-5 space-y-3 bg-zinc-900 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Abertura Instantânea</span>
              <span className="text-zinc-400">Acesso rápido com 1 toque sem abrir abas do navegador.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Funciona Offline</span>
              <span className="text-zinc-400">Consulte sua lista no supermercado mesmo sem sinal de internet.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Tela Cheia Nativa</span>
              <span className="text-zinc-400">Visual imersivo limpo sem barras de URL ou botões do navegador.</span>
            </div>
          </div>

          {/* Conditional Instructions */}
          {isInstalled ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-center font-bold">
              <Check className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              O aplicativo já está instalado no seu dispositivo!
            </div>
          ) : isInstallable ? (
            /* Direct Chrome / Android / Desktop Install Prompt */
            <div className="pt-2">
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Instalar Aplicativo Agora
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 mt-2">
              <span className="font-bold text-white block text-xs">
                Como instalar no iPhone (Safari):
              </span>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Toque no botão <strong className="text-white">Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-blue-400" /> no Safari.</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.</span>
              </div>
            </div>
          ) : (
            /* General Browser instructions */
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-zinc-300 space-y-2">
              <p>
                No seu navegador, abra o menu (<strong>⋮</strong> ou ícone na barra de endereço) e selecione:
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-bold text-xs">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                "Instalar aplicativo" ou "Adicionar à tela inicial"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
