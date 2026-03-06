import { createWebAPIs } from './api';
import { registerSW } from 'virtual:pwa-register';

import type { RuntimeAPIs } from '@kronoscode-ai/ui/lib/api/types';
import '@kronoscode-ai/ui/index.css';
import '@kronoscode-ai/ui/styles/fonts';

declare global {
  interface Window {
    __KRONOSCHAMBER_RUNTIME_APIS__?: RuntimeAPIs;
    __OPENCHAMBER_RUNTIME_APIS__?: RuntimeAPIs;
  }
}

const runtimeApis = createWebAPIs();
window.__KRONOSCHAMBER_RUNTIME_APIS__ = runtimeApis;
window.__OPENCHAMBER_RUNTIME_APIS__ = runtimeApis;

registerSW({
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    if (!registration) {
      return;
    }

    // Periodic update check (best-effort)
    setInterval(() => {
      void registration.update();
    }, 60 * 60 * 1000);
  },
  onRegisterError(error: unknown) {
    console.warn('[PWA] service worker registration failed:', error);
  },
});

import('@kronoscode-ai/ui/main');
