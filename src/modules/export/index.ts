/**
 * Export utilities for PNG/JPEG canvas export.
 * Uses direct Canvas 2D API rendering to ensure exported image matches
 * exact target dimensions without DOM capture issues.
 *
 * Follows the filename format: {name}_{width}x{height}_{scale}_{YYYYMMDD_HHmmss}.{ext}
 */

import type {
  EditorElement,
  TextElement,
  StickerElement,
  ShapeElement,
} from '../state/types';
import { sanitizeSvg } from '../../utils/sanitize';

export type ExportFormat = 'png' | 'jpeg';
export type ExportScale = 1 | 2;

export function sanitizeFilename(str: string): string {
  if (!str) return '';
  return (
    str
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100)
  );
}

export function generateExportFilename(
  name: string | null,
  width: number,
  height: number,
  scale: ExportScale,
  format: ExportFormat,
): string {
  const sanitized = sanitizeFilename(name ?? '');
  const displayName = sanitized || 'untitled';
  const scaleStr = `${scale}x`;
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const timestamp = formatTimestamp(new Date());

  return `${displayName}_${width}x${height}_${scaleStr}_${timestamp}.${ext}`;
}

function formatTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

export interface ExportOptions {
  canvasWidth: number;
  canvasHeight: number;
  scale: ExportScale;
  format: ExportFormat;
  name: string | null;
  backgroundColor: string;
  elements: EditorElement[];
}

/**
 * Convert SVG string to a data URL for use as an Image source.
 */
function svgToDataURL(svgSource: string): string {
  const sanitized = sanitizeSvg(svgSource);
  const encoded = encodeURIComponent(sanitized);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Load an image from a URL or data URL, returning a Promise.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Apply transform for an element with proper handling of negative scale (mirror).
 * In Canvas 2D, negative scale flips the coordinate system. To keep the element
 * at the same visual position, we need to compensate translate after scale.
 */
function applyElementTransform(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rotation: number,
  scaleX: number,
  scaleY: number,
  w: number,
  h: number,
): void {
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);
  // Compensate for negative scale (mirror effect)
  // When scaleX < 0, the coordinate system flips, so we need to shift by w
  // When scaleY < 0, the coordinate system flips, so we need to shift by h
  ctx.translate(scaleX < 0 ? w : 0, scaleY < 0 ? h : 0);
  ctx.translate(-w / 2, -h / 2);
}

/**
 * Draw a shape element onto the canvas context.
 */
function drawShape(
  ctx: CanvasRenderingContext2D,
  el: ShapeElement,
  outputScale: number,
) {
  ctx.save();

  const x = el.x * outputScale;
  const y = el.y * outputScale;
  const w = el.width * outputScale;
  const h = el.height * outputScale;
  const rotation = (el.rotation * Math.PI) / 180;
  const scaleX = el.scaleX;
  const scaleY = el.scaleY;

  ctx.globalAlpha = el.opacity;

  // Apply element transform: translate to center, rotate, scale, translate back
  const cx = x + w / 2;
  const cy = y + h / 2;
  applyElementTransform(ctx, cx, cy, rotation, scaleX, scaleY, w, h);

  ctx.fillStyle = el.fill;
  ctx.strokeStyle = el.stroke;
  ctx.lineWidth = el.strokeWidth * outputScale;

  if (el.shapeType === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  } else if (el.shapeType === 'roundedRect') {
    const radius = el.cornerRadius * outputScale;
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  } else {
    // rect
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a text element onto the canvas context.
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  outputScale: number,
) {
  ctx.save();

  const x = el.x * outputScale;
  const y = el.y * outputScale;
  const rotation = (el.rotation * Math.PI) / 180;
  const scaleX = el.scaleX;
  const scaleY = el.scaleY;

  ctx.globalAlpha = el.opacity;

  // Apply element transform
  const w = el.width * outputScale;
  const h = el.height * outputScale;
  const cx = x + w / 2;
  const cy = y + h / 2;
  applyElementTransform(ctx, cx, cy, rotation, scaleX, scaleY, w, h);

  const fontSize = el.fontSize * outputScale;
  const lineHeight = el.lineHeight;
  const letterSpacing = (el.letterSpacing ?? 0) * outputScale;

  ctx.font = `${el.fontWeight} ${fontSize}px ${el.fontFamily}`;
  ctx.textAlign = el.textAlign;
  ctx.textBaseline = 'top';

  // Measure text for manual line breaking
  const maxWidth = el.width * outputScale;
  const lines = wrapText(ctx, el.content, maxWidth, letterSpacing);

  // Shadow
  if (el.shadowColor && el.shadowBlur !== undefined) {
    ctx.shadowColor = el.shadowColor;
    ctx.shadowBlur = el.shadowBlur * outputScale;
    ctx.shadowOffsetX = (el.shadowOffsetX ?? 0) * outputScale;
    ctx.shadowOffsetY = (el.shadowOffsetY ?? 0) * outputScale;
  }

  // Fill
  ctx.fillStyle = el.fill;
  const textAnchorX =
    el.textAlign === 'center' ? w / 2 : el.textAlign === 'right' ? w : 0;
  drawTextLines(
    ctx,
    lines,
    textAnchorX,
    0,
    fontSize * lineHeight,
    letterSpacing,
  );

  // Stroke (-webkit-text-stroke) — fully reset shadow before stroke
  if (el.strokeColor && el.strokeWidth !== undefined) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = el.strokeColor;
    ctx.lineWidth = el.strokeWidth * outputScale;
    ctx.lineJoin = 'round';
    drawTextLines(
      ctx,
      lines,
      textAnchorX,
      0,
      fontSize * lineHeight,
      letterSpacing,
      true,
    );
  }

  ctx.restore();
}

