/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingItem } from './utils/cartCalculations';

export type Category = 
  | 'Todos'
  | 'Hortifrúti'
  | 'Padaria'
  | 'Carnes & Peixes'
  | 'Laticínios'
  | 'Mercearia'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene'
  | 'Congelados'
  | 'Outros';

export interface ShoppingList {
  id: string;
  name: string;
  icon: string;
  budget: number;
  items: ShoppingItem[];
  createdAt: string;
}

export interface ScannedPriceResult {
  productName: string;
  price: number;
  unitPrice?: string;
  originalPrice?: number;
  promotionType?: string;
  confidence?: 'alta' | 'media' | 'baixa';
  rawText?: string;
  category?: string;
  imageBase64?: string;
  fallback?: boolean;
  matchedItemId?: string;
}

export interface DemoPriceTag {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  unitPrice?: string;
  barcode: string;
  promoText?: string;
  category: Category;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pacote';
  color: string;
}
