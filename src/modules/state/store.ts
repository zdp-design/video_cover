import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  EditorElement,
  CanvasConfig,
  ThemeColors,
  TextElement,
  StickerElement,
  ShapeElement,
  BaseElement,
} from './types';
import { validateAndFilterElement } from './schema';
import type { ValidTemplate } from '../templates/schema';
import { saveDraft, loadDraft } from '../storage/draft';
import {
  saveCustomTemplate,
  loadCustomTemplates,
  deleteCustomTemplate,
} from '../storage/template';
import { THEME_PRESETS, buildColorReplaceMap } from '../themes/registry';

export type CreateElementInput =
  | (Partial<Omit<TextElement, keyof BaseElement>> &
      Partial<BaseElement> & { type: 'text' })
  | (Partial<Omit<StickerElement, keyof BaseElement>> &
      Partial<BaseElement> & { type: 'sticker' })
  | (Partial<Omit<ShapeElement, keyof BaseElement>> &
      Partial<BaseElement> & { type: 'shape' });

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
  isDirty: boolean;
  currentTemplateName: string | null;

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
  applyTemplate: (template: ValidTemplate, isCustomTemplate?: boolean) => void;
  applyTheme: (themeId: string) => void;
  saveDraftSnapshot: () => void;
  autoSave: () => void;
  restoreFromDraft: () => Promise<boolean>;
  saveAsCustomTemplate: (name: string) => Promise<boolean>;
  loadCustomTemplates: () => Promise<unknown[]>;
  deleteCustomTemplate: (id: string) => Promise<boolean>;
  resetStore: () => void;
}

const DEFAULT_CANVAS: CanvasConfig = {
  width: 1080,
  height: 1920,
  backgroundColor: '#ffffff',
};

const MAX_HISTORY = 50; // MVP: max 50 undo steps to limit memory usage (FIFO queue)

// Performance: debounce timer for autoSave to avoid excessive IndexedDB writes
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second debounce for auto-save

function createHistorySnapshot(state: EditorStore): HistoryState {
  return {
    canvas: { ...state.canvas },
    theme: { ...state.theme },
    elements: state.elements.map((el) => ({ ...el })),
  };
}

// Optimized selector hooks using zustand/shallow for array comparisons
// These prevent unnecessary re-renders when elements/selection hasn't changed
export const useCanvasSelector = () =>
  useEditorStore((state) => state.canvas);
export const useElementsSelector = () =>
  useEditorStore((state) => state.elements);
export const useSelectionSelector = () =>
  useEditorStore((state) => state.selection);

