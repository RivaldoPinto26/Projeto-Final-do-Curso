import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

const DB_NAME = 'FormDB';
const DB_STORE_NAME = 'pendingForms';
const DB_VERSION = 1;
const SERVER_URL = 'http://localhost:3000/submit';

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveFormData(request) {
  return request.clone().text().then(body => {
    const data = {
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body,
    };
    return openDatabase().then((db) => {
      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      tx.objectStore(DB_STORE_NAME).add(data);
      return tx.complete;
    });
  });
}

function getAllPendingData() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      console.log('[SW] Timestamp antes de obter dados do IndexedDB:', new Date().toISOString());

      const tx = db.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('[SW] Timestamp depois de obter dados do IndexedDB:', new Date().toISOString());
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  });
}


function clearPendingData() {
  return openDatabase().then((db) => {
    const tx = db.transaction(DB_STORE_NAME, 'readwrite');
    tx.objectStore(DB_STORE_NAME).clear();
    return tx.complete;
  });
}

//sendTo Server
async function sendToServer(storedRequest) {
  const headers = new Headers();
  for (const [key, value] of storedRequest.headers) {
    headers.append(key, value);
  }

  const request = new Request(storedRequest.url, {
    method: storedRequest.method,
    headers,
    body: storedRequest.body,
  });

  try {
    const res = await fetch(request);
    if (!res.ok) throw new Error('Erro na resposta do servidor');
    console.log('[SW] Dados reenviados com sucesso');
    console.log('[SW] Timestamp depois de processar o fetch:', new Date().toISOString());
    return true;
  } catch (err) {
    console.error('[SW] Erro ao reenviar:', err);
    return false;
  }
}

//fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/submit')) {
    console.log('[SW] Timestamp antes do fetch do SW:', new Date().toISOString());

    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          console.log('[SW] Timestamp depois do fetch do SW:', new Date().toISOString());
          return response;
        })
        .catch(async () => {
          console.warn('[SW] Offline. Salvando request no IndexedDB.');
          console.log('[SW] Timestamp antes de guardar em IndexedDB:', new Date().toISOString());

          await saveFormData(event.request);

          console.log('[SW] Timestamp depois de guardar em IndexedDB:', new Date().toISOString());
          await registerSync();

          return new Response(JSON.stringify({ success: false, offline: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
  }
});


self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-form-data') {
    event.waitUntil(syncPendingForms());
  }
});

async function syncPendingForms() {
  const allData = await getAllPendingData();
  for (const item of allData) {
    const success = await sendToServer(item);
    if (!success) return; // para se falhar
  }
  await clearPendingData();
  console.log('[SW] Todos os dados pendentes foram sincronizados');
}

function registerSync() {
  if ('SyncManager' in self) {
    return self.registration.sync.register('sync-form-data').then(() => {
      console.log('[SW] Sync registrado com sucesso');
    }).catch((err) => {
      console.error('[SW] Falha ao registrar sync:', err);
    });
  } else {
    console.warn('[SW] SyncManager não suportado');
    return Promise.resolve();
  }
}

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado');
  self.clients.claim();
});
