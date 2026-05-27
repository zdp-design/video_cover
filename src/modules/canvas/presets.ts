/**
 * Text style preset registry.
 * Provides one-click style presets for common e-commerce scenarios.
 */

export interface TextStylePreset {
  id: string;
  name: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  letterSpacing?: number;
  description?: string;
}

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  {
    id: 'bao_kuan_jia',
    name: '爆款价',
    strokeColor: '#ffffff',
    strokeWidth: 3,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    letterSpacing: 2,
    description: '白描边+阴影',
  },
  {
    id: 'bi_chi_bang',
    name: '必吃榜',
    strokeColor: '#FFD700',
    strokeWidth: 2,
    shadowColor: 'rgba(255,200,0,0.4)',
    shadowBlur: 6,
    shadowOffsetX: 0,
    shadowOffsetY: 3,
    letterSpacing: 4,
    description: '金黄描边+发光',
  },
  {
    id: 'bi_lei_ti_xing',
    name: '避雷提醒',
    strokeColor: '#ff4d4f',
    strokeWidth: 2,
    shadowColor: 'rgba(255,0,0,0.3)',
    shadowBlur: 5,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    letterSpacing: 1,
    description: '红色警示',
  },
  {
    id: 'xian_shi_tejia',
    name: '限时特价',
    strokeColor: '#e8590c',
    strokeWidth: 2,
    shadowColor: 'rgba(232,89,12,0.4)',
    shadowBlur: 4,
    shadowOffsetX: 1,
    shadowOffsetY: 2,
    letterSpacing: 3,
    description: '橙色描边',
  },
  {
    id: 'xin_shang_pin',
    name: '新商品',
    strokeColor: '#52c41a',
    strokeWidth: 1.5,
    shadowColor: 'rgba(82,196,26,0.3)',
    shadowBlur: 3,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    letterSpacing: 2,
    description: '绿色描边',
  },
  {
    id: 're_xiaobang',
    name: '热销榜',
    strokeColor: '#722ed1',
    strokeWidth: 2,
    shadowColor: 'rgba(114,46,209,0.35)',
    shadowBlur: 5,
    shadowOffsetX: 1,
    shadowOffsetY: 2,
    letterSpacing: 3,
    description: '紫色描边',
  },
];

export function buildPresetUpdate(
  preset: TextStylePreset,
): Partial<TextStylePreset> {
  return {
    strokeColor: preset.strokeColor,
    strokeWidth: preset.strokeWidth,
    shadowColor: preset.shadowColor,
    shadowBlur: preset.shadowBlur,
    shadowOffsetX: preset.shadowOffsetX,
    shadowOffsetY: preset.shadowOffsetY,
    letterSpacing: preset.letterSpacing,
  };
}
