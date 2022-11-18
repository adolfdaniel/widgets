const COUNTER_STORAGE = 'counter-db';
const COUNTER_KEY = 'counter';
const COUNTER_NAME = 'widget-clicks';
let db = null;

const COUNT_TYPE = {
  DEFAULT: 'default',
  INSTALL: 'install',
  CLICK: 'click',
  ACTIVATE: 'activate',
  SW_ACTIVATE: 'swActivate',
};

const openDatabase = async () => {
  if (db) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Let us open our training sample database.
    const DBOpenRequest = indexedDB.open(COUNTER_STORAGE, 2);

    // Register two event handlers to act on the database being opened successfully, or not.
    DBOpenRequest.onerror = (e) => {
      reject(new Error('Error loading database.', e));
    };

    DBOpenRequest.onupgradeneeded = (event) => {
      const db = DBOpenRequest.result;
      if (event.oldVersion < 1) {
        db.createObjectStore(COUNTER_STORAGE, { keyPath: COUNTER_KEY });
      }

      if (event.oldVersion < 2) {
        const objectStore = DBOpenRequest.transaction.objectStore(COUNTER_STORAGE);
        for (const type of Object.values(COUNT_TYPE)) {
          objectStore.createIndex(type, type, { unique: false });
        }
      }
    };



    DBOpenRequest.onsuccess = () => {
      db = DBOpenRequest.result;
      resolve();
    };
  });
};

const getObjectStore = async () => {
  await openDatabase();
  // open a read/write db transaction
  const transaction = db.transaction([COUNTER_STORAGE], 'readwrite');

  // report on the error of opening the transaction
  transaction.onerror = (event) => {
    console.error('Transaction failed', event);
  }

  // create an object store on the transaction
  return transaction.objectStore(COUNTER_STORAGE);
};

const getCount = async (tag, type) => {
  type = type || COUNT_TYPE.DEFAULT;
  const objectStore = await getObjectStore();
  return new Promise((resolve, reject) => {
    const objectStoreRequest = objectStore.get(COUNTER_NAME + tag);
    objectStoreRequest.onerror = (event) => {
      // report the error of the request
      console.error('Object Store Request failed', event);
      reject();
    };

    objectStoreRequest.onsuccess = () => {
      const { result } = objectStoreRequest;
      const count = result ? result[type] : 0;
      resolve(count || 0);
    };
  });
};

const putCounts = async (tag, counts) => {
  const key = COUNTER_NAME + tag;
  const objectStore = await getObjectStore();
  return new Promise((resolve, reject) => {
    const objectStoreRequest = objectStore.put({ [COUNTER_KEY]: key, ...counts });
    objectStoreRequest.onerror = (event) => {
      // report the error of the request
      console.error('Object Store Request failed', event);
      reject();
    };

    objectStoreRequest.onsuccess = () => {
      resolve();
    };
  });
};