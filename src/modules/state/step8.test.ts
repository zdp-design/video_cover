import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './store';

describe('Editor Store - Layer Reordering (Step 8)', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
  });

  const setupElements = () => {
    const store = useEditorStore.getState();
    // Add three elements: el0, el1, el2
    // Array order: [el0, el1, el2]
    // Default zIndex: el0=0, el1=1, el2=2
    store.addElement({ type: 'text', content: 'Element 0', id: 'el0' });
    store.addElement({ type: 'text', content: 'Element 1', id: 'el1' });
    store.addElement({ type: 'text', content: 'Element 2', id: 'el2' });
  };

  it('单测（store）：层级属性与元素数组顺序一致且初始自增', () => {
    setupElements();
    const { elements } = useEditorStore.getState();
    expect(elements).toHaveLength(3);
    expect(elements[0].id).toBe('el0');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el1');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el2');
    expect(elements[2].zIndex).toBe(2);
  });

  it('单测（store）：bringForward (上移) 逻辑正确且更新 zIndex', () => {
    setupElements();
    const store = useEditorStore.getState();

    // Move el0 forward (swap el0 and el1)
    // Target array order should become: [el1, el0, el2]
    store.bringForward('el0');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el1');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el0');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el2');
    expect(elements[2].zIndex).toBe(2);

    // History check
    expect(useEditorStore.getState().past).toHaveLength(4); // 3 from add, 1 from bringForward
  });

  it('单测（store）：bringForward (上移) 顶层元素时无动作', () => {
    setupElements();
    const store = useEditorStore.getState();

    // el2 is already at the top (index 2)
    store.bringForward('el2');

    const elements = useEditorStore.getState().elements;
    expect(elements[2].id).toBe('el2');
    expect(useEditorStore.getState().past).toHaveLength(3); // no new history snapshot
  });

  it('单测（store）：sendBackward (下移) 逻辑正确且更新 zIndex', () => {
    setupElements();
    const store = useEditorStore.getState();

    // Move el1 backward (swap el0 and el1)
    // Target array order should become: [el1, el0, el2]
    store.sendBackward('el1');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el1');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el0');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el2');
    expect(elements[2].zIndex).toBe(2);

    // History check
    expect(useEditorStore.getState().past).toHaveLength(4);
  });

  it('单测（store）：sendBackward (下移) 底层元素时无动作', () => {
    setupElements();
    const store = useEditorStore.getState();

    // el0 is already at the bottom (index 0)
    store.sendBackward('el0');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el0');
    expect(useEditorStore.getState().past).toHaveLength(3);
  });

  it('单测（store）：bringToFront (置顶) 逻辑正确且更新 zIndex', () => {
    setupElements();
    const store = useEditorStore.getState();

    // Move el0 to top
    // Target array order: [el1, el2, el0]
    store.bringToFront('el0');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el1');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el2');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el0');
    expect(elements[2].zIndex).toBe(2);

    // History check
    expect(useEditorStore.getState().past).toHaveLength(4);
  });

  it('单测（store）：bringToFront (置顶) 已经是顶层元素时无动作', () => {
    setupElements();
    const store = useEditorStore.getState();

    // el2 is already at the top
    store.bringToFront('el2');

    const elements = useEditorStore.getState().elements;
    expect(elements[2].id).toBe('el2');
    expect(useEditorStore.getState().past).toHaveLength(3);
  });

  it('单测（store）：sendToBack (置底) 逻辑正确且更新 zIndex', () => {
    setupElements();
    const store = useEditorStore.getState();

    // Move el2 to bottom
    // Target array order: [el2, el0, el1]
    store.sendToBack('el2');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el2');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el0');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el1');
    expect(elements[2].zIndex).toBe(2);

    // History check
    expect(useEditorStore.getState().past).toHaveLength(4);
  });

  it('单测（store）：sendToBack (置底) 已经是底层元素时无动作', () => {
    setupElements();
    const store = useEditorStore.getState();

    // el0 is already at the bottom
    store.sendToBack('el0');

    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el0');
    expect(useEditorStore.getState().past).toHaveLength(3);
  });

  it('单测（store）：层级操作与 撤销(undo) / 重做(redo) 兼容且完美回退', () => {
    setupElements();
    const store = useEditorStore.getState();

    // 1. Move el0 to top -> [el1, el2, el0]
    store.bringToFront('el0');
    expect(useEditorStore.getState().elements[2].id).toBe('el0');

    // 2. Undo -> should revert to [el0, el1, el2]
    store.undo();
    let elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('el0');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('el1');
    expect(elements[1].zIndex).toBe(1);
    expect(elements[2].id).toBe('el2');
    expect(elements[2].zIndex).toBe(2);

    // 3. Redo -> should move el0 to top again
    store.redo();
    elements = useEditorStore.getState().elements;
    expect(elements[2].id).toBe('el0');
    expect(elements[2].zIndex).toBe(2);
  });
});
