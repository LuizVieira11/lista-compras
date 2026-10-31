/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  FileSpreadsheet,
  Link2,
  Copy,
  Check,
  Mail,
  Send,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { ShoppingList } from '../types';
import {
  downloadCSV,
  generateShareableURL,
  generateWhatsAppMessage,
  generateEmailUrl,
} from '../utils/exportUtils';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingList;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  list,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const shareableUrl = generateShareableURL(list);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {}
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppMessage(list));
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {}
  };

  const handleDownloadCSV = () => {
    downloadCSV(list);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage(list));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = generateEmailUrl(list);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar e Exportar Lista"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-zinc-100 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compartilhar Lista</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[200px]">{list.name} • {list.items.length} itens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          
          {/* Shareable Link Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-emerald-400" />
                Link Compartilhável
              </span>
              <span className="text-[10px] text-zinc-500">Abre direto no app</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Envie esse link para qualquer pessoa abrir e importar esta lista no celular dela.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-2 text-[11px] text-zinc-300 font-mono focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Actions: WhatsApp & Email */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-3.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
            >
              <Send className="w-4 h-4 text-emerald-200" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleEmail}
              className="py-3 px-3.5 rounded-2xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
            >
              <Mail className="w-4 h-4 text-blue-200" />
              <span>E-mail</span>
            </button>
          </div>

          {/* Export CSV Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                Exportar para Excel / CSV
              </span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">.csv</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Baixe a planilha completa com colunas de produtos, categorias, quantidades, preços estimados e valores reais lidos pela câmera.
            </p>

            <button
              onClick={handleDownloadCSV}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-2 border border-zinc-700 transition active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Baixar Arquivo CSV</span>
            </button>
          </div>

          {/* Copy Plain Text for Telegram / SMS / Notes */}
          <button
            onClick={handleCopyText}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-zinc-700/60 transition"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Texto da Lista Copiado!' : 'Copiar Lista Formatada como Texto'}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
