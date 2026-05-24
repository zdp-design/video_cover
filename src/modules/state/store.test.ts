import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from './store';
import type { CreateElementInput } from './store';
import type { TextElement } from './types';

describe('Editor Store', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
    vi.restoreAllMocks();
  });

  it('状态层单测：元素新增后默认字段齐全且类型正确', () => {
    const store = useEditorStore.getState();

    // Add text element with only content
    store.addElement({
      type: 'text',
      content: 'Hello Store',
    });

    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);

    const textEl = elements[0] as TextElement;
    expect(textEl.type).toBe('text');
    expect(textEl.content).toBe('Hello Store');

    // Default base fields
    expect(textEl.id).toBeDefined();
    expect(typeof textEl.id).toBe('string');
    expect(textEl.name).toBe('文本元素');
    expect(textEl.x).toBe(0);
    expect(textEl.y).toBe(0);
    expect(textEl.width).toBe(200);
    expect(textEl.height).toBe(50);
    expect(textEl.rotation).toBe(0);
    expect(textEl.scaleX).toBe(1);
    expect(textEl.scaleY).toBe(1);
    expect(textEl.opacity).toBe(1);
    expect(textEl.visible).toBe(true);
    expect(textEl.locked).toBe(false);
    expect(textEl.zIndex).toBe(0);

    // Default text fields
    expect(textEl.fontFamily).toBe('sans-serif');
    expect(textEl.fontSize).toBe(40);
    expect(textEl.fontWeight).toBe('normal');
    expect(textEl.lineHeight).toBe(1.2);
    expect(textEl.textAlign).toBe('left');
    expect(textEl.fill).toBe('#000000');
  });

  it('状态层单测：选中、取消选中、删除已选中元素后三种场景均正确回退', () => {
    const store = useEditorStore.getState();

    store.addElement({
      type: 'text',
      content: 'Element 1',
    });
    const elId = useEditorStore.getState().elements[0].id;

    // 1. Select existing element
    useEditorStore.getState().selectElement(elId);
    expect(useEditorStore.getState().selection).toBe(elId);

    // 2. Select non-existent element -> rollbacks to null
    useEditorStore.getState().selectElement('non-existent');
    expect(useEditorStore.getState().selection).toBeNull();

    // Select again
    useEditorStore.getState().selectElement(elId);
    expect(useEditorStore.getState().selection).toBe(elId);

    // 3. Cancel selection
    useEditorStore.getState().selectElement(null);
    expect(useEditorStore.getState().selection).toBeNull();

    // Select again
    useEditorStore.getState().selectElement(elId);
    expect(useEditorStore.getState().selection).toBe(elId);

    // 4. Delete the currently selected element -> selection rollbacks to null
    useEditorStore.getState().removeElement(elId);
    expect(useEditorStore.getState().elements).toHaveLength(0);
    expect(useEditorStore.getState().selection).toBeNull();
  });

  it('状态层单测：外部输入（模板加载/草稿恢复）携带非法字段时，运行时会过滤并产生日志告警', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = useEditorStore.getState();

    const rawInput = [
      {
        id: 'el_external_1',
        type: 'text',
        content: 'Valid Content',
        invalidField: 'Should be discarded', // Whitelist filtering
        fill: '#ffffff',
      },
      {
        id: 'el_external_2',
        type: 'unsupported_type', // Unsupported type
        content: 'Fail',
      },
    ];

    store.importElements(rawInput);

    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);

    const el = elements[0] as TextElement;
    expect(el.id).toBe('el_external_1');
    expect(el.content).toBe('Valid Content');
    // Whitelisted fields are present, but extra fields are NOT
    expect(
      (el as unknown as Record<string, unknown>).invalidField,
    ).toBeUndefined();

    // Verify console.warn was called to report invalid fields/types
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('Type Tests', () => {
  it('should fail compilation if invalid fields are passed to addElement input', () => {
    const checkInput = (input: CreateElementInput) => input;

    // @ts-expect-error - extraField is not allowed in CreateElementInput
    checkInput({ type: 'text', extraField: 123, content: 'test' });

    // @ts-expect-error - fill should be string, not number
    checkInput({ type: 'text', fill: 123, content: 'test' });

    expect(true).toBe(true); // Dummy assertion to satisfy Vitest test requirement
  });
});
