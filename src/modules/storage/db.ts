import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'video-cover-db';
const DB_VERSION = 1;

interface VideoCoverDB {
  drafts: {
    key: string;
    value: unknown;
  };
  'custom-templates': {
    key: string;
    value: unknown;
  };
}

let dbInstance: IDBPDatabase<VideoCoverDB> | null = null;
let dbInitFailed = false;

/**
 * 获取共享的 IndexedDB 实例。
 * 如果初始化失败，后续调用会直接返回 null，存储操作会优雅降级。
 */
export async function getSharedDB(): Promise<IDBPDatabase<VideoCoverDB>> {
  if (dbInitFailed) {
    throw new Error('IndexedDB initialization failed previously');
  }
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<VideoCoverDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }
        if (!db.objectStoreNames.contains('custom-templates')) {
          db.createObjectStore('custom-templates');
        }
      },
    });
    return dbInstance;
  } catch (error) {
    dbInitFailed = true;
    const err = error as Error;
    if (
      err.name === 'InvalidAccessError' ||
      err.message.includes('not allowed')
    ) {
      console.error(
        '[数据库] 无法创建 IndexedDB（可能被隐私模式或浏览器设置阻止）',
        err,
      );
    } else {
      console.error('[数据库] 初始化失败:', err);
    }
    throw error; // Re-throw so callers can catch and handle gracefully
  }
}

/**
 * 检查 IndexedDB 是否在当前环境下可用。
 * 用于在 UI 中给出有针对性的提示。
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  try {
    await getSharedDB();
    return true;
  } catch {
    return false;
  }
}
