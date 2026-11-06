const express = require('express');
const axios = require('axios');

function origine(valeur) {
  try {
    const url = new URL(valeur);
    if (['http:', 'https:'].includes(url.protocol) && url.pathname === '/' &&
        !url.search && !url.hash && !url.username && !url.password) return url.origin;
  } catch {
    console.log('origine absente', req.get('Origin'));
  }
  return null;
}

const port = Number(process.env.PORT || 3000);
const locale = origine(process.env.PUBLIC_URL || `http://localhost:${port}`);

function envoyer(pair, route, timeout) {
  return axios.post(pair + route, null, {
    headers: { Origin: locale }, timeout, maxRedirects: 0,
  });
}
const app = express();
const pairs = new Map();

app.post('/syn', async (req, res) => {
  const pair = origine(req.get('Origin'));
  if (!pair) return res.sendStatus(400);
  const tentative = { statut: 'syn' };
  pairs.set(pair, tentative);
  try {
    await envoyer(pair, '/syn-ack', 8000);
    res.sendStatus(200);
  } catch (err) {
    if (pairs.get(pair) === tentative && tentative.statut === 'syn') pairs.delete(pair);
    throw err;
  }
});

app.post('/syn-ack', async (req, res) => {
  const pair = origine(req.get('Origin'));
  if (!pair) return res.sendStatus(400);
  await envoyer(pair, '/ack', 4000);
  res.sendStatus(200);
});

app.post('/ack', (req, res) => {
  const etat = pairs.get(origine(req.get('Origin')));
  if (etat?.statut !== 'syn') return res.sendStatus(403);
  etat.statut = 'connecté';
  console.log('Poignée de main terminée : ', req.get('Origin'));
  res.sendStatus(200);
});

app.use((err, req, res, next) => {
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
      .then(() => console.log('Handshake terminée avec : ', pair))
      .catch(err => { console.error(err.message); process.exitCode = 1; });
  }
} else {
  app.listen(port, '0.0.0.0', () => console.log('serveur prêt :', locale));
}
