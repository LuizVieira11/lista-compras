/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Scale, ArrowRight, CheckCircle2, TrendingDown, Plus } from 'lucide-react';
import { comparePackagePrices, formatCurrency, parsePrice } from '../utils/cartCalculations';

interface PriceComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWinnerToCart?: (name: string, price: number) => void;
}

export const PriceComparatorModal: React.FC<PriceComparatorModalProps> = ({
  isOpen,
  onClose,
  onAddWinnerToCart,
}) => {
  const [productName, setProductName] = useState('Produto');

  // Option A
  const [priceA, setPriceA] = useState('14,90');
  const [amountA, setAmountA] = useState('400');
  const [unitA, setUnitA] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  // Option B
  const [priceB, setPriceB] = useState('32,00');
  const [amountB, setAmountB] = useState('1000');
  const [unitB, setUnitB] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  const parsedPriceA = parsePrice(priceA);
  const parsedPriceB = parsePrice(priceB);
  const parsedAmountA = parseFloat(amountA.replace(',', '.')) || 1;
  const parsedAmountB = parseFloat(amountB.replace(',', '.')) || 1;

  const comparison = comparePackagePrices(
    parsedPriceA,
    parsedAmountA,
    unitA,
    parsedPriceB,
    parsedAmountB,
    unitB
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comparador de Preços e Embalagens"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Comparador de Embalagens</h2>
              <p className="text-xs text-zinc-400">Descubra qual tamanho compensa mais no bolso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar comparador"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Produto sendo comparado (ex: Café, Sabão em pó, Refrigerante)
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option A */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                comparison.cheaperOption === 'A'
                  ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
                  : 'bg-zinc-800/60 border-zinc-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Opção A (Menor / Promo)
                </span>
                {comparison.cheaperOption === 'A' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    MAIS BARATO
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Preço (R$)</span>
                  <input
                    type="text"
                    value={priceA}
                    onChange={(e) => setPriceA(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Quantidade</span>
                    <input
                      type="text"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Unidade</span>
                    <select
                      value={unitA}
                      onChange={(e) => setUnitA(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                    >
                      <option value="g">g (Gramas)</option>
                      <option value="kg">kg (Quilos)</option>
                      <option value="ml">ml</option>
                      <option value="L">L (Litros)</option>
                      <option value="un">unidades</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-700/50 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Preço real por {comparison.standardUnitLabel}:</span>
                  <span className="font-extrabold text-white">
                    {formatCurrency(comparison.pricePerStandardA)}
                  </span>
                </div>
              </div>
            </div>

            {/* Option B */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                comparison.cheaperOption === 'B'
                  ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
                  : 'bg-zinc-800/60 border-zinc-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Opção B (Maior / Leve+)
                </span>
                {comparison.cheaperOption === 'B' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    MAIS BARATO
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Preço (R$)</span>
                  <input
                    type="text"
                    value={priceB}
                    onChange={(e) => setPriceB(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Quantidade</span>
                    <input
                      type="text"
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Unidade</span>
                    <select
                      value={unitB}
                      onChange={(e) => setUnitB(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                    >
                      <option value="g">g (Gramas)</option>
                      <option value="kg">kg (Quilos)</option>
                      <option value="ml">ml</option>
                      <option value="L">L (Litros)</option>
                      <option value="un">unidades</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-700/50 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Preço real por {comparison.standardUnitLabel}:</span>
                  <span className="font-extrabold text-white">
                    {formatCurrency(comparison.pricePerStandardB)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict Card */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Veredito Econômico</span>
                <span className="text-sm font-bold text-white">
                  {comparison.cheaperOption === 'EQUAL'
                    ? 'As duas opções têm o mesmo custo por unidade!'
                    : `A Opção ${comparison.cheaperOption} é ${comparison.savingsPercentage}% mais vantajosa!`}
                </span>
              </div>
            </div>

            {onAddWinnerToCart && comparison.cheaperOption !== 'EQUAL' && (
              <button
                onClick={() => {
                  const winnerPrice = comparison.cheaperOption === 'A' ? parsedPriceA : parsedPriceB;
                  const winnerAmount = comparison.cheaperOption === 'A' ? `${amountA}${unitA}` : `${amountB}${unitB}`;
                  onAddWinnerToCart(`${productName} (${winnerAmount})`, winnerPrice);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Levar Vencedor
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
