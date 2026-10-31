/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  parsePrice,
  calculateCartTotals,
  findBestMatchingItem,
  comparePackagePrices,
  ShoppingItem
} from './cartCalculations';

test('formatCurrency formats to Brazilian Real with symbol and comma', () => {
  const result = formatCurrency(14.99);
  assert.ok(result.includes('14,99') || result.includes('14.99'));
  assert.ok(result.includes('R$'));
  
  assert.equal(formatCurrency(0), 'R$ 0,00'.replace(' ', '\u00a0') || 'R$ 0,00');
});

test('parsePrice correctly handles different Brazilian and international price formats', () => {
  assert.equal(parsePrice('R$ 14,99'), 14.99);
  assert.equal(parsePrice('14,99'), 14.99);
  assert.equal(parsePrice('14.99'), 14.99);
  assert.equal(parsePrice('1.250,50'), 1250.5);
  assert.equal(parsePrice('R$ 9,90/kg'), 9.9);
  assert.equal(parsePrice(25.5), 25.5);
  assert.equal(parsePrice(''), 0);
  assert.equal(parsePrice('invalido'), 0);
});

test('calculateCartTotals computes planned, in-cart totals, and budget alerts', () => {
  const items: ShoppingItem[] = [
    {
      id: '1',
      name: 'Leite Integral',
      category: 'Laticínios',
      quantity: 3,
      unit: 'L',
      estimatedPrice: 4.50,
      actualPrice: 4.80,
      inCart: true,
    },
    {
      id: '2',
      name: 'Café Torrado 500g',
      category: 'Mercearia',
      quantity: 2,
      unit: 'un',
      estimatedPrice: 18.00,
      inCart: false,
    },
    {
      id: '3',
      name: 'Arroz 5kg',
      category: 'Mercearia',
      quantity: 1,
      unit: 'un',
      estimatedPrice: 28.00,
      actualPrice: 26.50,
      inCart: true,
    }
  ];

  // In cart:
  // Item 1: 3 * 4.80 = 14.40
  // Item 3: 1 * 26.50 = 26.50
  // Total in cart: 14.40 + 26.50 = 40.90
  //
  // Planned total:
  // Item 1: 3 * 4.50 = 13.50
  // Item 2: 2 * 18.00 = 36.00
  // Item 3: 1 * 28.00 = 28.00
  // Total planned: 77.50

  const budget = 50.00;
  const totals = calculateCartTotals(items, budget);

  assert.equal(totals.totalInCart, 40.9);
  assert.equal(totals.totalPlanned, 77.5);
  assert.equal(totals.itemsCount, 3);
  assert.equal(totals.itemsInCartCount, 2);
  assert.equal(totals.percentCompleted, 67);
  assert.equal(totals.remainingBudget, 9.1);
  assert.equal(totals.isOverBudget, false);

  // If budget was lower
  const tightBudgetTotals = calculateCartTotals(items, 30.00);
  assert.equal(tightBudgetTotals.isOverBudget, true);
  assert.equal(tightBudgetTotals.remainingBudget, -10.9);
});

test('findBestMatchingItem identifies shopping list item from scanned text', () => {
  const items: ShoppingItem[] = [
    {
      id: '1',
      name: 'Leite Integral',
      category: 'Laticínios',
      quantity: 2,
      unit: 'L',
      estimatedPrice: 4.5,
      inCart: false,
    },
    {
      id: '2',
      name: 'Sabão em Pó Omo',
      category: 'Limpeza',
      quantity: 1,
      unit: 'un',
      estimatedPrice: 22.0,
      inCart: false,
    },
    {
      id: '3',
      name: 'Azeite de Oliva',
      category: 'Mercearia',
      quantity: 1,
      unit: 'un',
      estimatedPrice: 35.0,
      inCart: false,
    }
  ];

  // Scanned price label contains brand and details:
  const match1 = findBestMatchingItem('LEITE INTEGRAL PIRACANJUBA 1L', items);
  assert.ok(match1 !== null);
  assert.equal(match1?.id, '1');

  const match2 = findBestMatchingItem('LAVA ROUPAS EM PÓ OMO LAVAGEM PERFEITA 1.6KG', items);
  assert.ok(match2 !== null);
  assert.equal(match2?.id, '2');

  const match3 = findBestMatchingItem('AZEITE EXTRA VIRGEM BORGES 500ML', items);
  assert.ok(match3 !== null);
  assert.equal(match3?.id, '3');

  const matchUnknown = findBestMatchingItem('TELEVISOR SMART 55 POL', items);
  assert.equal(matchUnknown, null);
});

test('comparePackagePrices correctly calculates unit price economy', () => {
  // Option A: 400g coffee for R$ 16,00 -> R$ 40/kg
  // Option B: 1000g coffee for R$ 32,00 -> R$ 32/kg
  const comp = comparePackagePrices(16.0, 400, 'g', 32.0, 1000, 'g');
  assert.equal(comp.cheaperOption, 'B');
  assert.equal(comp.pricePerStandardA, 40);
  assert.equal(comp.pricePerStandardB, 32);
  assert.equal(comp.savingsPercentage, 20); // (40-32)/40 = 20% savings
});

test('generateCSV outputs valid Brazilian formatted semicolon CSV with BOM', async () => {
  const { generateCSV } = await import('./exportUtils');
  const dummyList = {
    id: 'l1',
    name: 'Feira Semanal',
    icon: '🛒',
    budget: 100,
    createdAt: '2026-10-31',
    items: [
      {
        id: '1',
        name: 'Arroz 5kg',
        category: 'Mercearia' as const,
        quantity: 2,
        unit: 'pacote' as const,
        estimatedPrice: 25.5,
        actualPrice: 24.9,
        inCart: true,
      },
    ],
  };

  const csv = generateCSV(dummyList);
  assert.ok(csv.startsWith('\uFEFF')); // BOM
  assert.ok(csv.includes('Produto;Categoria;Quantidade;Unidade'));
  assert.ok(csv.includes('"Arroz 5kg";"Mercearia";2;"pacote"'));
  assert.ok(csv.includes('24,90'));
  assert.ok(csv.includes('No Carrinho'));
});

test('toUrlSafeBase64 and fromUrlSafeBase64 correctly encode and decode UTF-8 JSON', async () => {
  const { toUrlSafeBase64, fromUrlSafeBase64 } = await import('./exportUtils');
  const payload = JSON.stringify({
    name: 'Churrasco com Picanha & Cerveja',
    budget: 350.5,
    items: [{ name: 'Feijão Carioca', price: 8.99 }],
  });

  const encoded = toUrlSafeBase64(payload);
  // Ensure no +, /, or = characters that can corrupt URLs
  assert.ok(!encoded.includes('+'));
  assert.ok(!encoded.includes('/'));
  assert.ok(!encoded.includes('='));

  const decoded = fromUrlSafeBase64(encoded);
  assert.equal(decoded, payload);
});
