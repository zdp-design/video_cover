import { create } from 'zustand';
import type {
  EditorElement,
  CanvasConfig,
  ThemeColors,
  TextElement,
  StickerElement,
  BaseElement,
} from './types';
import { validateAndFilterElement } from './schema';

export type CreateElementInput =
  | (Partial<Omit<TextElement, keyof BaseElement>> &
      Partial<BaseElement> & { type: 'text' })
  | (Partial<Omit<StickerElement, keyof BaseElement>> &
      Partial<BaseElement> & { type: 'sticker' });

export interface HistoryState {
  canvas: CanvasConfig;
  theme: ThemeColors;
  elements: EditorElement[];
}

export interface EditorStore {
  canvas: CanvasConfig;
  theme: ThemeColors;
  elements: EditorElement[];
  selection: string | null;

  // History Stacks (MVP max 50 steps, FIFO)
  past: HistoryState[];
  future: HistoryState[];

  // Actions
  setCanvasSize: (width: number, height: number) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setTheme: (theme: ThemeColors) => void;

  addElement: (element: CreateElementInput) => void;
  removeElement: (id: string) => void;
  updateElement: (
    id: string,
    updates: Partial<EditorElement>,
    skipHistory?: boolean,
  ) => void;

  selectElement: (id: string | null) => void;

  bringToFront: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  sendToBack: (id: string) => void;

  undo: () => void;
  redo: () => void;

  // Import
  importElements: (elements: unknown[]) => void;
  resetStore: () => void;
}

const DEFAULT_CANVAS: CanvasConfig = {
  width: 1080,
  height: 1920,
  backgroundColor: '#ffffff',
};

const MAX_HISTORY = 50;

