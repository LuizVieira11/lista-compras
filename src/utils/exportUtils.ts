/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingList } from '../types';
import { ShoppingItem, formatCurrency } from './cartCalculations';

/**
 * Generates UTF-8 CSV string with BOM for Brazilian Excel/Sheets compatibility
 */
export function generateCSV(list: ShoppingList): string {
  // UTF-8 BOM
  const BOM = '\uFEFF';
  const headers = [
    'Produto',
    'Categoria',
    'Quantidade',
    'Unidade',
    'Preço Estimado (R$)',
    'Preço Real / Câmera (R$)',
    'Subtotal (R$)',
    'Status',
    'Lido na Câmera',
  ];

  const rows = list.items.map((item) => {
    const hasActual = item.actualPrice !== undefined && item.actualPrice > 0;
    const finalPrice = hasActual ? item.actualPrice! : item.estimatedPrice;
    const lineTotal = finalPrice * item.quantity;
    const status = item.inCart ? 'No Carrinho' : 'A Comprar';
    const isCamera = hasActual ? 'Sim' : 'Não';

    return [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.quantity,
      `"${item.unit}"`,
      `"${item.estimatedPrice.toFixed(2).replace('.', ',')}"`,
      `"${(item.actualPrice || 0).toFixed(2).replace('.', ',')}"`,
      `"${lineTotal.toFixed(2).replace('.', ',')}"`,
      `"${status}"`,
      `"${isCamera}"`,
    ].join(';');
  });

  return BOM + [headers.join(';'), ...rows].join('\r\n');
}

/**
 * Triggers browser download of the CSV file
 */
export function downloadCSV(list: ShoppingList): void {
  const csvContent = generateCSV(list);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanName = list.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `superlista_${cleanName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts a string to URL-safe base64
 */
export function toUrlSafeBase64(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes URL-safe base64 back to string
 */
export function fromUrlSafeBase64(urlSafe: string): string {
  let b64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  return decodeURIComponent(escape(atob(b64)));
}

/**
 * Generates an encrypted/base64 encoded shareable URL containing the shopping list
 */
export function generateShareableURL(list: ShoppingList): string {
  try {
    const payload = {
      name: list.name,
      budget: list.budget,
      items: list.items.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.estimatedPrice,
        actualPrice: item.actualPrice,
        inCart: item.inCart,
      })),
    };

    const json = JSON.stringify(payload);
    const token = toUrlSafeBase64(json);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?lista=${token}`;
  } catch (err) {
    console.error('Error generating share URL:', err);
    return window.location.href;
  }
}

/**
 * Parses shared shopping list from current URL parameters
 */
export function parseSharedListFromURL(): ShoppingList | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('lista');
    if (!token) return null;

    const json = fromUrlSafeBase64(token);
    const data = JSON.parse(json);

    if (!data.name || !Array.isArray(data.items)) return null;

    const importedItems: ShoppingItem[] = data.items.map((item: any, idx: number) => ({
      id: `shared_${Date.now()}_${idx}`,
      name: String(item.name || 'Item'),
      category: item.category || 'Outros',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'un',
      estimatedPrice: Number(item.estimatedPrice) || 0,
      actualPrice: item.actualPrice !== undefined ? Number(item.actualPrice) : undefined,
      inCart: Boolean(item.inCart),
      addedAt: Date.now(),
    }));

    return {
      id: `list_shared_${Date.now()}`,
      name: `${data.name} (Compartilhada)`,
      budget: Number(data.budget) || 0,
      icon: '📋',
      createdAt: new Date().toISOString(),
      items: importedItems,
    };
  } catch (err) {
    console.warn('Could not parse shared list from URL:', err);
    return null;
  }
}

/**
 * Generates WhatsApp friendly text with items and share link
 */
export function generateWhatsAppMessage(list: ShoppingList): string {
  let msg = `🛒 *SuperLista: ${list.name}*\n`;
  msg += `Total de itens: ${list.items.length}\n`;
  if (list.budget > 0) {
    msg += `Orçamento limite: ${formatCurrency(list.budget)}\n`;
  }
  msg += `\n*Itens para comprar:*\n`;

  list.items.forEach((item) => {
    const check = item.inCart ? '✅' : '⬜';
    const price = item.actualPrice || item.estimatedPrice || 0;
    msg += `${check} ${item.quantity} ${item.unit} - ${item.name}`;
    if (price > 0) {
      msg += ` (${formatCurrency(price)})`;
    }
    msg += `\n`;
  });

  const shareUrl = generateShareableURL(list);
  msg += `\n🔗 *Abra ou importe esta lista no app:*\n${shareUrl}`;

  return msg;
}

/**
 * Generates mailto link for sending via email
 */
export function generateEmailUrl(list: ShoppingList): string {
  const subject = encodeURIComponent(`Lista de Compras: ${list.name} (SuperLista)`);
  const body = encodeURIComponent(generateWhatsAppMessage(list));
  return `mailto:?subject=${subject}&body=${body}`;
}
