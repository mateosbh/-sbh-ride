# SBH Ride — V1.0

MVP web responsive d'une plateforme de transport premium à Saint-Barthélemy. L'application propose trois parcours interactifs : commande client, outil chauffeur et administration.

## Démarrage

Prérequis : Node.js 20 ou supérieur.

```bash
npm install
npm run dev
```

Ouvrir ensuite [http://localhost:5173](http://localhost:5173). Pour tester la version de production :

```bash
npm run build
npm run preview
```

## Parcours disponibles

- **Client / Commander** : choix de lieux SBH, déplacement du départ sur la carte, estimation, commande et simulation complète de la course.
- **Chauffeur** : connexion de démonstration, disponibilité, réception et gestion d'une course jusqu'à sa fin.
- **Admin** : indicateurs, chauffeurs (suspension/réactivation), courses et gestion des lieux. Les lieux ajoutés sont persistés dans le navigateur et immédiatement recherchables côté client.

## Architecture

- React + TypeScript + Vite
- Leaflet / OpenStreetMap, sans clé API ni service cartographique payant
- Données simulées et persistance locale (`localStorage`)
- Structure prête à remplacer les sources locales par Supabase, un moteur d'itinéraire et des flux GPS temps réel

## Limites de la V1

L'authentification, le paiement, la tarification dynamique, les notifications, le calcul routier et le GPS sont simulés. La ligne affichée sur la carte est une prévisualisation directe entre les points et non un itinéraire routier.
