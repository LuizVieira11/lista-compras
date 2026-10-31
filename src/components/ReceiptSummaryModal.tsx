/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Receipt,
  Share2,
  Check,
  Copy,
  ShoppingCart,
  PieChart as PieChartIcon,
  Tag
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ShoppingItem, formatCurrency, CartTotals } from '../utils/cartCalculations';

interface ReceiptSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listName: string;
  items: ShoppingItem[];
  totals: CartTotals;
  budget: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Hortifrúti': '#10b981',
  'Padaria': '#f59e0b',
  'Carnes & Peixes': '#f43f5e',
  'Laticínios': '#3b82f6',
  'Mercearia': '#f97316',
  'Bebidas': '#a855f7',
  'Limpeza': '#06b6d4',
  'Higiene': '#14b8a6',
  'Congelados': '#6366f1',
  'Outros': '#71717a',
};

const DEFAULT_COLOR = '#10b981';

export const ReceiptSummaryModal: React.FC<ReceiptSummaryModalProps> = ({
  isOpen,
  onClose,
  listName,
  items,
  totals,
  budget,
}) => {
  const [activeTab, setActiveTab] = useState<'ticket' | 'chart'>('ticket');
  const [copied, setCopied] = useState(false);
  const cartItems = items.filter((item) => item.inCart);

  // Group items by category for pie chart
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const item of cartItems) {
      const price = (item.actualPrice !== undefined && item.actualPrice > 0)
        ? item.actualPrice
        : (item.estimatedPrice || 0);
      const lineTotal = price * item.quantity;
      const cat = item.category || 'Outros';

      if (!map[cat]) {
        map[cat] = { total: 0, count: 0 };
      }
      map[cat].total += lineTotal;
      map[cat].count += 1;
    }

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        value: Math.round(data.total * 100) / 100,
        count: data.count,
        color: CATEGORY_COLORS[name] || DEFAULT_COLOR,
      }))
      .sort((a, b) => b.value - a.value);
  }, [cartItems]);

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
    } catch {}
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
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

        {/* View Toggle Tabs: Cupom vs Gráfico de Gastos */}
        <div className="px-5 pt-3 pb-2 bg-zinc-900 border-b border-zinc-800/80">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('ticket')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ticket'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extrato Cupom</span>
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'chart'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Gráfico de Gastos</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: Paper Ticket Style */}
          {activeTab === 'ticket' && (
            <div className="space-y-4">
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
                  <div className="space-y-1.5 divide-y divide-zinc-800/60 max-h-56 overflow-y-auto pr-1">
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
              <div className="grid grid-cols-2 gap-2.5">
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
          )}

          {/* TAB 2: Recharts Pie Chart Distribution */}
          {activeTab === 'chart' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-xs font-bold text-zinc-400">Nenhum gasto registrado ainda</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Coloque itens no carrinho para ver a distribuição.</p>
                </div>
              ) : (
                <>
                  {/* Pie Chart Canvas */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
                    <div className="text-xs font-bold text-white mb-1 flex items-center justify-between w-full">
                      <span>Distribuição por Categoria</span>
                      <span className="text-emerald-400 font-extrabold">{formatCurrency(totals.totalInCart)}</span>
                    </div>

                    <div className="w-full h-56 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={82}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#18181b"
                            strokeWidth={2}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const pct = totals.totalInCart > 0
                                  ? Math.round((data.value / totals.totalInCart) * 100)
                                  : 0;
                                return (
                                  <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl shadow-xl text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                      <span className="font-bold text-white">{data.name}</span>
                                    </div>
                                    <div className="text-emerald-400 font-black mt-1">
                                      {formatCurrency(data.value)} ({pct}%)
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">
                                      {data.count} {data.count === 1 ? 'item' : 'itens'}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Donut center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-zinc-400 font-medium">Categorias</span>
                        <span className="text-sm font-black text-white">{categoryData.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Progress List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-300 block">Detalhamento dos Gastos</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {categoryData.map((cat) => {
                        const pct = totals.totalInCart > 0
                          ? Math.round((cat.value / totals.totalInCart) * 100)
                          : 0;

                        return (
                          <div
                            key={cat.name}
                            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="font-bold text-zinc-200">{cat.name}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">({cat.count})</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-white">{formatCurrency(cat.value)}</span>
                                <span className="text-[10px] text-emerald-400 font-bold ml-1.5">({pct}%)</span>
                              </div>
                            </div>

                            {/* Visual category proportion bar */}
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
