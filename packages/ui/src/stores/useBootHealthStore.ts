import { create } from 'zustand';

interface BootHealthState {
  bundleLoaded: boolean;
  apiConnected: boolean;
  sseActive: boolean;
  markBundleLoaded: () => void;
  setApiConnected: (connected: boolean) => void;
  setSseActive: (active: boolean) => void;
  reset: () => void;
}

export const useBootHealthStore = create<BootHealthState>((set) => ({
  bundleLoaded: false,
  apiConnected: false,
  sseActive: false,
  markBundleLoaded: () => {
    set({ bundleLoaded: true });
  },
  setApiConnected: (connected) => {
    set({ apiConnected: connected });
  },
  setSseActive: (active) => {
    set({ sseActive: active });
  },
  reset: () => {
    set({
      bundleLoaded: false,
      apiConnected: false,
      sseActive: false,
    });
  },
}));
