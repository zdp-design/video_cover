/**
 * SVG Sanitization utilities to prevent XSS attacks.
 * SVG content can contain script tags, event handlers (onload, onclick, etc.),
 * and other malicious content that can lead to XSS vulnerabilities.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize SVG string to prevent XSS attacks.
 * Removes script tags, event handlers, and other potentially dangerous content.
 */
export function sanitizeSvg(svgSource: string): string {
  return DOMPurify.sanitize(svgSource, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      'svg',
      'g',
      'path',
      'circle',
      'rect',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'defs',
      'linearGradient',
      'radialGradient',
      'stop',
      'clipPath',
      'mask',
      'use',
      'image',
      'filter',
      'feGaussianBlur',
      'feOffset',
      'feBlend',
      'title',
      'desc',
    ],
    ALLOWED_ATTR: [
      'viewBox',
      'xmlns',
      'width',
      'height',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'stroke-dashoffset',
      'opacity',
      'transform',
      'd',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'x',
      'y',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
      'offset',
      'stop-color',
      'stop-opacity',
      'gradientUnits',
      'gradientTransform',
      'clipPathUnits',
      'maskContentUnits',
      'xlink:href',
      'href',
      'preserveAspectRatio',
      'id',
      'class',
      'style',
      'text-anchor',
      'dominant-baseline',
      'font-family',
      'font-size',
      'font-weight',
      'text-align',
      'dy',
      'font-style',
      'letter-spacing',
    ],
  });
}

/**
 * Alias for sanitizeSvg for semantic clarity when rendering stickers.
 */
export const sanitizeStickerSvg = sanitizeSvg;
