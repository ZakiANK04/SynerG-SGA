# SynerG SGA

Plateforme de demo pour la Societe Generale Algerie :
- frontend React + Vite dans `Premium Banking Dashboard Design/`
- backend FastAPI dans `main.py`
- donnees et sorties modele locales en `csv` et `json`

## Structure

- `Premium Banking Dashboard Design/`: SPA React/Vite
- `main.py`: API FastAPI
- `df_final_features.csv`: features et KPIs clients
- `client_ai_insights.json`: recommandations, personas et fiches visite
- `model_metrics.json`, `exported_model_manifest.json`: resultats modele
- `catboost_models/`: artefacts modeles

## Lancement local

### Backend

```bash
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

API locale par defaut :

```text
http://127.0.0.1:8000
```

### Frontend

```bash
cd "Premium Banking Dashboard Design"
npm install
npm run dev
```

Optionnel :

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Deploiement recommande

### Backend sur Render

Ce repo contient deja `render.yaml`.

Service :
- runtime : Python
- build : `pip install -r requirements.txt`
- start : `uvicorn main:app --host 0.0.0.0 --port $PORT`

Variables utiles :
- aucune obligatoire pour les KPIs et recommandations statiques
- `OLLAMA_BASE_URL` et `OLLAMA_MODEL` inutiles si vous ne deployeez pas le pitch local

### Frontend sur Vercel

Ce repo contient deja `vercel.json` pour builder depuis la racine du repo.

Variables :

```text
VITE_API_BASE_URL=https://votre-backend.onrender.com
```

Le build Vercel s'appuie sur le `package.json` racine :
- `postinstall` installe les dependances frontend du sous-dossier
- `build` lance `vite build` dans `Premium Banking Dashboard Design/`

## Pitch local Ollama

Le module de pitch local est desactive par defaut en production.

Pour le re-activer :

```text
VITE_ENABLE_LOCAL_PITCH=true
```

Sans cette variable, l'application reste deployable sans Ollama.

## Endpoints utiles

- `GET /api/clients`
- `GET /api/clients/{client_id}`
- `GET /api/insights/{client_id}`
- `GET /api/manager/clients`
- `POST /api/feedback`

## Notes de prod

- les fichiers `csv/json` sont embarques avec l'application backend
- les ecritures sur `feedback_logs.csv` et `bandit_state.json` sont acceptables pour une demo, mais pas ideales pour une prod durable
- pour une vraie persistance, branchez une base de donnees