/**
 * Wrap text to fit within maxWidth, returning array of lines.
 * Supports CJK characters (no spaces needed), emoji, and mixed content.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    if (!para) {
      result.push('');
      continue;
    }
    result.push(...wrapTextParagraph(ctx, para, maxWidth, letterSpacing));
  }

  return result;
}

/**
 * Split text into grapheme clusters for proper emoji handling.
 * Falls back to simple string split if Intl.Segmenter is not available.
 */
function splitGraphemeClusters(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).map((s) => s.segment);
  }
  // Fallback: return each character as separate segment (works for CJK)
  return Array.from(text);
}

/**
 * Check if a character is CJK (Chinese, Japanese, Korean).
 */
function isCJK(char: string): boolean {
  const code = char.codePointAt(0);
  if (!code) return false;
  // CJK Unified Ideographs, Hiragana, Katakana, Hangul
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3040 && code <= 0x30ff) || // Hiragana, Katakana
    (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
    (code >= 0x3400 && code <= 0x4dbf) // CJK Extension A
  );
}

/**
 * Check if a string contains any CJK characters.
 */
function containsCJK(text: string): boolean {
  return Array.from(text).some(isCJK);
}

/**
 * Wrap a single paragraph with proper CJK and emoji handling.
 */
function wrapTextParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
): string[] {
  // For pure CJK text, character-by-character wrapping without spaces
  if (containsCJK(text)) {
    return wrapCJKText(ctx, text, maxWidth, letterSpacing);
  }

  // For non-CJK text (Latin, emoji, etc.), use word-based wrapping
  const words = text.split(' ');
  const result: string[] = [];
  let current = '';
  let currentWidth = 0;

  for (const word of words) {
    // Calculate width character-by-character for consistency with drawTextLines
    // (measureText on whole string differs from sum of individual chars due to kerning)
    let testWidth = 0;
    const testStr = current ? `${current} ${word}` : word;
    const chars = splitGraphemeClusters(testStr);
    for (let i = 0; i < chars.length; i++) {
      testWidth += ctx.measureText(chars[i]).width;
      if (i < chars.length - 1) {
        testWidth += letterSpacing;
      }
    }

    if (testWidth > maxWidth && current) {
      result.push(current);
      current = word;
      currentWidth = 0;
      // Calculate width for current word alone
      const wordChars = splitGraphemeClusters(word);
      for (let i = 0; i < wordChars.length; i++) {
        currentWidth += ctx.measureText(wordChars[i]).width;
        if (i < wordChars.length - 1) {
          currentWidth += letterSpacing;
        }
      }
    } else {
      current = testStr;
      currentWidth = testWidth;
    }
  }
  if (current) result.push(current);

  return result;
}

/**
 * Wrap CJK text character by character (no spaces between words).
 */
function wrapCJKText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
): string[] {
  const result: string[] = [];
  let current = '';
  let currentWidth = 0;

  for (const char of splitGraphemeClusters(text)) {
    const charWidth = ctx.measureText(char).width;
    const spacing = current.length > 0 ? letterSpacing : 0;

    if (currentWidth + charWidth + spacing > maxWidth && current) {
      result.push(current);
      current = char;
      currentWidth = charWidth;
    } else {
      current += char;
      currentWidth += charWidth + spacing;
    }
  }

  if (current) result.push(current);
  return result;
}