function createHistorySnapshot(state: EditorStore): HistoryState {
  return {
    canvas: { ...state.canvas },
    theme: { ...state.theme },
    elements: state.elements.map((el) => ({ ...el })),
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvas: { ...DEFAULT_CANVAS },
  theme: {},
  elements: [],
  selection: null,
  past: [],
  future: [],

  setCanvasSize: (width, height) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      canvas: { ...state.canvas, width, height },
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  setCanvasBackgroundColor: (backgroundColor) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      canvas: { ...state.canvas, backgroundColor },
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  setTheme: (theme) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      theme,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  addElement: (input) => {
    const snap = createHistorySnapshot(get());

    // Generate complete defaults for base fields
    const baseDefaults: BaseElement = {
      id: input.id || `el_${Math.random().toString(36).substring(2, 9)}`,
      type: input.type,
      name: input.name || (input.type === 'text' ? '文本元素' : '贴纸元素'),
      x: input.x ?? 0,
      y: input.y ?? 0,
      width: input.width ?? (input.type === 'text' ? 200 : 100),
      height: input.height ?? (input.type === 'text' ? 50 : 100),
      rotation: input.rotation ?? 0,
      scaleX: input.scaleX ?? 1,
      scaleY: input.scaleY ?? 1,
      opacity: input.opacity ?? 1,
      visible: input.visible ?? true,
      locked: input.locked ?? false,
      zIndex: input.zIndex ?? get().elements.length,
    };

    if (input.styleRef) {
      baseDefaults.styleRef = input.styleRef;
    }

    let fullElement: EditorElement;

    if (input.type === 'text') {
      const textInput = input as Omit<TextElement, keyof BaseElement> &
        Partial<BaseElement>;
      fullElement = {
        ...baseDefaults,
        type: 'text',
        content: textInput.content || '请输入文本',
        fontFamily: textInput.fontFamily || 'sans-serif',
        fontSize: textInput.fontSize || 40,
        fontWeight: textInput.fontWeight || 'normal',
        lineHeight: textInput.lineHeight || 1.2,
        textAlign: textInput.textAlign || 'left',
        fill: textInput.fill || '#000000',
      };
    } else {
      const stickerInput = input as Omit<StickerElement, keyof BaseElement> &
        Partial<BaseElement>;
      fullElement = {
        ...baseDefaults,
        type: 'sticker',
        assetId: stickerInput.assetId || '',
        assetType: stickerInput.assetType || 'svg',
        assetSource: stickerInput.assetSource || '',
      };
    }

    set((state) => ({
      elements: [...state.elements, fullElement],
      selection: fullElement.id, // Auto-select on creation
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  removeElement: (id) => {
    const snap = createHistorySnapshot(get());
    set((state) => {
      const filteredElements = state.elements.filter((el) => el.id !== id);
      const isSelected = state.selection === id;
      return {
        elements: filteredElements,
        selection: isSelected ? null : state.selection, // Correct rollback
        past: [...state.past, snap].slice(-MAX_HISTORY),
        future: [],
      };
    });
  },

  updateElement: (id, updates, skipHistory = false) => {
    if (skipHistory) {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as EditorElement) : el,
        ),
      }));
    } else {
      const snap = createHistorySnapshot(get());
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as EditorElement) : el,
        ),
        past: [...state.past, snap].slice(-MAX_HISTORY),
        future: [],
      }));
    }
  },

  selectElement: (id) => {
    set((state) => {
      if (id === null) {
        return { selection: null };
      }
      const exists = state.elements.some((el) => el.id === id);
      return {
        selection: exists ? id : null, // Rollback to null if not exists
      };
    });
  },

  bringToFront: (id) => {
    const { elements } = get();
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1 || index === elements.length - 1) return;

    const snap = createHistorySnapshot(get());
    const newElements = [...elements];
    const [target] = newElements.splice(index, 1);
    newElements.push(target);

    const updatedElements = newElements.map((el, idx) => ({
      ...el,
      zIndex: idx,
    }));

    set(() => ({
      elements: updatedElements,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  bringForward: (id) => {
    const { elements } = get();
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1 || index === elements.length - 1) return;

    const snap = createHistorySnapshot(get());
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index + 1];
    newElements[index + 1] = temp;

    const updatedElements = newElements.map((el, idx) => ({
      ...el,
      zIndex: idx,
    }));

    set(() => ({
      elements: updatedElements,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  sendBackward: (id) => {
    const { elements } = get();
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1 || index === 0) return;

    const snap = createHistorySnapshot(get());
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index - 1];
    newElements[index - 1] = temp;

    const updatedElements = newElements.map((el, idx) => ({
      ...el,
      zIndex: idx,
    }));

    set(() => ({
      elements: updatedElements,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  sendToBack: (id) => {
    const { elements } = get();
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1 || index === 0) return;

    const snap = createHistorySnapshot(get());
    const newElements = [...elements];
    const [target] = newElements.splice(index, 1);
    newElements.unshift(target);

    const updatedElements = newElements.map((el, idx) => ({
      ...el,
      zIndex: idx,
    }));

    set(() => ({
      elements: updatedElements,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnap = createHistorySnapshot(get());

    set((state) => ({
      canvas: previous.canvas,
      theme: previous.theme,
      elements: previous.elements,
      selection:
        state.selection &&
        previous.elements.some((el) => el.id === state.selection)
          ? state.selection
          : null,
      past: newPast,
      future: [currentSnap, ...future].slice(-MAX_HISTORY),
    }));
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnap = createHistorySnapshot(get());

    set((state) => ({
      canvas: next.canvas,
      theme: next.theme,
      elements: next.elements,
      selection:
        state.selection && next.elements.some((el) => el.id === state.selection)
          ? state.selection
          : null,
      past: [...past, currentSnap].slice(-MAX_HISTORY),
      future: newFuture,
    }));
  },

  importElements: (rawElements) => {
    const snap = createHistorySnapshot(get());
    const validElements: EditorElement[] = [];

    rawElements.forEach((raw) => {
      const validated = validateAndFilterElement(raw);
      if (validated) {
        validElements.push(validated);
      }
    });

    set(() => ({
      elements: validElements,
      selection: null,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  resetStore: () => {
    set({
      canvas: { ...DEFAULT_CANVAS },
      theme: {},
      elements: [],
      selection: null,
      past: [],
      future: [],
    });
  },
}));
