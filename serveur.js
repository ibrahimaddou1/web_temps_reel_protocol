
const express = require('express');
const axios = require('axios');

function origine(valeur) {
  try {
    const url = new URL(valeur);
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    ) {
      return url.origin;
    }
  } catch {
    console.log('origine absente');
  }

  return null;
}

const port = Number(process.env.PORT || 3000);
const locale = origine(process.env.PUBLIC_URL || `http://localhost:${port}`);

function envoyer(pair, route, timeout) {
  return axios.post(pair + route, null, {
    headers: { Origin: locale },
    timeout,
    maxRedirects: 0,
  });
}
const app = express();
app.use(express.json());
const pairs = new Map();
const actionsUniques = new Set();

app.post('/syn', async (req, res) => {
  const pair = origine(req.get('Origin'));
  if (!pair) return res.sendStatus(400);
  const tentative = { statut: 'syn' };
  pairs.set(pair, tentative);
  try {
    await envoyer(pair, '/syn-ack', 8000);
    res.sendStatus(200);
  } catch (err) {
    if (
      pairs.get(pair) === tentative &&
      tentative.statut === 'syn'
    ) {
      pairs.delete(pair);
    }

    throw err;
  }
});
app.post('/syn-ack', async (req, res) => {
  const pair = origine(req.get('Origin'));
  if (!pair) return res.sendStatus(400);
  await envoyer(pair, '/ack', 4000);
  pairs.set(pair, { statut: 'connecté' });
  res.sendStatus(200);
});

// ACK
app.post('/ack', (req, res) => {
  const pair = origine(req.get('Origin'));
  const etat = pairs.get(pair);
  if (etat?.statut !== 'syn') {
    return res.sendStatus(403);
  }
  etat.statut = 'connecté';
  console.log('Poignée de main terminée :', pair);
  res.sendStatus(200);
});

app.post('/forget', (req, res) => {
  const pair = origine(req.get('Origin'));
  if (!pair) return res.sendStatus(400);
  if (req.body?.action !== 'forget') {
    return res.sendStatus(400);
  }
  const etat = pairs.get(pair);
  if (etat?.statut !== 'connecté') {
    return res.sendStatus(403);
  }
  pairs.delete(pair);
  console.log('Serveur oublié :', pair);
  res.sendStatus(204);
});
app.post('/ingress', (req, res) => {
  const pair = origine(req.get('Origin'));
  const message = req.body;
  if (
    !pair || !message || typeof message !== 'object' || Array.isArray(message) ||
    typeof message.action !== 'string' || !message.action.trim() ||
    (message.payload !== undefined &&
      (!message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)))
  ) {
    return res.sendStatus(400);
  }
  const etat = pairs.get(pair);
  if (etat?.statut !== 'connecté') return res.sendStatus(403);
  if (!etat.actionsIngerees) etat.actionsIngerees = new Set();
  if (actionsUniques.has(message.action) && etat.actionsIngerees.has(message.action)) {
    return res.sendStatus(409);
  }
  console.log('Message reçu de', pair, message);
  etat.actionsIngerees.add(message.action);
  res.sendStatus(201);
});

app.get('/health', (req, res) => res.sendStatus(204));

app.get('/pong', (req, res) => {
  const pair = origine(req.get('Origin'));
  if (pairs.get(pair)?.statut !== 'connecté') return res.sendStatus(403);
  res.sendStatus(204);
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.sendStatus(400);
  console.error(req.path, err.message);
  res.sendStatus(500);
});
if (process.argv[2] === 'connect') {
  const pair = origine(process.argv[3]);

  if (!pair) {
    console.error('erreur connect');
    process.exitCode = 1;
  } else {
    envoyer(pair, '/syn', 12000)
      .then(() => {
        console.log('Handshake terminée avec :', pair);
      })
      .catch(err => {
        console.error(err.message);
        process.exitCode = 1;
      });
  }
} else {
  app.listen(port, '0.0.0.0', () => {
    console.log('serveur prêt :', locale);
  });
}
