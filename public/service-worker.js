const OFFLINE_DATA_KEY = 'offlineData'; // Chave para armazenar dados offline no localStorage

// Função para enviar dados offline para o servidor
async function sendOfflineData() {
  const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '[]');
  if (offlineData.length > 0) {
    try {
      // Envia cada item dos dados offline para o servidor
      await Promise.all(
        offlineData.map(async (data) => {
          await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
        })
      );

      // Remove os dados do localStorage após sincronização bem-sucedida
      localStorage.removeItem(OFFLINE_DATA_KEY);
      console.log('Dados offline sincronizados com sucesso');
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
    }
  }
}

// Evento de sincronização: Sincroniza dados offline quando online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    console.log('Sincronizando dados offline...');
    event.waitUntil(sendOfflineData());
  }
});

// Evento de fetch: Intercepta solicitações de rede
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Se for uma solicitação para a API, tenta enviar os dados
  if (request.url.includes('https://jsonplaceholder.typicode.com/posts')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a solicitação for bem-sucedida, tenta sincronizar dados offline
          sendOfflineData();
          return response;
        })
        .catch(() => {
          // Se offline, retorna uma resposta de fallback
          return new Response(JSON.stringify({ message: 'Você está offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
  }
});