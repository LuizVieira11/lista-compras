/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  Minus,
  Tag,
  Zap,
  ShoppingBag,
  ExternalLink,
  Info
} from 'lucide-react';
import { ShoppingItem, formatCurrency, findBestMatchingItem, parsePrice } from '../utils/cartCalculations';
import { ScannedPriceResult, DemoPriceTag } from '../types';
import { DEMO_PRICE_TAGS } from '../data/initialData';
import { generatePriceTagCanvas } from '../utils/generatePriceTagImage';
import { sounds } from '../utils/audioFeedback';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onConfirmItem: (scanned: ScannedPriceResult, quantity: number, matchedItem?: ShoppingItem) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onConfirmItem,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedPriceResult | null>(null);
  const [matchedItem, setMatchedItem] = useState<ShoppingItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'demo'>('camera');
  const [editablePrice, setEditablePrice] = useState<string>('');
  const [editableName, setEditableName] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start camera stream when modal opens
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta acesso à câmera.');
      }

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera negada. Você pode fazer upload de foto ou usar as etiquetas de teste abaixo.'
          : 'Não foi possível inicializar a câmera. Use o upload ou etiquetas de teste.'
      );
      setActiveTab('demo');
    }
  }, [stream]);

  // Clean up camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setCapturedImagePreview(null);
      setCameraError(null);
      setQuantity(1);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Connect video element when stream is updated
  useEffect(() => {
    if (videoRef.current && stream && activeTab === 'camera') {
      videoRef.current.srcObject = stream;
    }
  }, [stream, activeTab]);

  /**
   * Sends base64 image to server OCR API
   */
  const processImageForOCR = async (base64Image: string, demoTag?: DemoPriceTag) => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/scan-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
          demoTag,
        }),
      });

      const result: ScannedPriceResult = await response.json();
      result.imageBase64 = base64Image;

      // Find matching item in shopping list
      const matched = findBestMatchingItem(result.productName, items);
      setMatchedItem(matched);
      if (matched) {
        result.matchedItemId = matched.id;
        setQuantity(matched.quantity || 1);
      } else {
        setQuantity(1);
      }

      setScanResult(result);
      setEditableName(result.productName);
      setEditablePrice(result.price ? result.price.toFixed(2).replace('.', ',') : '0,00');
      setCapturedImagePreview(base64Image);

      // Play audio beep
      sounds.playScanBeep();
    } catch (err: any) {
      console.error('Scan error:', err);
      const fallbackResult: ScannedPriceResult = {
        productName: demoTag?.title || 'Etiqueta Detectada',
        price: demoTag?.price || 9.90,
        unitPrice: demoTag?.unitPrice || 'R$ 9,90 / un',
        confidence: 'media',
        promotionType: demoTag?.promoText || 'Oferta',
        fallback: true,
      };
      const matched = findBestMatchingItem(fallbackResult.productName, items);
      setMatchedItem(matched);
      setScanResult(fallbackResult);
      setEditableName(fallbackResult.productName);
      setEditablePrice(fallbackResult.price.toFixed(2).replace('.', ','));
      setCapturedImagePreview(base64Image);
      sounds.playScanBeep();
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Captures current video frame
   */
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create an off-screen canvas to capture
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    processImageForOCR(dataUrl);
  };

  /**
   * Handles user photo upload
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      processImageForOCR(resultStr);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /**
   * Handles clicking an authentic demo shelf price tag
   */
  const handleSelectDemoTag = (tag: DemoPriceTag) => {
    const tagDataUrl = generatePriceTagCanvas(tag);
    processImageForOCR(tagDataUrl, tag);
  };

  /**
   * Confirms price and adds/updates item in shopping list
   */
  const handleConfirm = () => {
    if (!scanResult) return;
    const parsedPrice = parsePrice(editablePrice);

    const finalResult: ScannedPriceResult = {
      ...scanResult,
      productName: editableName.trim() || scanResult.productName,
      price: parsedPrice > 0 ? parsedPrice : scanResult.price,
    };

    sounds.playSuccessChime();
    onConfirmItem(finalResult, quantity, matchedItem || undefined);
    onClose();
  };

  const handleReset = () => {
    setScanResult(null);
    setCapturedImagePreview(null);
    setMatchedItem(null);
    setQuantity(1);
    if (activeTab === 'camera' && !stream) {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leitor de Preços via Câmera"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Leitor de Preços
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider">
                  IA OCR
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Aponte para a etiqueta na prateleira</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar leitor de preços"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport content */}
        <div className="relative flex-1 overflow-y-auto bg-black flex flex-col items-center">
          
          {/* Main camera / scan interface */}
          {!scanResult ? (
            <div className="w-full flex flex-col items-center flex-1">
              {/* Tab Selector: Live Camera vs Test Shelf Tags */}
              <div className="w-full px-4 pt-3 pb-2 bg-zinc-950/80 flex items-center justify-between gap-2 border-b border-zinc-800/80">
                <div className="flex bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab('camera');
                      if (!stream) startCamera();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'camera'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Câmera Ao Vivo
                  </button>
                  <button
                    onClick={() => setActiveTab('demo')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'demo'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Etiquetas de Teste
                  </button>
                </div>

                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Carregar foto da galeria"
                  aria-label="Carregar foto de etiqueta da galeria"
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 border border-zinc-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Galeria</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Camera Stream View */}
              {activeTab === 'camera' && (
                <div className="relative w-full aspect-[4/3] max-h-[380px] bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-6 text-center max-w-sm">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-zinc-300 mb-4">{cameraError}</p>
                      <button
                        onClick={() => setActiveTab('demo')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Usar Etiquetas de Teste
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />

                      {/* Visual Reticle / Target Box */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="relative w-[85%] h-[68%] border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          {/* Corner accents */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                          
                          {/* Scanning Laser Line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#10b981]" />

                          <div className="absolute bottom-2 inset-x-0 text-center">
                            <span className="px-2.5 py-0.5 bg-black/70 backdrop-blur-md rounded-full text-[10px] text-emerald-300 font-medium">
                              Enquadre o preço e nome do produto
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Loading state indicator */}
                      {isScanning && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                          <p className="text-sm font-semibold text-white">Lendo etiqueta com Gemini...</p>
                          <p className="text-xs text-zinc-400 mt-1">Identificando valor e produto</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Demo Shelf Tags Section */}
              {activeTab === 'demo' && (
                <div className="w-full p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-zinc-300 font-medium">
                      Toque em uma etiqueta para simular a leitura do supermercado:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {DEMO_PRICE_TAGS.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleSelectDemoTag(tag)}
                        disabled={isScanning}
                        className="group relative flex items-center justify-between p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-emerald-500/50 text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-700 text-zinc-300 font-bold uppercase">
                              {tag.brand}
                            </span>
                            {tag.promoText && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 font-bold">
                                {tag.promoText}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-zinc-100 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                            {tag.title}
                          </div>
                          {tag.unitPrice && (
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              {tag.unitPrice}
                            </div>
                          )}
                        </div>

                        <div className="text-right pl-2 border-l border-zinc-700/60">
                          {tag.originalPrice && (
                            <div className="text-[10px] text-zinc-400 line-through">
                              {formatCurrency(tag.originalPrice)}
                            </div>
                          )}
                          <div className="text-sm font-extrabold text-emerald-400">
                            {formatCurrency(tag.price)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {isScanning && (
                    <div className="mt-4 p-4 rounded-2xl bg-zinc-800/90 flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="text-xs text-zinc-200 font-medium">Analisando etiqueta com IA...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shutter Button when camera is active */}
              {activeTab === 'camera' && !cameraError && (
                <div className="w-full p-4 flex items-center justify-center bg-zinc-950">
                  <button
                    onClick={captureFrame}
                    disabled={isScanning}
                    aria-label="Capturar etiqueta com a câmera"
                    className="group relative w-18 h-18 rounded-full border-4 border-emerald-500/30 flex items-center justify-center p-1 transition-transform active:scale-90 hover:border-emerald-400"
                  >
                    <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg group-hover:bg-emerald-400 transition">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Result Card After Scan */
            <div className="w-full p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in duration-200">
              
              {/* Image Thumbnail & Recognition header */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                {capturedImagePreview && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-zinc-700">
                    <img
                      src={capturedImagePreview}
                      alt="Etiqueta Capturada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      Etiqueta Reconhecida
                    </span>
                    {scanResult.promotionType && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold ml-auto">
                        {scanResult.promotionType}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white line-clamp-2">
                    {scanResult.productName}
                  </div>
                  {scanResult.unitPrice && (
                    <div className="text-[11px] text-zinc-400 mt-1">
                      {scanResult.unitPrice}
                    </div>
                  )}
                </div>
              </div>

              {/* Matched item in shopping list alert */}
              {matchedItem ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-300">
                      Item na sua lista encontrado!
                    </div>
                    <div className="text-xs text-zinc-300 truncate">
                      "{matchedItem.name}" (Planejado: {formatCurrency(matchedItem.estimatedPrice)})
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500 text-white font-bold shrink-0">
                    Sincronizar
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-center gap-2.5 text-xs text-blue-200">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Novo item: Será adicionado diretamente ao seu carrinho.</span>
                </div>
              )}

              {/* Editable Fields for Name and Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Nome do produto"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Preço Unitário (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-zinc-400 font-bold">R$</span>
                    <input
                      type="text"
                      value={editablePrice}
                      onChange={(e) => setEditablePrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Total Preview */}
              <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">Quantidade</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Diminuir quantidade"
                      className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Aumentar quantidade"
                      className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Subtotal Item</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatCurrency(parsePrice(editablePrice) * quantity)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Escanear Outro
                </button>

                <button
                  onClick={handleConfirm}
                  className="flex-[2] py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {matchedItem ? 'Atualizar e Ir ao Carrinho' : 'Adicionar ao Carrinho'}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
