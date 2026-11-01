/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pacote' | 'lata' | 'caixa';
  estimatedPrice: number; // Planned price per unit
  actualPrice?: number;   // Real price per unit scanned/entered
  inCart: boolean;
  scannedAt?: string;
  notes?: string;
}

export interface CartTotals {
  totalPlanned: number;
  totalInCart: number;
  totalPendingPlanned: number;
  totalEstimatedFinal: number;
  itemsCount: number;
  itemsInCartCount: number;
  percentCompleted: number;
  remainingBudget: number;
  isOverBudget: boolean;
}

/**
 * Formats a number to Brazilian currency (R$ 12,50)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats user input into a financial currency mask (0,00).
 * Typing "9" -> "0,09", "99" -> "0,99", "999" -> "9,99", "2500" -> "25,00".
 * Deleting removes the last digit.
 */
export function formatFinancialMask(input: string | number): string {
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) return '0,00';
    return input.toFixed(2).replace('.', ',');
  }

  if (!input || typeof input !== 'string') return '0,00';

  // Extract all numeric digits
  const digits = input.replace(/\D/g, '');
  if (!digits || digits === '0') return '0,00';

  const cents = parseInt(digits, 10);
  if (isNaN(cents) || cents === 0) return '0,00';

  const integerPart = Math.floor(cents / 100);
  const decimalPart = String(cents % 100).padStart(2, '0');

  return `${integerPart},${decimalPart}`;
}

/**
 * Parses financial mask (e.g. "9,99") to floating number (9.99)
 */
export function parseFinancialMask(masked: string | number): number {
  if (typeof masked === 'number') return isNaN(masked) ? 0 : Math.max(0, masked);
  if (!masked || typeof masked !== 'string') return 0;
  const digits = masked.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/**
 * Parses a price string into a float, supporting Brazilian (comma) and decimal (dot) formats
 */
export function parsePrice(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : Math.max(0, input);
  }
  if (!input || typeof input !== 'string') return 0;

  // Clean string
  let cleaned = input.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return 0;

  // Handle formats like 1.250,50 (Brazilian standard)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Format like 14,99
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Calculates cart totals, completed items, and budget metrics
 */
export function calculateCartTotals(items: ShoppingItem[], budget: number = 0): CartTotals {
  let totalPlanned = 0;
  let totalInCart = 0;
  let totalPendingPlanned = 0;
  let itemsInCartCount = 0;

  for (const item of items) {
    const qty = Math.max(0, item.quantity || 1);
    const est = (item.estimatedPrice || 0) * qty;
    totalPlanned += est;

    if (item.inCart) {
      itemsInCartCount++;
      const pricePerUnit = (item.actualPrice !== undefined && item.actualPrice > 0)
        ? item.actualPrice
        : (item.estimatedPrice || 0);
      totalInCart += pricePerUnit * qty;
    } else {
      totalPendingPlanned += est;
    }
  }

  const itemsCount = items.length;
  const percentCompleted = itemsCount > 0 ? Math.round((itemsInCartCount / itemsCount) * 100) : 0;
  const totalEstimatedFinal = totalInCart + totalPendingPlanned;
  const remainingBudget = budget > 0 ? budget - totalInCart : 0;
  const isOverBudget = budget > 0 && totalInCart > budget;

  return {
    totalPlanned: Math.round(totalPlanned * 100) / 100,
    totalInCart: Math.round(totalInCart * 100) / 100,
    totalPendingPlanned: Math.round(totalPendingPlanned * 100) / 100,
    totalEstimatedFinal: Math.round(totalEstimatedFinal * 100) / 100,
    itemsCount,
    itemsInCartCount,
    percentCompleted,
    remainingBudget: Math.round(remainingBudget * 100) / 100,
    isOverBudget,
  };
}

/**
 * Normalizes string for text comparison (removes accents, lowercase, removes punctuation)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .trim();
}

/**
 * Finds the best matching item from the shopping list given OCR/scanned text
 */
export function findBestMatchingItem(scannedName: string, items: ShoppingItem[]): ShoppingItem | null {
  if (!scannedName || items.length === 0) return null;

  const normalizedScanned = normalizeText(scannedName);
  const scannedTokens = normalizedScanned.split(/\s+/).filter(t => t.length > 2);

  let bestMatch: ShoppingItem | null = null;
  let highestScore = 0;

  for (const item of items) {
    const normalizedItem = normalizeText(item.name);
    
    // Direct exact or substring match
    if (normalizedScanned.includes(normalizedItem)) {
      const score = 100 + normalizedItem.length;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
      continue;
    }

    if (normalizedItem.includes(normalizedScanned)) {
      const score = 90 + normalizedScanned.length;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
      continue;
    }

    // Token overlap match
    const itemTokens = normalizedItem.split(/\s+/).filter(t => t.length > 2);
    if (itemTokens.length === 0) continue;

    let matchedTokens = 0;
    for (const token of itemTokens) {
      if (scannedTokens.some(st => st.includes(token) || token.includes(st))) {
        matchedTokens++;
      }
    }

    if (matchedTokens > 0) {
      const score = (matchedTokens / itemTokens.length) * 80;
      if (score > highestScore && score >= 40) {
        highestScore = score;
        bestMatch = item;
      }
    }
  }

  return bestMatch;
}

export interface UnitComparisonResult {
  pricePerStandardA: number;
  pricePerStandardB: number;
  cheaperOption: 'A' | 'B' | 'EQUAL';
  savingsPercentage: number;
  standardUnitLabel: string;
}

/**
 * Compares two product packages (e.g. 400g vs 1kg, or 350ml vs 2L)
 */
export function comparePackagePrices(
  priceA: number,
  quantityA: number,
  unitA: 'g' | 'kg' | 'ml' | 'L' | 'un',
  priceB: number,
  quantityB: number,
  unitB: 'g' | 'kg' | 'ml' | 'L' | 'un'
): UnitComparisonResult {
  const normA = normalizeToStandardUnit(quantityA, unitA);
  const normB = normalizeToStandardUnit(quantityB, unitB);

  const pricePerStandardA = normA.quantity > 0 ? priceA / normA.quantity : 0;
  const pricePerStandardB = normB.quantity > 0 ? priceB / normB.quantity : 0;

  let cheaperOption: 'A' | 'B' | 'EQUAL' = 'EQUAL';
  let savingsPercentage = 0;

  if (Math.abs(pricePerStandardA - pricePerStandardB) < 0.001) {
    cheaperOption = 'EQUAL';
    savingsPercentage = 0;
  } else if (pricePerStandardA < pricePerStandardB) {
    cheaperOption = 'A';
    savingsPercentage = Math.round(((pricePerStandardB - pricePerStandardA) / pricePerStandardB) * 100);
  } else {
    cheaperOption = 'B';
    savingsPercentage = Math.round(((pricePerStandardA - pricePerStandardB) / pricePerStandardA) * 100);
  }

  return {
    pricePerStandardA: Math.round(pricePerStandardA * 100) / 100,
    pricePerStandardB: Math.round(pricePerStandardB * 100) / 100,
    cheaperOption,
    savingsPercentage,
    standardUnitLabel: normA.label,
  };
}

function normalizeToStandardUnit(amount: number, unit: string): { quantity: number; label: string } {
  switch (unit) {
    case 'g':
      return { quantity: amount / 1000, label: 'kg' };
    case 'kg':
      return { quantity: amount, label: 'kg' };
    case 'ml':
      return { quantity: amount / 1000, label: 'L' };
    case 'L':
      return { quantity: amount, label: 'L' };
    case 'un':
    default:
      return { quantity: amount, label: 'un' };
  }
}
