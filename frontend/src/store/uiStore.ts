import { create } from 'zustand';

interface UIState {
  lang: string;
  setLang: (lang: string) => void;
  isChatOpen: boolean;
  toggleChat: (open?: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  lang: localStorage.getItem('tawsa_lang') || 'FR',
  setLang: (lang) => {
    localStorage.setItem('tawsa_lang', lang);
    set({ lang });
  },
  isChatOpen: false,
  toggleChat: (open) => set((state) => ({ isChatOpen: open !== undefined ? open : !state.isChatOpen })),
}));
