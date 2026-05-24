import { validateAndFilterElement } from '../state/schema';
import type { EditorElement } from '../state/types';
import type { TemplateSchema } from './types';

export interface ValidTemplate {
  version: number;
  meta: TemplateSchema['meta'];
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  theme: Record<string, string>;
  elements: EditorElement[];
}

export function validateTemplateSchema(raw: unknown): ValidTemplate | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== 'number') return null;

  const meta = obj.meta as Record<string, unknown> | undefined;
  if (!meta) return null;
  if (
    typeof meta.id !== 'string' ||
    typeof meta.name !== 'string' ||
    (meta.category !== 'ecommerce' && meta.category !== 'store-review') ||
    typeof meta.thumbnail !== 'string' ||
    typeof meta.author !== 'string' ||
    typeof meta.updatedAt !== 'string'
  ) {
    return null;
  }

  const canvas = obj.canvas as Record<string, unknown> | undefined;
  if (!canvas) return null;
  if (
    typeof canvas.width !== 'number' ||
    typeof canvas.height !== 'number' ||
    typeof canvas.backgroundColor !== 'string'
  ) {
    return null;
  }

  const theme = obj.theme;
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) return null;
  const themeRecord = theme as Record<string, unknown>;
  for (const key of Object.keys(themeRecord)) {
    if (typeof themeRecord[key] !== 'string') return null;
  }

  if (!Array.isArray(obj.elements)) return null;
  const elements: EditorElement[] = [];
  for (const item of obj.elements) {
    const parsed = validateAndFilterElement(item);
    if (!parsed) return null;
    elements.push(parsed);
  }

  return {
    version: obj.version,
    meta: {
      id: meta.id,
      name: meta.name,
      category: meta.category,
      thumbnail: meta.thumbnail,
      author: meta.author,
      updatedAt: meta.updatedAt,
    },
    canvas: {
      width: canvas.width,
      height: canvas.height,
      backgroundColor: canvas.backgroundColor,
    },
    theme: themeRecord as Record<string, string>,
    elements,
  };
}
