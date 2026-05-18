import type { EditorElement } from './types';

/**
 * Validates and filters an external input element against a whitelist schema.
 * Unknown fields are discarded and logged as warnings.
 * Strict type checking is performed.
 */
export function validateAndFilterElement(raw: unknown): EditorElement | null {
  if (!raw || typeof raw !== 'object') {
    console.warn('Invalid element input: not an object', raw);
    return null;
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.id || typeof obj.id !== 'string') {
    console.warn('Invalid element input: missing or invalid id', raw);
    return null;
  }
  if (obj.type !== 'text' && obj.type !== 'sticker') {
    console.warn(`Invalid element input: unsupported type "${obj.type}"`, raw);
    return null;
  }

  // Base whitelist fields
  const baseFields = [
    'id',
    'type',
    'name',
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'scaleX',
    'scaleY',
    'opacity',
    'visible',
    'locked',
    'zIndex',
    'styleRef',
  ];

  const filtered: Record<string, unknown> = {
    id: obj.id,
    type: obj.type,
    name: typeof obj.name === 'string' ? obj.name : 'Untitled',
    x: typeof obj.x === 'number' ? obj.x : 0,
    y: typeof obj.y === 'number' ? obj.y : 0,
    width: typeof obj.width === 'number' ? obj.width : 100,
    height: typeof obj.height === 'number' ? obj.height : 100,
    rotation: typeof obj.rotation === 'number' ? obj.rotation : 0,
    scaleX: typeof obj.scaleX === 'number' ? obj.scaleX : 1,
    scaleY: typeof obj.scaleY === 'number' ? obj.scaleY : 1,
    opacity: typeof obj.opacity === 'number' ? obj.opacity : 1,
    visible: typeof obj.visible === 'boolean' ? obj.visible : true,
    locked: typeof obj.locked === 'boolean' ? obj.locked : false,
    zIndex: typeof obj.zIndex === 'number' ? obj.zIndex : 0,
  };

  if (typeof obj.styleRef === 'string') {
    filtered.styleRef = obj.styleRef;
  }

  // Detect and warn about discarded unknown or forbidden fields
  const allowedSpecificFields =
    obj.type === 'text'
      ? [
          'content',
          'fontFamily',
          'fontSize',
          'fontWeight',
          'lineHeight',
          'textAlign',
          'fill',
        ]
      : ['assetId', 'assetType', 'assetSource'];

  const allAllowedFields = [...baseFields, ...allowedSpecificFields];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!allAllowedFields.includes(key)) {
        console.warn(
          `Discarded unknown or forbidden field: "${key}" from element:`,
          raw,
        );
      }
    }
  }

  // Validate specific element types
  if (obj.type === 'text') {
    filtered.content = typeof obj.content === 'string' ? obj.content : '';
    filtered.fontFamily =
      typeof obj.fontFamily === 'string' ? obj.fontFamily : 'sans-serif';
    filtered.fontSize = typeof obj.fontSize === 'number' ? obj.fontSize : 16;
    filtered.fontWeight =
      typeof obj.fontWeight === 'string' || typeof obj.fontWeight === 'number'
        ? obj.fontWeight
        : 'normal';
    filtered.lineHeight =
      typeof obj.lineHeight === 'number' ? obj.lineHeight : 1.2;
    filtered.textAlign =
      obj.textAlign === 'left' ||
      obj.textAlign === 'center' ||
      obj.textAlign === 'right'
        ? obj.textAlign
        : 'left';
    filtered.fill = typeof obj.fill === 'string' ? obj.fill : '#000000';
    return filtered as unknown as EditorElement;
  } else if (obj.type === 'sticker') {
    filtered.assetId = typeof obj.assetId === 'string' ? obj.assetId : '';
    filtered.assetType =
      obj.assetType === 'svg' || obj.assetType === 'png'
        ? obj.assetType
        : 'svg';
    filtered.assetSource =
      typeof obj.assetSource === 'string' ? obj.assetSource : '';
    return filtered as unknown as EditorElement;
  }

  return null;
}
