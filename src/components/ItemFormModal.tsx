/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Plus, Tag } from 'lucide-react';
import { ShoppingItem, parsePrice } from '../utils/cartCalculations';
import { CATEGORIES } from '../data/initialData';
import { Category } from '../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<ShoppingItem>) => void;
  initialItem?: ShoppingItem | null;
}

const COMMON_SUGGESTIONS = [
  { name: 'Arroz 5kg', category: 'Mercearia', price: 28.90, unit: 'pacote' },
  { name: 'Feijão 1kg', category: 'Mercearia', price: 8.50, unit: 'kg' },
  { name: 'Leite 1L', category: 'Laticínios', price: 4.80, unit: 'L' },
  { name: 'Café 500g', category: 'Mercearia', price: 19.00, unit: 'pacote' },
  { name: 'Açúcar 1kg', category: 'Mercearia', price: 5.20, unit: 'kg' },
  { name: 'Óleo de Soja 900ml', category: 'Mercearia', price: 6.90, unit: 'un' },
  { name: 'Pão Francês', category: 'Padaria', price: 14.00, unit: 'kg' },
  { name: 'Ovos 30 un', category: 'Hortifrúti', price: 22.00, unit: 'caixa' },
  { name: 'Banana Prata', category: 'Hortifrúti', price: 7.00, unit: 'kg' },
  { name: 'Detergente 500ml', category: 'Limpeza', price: 2.50, unit: 'un' },
  { name: 'Papel Higiênico 12un', category: 'Higiene', price: 18.00, unit: 'pacote' },
];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Mercearia');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<ShoppingItem['unit']>('un');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory((initialItem.category as Category) || 'Mercearia');
      setQuantity(String(initialItem.quantity || 1));
      setUnit(initialItem.unit || 'un');
      setEstimatedPrice(
        initialItem.estimatedPrice ? initialItem.estimatedPrice.toFixed(2).replace('.', ',') : ''
      );
      setNotes(initialItem.notes || '');
    } else {
      setName('');
      setCategory('Mercearia');
      setQuantity('1');
      setUnit('un');
      setEstimatedPrice('');
      setNotes('');
    }
  }, [initialItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedQty = parseFloat(quantity.replace(',', '.')) || 1;
    const parsedPrice = parsePrice(estimatedPrice);

    onSave({
      name: name.trim(),
      category: category === 'Todos' ? 'Mercearia' : category,
      quantity: parsedQty,
      unit,
      estimatedPrice: parsedPrice,
      notes: notes.trim(),
    });

    onClose();
  };

  const applySuggestion = (sug: typeof COMMON_SUGGESTIONS[0]) => {
    setName(sug.name);
    setCategory(sug.category as Category);
    setEstimatedPrice(sug.price.toFixed(2).replace('.', ','));
    setUnit(sug.unit as ShoppingItem['unit']);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initialItem ? 'Editar Item da Lista' : 'Novo Item na Lista'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              {initialItem ? 'Editar Item' : 'Adicionar à Lista'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar formulário"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Quick suggestions if new item */}
          {!initialItem && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-400" />
                Sugestões Rápidas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SUGGESTIONS.slice(0, 6).map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => applySuggestion(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition"
                  >
                    + {sug.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Nome do Item *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Leite Integral 1L"
              className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Unidade
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ShoppingItem['unit'])}
                className="w-full px-3 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="un">un (Unidade)</option>
                <option value="kg">kg (Quilograma)</option>
                <option value="g">g (Grama)</option>
                <option value="L">L (Litro)</option>
                <option value="ml">ml (Mililitro)</option>
                <option value="pacote">pacote</option>
                <option value="caixa">caixa</option>
                <option value="lata">lata</option>
              </select>
            </div>
          </div>

          {/* Quantity & Estimated Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Quantidade
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Preço Estimado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-bold">R$</span>
                <input
                  type="text"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/90 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Observações (marca preferida, tamanho...)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Se tiver Italac ou Piracanjuba"
              className="w-full px-3.5 py-2 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              {initialItem ? 'Salvar Alterações' : 'Adicionar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
