import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isDialogOpen: false,
  isQuizOpen: false,
  isGlossaryOpen: false,
  isInventoryOpen: false,
  currentDialog: null,
  currentQuiz: null,

  // Dialog actions
  toggleDialog: (isOpen, dialog = null) =>
    set((state) => {
      const nextOpen = typeof isOpen === 'boolean' ? isOpen : !state.isDialogOpen;
      return {
        isDialogOpen: nextOpen,
        currentDialog: nextOpen ? (dialog ?? state.currentDialog) : null,
      };
    }),
  openDialog: (dialog) => set({ isDialogOpen: true, currentDialog: dialog }),
  closeDialog: () => set({ isDialogOpen: false, currentDialog: null }),

  // Quiz actions
  toggleQuiz: (isOpen, quiz = null) =>
    set((state) => {
      const nextOpen = typeof isOpen === 'boolean' ? isOpen : !state.isQuizOpen;
      return {
        isQuizOpen: nextOpen,
        currentQuiz: nextOpen ? (quiz ?? state.currentQuiz) : null,
      };
    }),
  openQuiz: (quiz) => set({ isQuizOpen: true, currentQuiz: quiz }),
  closeQuiz: () => set({ isQuizOpen: false, currentQuiz: null }),

  // Glossary actions
  toggleGlossary: (isOpen) =>
    set((state) => ({
      isGlossaryOpen: typeof isOpen === 'boolean' ? isOpen : !state.isGlossaryOpen,
    })),
  openGlossary: () => set({ isGlossaryOpen: true }),
  closeGlossary: () => set({ isGlossaryOpen: false }),

  // Inventory actions
  toggleInventory: (isOpen) =>
    set((state) => ({
      isInventoryOpen: typeof isOpen === 'boolean' ? isOpen : !state.isInventoryOpen,
    })),
  openInventory: () => set({ isInventoryOpen: true }),
  closeInventory: () => set({ isInventoryOpen: false }),
}));
