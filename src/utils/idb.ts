import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'scrivai-db';
const DB_VERSION = 2;

export interface DBImage {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface DBItem {
  id: string;
  data: any; // The ScrivNode or Project Data
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        console.log(db.objectStoreNames);
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveImageToDB = async (id: string, blob: Blob) => {
  const db = await getDB();
  await db.put('images', { id, blob, createdAt: Date.now() });
};

export const getImageFromDB = async (id: string): Promise<Blob | undefined> => {
  const db = await getDB();
  const entry = await db.get('images', id);
  return entry?.blob;
};

export const saveItemToDB = async (id: string, data: any) => {
  const db = await getDB();
  await db.put('items', { id, data });
};

export const getItemFromDB = async (id: string): Promise<any | undefined> => {
  const db = await getDB();
  const entry = await db.get('items', id);
  return entry?.data;
};

export const getAllItemsFromDB = async (): Promise<any[]> => {
  const db = await getDB();
  const entries = await db.getAll('items');
  return entries.map(e => e.data);
};

export const clearDB = async () => {
    const db = await getDB();
    await db.clear('items');
    await db.clear('images');
}
