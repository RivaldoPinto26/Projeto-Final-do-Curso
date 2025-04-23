import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Corrigir __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho completo para o arquivo
const FILE_PATH = path.join(__dirname, 'data.txt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/submit', (req, res) => {
  const data = req.body;

  console.log('Recebido do frontend:', data);

  const line = `${new Date().toISOString()} - ${JSON.stringify(data)}\n`;

  fs.appendFile(FILE_PATH, line, (err) => {
    if (err) {
      console.error('Erro ao salvar os dados:', err);
      return res.status(500).send('Erro ao salvar os dados.');
    }
    res.send('Dados salvos com sucesso.');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor esta rodar em http://localhost:${PORT}`);
});
