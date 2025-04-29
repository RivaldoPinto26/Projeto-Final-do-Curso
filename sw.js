// sw.js
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

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

// Tentativa de envio ao servidor
async function sendToServer(data) {
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Erro na resposta do servidor');
    }

    console.log('[SW] Dados enviados com sucesso:', data);
    return true;
  } catch (err) {
    console.error('[SW] Erro ao enviar dados:', err);
    return false;
  }
}

// Sincronização offline
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

// Recebe dados do app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORM_SUBMIT') {
    const formData = event.data.payload;

    if (self.navigator.onLine) {
      sendToServer(formData).then((success) => {
        if (!success) saveFormData(formData);
      });
    } else {
      console.log('[SW] Offline. Salvando dados no IndexedDB');
      saveFormData(formData);
    }
  }
});

// Instalação padrão
self.addEventListener('install', (event) => {
  console.log('[SW] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado');
  self.clients.claim();
});
