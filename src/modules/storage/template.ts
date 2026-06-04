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
    const err = error as Error;
    if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
      console.error('[模板保存] 存储空间已满，无法保存新模板。', err);
    } else {
      console.error('[模板保存] 保存失败:', err);
    }
    return false;
  }
}

export async function loadCustomTemplates(): Promise<CustomTemplateRecord[]> {
  try {
    const db = await getSharedDB();
    return (await db.getAll(STORE_NAME)) as CustomTemplateRecord[];
  } catch (error) {
    console.error('[模板加载] 读取失败:', error);
    return []; // Return empty array so UI can continue working without custom templates
  }
}

export async function deleteCustomTemplate(id: string): Promise<boolean> {
  try {
    const db = await getSharedDB();
    await db.delete(STORE_NAME, id);
    return true;
  } catch (error) {
    console.error('[模板删除] 删除失败:', error);
    return false;
  }
}
