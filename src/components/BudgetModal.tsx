/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check } from 'lucide-react';
import { formatFinancialMask, parseFinancialMask } from '../utils/cartCalculations';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  onSave: (newBudget: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  onSave,
}) => {
  const [budgetInput, setBudgetInput] = useState('0,00');

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(formatFinancialMask(currentBudget || 0));
    }
  }, [isOpen, currentBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFinancialMask(budgetInput);
    onSave(parsed);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Definir Orçamento de Compras"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Meta de Gastos</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal de orçamento"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-zinc-400">
            Defina um teto máximo para esta lista. Avisaremos caso o carrinho ultrapasse o valor!
          </p>

          <div className="relative">
            <span className="absolute left-3.5 top-3 text-sm text-zinc-400 font-bold">R$</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={budgetInput}
              onChange={(e) => setBudgetInput(formatFinancialMask(e.target.value))}
              placeholder="0,00"
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-[10px] text-zinc-500 block">Digite apenas números (ex: 999 = R$ 9,99)</span>

          <div className="flex gap-2">
            {[100, 200, 350, 500].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setBudgetInput(formatFinancialMask(quick))}
                className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/60"
              >
                R$ {quick}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Check className="w-4 h-4" />
            Salvar Limite
          </button>
        </form>
      </div>
    </div>
  );
};
