/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DemoPriceTag } from '../types';

/**
 * Renders an authentic Brazilian supermarket shelf price tag onto a canvas
 * and returns the base64 JPEG data URL.
 */
export function generatePriceTagCanvas(tag: DemoPriceTag): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic shelf tag card
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header banner (Supermarket promotional yellow/red bar)
  ctx.fillStyle = tag.promoText ? '#dc2626' : '#2563eb';
  ctx.fillRect(0, 0, canvas.width, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(tag.promoText || 'SUPERMERCADO OFERTAS', 30, 45);

  ctx.textAlign = 'right';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('REF: ' + tag.id.toUpperCase(), canvas.width - 30, 45);

  // Product description
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'left';
  
  // Word wrap product name
  const words = tag.title.split(' ');
  let line = '';
  let y = 130;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 740 && n > 0) {
      ctx.fillText(line, 30, y);
      line = words[n] + ' ';
      y += 42;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 30, y);

  // Subtitle / Brand info
  ctx.fillStyle = '#64748b';
  ctx.font = '500 22px sans-serif';
  ctx.fillText(`Marca: ${tag.brand} • Categoria: ${tag.category}`, 30, y + 40);

  // Original price if promo
  if (tag.originalPrice) {
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`DE: R$ ${tag.originalPrice.toFixed(2).replace('.', ',')}`, 30, 310);
    // Strikethrough line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 302);
    ctx.lineTo(210, 302);
    ctx.stroke();
  }

  // Giant Price Area
  const priceParts = tag.price.toFixed(2).split('.');
  const integerPart = priceParts[0];
  const decimalPart = priceParts[1];

  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('POR', 30, 370);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText('R$', 110, 370);

  // Integer price
  ctx.font = '900 125px sans-serif';
  ctx.fillText(integerPart, 185, 395);

  const intWidth = ctx.measureText(integerPart).width;

  // Decimal comma & cents superscript
  ctx.font = '900 70px sans-serif';
  ctx.fillText(`,${decimalPart}`, 195 + intWidth, 345);

  // Unit indicator
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`cada ${tag.unit}`, 200 + intWidth, 385);

  // Unit price (small print)
  if (tag.unitPrice) {
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`(${tag.unitPrice})`, 30, 440);
  }

  // Fake barcode on the right bottom
  const barcodeX = canvas.width - 240;
  const barcodeY = 320;
  ctx.fillStyle = '#0f172a';
  
  // Draw barcode lines
  const seed = tag.barcode.split('').map(c => parseInt(c) || 1);
  let currentX = barcodeX;
  for (let i = 0; i < 40; i++) {
    const val = seed[i % seed.length];
    const barWidth = (val % 3) + 1;
    ctx.fillRect(currentX, barcodeY, barWidth, 75);
    currentX += barWidth + ((i % 4 === 0) ? 4 : 2);
  }

  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(tag.barcode, barcodeX + 100, barcodeY + 100);

  return canvas.toDataURL('image/jpeg', 0.92);
}
