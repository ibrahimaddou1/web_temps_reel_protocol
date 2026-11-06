const WebSocket = require('ws');
const readline = require('node:readline');
const adresse = process.argv[2] || 'ws://localhost:3000/ws';
let connexion;
try {
  connexion = new WebSocket(adresse, { handshakeTimeout: 15000 });
} catch (err) {
  console.error('Adresse WebSocket invalide :', err.message);
  process.exit(1);
}

connexion.on('open', () => console.log('Connecté au serveur WebSocket', adresse));
connexion.on('close', () => console.log('Connexion WebSocket fermée'));
connexion.on('error', err => {
  console.error('Connexion WebSocket échouée :', err.message);
  process.exitCode = 1;
});
// Envoi et réception des messages WebSocket
connexion.on('open', () => {
  const readline = require('node:readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Écris un message :');

  rl.on('line', (texte) => {
    if (connexion.readyState !== WebSocket.OPEN) {
      console.log('Connexion indisponible');
      return;
    }

    const message = {
      action: 'bonjour',
      payload: {
        texte: texte
      }
    };

    connexion.send(JSON.stringify(message));

    console.log('Message envoyé :', message);
  });
});

connexion.on('message', (data) => {
  console.log('Message reçu du serveur :', data.toString());
});

process.on('SIGINT', () => connexion.close());
