const WebSocket = require('ws');

const adresse = process.argv[2] || 'ws://localhost:3000/ws';
let connexion;
try {
  connexion = new WebSocket(adresse, { handshakeTimeout: 15000 });
} catch (err) {
  console.error('Adresse WebSocket invalide :', err.message);
  process.exit(1);
}

connexion.on('open', () => {
  console.log('Connecté au serveur WebSocket', adresse);
});
connexion.on('close', () => {
  console.log('Connexion WebSocket fermée');
});
connexion.on('error', err => {
  console.error('Connexion WebSocket échouée :', err.message);
  process.exitCode = 1;
});

process.on('SIGINT', () => {
  if (connexion.readyState === WebSocket.OPEN) {
    connexion.close();
  } else {
    connexion.terminate();
  }
});
