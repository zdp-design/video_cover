import { describe, it, expect } from 'vitest';
import { useEditorStore } from './store';
import {
  THEME_PRESETS,
  getContrastRatio,
  getContrastLevel,
  buildColorReplaceMap,
} from '../themes/registry';
import type { TextElement, ShapeElement } from './types';

describe('Step 16: Theme System - Presets', () => {
  it('has at least 3 built-in theme presets', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('each preset has required color tokens', () => {
    THEME_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.colors.primary).toBeTruthy();
      expect(preset.colors.accent).toBeTruthy();
      expect(preset.colors.text).toBeTruthy();
      expect(preset.colors.background).toBeTruthy();
    });
  });

  it('ecommerce_high_contrast has correct colors', () => {
    const preset = THEME_PRESETS.find(
      (t) => t.id === 'ecommerce_high_contrast',
    );
    expect(preset).toBeDefined();
    expect(preset!.colors.primary).toBe('#ff4d4f');
    expect(preset!.colors.background).toBe('#fff3e8');
  });

  it('store_review_fresh has correct colors', () => {
    const preset = THEME_PRESETS.find((t) => t.id === 'store_review_fresh');
    expect(preset).toBeDefined();
    expect(preset!.colors.primary).toBe('#52c41a');
    expect(preset!.colors.background).toBe('#f6ffed');
  });

  it('night_neon has correct colors', () => {
    const preset = THEME_PRESETS.find((t) => t.id === 'night_neon');
    expect(preset).toBeDefined();
    expect(preset!.colors.primary).toBe('#722ed1');
    expect(preset!.colors.background).toBe('#160d2e');
  });
});

describe('Step 16: Theme System - Contrast Ratio', () => {
  it('black on white has maximum contrast ratio', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeGreaterThan(20);
  });

  it('white on black has maximum contrast ratio', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeGreaterThan(20);
  });

  it('similar colors have low contrast ratio', () => {
    const ratio = getContrastRatio('#999999', '#aaaaaa');
    expect(ratio).toBeLessThan(2);
  });

  it('getContrastLevel returns AAA for ratio >= 7', () => {
    const level = getContrastLevel(10);
    expect(level.label).toBe('AAA');
    expect(level.color).toBe('#52c41a');
  });

  it('getContrastLevel returns AA for ratio >= 4.5', () => {
    const level = getContrastLevel(5);
    expect(level.label).toBe('AA');
    expect(level.color).toBe('#1890ff');
  });

  it('getContrastLevel returns AA+ for ratio >= 3', () => {
    const level = getContrastLevel(3.5);
    expect(level.label).toBe('AA+');
    expect(level.color).toBe('#fa8c16');
  });

  it('getContrastLevel returns _fail for ratio < 3', () => {
    const level = getContrastLevel(2);
    expect(level.label).toBe('_fail');
    expect(level.color).toBe('#ff4d4f');
  });
});

describe('Step 16: Theme System - Color Replace Map', () => {
  it('builds correct map when theme colors differ', () => {
    const oldTheme = { primary: '#ff0000', accent: '#00ff00' };
    const newTheme = { primary: '#0000ff', accent: '#00ff00' };
    const map = buildColorReplaceMap(oldTheme, newTheme);
    expect(map.get('#ff0000')).toBe('#0000ff');
    expect(map.has('#00ff00')).toBe(false); // unchanged
  });

  it('returns empty map when no colors differ', () => {
    const oldTheme = { primary: '#ff0000' };
    const newTheme = { primary: '#ff0000' };
    const map = buildColorReplaceMap(oldTheme, newTheme);
    expect(map.size).toBe(0);
  });

  it('handles empty oldTheme gracefully', () => {
    const oldTheme: Record<string, string> = {};
    const newTheme = { primary: '#0000ff' };
    const map = buildColorReplaceMap(oldTheme, newTheme);
    expect(map.size).toBe(0); // no old value to replace
  });
});

