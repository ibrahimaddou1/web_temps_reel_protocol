# Protocole

Les deux ordinateurs doivent pouvoir joindre le port annoncé. Chaque POST contient l’en-tête Origin du serveur qui l’envoie. A envoie /syn à B, B enregistre le statut syn pour A et envoie /syn-ack à A. A renvoie /ack à B, qui passe le statut à connecté. Les trois appels renvoient 200 en cas de succès.

Une origine absente ou invalide sur /syn ou /syn-ack donne 400. 

Un /ack sans statut syn pour son origine donne 403, y compris après une poignée de main déjà terminée. 

Une erreur interne ou un appel au camarade qui échoue donne 500. 

Les statuts sont conservés en mémoire jusqu’au redémarrage.
