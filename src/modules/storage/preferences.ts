const PREFIX = 'video-cover:prefs:';
const LAST_SIZE_KEY = `${PREFIX}lastSize`;

export interface LastSizePref {
  width: number;
  height: number;
}

export function saveLastUsedSize(width: number, height: number): void {
  try {
    localStorage.setItem(LAST_SIZE_KEY, JSON.stringify({ width, height }));
  } catch (error) {
    console.warn('Failed to save last used size to localStorage:', error);
  }
}

export function loadLastUsedSize(): LastSizePref | null {
  try {
    const raw = localStorage.getItem(LAST_SIZE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'width' in parsed &&
      'height' in parsed &&
      typeof (parsed as LastSizePref).width === 'number' &&
      typeof (parsed as LastSizePref).height === 'number'
    ) {
      return parsed as LastSizePref;
    }
    return null;
  } catch (error) {
    console.warn('Failed to load last used size from localStorage:', error);
    return null;
  }
}
