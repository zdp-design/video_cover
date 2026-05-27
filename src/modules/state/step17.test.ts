import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEditorStore } from './store';
import {
  saveLastUsedSize,
  loadLastUsedSize,
} from '../storage/preferences';

// --- preferences localStorage unit tests ---

describe('Step 17: Preferences - localStorage', () => {
  const storage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
  };

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saveLastUsedSize stores width and height in localStorage', () => {
    saveLastUsedSize(1080, 1920);
    expect(storage['video-cover:prefs:lastSize']).toBe(
      JSON.stringify({ width: 1080, height: 1920 }),
    );
  });

  it('loadLastUsedSize returns null when nothing is saved', () => {
    expect(loadLastUsedSize()).toBeNull();
  });

  it('loadLastUsedSize returns saved width and height', () => {
    storage['video-cover:prefs:lastSize'] = JSON.stringify({
      width: 1080,
      height: 1440,
    });
    const result = loadLastUsedSize();
    expect(result).toEqual({ width: 1080, height: 1440 });
  });

  it('loadLastUsedSize returns null for malformed JSON', () => {
    storage['video-cover:prefs:lastSize'] = 'not json';
    expect(loadLastUsedSize()).toBeNull();
  });

  it('loadLastUsedSize returns null for missing width/height fields', () => {
    storage['video-cover:prefs:lastSize'] = JSON.stringify({ width: 1080 });
    expect(loadLastUsedSize()).toBeNull();
  });

  it('loadLastUsedSize returns null for wrong field types', () => {
    storage['video-cover:prefs:lastSize'] = JSON.stringify({
      width: '1080',
      height: '1920',
    });
    expect(loadLastUsedSize()).toBeNull();
  });
});

// --- store autoSave / draft unit tests ---

vi.mock('../storage/draft', () => ({
  saveDraft: vi.fn().mockResolvedValue(true),
  loadDraft: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../storage/template', () => ({
  saveCustomTemplate: vi.fn().mockResolvedValue(true),
  loadCustomTemplates: vi.fn().mockResolvedValue([]),
  deleteCustomTemplate: vi.fn().mockResolvedValue(true),
}));

describe('Step 17: Store - autoSave does not reset isDirty', () => {
  beforeEach(() => {
    useEditorStore.setState({
      canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
      theme: {},
      elements: [],
      selection: null,
      isDirty: false,
      currentTemplateName: null,
      past: [],
      future: [],
    });
  });

  it('addElement sets isDirty to true, autoSave does not reset it', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test',
    });
    expect(useEditorStore.getState().isDirty).toBe(true);

    // autoSave should NOT reset isDirty
    useEditorStore.getState().autoSave();
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('removeElement sets isDirty to true, autoSave does not reset it', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test',
    });
    expect(useEditorStore.getState().isDirty).toBe(true);

    const id = useEditorStore.getState().elements[0].id;
    useEditorStore.getState().removeElement(id);
    expect(useEditorStore.getState().isDirty).toBe(true);

    useEditorStore.getState().autoSave();
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('setCanvasBackgroundColor sets isDirty to true, autoSave does not reset it', () => {
    useEditorStore.getState().setCanvasBackgroundColor('#ff0000');
    expect(useEditorStore.getState().isDirty).toBe(true);

    useEditorStore.getState().autoSave();
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('applyTheme sets isDirty to true, autoSave does not reset it', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test',
      fill: '#ff4d4f',
    });
    useEditorStore.getState().applyTheme('ecommerce_high_contrast');
    expect(useEditorStore.getState().isDirty).toBe(true);

    useEditorStore.getState().autoSave();
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('saveDraftSnapshot explicitly resets isDirty to false', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test',
    });
    expect(useEditorStore.getState().isDirty).toBe(true);

    useEditorStore.getState().saveDraftSnapshot();
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});

