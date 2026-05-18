import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './store';
import type { TextElement } from './types';

describe('Step 6 Canvas Interaction & Transform Tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
  });

  it('单测：变换回写逻辑可正确更新对应元素字段', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'Interactive Text',
    });

    const elementsBefore = useEditorStore.getState().elements;
    const elId = elementsBefore[0].id;

    // 1. Simulate drag writing back to state
    useEditorStore.getState().updateElement(elId, { x: 150, y: 220 });

    let el = useEditorStore.getState().elements[0] as TextElement;
    expect(el.x).toBe(150);
    expect(el.y).toBe(220);

    // 2. Simulate resize writing back to state
    useEditorStore.getState().updateElement(elId, { scaleX: 1.5, scaleY: 1.5 });

    el = useEditorStore.getState().elements[0] as TextElement;
    expect(el.scaleX).toBe(1.5);
    expect(el.scaleY).toBe(1.5);

    // 3. Simulate rotate writing back to state
    useEditorStore.getState().updateElement(elId, { rotation: 45 });

    el = useEditorStore.getState().elements[0] as TextElement;
    expect(el.rotation).toBe(45);
  });

  it('单测：连续变换采用 skipHistory = true 不写入历史栈，仅在交互结束时记录一次历史', () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: 'History Text',
    });

    const elId = useEditorStore.getState().elements[0].id;

    // Clear past history that was created by addElement
    useEditorStore.setState({ past: [] });
    expect(useEditorStore.getState().past).toHaveLength(0);

    // 1. Drag move starts (continuous dragging skips history)
    useEditorStore.getState().updateElement(elId, { x: 10, y: 20 }, true);
    useEditorStore.getState().updateElement(elId, { x: 20, y: 40 }, true);
    useEditorStore.getState().updateElement(elId, { x: 30, y: 60 }, true);

    // Verify elements are updated but history remains completely empty
    let currentElements = useEditorStore.getState().elements;
    expect(currentElements[0].x).toBe(30);
    expect(currentElements[0].y).toBe(60);
    expect(useEditorStore.getState().past).toHaveLength(0);

    // 2. Drag interaction ends (mouseup writes history once)
    useEditorStore.getState().updateElement(elId, { x: 35, y: 70 }, false);

    // Verify final state is saved AND exactly 1 history step is pushed!
    currentElements = useEditorStore.getState().elements;
    expect(currentElements[0].x).toBe(35);
    expect(currentElements[0].y).toBe(70);
    expect(useEditorStore.getState().past).toHaveLength(1);

    // The history snapshot contains the state before the drag ended (where x was 30)
    expect(useEditorStore.getState().past[0].elements[0].x).toBe(30);
  });
});
