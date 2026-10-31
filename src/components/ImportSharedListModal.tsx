/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Check, X, Sparkles } from 'lucide-react';
import { ShoppingList } from '../types';
import { formatCurrency } from '../utils/cartCalculations';

interface ImportSharedListModalProps {
  sharedList: ShoppingList | null;
  onConfirm: (list: ShoppingList) => void;
  onCancel: () => void;
}

export const ImportSharedListModal: React.FC<ImportSharedListModalProps> = ({
  sharedList,
  onConfirm,
  onCancel,
}) => {
  if (!sharedList) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar Lista Compartilhada"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-zinc-100 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black">Lista Compartilhada Recebida!</h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            Deseja importar esta lista para o seu SuperLista?
          </p>
        </div>

        {/* List Details & Preview */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm block">{sharedList.name}</span>
              <span className="text-zinc-400 text-[11px]">{sharedList.items.length} itens incluídos</span>
            </div>
            {sharedList.budget > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Teto</span>
                <span className="font-extrabold text-emerald-400">{formatCurrency(sharedList.budget)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-zinc-400 block mb-1">Prévia dos Itens:</span>
            {sharedList.items.map((item, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-zinc-200 font-medium truncate">{item.name}</span>
                </div>
                <span className="text-zinc-400 shrink-0 font-mono">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
          >
            Ignorar
          </button>
          <button
            onClick={() => onConfirm(sharedList)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Check className="w-4 h-4" />
            Importar Lista
          </button>
        </div>
      </div>
    </div>
  );
};
