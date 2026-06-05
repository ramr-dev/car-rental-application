import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedState {
  savedIds: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  clearSaved: () => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: (id) => {
        const current = get().savedIds;
        const exists = current.includes(id);
        const updated = exists ? current.filter((x) => x !== id) : [...current, id];
        set({ savedIds: updated });
      },
      isSaved: (id) => get().savedIds.includes(id),
      clearSaved: () => set({ savedIds: [] }),
    }),
    { name: "drivelux-saved" }
  )
);
