/**
 * Export utilities for PNG/JPEG canvas export.
 * Follows the format: {name}_{width}x{height}_{scale}_{YYYYMMDD_HHmmss}.{ext}
 * - name: template name > project name > 'untitled'
 * - scale: only '1x' or '2x'
 * - ext: 'png' or 'jpg' for JPEG
 * - Sanitize: remove illegal chars, replace spaces with '-'
 */

import type {
  EditorElement,
  TextElement,
  StickerElement,
} from '../state/types';

export type ExportFormat = 'png' | 'jpeg';
export type ExportScale = 1 | 2;

/**
 * Sanitize string for use in filename.
 * - Remove illegal file characters
 * - Replace spaces with '-'
 */
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

/**
 * Generate export filename per spec:
 * {name}_{width}x{height}_{scale}_{YYYYMMDD_HHmmss}.{ext}
 */
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
 * Export canvas as PNG/JPEG blob by directly drawing elements using Canvas 2D API.
 * Avoids foreignObject approach that causes tainted canvas security errors.
 * Returns a Promise that resolves with the blob.
 */
export async function exportToBlob(options: ExportOptions): Promise<Blob> {
  const {
    canvasWidth,
    canvasHeight,
    scale,
    format,
    backgroundColor,
    elements,
  } = options;
  const exportWidth = canvasWidth * scale;
  const exportHeight = canvasHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  // Fill background
  ctx.fillStyle = backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, exportWidth, exportHeight);

  // Scale for HiDPI export
  ctx.scale(scale, scale);

  // Draw each element in zIndex order
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const element of sortedElements) {
    if (!element.visible) continue;

    // Save context state before transform
    ctx.save();

    // Apply element transforms
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.scale(element.scaleX, element.scaleY);
    ctx.globalAlpha = element.opacity;
    ctx.translate(-element.width / 2, -element.height / 2);

    if (element.type === 'text') {
      await drawTextElement(ctx, element as TextElement);
    } else if (element.type === 'sticker') {
      await drawStickerElement(ctx, element as StickerElement);
    }

    // Restore context state after transform
    ctx.restore();
  }

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
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    }
  });
}

async function drawTextElement(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
): Promise<void> {
  const {
    x,
    y,
    width,
    content,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    textAlign,
    fill,
  } = element;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fill;
  ctx.textBaseline = 'top';

  // Calculate text alignment offset
  let textX = x;
  if (textAlign === 'center') {
    ctx.textAlign = 'center';
    textX = x + width / 2;
  } else if (textAlign === 'right') {
    ctx.textAlign = 'right';
    textX = x + width;
  } else {
    ctx.textAlign = 'left';
  }

  // Word wrap and render line by line
  const lines = wrapText(ctx, content, width);
  const actualLineHeight = fontSize * lineHeight;
  let currentY = y;

  for (const line of lines) {
    ctx.fillText(line, textX, currentY);
    currentY += actualLineHeight;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      result.push('');
      continue;
    }

    const words = paragraph.split('');
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

async function drawStickerElement(
  ctx: CanvasRenderingContext2D,
  element: StickerElement,
): Promise<void> {
  const { x, y, width, height, assetSource, assetType } = element;

  return new Promise((resolve, reject) => {
    let imageUrl: string;

    if (assetType === 'png') {
      // For PNG stickers, assetSource is either a data URL or a URL
      imageUrl = assetSource;
    } else {
      // For SVG stickers, convert SVG string to data URL
      const svgBlob = new Blob([assetSource], { type: 'image/svg+xml' });
      imageUrl = URL.createObjectURL(svgBlob);
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      if (assetType === 'svg') {
        URL.revokeObjectURL(imageUrl);
      }
      resolve();
    };
    img.onerror = () => {
      if (assetType === 'svg') {
        URL.revokeObjectURL(imageUrl);
      }
      reject(new Error(`Failed to load sticker image (type: ${assetType})`));
    };
    img.src = imageUrl;
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
