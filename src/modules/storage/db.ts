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

export async function getSharedDB(): Promise<IDBPDatabase<VideoCoverDB>> {
  if (dbInstance) return dbInstance;

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
}
