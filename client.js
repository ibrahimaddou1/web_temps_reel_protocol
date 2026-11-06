const WebSocket = require('ws');
const readline = require('node:readline');
const adresse = process.argv[2] || 'ws://localhost:3000/ws';
let connexion;
let attentePing;
let rl;

function attendrePing() {
  clearTimeout(attentePing);
  attentePing = setTimeout(() => {
    console.log('Connexion WebSocket perdue : aucun ping reçu');
    connexion.terminate();
  }, 20000);
}
try {
  connexion = new WebSocket(adresse, { handshakeTimeout: 15000 });
} catch (err) {
  console.error('Adresse WebSocket invalide :', err.message);
  process.exit(1);
}

connexion.on('open', () => {
  console.log('Connecté au serveur WebSocket', adresse);
  attendrePing();
});
connexion.on('ping', attendrePing);
connexion.on('close', () => {
  clearTimeout(attentePing);
  rl?.close();
  console.log('Connexion WebSocket fermée');
});
connexion.on('error', err => {
  console.error('Connexion WebSocket échouée :', err.message);
  process.exitCode = 1;
});
connexion.on('open', () => {
  rl = readline.createInterface({
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

process.on('SIGINT', () => {
  if (connexion.readyState === WebSocket.OPEN) {
    connexion.close();
  } else {
    connexion.terminate();
  }
});