describe('Step 17: Store - restoreFromDraft', () => {
  beforeEach(() => {
    useEditorStore.setState({
      canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
      theme: {},
      elements: [],
      selection: null,
      isDirty: false,
      currentTemplateName: null,
      past: [],
      future: [],
    });
  });

  it('restoreFromDraft returns false when no draft exists', async () => {
    const result = await useEditorStore.getState().restoreFromDraft();
    expect(result).toBe(false);
  });

  it('restoreFromDraft returns true and restores state when draft exists', async () => {
    const { loadDraft } = await import('../storage/draft');
    vi.mocked(loadDraft).mockResolvedValueOnce({
      canvas: { width: 1080, height: 1080, backgroundColor: '#ff0000' },
      theme: { primary: '#ff0000' },
      elements: [
        {
          id: 'restored-text',
          type: 'text' as const,
          name: 'Restored Text',
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 0,
          content: 'Restored',
          fontFamily: 'sans-serif',
          fontSize: 40,
          fontWeight: 'normal',
          lineHeight: 1.2,
          textAlign: 'left',
          fill: '#000000',
        },
      ],
      selection: null,
      savedAt: new Date().toISOString(),
    });

    const result = await useEditorStore.getState().restoreFromDraft();
    expect(result).toBe(true);

    const state = useEditorStore.getState();
    expect(state.canvas.width).toBe(1080);
    expect(state.canvas.height).toBe(1080);
    expect(state.canvas.backgroundColor).toBe('#ff0000');
    expect(state.theme).toEqual({ primary: '#ff0000' });
    expect(state.elements.length).toBe(1);
    expect(state.elements[0].content).toBe('Restored');
    expect(state.isDirty).toBe(false);
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
  });

  it('restoreFromDraft does not restore history (past/future are empty)', async () => {
    // Add elements and undo history before saving draft
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test1',
    });
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test2',
    });
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().past.length).toBeGreaterThan(0);

    const { loadDraft } = await import('../storage/draft');
    vi.mocked(loadDraft).mockResolvedValueOnce({
      canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
      theme: {},
      elements: [
        {
          id: 'restored-text',
          type: 'text' as const,
          name: 'Restored',
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 0,
          content: 'Restored',
          fontFamily: 'sans-serif',
          fontSize: 40,
          fontWeight: 'normal',
          lineHeight: 1.2,
          textAlign: 'left',
          fill: '#000000',
        },
      ],
      selection: null,
      savedAt: new Date().toISOString(),
    });

    await useEditorStore.getState().restoreFromDraft();
    expect(useEditorStore.getState().past).toEqual([]);
    expect(useEditorStore.getState().future).toEqual([]);
  });
});

describe('Step 17: Store - Custom Template CRUD', () => {
  beforeEach(() => {
    useEditorStore.setState({
      canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
      theme: {},
      elements: [],
      selection: null,
      isDirty: false,
      currentTemplateName: null,
      past: [],
      future: [],
    });
  });

  it('saveAsCustomTemplate calls storage saveCustomTemplate with correct data', async () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'test',
    });

    const { saveCustomTemplate } = await import('../storage/template');
    const result = await useEditorStore.getState().saveAsCustomTemplate('My Template');
    expect(result).toBe(true);
    expect(saveCustomTemplate).toHaveBeenCalledTimes(1);
    const [name, template] = vi.mocked(saveCustomTemplate).mock.calls[0];
    expect(name).toBe('My Template');
    expect(template.meta.name).toBe('My Template');
    expect(template.meta.author).toBe('user');
    expect(template.elements.length).toBe(1);
  });

  it('loadCustomTemplates returns list from storage', async () => {
    const { loadCustomTemplates } = await import('../storage/template');
    vi.mocked(loadCustomTemplates).mockResolvedValueOnce([
      { id: 't1', name: 'Template 1', savedAt: '2024-01-01', template: {} as never },
      { id: 't2', name: 'Template 2', savedAt: '2024-01-02', template: {} as never },
    ]);

    const result = (await useEditorStore.getState().loadCustomTemplates()) as {
      id: string;
      name: string;
    }[];
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Template 1');
    expect(result[1].name).toBe('Template 2');
  });

  it('deleteCustomTemplate calls storage deleteCustomTemplate', async () => {
    const { deleteCustomTemplate } = await import('../storage/template');
    const result = await useEditorStore.getState().deleteCustomTemplate('t1');
    expect(result).toBe(true);
    expect(deleteCustomTemplate).toHaveBeenCalledWith('t1');
  });

  it('applyTemplate with isCustomTemplate=true keeps currentTemplateName', () => {
    useEditorStore.getState().applyTemplate(
      {
        version: 1,
        meta: {
          id: 'custom-1',
          name: 'Custom Name',
          category: 'ecommerce',
          thumbnail: '',
          author: 'user',
          updatedAt: new Date().toISOString(),
        },
        canvas: { width: 1080, height: 1920, backgroundColor: '#fff' },
        theme: {},
        elements: [],
      },
      true,
    );
    expect(useEditorStore.getState().currentTemplateName).toBe('Custom Name');
  });

  it('applyTemplate with isCustomTemplate=false keeps currentTemplateName', () => {
    useEditorStore.getState().applyTemplate(
      {
        version: 1,
        meta: {
          id: 'builtin-1',
          name: 'Built-in',
          category: 'ecommerce',
          thumbnail: '',
          author: 'author',
          updatedAt: new Date().toISOString(),
        },
        canvas: { width: 1080, height: 1920, backgroundColor: '#fff' },
        theme: {},
        elements: [],
      },
      false,
    );
    expect(useEditorStore.getState().currentTemplateName).toBe('Built-in');
  });
});