/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Sparkles,
  DollarSign,
  Scale,
  Receipt,
  Search,
  Volume2,
  VolumeX,
  ChevronDown,
  ListPlus,
  TrendingDown,
  AlertCircle,
  Tag,
  Check,
  Download,
  Share2
} from 'lucide-react';
import {
  ShoppingItem,
  formatCurrency,
  calculateCartTotals,
} from './utils/cartCalculations';
import { ShoppingList, Category, ScannedPriceResult } from './types';
import { INITIAL_LISTS, CATEGORIES, CATEGORY_COLORS } from './data/initialData';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ItemFormModal } from './components/ItemFormModal';
import { PriceComparatorModal } from './components/PriceComparatorModal';
import { ReceiptSummaryModal } from './components/ReceiptSummaryModal';
import { BudgetModal } from './components/BudgetModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ShareExportModal } from './components/ShareExportModal';
import { ImportSharedListModal } from './components/ImportSharedListModal';
import { parseSharedListFromURL } from './utils/exportUtils';
import { usePWAInstall } from './hooks/usePWAInstall';
import { sounds } from './utils/audioFeedback';

const STORAGE_KEY = 'superlista_app_lists_v1';
const ACTIVE_LIST_KEY = 'superlista_active_list_id_v1';

export default function App() {
  // Load state from localStorage or initial realistic data
  const [lists, setLists] = useState<ShoppingList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LISTS;
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_LIST_KEY);
      if (savedId) return savedId;
    } catch {}
    return INITIAL_LISTS[0].id;
  });

  // Modals & Navigation state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [comparatorTargetItem, setComparatorTargetItem] = useState<ShoppingItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [soundActive, setSoundActive] = useState(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedListToImport, setSharedListToImport] = useState<ShoppingList | null>(() => {
    return parseSharedListFromURL();
  });
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'inCart'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      localStorage.setItem(ACTIVE_LIST_KEY, activeListId);
    } catch {}
  }, [lists, activeListId]);

  // Sync sound controller
  useEffect(() => {
    sounds.soundEnabled = soundActive;
  }, [soundActive]);

  // Active list resolution
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0];
  }, [lists, activeListId]);

  // Calculate cart metrics
  const totals = useMemo(() => {
    return calculateCartTotals(activeList.items, activeList.budget);
  }, [activeList.items, activeList.budget]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return activeList.items.filter((item) => {
      // Status filter
      if (statusFilter === 'pending' && item.inCart) return false;
      if (statusFilter === 'inCart' && !item.inCart) return false;

      // Category filter
      if (categoryFilter !== 'Todos' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activeList.items, statusFilter, categoryFilter, searchQuery]);

  // Toggle item in cart
  const toggleItemInCart = (itemId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;
        return {
          ...l,
          items: l.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextInCart = !item.inCart;
            if (nextInCart) {
              sounds.playSuccessChime();
            }
            return {
              ...item,
              inCart: nextInCart,
              scannedAt: nextInCart ? new Date().toISOString() : undefined,
            };
          }),
        };
      })
    );
  };

  // Adjust quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;
        return {
          ...l,
          items: l.items.map((item) => {
            if (item.id !== itemId) return item;
            const newQty = Math.max(1, (item.quantity || 1) + delta);
            return { ...item, quantity: newQty };
          }),
        };
      })
    );
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;
        return {
          ...l,
          items: l.items.filter((i) => i.id !== itemId),
        };
      })
    );
  };

  // Save new or edited item from modal
  const handleSaveItem = (itemData: Partial<ShoppingItem>) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;

        if (editingItem) {
          // Update existing
          return {
            ...l,
            items: l.items.map((item) =>
              item.id === editingItem.id ? { ...item, ...itemData } : item
            ),
          };
        } else {
          // Add new
          const newItem: ShoppingItem = {
            id: 'item-' + Date.now(),
            name: itemData.name || 'Novo Item',
            category: itemData.category || 'Mercearia',
            quantity: itemData.quantity || 1,
            unit: itemData.unit || 'un',
            estimatedPrice: itemData.estimatedPrice || 0,
            inCart: false,
            notes: itemData.notes,
          };
          return {
            ...l,
            items: [newItem, ...l.items],
          };
        }
      })
    );
    setEditingItem(null);
  };

  // Confirm item scanned via camera
  const handleConfirmScannedItem = (
    scanned: ScannedPriceResult,
    scannedQuantity: number,
    matchedItem?: ShoppingItem
  ) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;

        if (matchedItem) {
          // Update the matched item with scanned real price and mark in cart
          return {
            ...l,
            items: l.items.map((item) => {
              if (item.id === matchedItem.id) {
                return {
                  ...item,
                  actualPrice: scanned.price,
                  quantity: scannedQuantity,
                  inCart: true,
                  scannedAt: new Date().toISOString(),
                };
              }
              return item;
            }),
          };
        } else {
          // Add as a brand new item directly in cart
          const newItem: ShoppingItem = {
            id: 'item-' + Date.now(),
            name: scanned.productName,
            category: (scanned.category as Category) || 'Mercearia',
            quantity: scannedQuantity,
            unit: 'un',
            estimatedPrice: scanned.price,
            actualPrice: scanned.price,
            inCart: true,
            scannedAt: new Date().toISOString(),
          };
          return {
            ...l,
            items: [newItem, ...l.items],
          };
        }
      })
    );
  };

  // Update budget
  const handleSaveBudget = (newBudget: number) => {
    setLists((prev) =>
      prev.map((l) => (l.id === activeList.id ? { ...l, budget: newBudget } : l))
    );
  };

  // Create new list
  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newList: ShoppingList = {
      id: 'list-' + Date.now(),
      name: newListName.trim(),
      icon: '🛒',
      budget: 200,
      createdAt: new Date().toISOString(),
      items: [],
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
    setNewListName('');
    setIsNewListOpen(false);
  };

  // Add winner item from comparator
  const handleAddWinnerFromComparator = (name: string, price: number) => {
    const newItem: ShoppingItem = {
      id: 'item-' + Date.now(),
      name,
      category: 'Mercearia',
      quantity: 1,
      unit: 'un',
      estimatedPrice: price,
      actualPrice: price,
      inCart: true,
    };
    setLists((prev) =>
      prev.map((l) => (l.id === activeList.id ? { ...l, items: [newItem, ...l.items] } : l))
    );
    sounds.playSuccessChime();
  };

  // Open comparator for a specific item to edit it in place
  const handleOpenComparatorForItem = (item: ShoppingItem) => {
    setComparatorTargetItem(item);
    setIsComparatorOpen(true);
  };

  // Update an existing item from comparator verdict
  const handleUpdateItemFromComparator = (itemId: string, newPrice: number, updatedPackageName?: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeList.id) return l;
        return {
          ...l,
          items: l.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              name: updatedPackageName || item.name,
              actualPrice: newPrice,
            };
          }),
        };
      })
    );
    sounds.playSuccessChime();
  };

  // Confirm import of shared list from URL
  const handleConfirmImport = (importedList: ShoppingList) => {
    setLists((prev) => [importedList, ...prev]);
    setActiveListId(importedList.id);
    setSharedListToImport(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    sounds.playSuccessChime();
  };

  // Budget progress percentage
  const budgetProgress = activeList.budget > 0
    ? Math.min(100, Math.round((totals.totalInCart / activeList.budget) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col select-none">
      
      {/* Sticky Top App Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 shadow-md">
        <div className="max-w-2xl mx-auto w-full px-4 pt-3 pb-3">
          {/* Row 1: Brand & Quick Utility Actions */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                  SuperLista
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500 text-white font-black uppercase">
                    PRO
                  </span>
                </h1>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">Leitor de Preços com Câmera</p>
              </div>
            </div>

            {/* Quick Utilities (Baixar App & Som) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Install PWA Button */}
              {!isInstalled && (
                <button
                  onClick={() => {
                    if (isInstallable) {
                      install();
                    } else {
                      setIsInstallModalOpen(true);
                    }
                  }}
                  title="Baixar aplicativo no celular ou computador"
                  aria-label="Baixar e instalar aplicativo"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Baixar</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundActive(!soundActive)}
                title={soundActive ? 'Silenciar bip do scanner' : 'Ativar som'}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition border border-zinc-700/80 flex items-center justify-center"
                aria-label="Alternar som do supermercado"
              >
                {soundActive ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>
            </div>
          </div>

          {/* Row 2: Dedicated List Selector & Creation Bar */}
          <div className="flex items-center gap-2 mb-3 bg-zinc-950/70 p-1.5 rounded-2xl border border-zinc-800">
            <div className="relative flex-1 min-w-0">
              <select
                value={activeListId}
                onChange={(e) => {
                  if (e.target.value === 'NEW') {
                    setIsNewListOpen(true);
                  } else {
                    setActiveListId(e.target.value);
                  }
                }}
                aria-label="Selecionar lista de compras ativa"
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3 py-2 text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500 appearance-none pr-8 cursor-pointer truncate"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.name}
                  </option>
                ))}
                <option value="NEW">+ Criar Nova Lista...</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <button
              onClick={() => setIsNewListOpen(true)}
              title="Criar nova lista"
              aria-label="Criar nova lista de compras"
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition border border-zinc-700/80 shrink-0 active:scale-95"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Nova</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              title="Compartilhar ou exportar lista para CSV"
              aria-label="Compartilhar ou exportar lista"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 font-bold text-xs flex items-center justify-center transition border border-zinc-700/80 shrink-0 active:scale-95"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Budget & Cart Metric Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-700/60 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                  Total no Carrinho
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(totals.totalInCart)}
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setIsBudgetOpen(true)}
                  className="group flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-emerald-400 transition"
                >
                  <span>Teto: {formatCurrency(activeList.budget)}</span>
                  <Edit2 className="w-3 h-3 group-hover:scale-110 transition" />
                </button>
                <div className="text-xs font-bold mt-0.5">
                  {totals.isOverBudget ? (
                    <span className="text-red-400 flex items-center justify-end gap-1 font-black">
                      <AlertCircle className="w-3.5 h-3.5" />
                      + {formatCurrency(Math.abs(totals.remainingBudget))} acima
                    </span>
                  ) : (
                    <span className="text-zinc-300">
                      Resta: <strong className="text-emerald-300">{formatCurrency(totals.remainingBudget)}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-700/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totals.isOverBudget
                    ? 'bg-red-500'
                    : budgetProgress > 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetProgress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 font-medium">
              <span>{totals.itemsInCartCount} de {totals.itemsCount} itens comprados ({totals.percentCompleted}%)</span>
              <span>Previsto: {formatCurrency(totals.totalEstimatedFinal)}</span>
            </div>
          </div>

          {/* Search Bar & Action Buttons */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produto na lista..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/90 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsItemFormOpen(true);
                }}
                aria-label="Adicionar item manualmente à lista"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Item</span>
              </button>
            </div>

            {/* Status Tabs: Todos | A Comprar | No Carrinho */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({activeList.items.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                A Comprar ({activeList.items.length - totals.itemsInCartCount})
              </button>
              <button
                onClick={() => setStatusFilter('inCart')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
                  statusFilter === 'inCart'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                No Carrinho ({totals.itemsInCartCount})
              </button>
            </div>

            {/* Horizontal Category Carousel */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main List of Shopping Items */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-2.5 pb-32">
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-zinc-300">Nenhum item nesta visualização</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Nenhum produto encontrado para sua busca.'
                  : 'Sua lista está vazia nesta categoria. Adicione itens ou aponte a câmera para uma etiqueta de preço!'}
              </p>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <Camera className="w-4 h-4" />
                Escanear Etiqueta Agora
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Outros'];
              const hasScannedPrice = item.actualPrice !== undefined && item.actualPrice > 0;
              const displayPrice = hasScannedPrice ? item.actualPrice! : item.estimatedPrice;
              const lineTotal = displayPrice * item.quantity;
              const savedAmount = item.actualPrice && item.estimatedPrice > item.actualPrice
                ? (item.estimatedPrice - item.actualPrice) * item.quantity
                : 0;

              return (
                <div
                  key={item.id}
                  className={`group relative p-3.5 rounded-2xl border transition-all duration-200 ${
                    item.inCart
                      ? 'bg-zinc-950/60 border-zinc-800/80 opacity-90'
                      : 'bg-zinc-800/70 hover:bg-zinc-800 border-zinc-700/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox toggle */}
                    <button
                      onClick={() => toggleItemInCart(item.id)}
                      aria-label={item.inCart ? `Marcar ${item.name} como pendente` : `Colocar ${item.name} no carrinho`}
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 shrink-0 ${
                        item.inCart
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'border-2 border-zinc-600 hover:border-emerald-400 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Item Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-semibold ${categoryColor.bg} ${categoryColor.text}`}
                        >
                          {item.category}
                        </span>

                        {hasScannedPrice && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            Preço Câmera
                          </span>
                        )}

                        {savedAmount > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                            Economizou {formatCurrency(savedAmount)}!
                          </span>
                        )}
                      </div>

                      <h2
                        className={`text-sm font-bold mt-1 text-white truncate ${
                          item.inCart ? 'line-through text-zinc-400' : ''
                        }`}
                      >
                        {item.name}
                      </h2>

                      {item.notes && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                          {item.notes}
                        </p>
                      )}

                      {/* Quantity & Unit controls */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-2 text-white">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-[11px] text-zinc-400">
                          {formatCurrency(displayPrice)} / {item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Price Column & Quick Actions */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <div className="text-sm font-black text-emerald-400">
                        {formatCurrency(lineTotal)}
                      </div>

                      {item.estimatedPrice > 0 && hasScannedPrice && (
                        <div className="text-[10px] text-zinc-500 line-through">
                          Est: {formatCurrency(item.estimatedPrice * item.quantity)}
                        </div>
                      )}

                      {/* Quick Item Buttons */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <button
                          onClick={() => handleOpenComparatorForItem(item)}
                          aria-label={`Comparar embalagens de ${item.name}`}
                          title="Comparar tamanhos e preços desta embalagem"
                          className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition text-[11px] font-bold flex items-center gap-1 active:scale-95"
                        >
                          <Scale className="w-3 h-3 text-amber-400" />
                          <span>Comparar</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemFormOpen(true);
                          }}
                          aria-label={`Editar ${item.name}`}
                          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label={`Excluir ${item.name}`}
                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
      </main>
 
      {/* Mobile-First Bottom Navigation Bar - Fixed to Browser Bottom */}
      <nav
        aria-label="Menu principal"
        className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/90 py-2 px-4 shadow-2xl"
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {/* List Tab */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              statusFilter === 'all' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Lista</span>
          </button>

          {/* Central Camera Scanner Prominent Button */}
          <div className="relative -top-5">
            <button
              onClick={() => setIsScannerOpen(true)}
              aria-label="Abrir leitor de preços via câmera"
              className="group relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-zinc-950 transition-transform active:scale-90 hover:scale-105"
            >
              <Camera className="w-7 h-7" />
              {/* Pulsing ring animation */}
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            </button>
            <span className="block text-center text-[10px] font-extrabold text-emerald-400 mt-0.5">
              LER PREÇO
            </span>
          </div>

          {/* Comparator Tool */}
          <button
            onClick={() => {
              setComparatorTargetItem(null);
              setIsComparatorOpen(true);
            }}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition"
          >
            <Scale className="w-5 h-5 text-amber-400" />
            <span>Comparar</span>
          </button>

          {/* Cupom / Carrinho Receipt */}
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition"
          >
            <Receipt className="w-5 h-5 text-blue-400" />
            <span>Cupom</span>
          </button>
        </div>
      </nav>

      {/* Camera Price Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={activeList.items}
        onConfirmItem={handleConfirmScannedItem}
      />

      {/* Manual Item Add / Edit Modal */}
      <ItemFormModal
        isOpen={isItemFormOpen}
        onClose={() => {
          setIsItemFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
      />

      {/* Packaging Unit Price Comparator */}
      <PriceComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => {
          setIsComparatorOpen(false);
          setComparatorTargetItem(null);
        }}
        targetItem={comparatorTargetItem}
        items={activeList.items}
        onAddWinnerToCart={handleAddWinnerFromComparator}
        onUpdateItem={handleUpdateItemFromComparator}
      />

      {/* Receipt Cupom Fiscal Modal */}
      <ReceiptSummaryModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        listName={activeList.name}
        items={activeList.items}
        totals={totals}
        budget={activeList.budget}
      />

      {/* Budget / Spending Limit Modal */}
      <BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        currentBudget={activeList.budget}
        onSave={handleSaveBudget}
      />

      {/* New List Modal */}
      {isNewListOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Criar Nova Lista"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-zinc-100">
            <h2 className="text-base font-bold text-white mb-1">Criar Nova Lista</h2>
            <p className="text-xs text-zinc-400 mb-4">Ex: Feira de Orgânicos, Compras de Natal</p>

            <form onSubmit={handleCreateNewList} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nome da lista"
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewListOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Share & Export CSV Modal */}
      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        list={activeList}
      />

      {/* Import Shared List Modal (URL query) */}
      <ImportSharedListModal
        sharedList={sharedListToImport}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setSharedListToImport(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />

      {/* Connectivity Offline Indicator */}
      <OfflineIndicator />

    </div>
  );
}
