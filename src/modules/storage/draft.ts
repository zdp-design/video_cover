import { openDB, type IDBPDatabase } from 'idb';
import type { CanvasConfig, EditorElement, ThemeColors } from '../state/types';

const DB_NAME = 'video-cover-db';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current-draft';

export interface DraftSnapshot {
  canvas: CanvasConfig;
  theme: ThemeColors;
  elements: EditorElement[];
  selection: string | null;
  savedAt: string;
}

interface VideoCoverDB {
  drafts: {
    key: string;
    value: DraftSnapshot;
  };
}

let dbInstance: IDBPDatabase<VideoCoverDB> | null = null;

async function getDB(): Promise<IDBPDatabase<VideoCoverDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VideoCoverDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });

  return dbInstance;
}

export async function saveDraft(snapshot: DraftSnapshot): Promise<boolean> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, snapshot, DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('Failed to save draft to IndexedDB:', error);
    return false;
  }
}

export async function loadDraft(): Promise<DraftSnapshot | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORE_NAME, DRAFT_KEY);
  } catch (error) {
    console.error('Failed to load draft from IndexedDB:', error);
    return undefined;
  }
}

export async function deleteDraft(): Promise<boolean> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete draft from IndexedDB:', error);
    return false;
  }
}