import type { CanvasConfig, EditorElement, ThemeColors } from '../state/types';
import { getSharedDB } from './db';

const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current-draft';

export interface DraftSnapshot {
  canvas: CanvasConfig;
  theme: ThemeColors;
  elements: EditorElement[];
  selection: string | null;
  savedAt: string;
}

export async function saveDraft(snapshot: DraftSnapshot): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.put(STORE_NAME, snapshot, DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('Failed to save draft to IndexedDB:', error);
    return false;
  }
}

export async function loadDraft(): Promise<DraftSnapshot | undefined> {
  try {
    const db = await getSharedDB();
    return (await db.get(STORE_NAME, DRAFT_KEY)) as DraftSnapshot | undefined;
  } catch (error) {
    console.error('Failed to load draft from IndexedDB:', error);
    return undefined;
  }
}

export async function deleteDraft(): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.delete(STORE_NAME, DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete draft from IndexedDB:', error);
    return false;
  }
}
