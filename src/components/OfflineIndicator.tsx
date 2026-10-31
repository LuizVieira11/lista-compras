/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 inset-x-4 max-w-sm mx-auto z-50 flex items-center justify-center gap-2 rounded-2xl bg-amber-600/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline — Suas listas e dados salvos continuam disponíveis!</span>
    </div>
  );
};
