import { getSharedDB } from './db';

const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current-draft';

/**
 * @returns true if save succeeded, false if IndexedDB is unavailable or quota exceeded.
 * Calling code should handle false gracefully (e.g., warn but not block editing).
 */
export async function saveDraft(snapshot: {
  canvas: unknown;
  theme: unknown;
  elements: unknown[];
  selection: string | null;
  savedAt: string;
}): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.put(STORE_NAME, snapshot, DRAFT_KEY);
    return true;
  } catch (error) {
    // 分类错误，提供开发者可操作的提示
    const err = error as Error;
    if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
      console.error('[草稿保存] 存储空间已满，无法保存草稿。', err);
    } else if (
      err.name === 'InvalidStateError' ||
      err.message.includes('not active')
    ) {
      console.error('[草稿保存] IndexedDB 不可用（可能被隐私模式阻止）。', err);
    } else {
      console.error('[草稿保存] 未知错误:', err);
    }
    return false;
  }
}

/**
 * @returns draft snapshot if found and parseable, undefined otherwise.
 * Never throws — callers can rely on undefined being returned on any failure.
 */
export async function loadDraft(): Promise<
  | {
      canvas: unknown;
      theme: unknown;
      elements: unknown[];
      selection: string | null;
      savedAt: string;
    }
  | undefined
> {
  try {
    const db = await getSharedDB();
    const result = await db.get(STORE_NAME, DRAFT_KEY);
    return result as
      | {
          canvas: unknown;
          theme: unknown;
          elements: unknown[];
          selection: string | null;
          savedAt: string;
        }
      | undefined;
  } catch (error) {
    const err = error as Error;
    console.error('[草稿加载] 读取失败:', err);
    return undefined;
  }
}

/**
 * @returns true if delete succeeded, false otherwise.
 */
export async function deleteDraft(): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.delete(STORE_NAME, DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('[草稿删除] IndexedDB 操作失败:', error);
    return false;
  }
}
