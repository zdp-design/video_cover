import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './store';
import type { TextElement } from './types';
import { validateAndFilterElement } from './schema';

describe('Step 5 Text Elements tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
  });

  it('单测：文本元素创建后字段完整', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: '测试文本',
    });

    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);

    const el = elements[0] as TextElement;
    expect(el.id).toBeDefined();
    expect(el.type).toBe('text');
    expect(el.name).toBe('文本元素');
    expect(el.x).toBe(0);
    expect(el.y).toBe(0);
    expect(el.width).toBe(200);
    expect(el.height).toBe(50);
    expect(el.rotation).toBe(0);
    expect(el.scaleX).toBe(1);
    expect(el.scaleY).toBe(1);
    expect(el.opacity).toBe(1);
    expect(el.visible).toBe(true);
    expect(el.locked).toBe(false);
    expect(el.zIndex).toBe(0);
    expect(el.content).toBe('测试文本');
    expect(el.fontFamily).toBe('sans-serif');
    expect(el.fontSize).toBe(40);
    expect(el.fontWeight).toBe('normal');
    expect(el.lineHeight).toBe(1.2);
    expect(el.textAlign).toBe('left');
    expect(el.fill).toBe('#000000');
  });

  it('单测：主标题/副标题创建后默认样式值符合预设定义', () => {
    // 1. Add Main Title (using style values from LeftPanel.tsx)
    useEditorStore.getState().addElement({
      type: 'text',
      name: '主标题',
      x: 90,
      y: 200,
      width: 900,
      height: 120,
      content: '主标题',
      fontSize: 80,
      fontWeight: 'bold',
      lineHeight: 1.2,
      textAlign: 'center',
      fill: '#000000',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    });

    let elements = useEditorStore.getState().elements;
    const mainTitle = elements[0] as TextElement;
    expect(mainTitle.fontSize).toBe(80);
    expect(mainTitle.fontWeight).toBe('bold');
    expect(mainTitle.lineHeight).toBe(1.2);
    expect(mainTitle.textAlign).toBe('center');
    expect(mainTitle.fill).toBe('#000000');
    expect(mainTitle.content).toBe('主标题');

    // 2. Add Subtitle (using style values from LeftPanel.tsx)
    useEditorStore.getState().addElement({
      type: 'text',
      name: '副标题',
      x: 90,
      y: 350,
      width: 900,
      height: 80,
      content: '副标题',
      fontSize: 40,
      fontWeight: 'normal',
      lineHeight: 1.3,
      textAlign: 'center',
      fill: '#666666',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    });

    elements = useEditorStore.getState().elements;
    const subTitle = elements[1] as TextElement;
    expect(subTitle.fontSize).toBe(40);
    expect(subTitle.fontWeight).toBe('normal');
    expect(subTitle.lineHeight).toBe(1.3);
    expect(subTitle.textAlign).toBe('center');
    expect(subTitle.fill).toBe('#666666');
    expect(subTitle.content).toBe('副标题');
  });

  it('单测：高级文本字段（描边/阴影）在 schema 中被正确保留（Step 14 扩展）', () => {
    // Step 14 added stroke/shadow as supported advanced text fields.
    // Schema should now preserve them, not discard them.
    const rawExternalInput = {
      id: 'el_advanced_1',
      type: 'text',
      content: 'Advanced Text',
      strokeColor: '#ff0000',
      strokeWidth: 4,
      shadowColor: '#000000',
      shadowBlur: 10,
    };

    const validated = validateAndFilterElement(rawExternalInput);
    expect(validated).not.toBeNull();
    if (validated) {
      expect((validated as TextElement).content).toBe('Advanced Text');
      // Step 14 advanced fields should now be preserved
      expect((validated as TextElement).strokeColor).toBe('#ff0000');
      expect((validated as TextElement).strokeWidth).toBe(4);
      expect((validated as TextElement).shadowColor).toBe('#000000');
      expect((validated as TextElement).shadowBlur).toBe(10);
    }

    // Manually injected advanced fields also work via store
    useEditorStore.getState().resetStore();
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'Manual Advanced Text',
      strokeColor: '#ff0000',
      strokeWidth: 4,
    } as unknown as import('./store').CreateElementInput);

    const elements = useEditorStore.getState().elements;
    const manualEl = elements[0] as TextElement;
    expect(manualEl.content).toBe('Manual Advanced Text');
    expect(manualEl.strokeColor).toBe('#ff0000');
    expect(manualEl.strokeWidth).toBe(4);
    expect(manualEl.fontSize).toBe(40);
    expect(manualEl.fill).toBe('#000000');
  });
});