describe('Step 16: Theme System - Store applyTheme', () => {
  it('applyTheme replaces text fill colors when old theme token matches', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    // Set old theme where primary is #ff0000
    useEditorStore.setState((s) => ({
      ...s,
      theme: {
        primary: '#ff0000',
        accent: '#fff',
        text: '#000',
        background: '#fff',
      },
    }));

    store.addElement({ type: 'text', content: 'Test', fill: '#ff0000' });

    // Apply ecommerce theme (primary changes from #ff0000 → #ff4d4f)
    store.applyTheme('ecommerce_high_contrast');
    const el = useEditorStore.getState().elements[0] as TextElement;
    // fill=#ff0000 matches old theme primary, so it gets replaced with new primary
    expect(el.fill).toBe('#ff4d4f');
  });

  it('applyTheme does not replace when element color does not match old theme token', () => {
    const store = useEditorStore.getState();
    store.resetStore();

    // Set old theme with primary #ff0000
    useEditorStore.setState((s) => ({
      ...s,
      theme: {
        primary: '#ff0000',
        accent: '#fff',
        text: '#000',
        background: '#fff',
      },
    }));

    // Add text with fill that does NOT match old theme primary
    store.addElement({ type: 'text', content: 'Test', fill: '#aaaaaa' });

    store.applyTheme('ecommerce_high_contrast');
    const el = useEditorStore.getState().elements[0] as TextElement;
    // fill=#aaaaaa does not match old theme primary=#ff0000, so no replacement
    expect(el.fill).toBe('#aaaaaa');
  });

  it('applyTheme replaces shape fill and stroke', () => {
    const store = useEditorStore.getState();
    store.resetStore();
    useEditorStore.setState((s) => ({
      ...s,
      theme: {
        primary: '#e8e8e8',
        accent: '#d9d9d9',
        text: '#000',
        background: '#fff',
      },
    }));

    store.addElement({
      type: 'shape',
      shapeType: 'rect',
      fill: '#e8e8e8',
      stroke: '#d9d9d9',
    });

    store.applyTheme('night_neon');
    const el = useEditorStore.getState().elements[0] as ShapeElement;
    // old theme primary=#e8e8e8, new theme primary=#722ed1 → fill replaced
    expect(el.fill).toBe('#722ed1');
    // old theme accent=#d9d9d9, new theme accent=#eb2f96 → stroke replaced
    expect(el.stroke).toBe('#eb2f96');
  });

  it('applyTheme records history for undo', () => {
    const store = useEditorStore.getState();
    store.resetStore();
    useEditorStore.setState((s) => ({
      ...s,
      theme: {
        primary: '#e8e8e8',
        accent: '#d9d9d9',
        text: '#000',
        background: '#fff',
      },
    }));

    store.addElement({ type: 'shape', shapeType: 'rect', fill: '#e8e8e8' });
    const beforeCount = useEditorStore.getState().past.length;
    store.applyTheme('ocean_blue');
    expect(useEditorStore.getState().past.length).toBeGreaterThan(beforeCount);
  });

  it('applyTheme with unknown themeId does nothing', () => {
    const store = useEditorStore.getState();
    store.resetStore();
    store.addElement({ type: 'text', content: 'Test', fill: '#fff' });
    store.applyTheme('nonexistent_theme_id');
    const el = useEditorStore.getState().elements[0] as TextElement;
    expect(el.fill).toBe('#fff');
  });

  it('applyTheme also updates canvas background color', () => {
    const store = useEditorStore.getState();
    store.resetStore();
    useEditorStore.setState((s) => ({
      ...s,
      theme: {
        primary: '#fff',
        accent: '#fff',
        text: '#000',
        background: '#ffffff',
      },
      canvas: { ...s.canvas, backgroundColor: '#ffffff' },
    }));

    store.addElement({ type: 'text', content: 'Test', fill: '#fff' });
    store.applyTheme('night_neon');
    // night_neon theme background=#160d2e should replace canvas bg
    expect(useEditorStore.getState().canvas.backgroundColor).toBe('#160d2e');
  });
});