/**
 * Draw array of text lines, optionally stroking instead of filling.
 * Handles letterSpacing by drawing character-by-character.
 * textAlign is passed explicitly since ctx.textAlign doesn't work correctly
 * after applyElementTransform (which moves the coordinate system origin).
 */
function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  letterSpacing: number,
  stroke = false,
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue; // Skip empty lines

    const lineY = y + i * lineHeight;

    // Calculate total line width including letterSpacing
    let lineWidth = 0;
    for (const char of line) {
      lineWidth += ctx.measureText(char).width;
    }
    lineWidth += letterSpacing * Math.max(0, line.length - 1);

    // Calculate starting x position based on ctx.textAlign
    // After applyElementTransform, ctx.textAlign='center' would center on x=0,
    // which is the element's left edge, not its center. So we manually compute offsets.
    const textAlign = ctx.textAlign;
    let startX = x;
    if (textAlign === 'center') {
      startX = x - lineWidth / 2;
    } else if (textAlign === 'right') {
      startX = x - lineWidth;
    }

    // Draw character by character with letterSpacing
    let currentX = startX;
    for (const char of line) {
      const charWidth = ctx.measureText(char).width;
      if (stroke) {
        ctx.strokeText(char, currentX, lineY);
      } else {
        ctx.fillText(char, currentX, lineY);
      }
      currentX += charWidth + letterSpacing;
    }
  }
}

/**
 * Draw a sticker (SVG) element onto the canvas context.
 */
async function drawSticker(
  ctx: CanvasRenderingContext2D,
  el: StickerElement,
  outputScale: number,
): Promise<void> {
  ctx.save();

  const x = el.x * outputScale;
  const y = el.y * outputScale;
  const w = el.width * outputScale;
  const h = el.height * outputScale;
  const rotation = (el.rotation * Math.PI) / 180;
  const scaleX = el.scaleX;
  const scaleY = el.scaleY;

  ctx.globalAlpha = el.opacity;

  const cx = x + w / 2;
  const cy = y + h / 2;
  applyElementTransform(ctx, cx, cy, rotation, scaleX, scaleY, w, h);

  try {
    if (el.assetType === 'svg') {
      const dataURL = svgToDataURL(el.assetSource);
      const img = await loadImage(dataURL);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      // PNG asset — assetSource is already a URL or data URL
      const img = await loadImage(el.assetSource);
      ctx.drawImage(img, 0, 0, w, h);
    }
  } catch {
    // Draw placeholder on failure
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

/**
 * Wait for all fonts to be loaded before export.
 * Uses document.fonts.ready which is a Promise that resolves when all CSS fonts are loaded.
 */
async function waitForFonts(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

/**
 * Export canvas elements as a PNG/JPEG blob using direct Canvas 2D rendering.
 * This ensures the output dimensions exactly match canvasWidth x canvasHeight
 * regardless of the editor's display scaling.
 */
export async function exportToBlob(options: ExportOptions): Promise<Blob> {
  const { canvasWidth, canvasHeight, scale, format, backgroundColor, elements } =
    options;

  // Wait for fonts to be loaded before rendering text
  await waitForFonts();

  const outputWidth = canvasWidth * scale;
  const outputHeight = canvasHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d context');
  }

  // Fill background
  ctx.fillStyle = backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  // Sort elements by zIndex, then by id for stable sorting when zIndex is equal
  const sorted = [...elements]
    .filter((el) => el.visible)
    .sort((a, b) => {
      const zDiff = a.zIndex - b.zIndex;
      if (zDiff !== 0) return zDiff;
      return a.id.localeCompare(b.id);
    });

  // Draw non-sticker elements synchronously
  for (const el of sorted) {
    if (el.type === 'shape') {
      drawShape(ctx, el as ShapeElement, scale);
    } else if (el.type === 'text') {
      drawText(ctx, el as TextElement, scale);
    }
  }

  // Draw sticker elements (async due to image loading)
  // Use Promise.allSettled to ensure one sticker failure doesn't block others
  const stickerElements = sorted.filter((el) => el.type === 'sticker');
  const stickerResults = await Promise.allSettled(
    stickerElements.map((el) => drawSticker(ctx, el as StickerElement, scale)),
  );

  // Log any sticker failures but don't throw - partial export is still valid
  stickerResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`Sticker ${index} failed to render:`, result.reason);
    }
  });

  return new Promise<Blob>((resolve, reject) => {
    if (format === 'jpeg') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create JPEG blob'));
          }
        },
        'image/jpeg',
        0.92,
      );
    } else {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
      );
    }
  });
}

/**
 * Trigger browser download of a blob with the given filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
