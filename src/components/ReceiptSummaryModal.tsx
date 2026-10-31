/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Receipt, Share2, Check, Copy, CheckCircle2, ShoppingCart, Sparkles } from 'lucide-react';
import { ShoppingItem, formatCurrency, CartTotals } from '../utils/cartCalculations';

interface ReceiptSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listName: string;
  items: ShoppingItem[];
  totals: CartTotals;
  budget: number;
}

export const ReceiptSummaryModal: React.FC<ReceiptSummaryModalProps> = ({
  isOpen,
  onClose,
  listName,
  items,
  totals,
  budget,
}) => {
  const [copied, setCopied] = useState(false);
  const cartItems = items.filter((item) => item.inCart);

  if (!isOpen) return null;

  const generateReceiptText = () => {
    let text = `🛒 *SUPERLISTA - RESUMO DA COMPRA*\n`;
    text += `Lista: ${listName}\n`;
    text += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `--------------------------------\n`;

    cartItems.forEach((item) => {
      const price = item.actualPrice || item.estimatedPrice || 0;
      const sub = price * item.quantity;
      text += `• ${item.quantity}x ${item.name} (${formatCurrency(price)}) = ${formatCurrency(sub)}\n`;
    });

    text += `--------------------------------\n`;
    text += `*TOTAL NO CARRINHO:* ${formatCurrency(totals.totalInCart)}\n`;
    if (budget > 0) {
      text += `Orçamento: ${formatCurrency(budget)}\n`;
      text += totals.isOverBudget
        ? `⚠️ Excedido em: ${formatCurrency(Math.abs(totals.remainingBudget))}\n`
        : `Economia/Saldo restante: ${formatCurrency(totals.remainingBudget)}\n`;
    }
    return text;
  };

  const handleCopyText = async () => {
    const text = generateReceiptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resumo do Carrinho e Cupom"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cupom de Compras</h2>
              <p className="text-xs text-zinc-400">{cartItems.length} itens no carrinho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar resumo"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Paper Ticket Style */}
          <div className="bg-zinc-950 border border-dashed border-zinc-700 rounded-2xl p-4 font-mono text-xs text-zinc-300 space-y-3">
            <div className="text-center pb-2 border-b border-dashed border-zinc-700">
              <div className="text-sm font-bold text-white tracking-widest uppercase">
                SUPERLISTA
              </div>
              <div className="text-[10px] text-zinc-500">
                {listName} • {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Items */}
            {cartItems.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-50" />
                Nenhum item adicionado ao carrinho ainda.
              </div>
            ) : (
              <div className="space-y-1.5 divide-y divide-zinc-800/60">
                {cartItems.map((item) => {
                  const unitPrice = item.actualPrice || item.estimatedPrice || 0;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div key={item.id} className="pt-1.5 flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <div className="text-zinc-200 font-semibold">{item.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {item.quantity} {item.unit} x {formatCurrency(unitPrice)}
                        </div>
                      </div>
                      <div className="font-bold text-white">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Calculations & Subtotals */}
            <div className="pt-3 border-t border-dashed border-zinc-700 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-white text-sm pt-1">
                <span>TOTAL A PAGAR:</span>
                <span className="text-emerald-400 font-extrabold text-base">
                  {formatCurrency(totals.totalInCart)}
                </span>
              </div>

              {budget > 0 && (
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Limite de Gastos:</span>
                  <span>{formatCurrency(budget)}</span>
                </div>
              )}

              {budget > 0 && (
                <div className="flex justify-between text-[11px] font-semibold">
                  <span>{totals.isOverBudget ? '⚠️ Excedido:' : 'Saldo Restante:'}</span>
                  <span className={totals.isOverBudget ? 'text-red-400' : 'text-emerald-400'}>
                    {formatCurrency(Math.abs(totals.remainingBudget))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Share & Copy Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
