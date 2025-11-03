import express from 'express';
import { URLSearchParams } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Credenciales (mantener en entorno si es necesario)
const UID = '13561';
const TOKEN_ID = 'fIBAnaMl96jrfCEI';
const API_BASE_URL = 'https://www.stands4.com/services/v2/lyrics.php';

// Habilitar CORS básico para desarrollo
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/lyrics', async (req, res) => {
  try {
    const { term = '', artist = '' } = req.query;
    const params = new URLSearchParams();
    params.set('uid', UID);
    params.set('tokenid', TOKEN_ID);
    params.set('term', term);
    if (artist) params.set('artist', artist);
    params.set('format', 'xml');

    const url = `${API_BASE_URL}?${params.toString()}`;

    const upstream = await fetch(url);
    const text = await upstream.text();

    // Reenviar exactamente el XML/JSON recibido
    // Detectar si es XML o JSON por el inicio del contenido
    if (text.trim().startsWith('<')) {
      res.type('application/xml').send(text);
    } else {
      // Intentar parsear JSON
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch (e) {
        res.type('text').send(text);
      }
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'proxy_error' });
  }
});

app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`));
