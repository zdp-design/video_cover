import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './store';

describe('Editor Store - Undo/Redo History (Step 9)', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
  });

  it('单测：基本操作（添加、删除、更新、尺寸、背景、层级）正确记录历史并清空 future 栈', () => {
    const store = useEditorStore.getState();

    // Initial state: past = [], future = [], elements = []
    expect(store.past).toHaveLength(0);
    expect(store.future).toHaveLength(0);

    // 1. Add element -> past = [initial]
    store.addElement({ type: 'text', content: 'Test Element', id: 'el0' });
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().elements).toHaveLength(1);

    // 2. Update element -> past = [initial, afterAdd]
    store.updateElement('el0', { fontSize: 60 });
    expect(useEditorStore.getState().past).toHaveLength(2);

    // 3. Set canvas size -> past = [initial, afterAdd, afterUpdate]
    store.setCanvasSize(1200, 1200);
    expect(useEditorStore.getState().past).toHaveLength(3);

    // 4. Set background color -> past = [4 steps]
    store.setCanvasBackgroundColor('#eeeeee');
    expect(useEditorStore.getState().past).toHaveLength(4);

    // 5. Undo -> reverts color, color goes to future
    store.undo();
    expect(useEditorStore.getState().past).toHaveLength(3);
    expect(useEditorStore.getState().future).toHaveLength(1);
    expect(useEditorStore.getState().canvas.backgroundColor).toBe('#ffffff');

    // 6. Making a new change (e.g. update color again) should clear the future stack
    store.setCanvasBackgroundColor('#ff0000');
    expect(useEditorStore.getState().past).toHaveLength(4);
    expect(useEditorStore.getState().future).toHaveLength(0); // cleared!
  });

  it('单测：超过 50 步后最早的历史记录按 FIFO 被正确淘汰', () => {
    const store = useEditorStore.getState();

    // Perform 60 actions of changing canvas size
    for (let i = 1; i <= 60; i++) {
      store.setCanvasSize(1000 + i, 1000 + i);
    }

    // Past stack should be capped at MAX_HISTORY = 50
    expect(useEditorStore.getState().past).toHaveLength(50);

    // The oldest history snapshot in past should be from action index 11 (the 11th change)
    // Snapshot of canvas size at step 10 should have been evicted.
    const oldestInPast = useEditorStore.getState().past[0];
    expect(oldestInPast.canvas.width).toBe(1010); // The 10th action's result is in past[0] after 60 additions (60 - 50 = 10 snapshot steps evicted)
  });

  it('单测：连续的 transient 操作在 skipHistory=true 时不产生历史记录，skipHistory=false 结束时产生 1 条历史', () => {
    const store = useEditorStore.getState();

    // 1. Add an element first
    store.addElement({ type: 'text', content: 'Base Element', id: 'el0' });
    expect(useEditorStore.getState().past).toHaveLength(1);

    // 2. Simulate drag start & move (transient updates)
    store.updateElement('el0', { x: 10 }, true); // skipHistory = true
    store.updateElement('el0', { x: 20 }, true);
    store.updateElement('el0', { x: 30 }, true);

    // History past stack size should STILL be 1!
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().elements[0].x).toBe(30);

    // 3. Simulate drag end (commit update)
    store.updateElement('el0', { x: 35 }, false); // skipHistory = false

    // History past stack should now have exactly 2 elements!
    expect(useEditorStore.getState().past).toHaveLength(2);
    expect(useEditorStore.getState().elements[0].x).toBe(35);
  });

  it('单测：重置 store (resetStore) 能够完全清空所有状态包括历史栈', () => {
    const store = useEditorStore.getState();

    store.addElement({ type: 'text', content: 'Base Element', id: 'el0' });
    store.updateElement('el0', { x: 10 });
    expect(useEditorStore.getState().past).toHaveLength(2);

    store.resetStore();

    expect(useEditorStore.getState().elements).toHaveLength(0);
    expect(useEditorStore.getState().past).toHaveLength(0);
    expect(useEditorStore.getState().future).toHaveLength(0);
    expect(useEditorStore.getState().selection).toBeNull();
  });
});
