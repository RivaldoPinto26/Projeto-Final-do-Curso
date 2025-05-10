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

function saveFormData(data) {
  return openDatabase().then((db) => {
    const tx = db.transaction(DB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DB_STORE_NAME);
    store.add(data);
    return tx.complete;
  });
}

function getAllPendingData() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
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

async function sendToServer(data) {
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Erro do servidor');
    console.log('[SW] Dados enviados com sucesso:', data);
    return true;
  } catch (err) {
    console.error('[SW] Erro ao enviar dados:', err);
    return false;
  }
}

// Fetch interceptor: salva offline e tenta enviar depois
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url === SERVER_URL) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request.clone());
          if (response.ok) return response;
          throw new Error('Resposta do servidor não OK');
        } catch (error) {
          console.warn('[SW] Falha na requisição. Salvando localmente.');

          const clonedRequest = event.request.clone();
          const body = await clonedRequest.json();
          await saveFormData(body);

          if ('sync' in self.registration) {
            try {
              await self.registration.sync.register('sync-form-data');
              console.log('[SW] Sync registrado');
            } catch (err) {
              console.warn('[SW] Falha ao registrar sync:', err);
            }
          }

          return new Response(
            JSON.stringify({ message: 'Dados salvos offline. Serão enviados ao voltar a conexão.' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-form-data') {
    event.waitUntil(syncPendingForms());
  }
});

async function syncPendingForms() {
  const allData = await getAllPendingData();
  for (const item of allData) {
    const success = await sendToServer(item);
    if (!success) return; // Para em caso de erro
  }
  await clearPendingData();
  console.log('[SW] Todos os dados pendentes foram sincronizados');
}

// Instalação e ativação padrão
self.addEventListener('install', (event) => {
  console.log('[SW] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado');
  self.clients.claim();
});