export const useEditorStoreShallow = () =>
  useEditorStore(
    useShallow((state) => ({
      canvas: state.canvas,
      theme: state.theme,
      elements: state.elements,
      selection: state.selection,
      isDirty: state.isDirty,
      currentTemplateName: state.currentTemplateName,
      past: state.past,
      future: state.future,
    })),
  );

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvas: { ...DEFAULT_CANVAS },
  theme: {},
  elements: [],
  selection: null,
  isDirty: false,
  currentTemplateName: null,
  past: [],
  future: [],

  setCanvasSize: (width, height) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      canvas: { ...state.canvas, width, height },
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
  },

  setCanvasBackgroundColor: (backgroundColor) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      canvas: { ...state.canvas, backgroundColor },
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
  },

  setTheme: (theme) => {
    const snap = createHistorySnapshot(get());
    set((state) => ({
      theme,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
  },

  addElement: (input) => {
    const snap = createHistorySnapshot(get());

    // Generate complete defaults for base fields
    const baseDefaults: BaseElement = {
      id: input.id || crypto.randomUUID(),
      type: input.type,
      name:
        input.name ||
        (input.type === 'text'
          ? '文本元素'
          : input.type === 'sticker'
            ? '贴纸元素'
            : '图形元素'),
      x: input.x ?? 0,
      y: input.y ?? 0,
      width:
        input.width ??
        (input.type === 'text' ? 200 : input.type === 'sticker' ? 100 : 150),
      height:
        input.height ??
        (input.type === 'text' ? 50 : input.type === 'sticker' ? 100 : 150),
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
        // Step 14 advanced styles
        strokeColor: textInput.strokeColor,
        strokeWidth: textInput.strokeWidth,
        shadowColor: textInput.shadowColor,
        shadowBlur: textInput.shadowBlur,
        shadowOffsetX: textInput.shadowOffsetX,
        shadowOffsetY: textInput.shadowOffsetY,
        letterSpacing: textInput.letterSpacing,
      };
    } else if (input.type === 'sticker') {
      const stickerInput = input as Omit<StickerElement, keyof BaseElement> &
        Partial<BaseElement>;
      fullElement = {
        ...baseDefaults,
        type: 'sticker',
        assetId: stickerInput.assetId || '',
        assetType: stickerInput.assetType || 'svg',
        assetSource: stickerInput.assetSource || '',
      };
    } else {
      const shapeInput = input as Omit<ShapeElement, keyof BaseElement> &
        Partial<BaseElement>;
      fullElement = {
        ...baseDefaults,
        type: 'shape',
        shapeType: shapeInput.shapeType || 'rect',
        fill: shapeInput.fill || '#e8e8e8',
        stroke: shapeInput.stroke || '#d9d9d9',
        strokeWidth: shapeInput.strokeWidth ?? 1,
        cornerRadius: shapeInput.cornerRadius ?? 0,
      };
    }

    set((state) => ({
      elements: [...state.elements, fullElement],
      selection: fullElement.id,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
  },

  removeElement: (id) => {
    const snap = createHistorySnapshot(get());
    set((state) => {
      const filteredElements = state.elements.filter((el) => el.id !== id);
      const isSelected = state.selection === id;
      return {
        elements: filteredElements,
        selection: isSelected ? null : state.selection,
        past: [...state.past, snap].slice(-MAX_HISTORY),
        future: [],
        isDirty: true,
      };
    });
    get().autoSave();
  },

  updateElement: (id, updates, skipHistory = false) => {
    if (skipHistory) {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as EditorElement) : el,
        ),
        isDirty: true,
      }));
    } else {
      const snap = createHistorySnapshot(get());
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as EditorElement) : el,
        ),
        past: [...state.past, snap].slice(-MAX_HISTORY),
        future: [],
        isDirty: true,
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

    set((state) => ({
      elements: updatedElements,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
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

    set((state) => ({
      elements: updatedElements,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
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

    set((state) => ({
      elements: updatedElements,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
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

    set((state) => ({
      elements: updatedElements,
      past: [...state.past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
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
      isDirty: true,
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
      isDirty: true,
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
      selection: validElements.length > 0 ? validElements[0].id : null,
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
  },

  applyTemplate: (template, _isCustomTemplate = false) => {
    set(() => ({
      canvas: { ...template.canvas },
      theme: { ...template.theme },
      elements: template.elements.map((element) => ({ ...element })),
      selection: null,
      past: [],
      future: [],
      isDirty: false,
      currentTemplateName: template.meta.name,
    }));
  },

  applyTheme: (themeId: string) => {
    const preset = THEME_PRESETS.find((t) => t.id === themeId);
    if (!preset) return;

    const snap = createHistorySnapshot(get());
    const { theme: oldTheme, elements: oldElements, canvas: oldCanvas } = get();
    const newTheme = {
      primary: preset.colors.primary,
      accent: preset.colors.accent,
      text: preset.colors.text,
      background: preset.colors.background,
    };

    const colorMap = buildColorReplaceMap(oldTheme, newTheme);
    if (colorMap.size === 0) return; // No change

    const newElements: EditorElement[] = oldElements.map((el) => {
      if (el.type === 'text') {
        const t = el as TextElement;
        let changed = false;
        const replacements: Partial<TextElement> = {};
        if (colorMap.has(t.fill)) {
          replacements.fill = colorMap.get(t.fill)!;
          changed = true;
        }
        if (t.strokeColor && colorMap.has(t.strokeColor)) {
          replacements.strokeColor = colorMap.get(t.strokeColor)!;
          changed = true;
        }
        return changed ? ({ ...el, ...replacements } as EditorElement) : el;
      } else if (el.type === 'shape') {
        const s = el as ShapeElement;
        let changed = false;
        const replacements: Partial<ShapeElement> = {};
        if (colorMap.has(s.fill)) {
          replacements.fill = colorMap.get(s.fill)!;
          changed = true;
        }
        if (colorMap.has(s.stroke)) {
          replacements.stroke = colorMap.get(s.stroke)!;
          changed = true;
        }
        return changed ? ({ ...el, ...replacements } as EditorElement) : el;
      }
      return el;
    });

    const newBg = colorMap.has(oldCanvas.backgroundColor)
      ? colorMap.get(oldCanvas.backgroundColor)!
      : oldCanvas.backgroundColor;

    set(() => ({
      elements: newElements,
      theme: newTheme,
      canvas: { ...oldCanvas, backgroundColor: newBg },
      past: [...get().past, snap].slice(-MAX_HISTORY),
      future: [],
      isDirty: true,
    }));
    get().autoSave();
  },

  saveDraftSnapshot: () => {
    // Cancel any pending debounced auto-save
    if (autoSaveTimer !== null) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    const state = get();
    saveDraft({
      canvas: state.canvas,
      theme: state.theme,
      elements: state.elements,
      selection: state.selection,
      savedAt: new Date().toISOString(),
    }).then((saved) => {
      if (!saved) {
        console.warn(
          '[草稿保存] IndexedDB 不可用或存储已满。编辑内容将不会自动保存。',
        );
      }
    });
    set(() => ({ isDirty: false }));
  },

  // Auto-save: persists to IndexedDB for crash recovery WITHOUT resetting isDirty.
  // isDirty tracks explicit saves; auto-save is invisible to the dirty flag.
  // Uses debouncing to avoid excessive IndexedDB writes during rapid interactions.
  autoSave: () => {
    // Cancel any existing debounced auto-save
    if (autoSaveTimer !== null) {
      clearTimeout(autoSaveTimer);
    }
    // Debounce the actual save operation
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null;
      const state = get();
      saveDraft({
        canvas: state.canvas,
        theme: state.theme,
        elements: state.elements,
        selection: state.selection,
        savedAt: new Date().toISOString(),
      }).then((saved) => {
        if (!saved) {
          console.warn(
            '[自动保存] IndexedDB 不可用或存储已满。上次编辑可能无法恢复。',
          );
        }
      });
    }, AUTO_SAVE_DEBOUNCE_MS);
  },

  restoreFromDraft: async () => {
    try {
      const draft = await loadDraft();
      if (!draft) return false;
      // Cancel any pending debounced auto-save on restore
      if (autoSaveTimer !== null) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      set({
        canvas: draft.canvas as EditorStore['canvas'],
        theme: draft.theme as EditorStore['theme'],
        elements: draft.elements as EditorStore['elements'],
        selection: draft.selection,
        isDirty: false,
        currentTemplateName: null,
        past: [] as EditorStore['past'],
        future: [] as EditorStore['future'],
      });
      return true;
    } catch (err) {
      // IndexedDB 读取失败时，以空白画布启动，不阻断用户操作
      console.warn('[草稿恢复] 读取失败，将以空白画布启动:', err);
      return false;
    }
  },

  saveAsCustomTemplate: async (name: string) => {
    const state = get();
    const template: ValidTemplate = {
      version: 1,
      meta: {
        id: `custom-${crypto.randomUUID()}`,
        name,
        category: 'ecommerce',
        thumbnail: '',
        author: 'user',
        updatedAt: new Date().toISOString(),
      },
      canvas: { ...state.canvas },
      theme: { ...state.theme },
      elements: state.elements.map((el) => ({ ...el })),
    };
    return await saveCustomTemplate(name, template);
  },

  loadCustomTemplates: async () => {
    return await loadCustomTemplates();
  },

  deleteCustomTemplate: async (id: string) => {
    return await deleteCustomTemplate(id);
  },

  resetStore: () => {
    // Cancel any pending debounced auto-save on reset
    if (autoSaveTimer !== null) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    set({
      canvas: { ...DEFAULT_CANVAS },
      theme: {},
      elements: [],
      selection: null,
      isDirty: false,
      currentTemplateName: null,
      past: [],
      future: [],
    });
  },
}));
