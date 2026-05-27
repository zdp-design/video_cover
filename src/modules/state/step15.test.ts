import { describe, it, expect } from 'vitest';
import { useEditorStore } from './store';
import type { ShapeElement } from './types';

describe('Step 15: Shape Elements - Store', () => {
  it('addElement creates a rect shape with correct defaults', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({
      type: 'shape',
      shapeType: 'rect',
    });

    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);
    const el = elements[0] as ShapeElement;
    expect(el.type).toBe('shape');
    expect(el.shapeType).toBe('rect');
    expect(el.fill).toBe('#e8e8e8');
    expect(el.stroke).toBe('#d9d9d9');
    expect(el.strokeWidth).toBe(1);
    expect(el.cornerRadius).toBe(0);
    expect(el.width).toBe(150);
    expect(el.height).toBe(150);
  });

  it('addElement creates a roundedRect shape with cornerRadius defaulting to 0 in store', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({
      type: 'shape',
      shapeType: 'roundedRect',
      // cornerRadius not passed — store defaults to 0
    });

    const elements = useEditorStore.getState().elements;
    const el = elements[0] as ShapeElement;
    expect(el.shapeType).toBe('roundedRect');
    expect(el.cornerRadius).toBe(0);
  });

  it('addElement creates roundedRect with custom cornerRadius when provided', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({
      type: 'shape',
      shapeType: 'roundedRect',
      cornerRadius: 20,
    });

    const elements = useEditorStore.getState().elements;
    const el = elements[0] as ShapeElement;
    expect(el.shapeType).toBe('roundedRect');
    expect(el.cornerRadius).toBe(20);
  });

  it('addElement creates a circle shape with correct defaults', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({
      type: 'shape',
      shapeType: 'circle',
    });

    const elements = useEditorStore.getState().elements;
    const el = elements[0] as ShapeElement;
    expect(el.shapeType).toBe('circle');
    expect(el.cornerRadius).toBe(0);
  });

  it('updateElement updates shape fill, stroke, strokeWidth, cornerRadius', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({ type: 'shape', shapeType: 'rect' });
    const id = useEditorStore.getState().elements[0].id;

    store.updateElement(id, {
      fill: '#ff0000',
      stroke: '#0000ff',
      strokeWidth: 3,
      cornerRadius: 20,
    });

    const el = useEditorStore.getState().elements[0] as ShapeElement;
    expect(el.fill).toBe('#ff0000');
    expect(el.stroke).toBe('#0000ff');
    expect(el.strokeWidth).toBe(3);
    expect(el.cornerRadius).toBe(20);
  });

  it('updateElement records history for shape changes', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({ type: 'shape', shapeType: 'rect' });
    const id = useEditorStore.getState().elements[0].id;
    store.updateElement(id, { fill: '#ff0000' });

    const { past } = useEditorStore.getState();
    expect(past.length).toBe(2); // addElement + updateElement
  });

  it('removeElement removes shape from store', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({ type: 'shape', shapeType: 'rect' });
    const id = useEditorStore.getState().elements[0].id;
    store.removeElement(id);

    expect(useEditorStore.getState().elements).toHaveLength(0);
  });

  it('addElement with custom dimensions overrides defaults', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    store.addElement({
      type: 'shape',
      shapeType: 'rect',
      width: 300,
      height: 400,
      x: 100,
      y: 200,
    });

    const el = useEditorStore.getState().elements[0] as ShapeElement;
    expect(el.width).toBe(300);
    expect(el.height).toBe(400);
    expect(el.x).toBe(100);
    expect(el.y).toBe(200);
  });
});

describe('Step 15: Shape Elements - Types', () => {
  it('ShapeElement has required fields', () => {
    const shape: ShapeElement = {
      id: 'test',
      type: 'shape',
      name: '矩形',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
      shapeType: 'rect',
      fill: '#e8e8e8',
      stroke: '#d9d9d9',
      strokeWidth: 1,
      cornerRadius: 0,
    };

    expect(shape.type).toBe('shape');
    expect(shape.shapeType).toBe('rect');
    expect(shape.fill).toBe('#e8e8e8');
    expect(shape.stroke).toBe('#d9d9d9');
    expect(shape.strokeWidth).toBe(1);
  });

  it('circle shapeType is valid', () => {
    const circle: ShapeElement = {
      id: 'test',
      type: 'shape',
      name: '圆形',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
      shapeType: 'circle',
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      cornerRadius: 0,
    };

    expect(circle.shapeType).toBe('circle');
  });

  it('roundedRect shapeType with cornerRadius is valid', () => {
    const rounded: ShapeElement = {
      id: 'test',
      type: 'shape',
      name: '圆角矩形',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
      shapeType: 'roundedRect',
      fill: '#00ff00',
      stroke: '#ffffff',
      strokeWidth: 1,
      cornerRadius: 20,
    };

    expect(rounded.shapeType).toBe('roundedRect');
    expect(rounded.cornerRadius).toBe(20);
  });
});
