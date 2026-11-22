import { create } from 'zustand';

export const useInventoryStore = create((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      if (state.items.some((i) => i.code === item.code)) {
        return state;
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (code) =>
    set((state) => ({
      items: state.items.filter((i) => i.code !== code),
    })),

  hasItem: (code) => {
    return get().items.some((i) => i.code === code);
  },

  setItems: (items) => set({ items }),

  clearInventory: () => set({ items: [] }),
}));
