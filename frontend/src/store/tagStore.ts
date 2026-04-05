import { create } from 'zustand';
import type { TagData } from '../types/mp3File';
import type { TagDiffResult } from '../types/musicbrainz';

interface TagStore {
  pendingEdits: Record<string, TagData>;
  lastDiff: TagDiffResult[];
  setPendingEdit: (fileId: string, tags: TagData) => void;
  clearPending: () => void;
  setDiff: (diff: TagDiffResult[]) => void;
}

export const useTagStore = create<TagStore>((set) => ({
  pendingEdits: {},
  lastDiff: [],
  setPendingEdit: (fileId, tags) =>
    set((s) => ({ pendingEdits: { ...s.pendingEdits, [fileId]: tags } })),
  clearPending: () => set({ pendingEdits: {} }),
  setDiff: (diff) => set({ lastDiff: diff }),
}));
