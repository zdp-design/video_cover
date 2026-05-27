import { getSharedDB } from './db';
import type { ValidTemplate } from '../templates/schema';

export interface CustomTemplateRecord {
  id: string;
  name: string;
  savedAt: string;
  template: ValidTemplate;
}

const STORE_NAME = 'custom-templates';

export async function saveCustomTemplate(
  name: string,
  template: ValidTemplate,
): Promise<boolean> {
  try {
    const db = await getSharedDB();
    const record: CustomTemplateRecord = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      template,
    };
    await db.put(STORE_NAME, record, record.id);
    return true;
  } catch (error) {
    console.error('Failed to save custom template to IndexedDB:', error);
    return false;
  }
}

export async function loadCustomTemplates(): Promise<CustomTemplateRecord[]> {
  try {
    const db = await getSharedDB();
    return (await db.getAll(STORE_NAME)) as CustomTemplateRecord[];
  } catch (error) {
    console.error('Failed to load custom templates from IndexedDB:', error);
    return [];
  }
}

export async function deleteCustomTemplate(id: string): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.delete(STORE_NAME, id);
    return true;
  } catch (error) {
    console.error('Failed to delete custom template from IndexedDB:', error);
    return false;
  }
}
