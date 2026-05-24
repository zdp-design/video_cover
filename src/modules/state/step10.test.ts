import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_TEMPLATES } from '../templates/builtins';
import { validateTemplateSchema } from '../templates/schema';
import { useEditorStore } from './store';

// Mock the draft module to avoid IndexedDB in tests
vi.mock('../storage/draft', () => ({
  saveDraft: vi.fn().mockResolvedValue(true),
  loadDraft: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(true),
}));

describe('Step 10 - Template System', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
    vi.restoreAllMocks();
  });

  it('模板 JSON 通过 schema 校验（字段完整、类型正确）', () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(3);
    BUILTIN_TEMPLATES.forEach((template) => {
      const validated = validateTemplateSchema(template);
      expect(validated).not.toBeNull();
      expect(validated?.elements.length).toBeGreaterThan(0);
    });
  });

  it('套用模板后 canvas/theme/elements 与模板一致；旧画布元素被清空', () => {
    const store = useEditorStore.getState();

    store.addElement({ type: 'text', content: 'old element' });
    expect(useEditorStore.getState().elements).toHaveLength(1);

    const parsed = validateTemplateSchema(BUILTIN_TEMPLATES[0]);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    store.applyTemplate(parsed);

    const state = useEditorStore.getState();
    expect(state.canvas).toEqual(parsed.canvas);
    expect(state.theme).toEqual(parsed.theme);
    expect(state.elements).toEqual(parsed.elements);
    expect(
      state.elements.find(
        (el) => el.type === 'text' && el.content === 'old element',
      ),
    ).toBeUndefined();
    expect(state.isDirty).toBe(false);
  });

  it('未保存改动场景：保存草稿后覆盖会写入草稿并完成覆盖', async () => {
    const store = useEditorStore.getState();
    store.addElement({ type: 'text', content: 'dirty content' });
    expect(useEditorStore.getState().isDirty).toBe(true);

    store.saveDraftSnapshot();

    // Wait for async saveDraft to be called
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { saveDraft } = await import('../storage/draft');
    expect(saveDraft).toHaveBeenCalled();

    const parsed = validateTemplateSchema(BUILTIN_TEMPLATES[1]);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    store.applyTemplate(parsed);
    expect(useEditorStore.getState().elements).toEqual(parsed.elements);
  });
});
