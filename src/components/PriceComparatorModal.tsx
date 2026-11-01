/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Scale, ArrowRight, CheckCircle2, TrendingDown, Plus, Edit, Sparkles, Check } from 'lucide-react';
import {
  comparePackagePrices,
  formatCurrency,
  formatFinancialMask,
  parseFinancialMask,
  ShoppingItem
} from '../utils/cartCalculations';

interface PriceComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem?: ShoppingItem | null;
  items?: ShoppingItem[];
  onAddWinnerToCart?: (name: string, price: number) => void;
  onUpdateItem?: (itemId: string, newPrice: number, updatedPackageName?: string) => void;
}

function extractSizeAndUnit(
  name: string,
  fallbackUnit: string = 'un'
): { amount: string; unit: 'g' | 'kg' | 'ml' | 'L' | 'un' } {
  const match = name.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litros?|unidades?|un)?/i);
  if (match) {
    const rawAmt = match[1].replace(',', '.');
    const rawUnit = (match[2] || '').toLowerCase();
    let detectedUnit: 'g' | 'kg' | 'ml' | 'L' | 'un' = 'un';
    if (rawUnit === 'g') detectedUnit = 'g';
    else if (rawUnit === 'kg') detectedUnit = 'kg';
    else if (rawUnit === 'ml') detectedUnit = 'ml';
    else if (rawUnit === 'l' || rawUnit.startsWith('litro')) detectedUnit = 'L';
    else if (fallbackUnit === 'g' || fallbackUnit === 'kg' || fallbackUnit === 'ml' || fallbackUnit === 'L') {
      detectedUnit = fallbackUnit;
    }
    return { amount: rawAmt, unit: detectedUnit };
  }

  if (fallbackUnit === 'kg' || fallbackUnit === 'g' || fallbackUnit === 'ml' || fallbackUnit === 'L') {
    return { amount: '1', unit: fallbackUnit };
  }
  return { amount: '1', unit: 'un' };
}

export const PriceComparatorModal: React.FC<PriceComparatorModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  items = [],
  onAddWinnerToCart,
  onUpdateItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [productName, setProductName] = useState('Produto');

  // Option A (Base/Existing Item)
  const [priceA, setPriceA] = useState('0,00');
  const [amountA, setAmountA] = useState('400');
  const [unitA, setUnitA] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  // Option B (Alternative Package)
  const [priceB, setPriceB] = useState('0,00');
  const [amountB, setAmountB] = useState('1000');
  const [unitB, setUnitB] = useState<'g' | 'kg' | 'ml' | 'L' | 'un'>('g');

  // Load target item or initial values
  useEffect(() => {
    if (isOpen) {
      const active = targetItem || (items.length > 0 ? items.find((i) => i.id === selectedItemId) : null);
      if (active) {
        setSelectedItemId(active.id);
        setProductName(active.name);
        const currentPrice = active.actualPrice || active.estimatedPrice || 0;
        setPriceA(formatFinancialMask(currentPrice));

        const extracted = extractSizeAndUnit(active.name, active.unit);
        setAmountA(extracted.amount);
        setUnitA(extracted.unit);

        // Pre-fill Option B with a plausible alternative package
        setPriceB('0,00');
        const numAmt = parseFloat(extracted.amount) || 1;
        setAmountB(numAmt > 1 ? String(Math.round(numAmt * 2)) : '2');
        setUnitB(extracted.unit);
      } else {
        setSelectedItemId('');
        setProductName('Produto');
        setPriceA('14,90');
        setAmountA('400');
        setUnitA('g');
        setPriceB('32,00');
        setAmountB('1000');
        setUnitB('g');
      }
    }
  }, [isOpen, targetItem]);

  // Handle changing selected item from dropdown inside modal
  const handleSelectExistingItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const found = items.find((i) => i.id === itemId);
    if (found) {
      setProductName(found.name);
      const currentPrice = found.actualPrice || found.estimatedPrice || 0;
      setPriceA(formatFinancialMask(currentPrice));
      const extracted = extractSizeAndUnit(found.name, found.unit);
      setAmountA(extracted.amount);
      setUnitA(extracted.unit);
      setUnitB(extracted.unit);
    }
  };

  const currentSelectedItem = items.find((i) => i.id === selectedItemId) || targetItem;

  const parsedPriceA = parseFinancialMask(priceA);
  const parsedPriceB = parseFinancialMask(priceB);
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

  const handleApplyWinner = () => {
    const isWinnerA = comparison.cheaperOption === 'A';
    const winnerPrice = isWinnerA ? parsedPriceA : parsedPriceB;
    const winnerAmount = isWinnerA ? `${amountA}${unitA}` : `${amountB}${unitB}`;
    const updatedName = `${productName.replace(/\s*\([^)]*\)$/, '')} (${winnerAmount})`;

    // If comparing an existing item, EDIT IT in place rather than creating a new one
    if (currentSelectedItem && onUpdateItem) {
      onUpdateItem(currentSelectedItem.id, winnerPrice, updatedName);
    } else if (onAddWinnerToCart) {
      onAddWinnerToCart(updatedName, winnerPrice);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comparador de Preços e Embalagens"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-zinc-100"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
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
          
          {/* Target Item Status Banner (Edit Mode vs New Mode) */}
          {currentSelectedItem ? (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">
                    Modo Edição de Item da Lista
                  </span>
                  <span className="text-xs font-bold text-white">
                    {currentSelectedItem.name}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                Atualizará o item
              </span>
            </div>
          ) : items.length > 0 ? (
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-400 font-medium">Comparar item existente:</span>
              <select
                value={selectedItemId}
                onChange={(e) => handleSelectExistingItem(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 max-w-[200px] truncate"
              >
                <option value="">-- Comparar novo produto --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({formatCurrency(it.actualPrice || it.estimatedPrice)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Product Name Input */}
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

          {/* Options Grid */}
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
                  {currentSelectedItem ? 'Opção A (Item Atual)' : 'Opção A (Menor / Promo)'}
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
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-zinc-400 font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceA}
                      onChange={(e) => setPriceA(formatFinancialMask(e.target.value))}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Digite apenas números (ex: 999 = 9,99)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Quantidade</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Ex: 400"
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Unidade</span>
                    <select
                      value={unitA}
                      onChange={(e) => setUnitA(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  Opção B (Maior / Outra Marca)
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
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-zinc-400 font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceB}
                      onChange={(e) => setPriceB(formatFinancialMask(e.target.value))}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Digite apenas números (ex: 999 = 9,99)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Quantidade</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Ex: 1000"
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Unidade</span>
                    <select
                      value={unitB}
                      onChange={(e) => setUnitB(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            {/* Action Button: Edit Existing Item vs Add Winner */}
            {comparison.cheaperOption !== 'EQUAL' && (
              <button
                onClick={handleApplyWinner}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                {currentSelectedItem ? (
                  <>
                    <Edit className="w-3.5 h-3.5" />
                    <span>Atualizar Item com Opção {comparison.cheaperOption}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Vencedor à Lista</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
