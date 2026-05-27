import { describe, it, expect } from 'vitest';
import { TEXT_STYLE_PRESETS, buildPresetUpdate } from './presets';

describe('TEXT_STYLE_PRESETS', () => {
  it('has at least 6 presets', () => {
    expect(TEXT_STYLE_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('each preset has id, name, and at least one advanced style field', () => {
    TEXT_STYLE_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      const hasStroke =
        preset.strokeColor !== undefined && preset.strokeWidth !== undefined;
      const hasShadow =
        preset.shadowColor !== undefined && preset.shadowBlur !== undefined;
      const hasLetterSpacing = preset.letterSpacing !== undefined;
      expect(hasStroke || hasShadow || hasLetterSpacing).toBe(true);
    });
  });

  it('bao_kuan_jia has white stroke and shadow', () => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === 'bao_kuan_jia');
    expect(preset).toBeDefined();
    expect(preset!.strokeColor).toBe('#ffffff');
    expect(preset!.strokeWidth).toBe(3);
    expect(preset!.shadowColor).toBe('rgba(0,0,0,0.5)');
    expect(preset!.shadowBlur).toBe(4);
  });

  it('bi_chi_bang has gold stroke and glow shadow', () => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === 'bi_chi_bang');
    expect(preset).toBeDefined();
    expect(preset!.strokeColor).toBe('#FFD700');
    expect(preset!.strokeWidth).toBe(2);
    expect(preset!.shadowColor).toBe('rgba(255,200,0,0.4)');
    expect(preset!.shadowBlur).toBe(6);
  });

  it('bi_lei_ti_xing has red stroke for warning', () => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === 'bi_lei_ti_xing');
    expect(preset).toBeDefined();
    expect(preset!.strokeColor).toBe('#ff4d4f');
    expect(preset!.strokeWidth).toBe(2);
  });
});

describe('buildPresetUpdate', () => {
  it('extracts all style fields from a preset', () => {
    const preset = TEXT_STYLE_PRESETS[0];
    const update = buildPresetUpdate(preset);

    expect(update.strokeColor).toBe(preset.strokeColor);
    expect(update.strokeWidth).toBe(preset.strokeWidth);
    expect(update.shadowColor).toBe(preset.shadowColor);
    expect(update.shadowBlur).toBe(preset.shadowBlur);
    expect(update.shadowOffsetX).toBe(preset.shadowOffsetX);
    expect(update.shadowOffsetY).toBe(preset.shadowOffsetY);
    expect(update.letterSpacing).toBe(preset.letterSpacing);
  });

  it('returns partial update object without id or name', () => {
    const preset = TEXT_STYLE_PRESETS[0];
    const update = buildPresetUpdate(preset);

    expect(update).not.toHaveProperty('id');
    expect(update).not.toHaveProperty('name');
  });
});
