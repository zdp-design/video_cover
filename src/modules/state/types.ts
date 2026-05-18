export type ElementType = 'text' | 'sticker';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  styleRef?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  fill: string;

  // Advanced styles are optional in MVP
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  letterSpacing?: number;
}

export interface StickerElement extends BaseElement {
  type: 'sticker';
  assetId: string;
  assetType: 'svg' | 'png';
  assetSource: string;
}

export type EditorElement = TextElement | StickerElement;

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface ThemeColors {
  [key: string]: string;
}
