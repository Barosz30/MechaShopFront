# Mechanical Shop – Frontend

Frontend sklepu rowerowego (Angular 21). Backend (NestJS) jest w **osobnym repozytorium** i hostowany na Renderze.

## Linki (live)

| Co | URL |
|----|-----|
| **Aplikacja (ten frontend)** | `https://<twoj-login>.github.io/<nazwa-tego-repo>/` |
| **Backend API** | https://mechanicalshopbackend.onrender.com |
| **Swagger** | https://mechanicalshopbackend.onrender.com/api |
| **GraphQL** | https://mechanicalshopbackend.onrender.com/graphql |

Adres GitHub Pages zależy od nazwy tego repozytorium. Jeśli repo nazywa się np. `mechanical-shop`, to adres to:  
`https://<twoj-login>.github.io/mechanical-shop/`  
Upewnij się, że w `package.json` w skrypcie `build:prod` parametr `--base-href` ma tę samą ścieżkę (np. `--base-href /mechanical-shop/`).

## Konto demo (dla rekruterów)

- **Login:** `demo`  
- **Hasło:** `Demo123!`  

(Konto jest tworzone w backendzie przez `npm run seed` – backend w osobnym repo.)

## Uruchomienie lokalne

```bash
npm install
npm start
```

Aplikacja: http://localhost:4200. W trybie dev frontend korzysta z `http://localhost:3000` (zmienna w `src/environments/environment.ts`). Backend uruchamiasz osobno z drugiego repo.

## Deploy na GitHub Pages

1. W ustawieniach repozytorium: **Settings → Pages** → Build and deployment: **GitHub Actions**.
2. Przy pushu na gałąź `main` workflow zbuduje projekt i wdroży go na Pages.
3. Alternatywnie lokalnie: `npm run deploy` (wymaga `angular-cli-ghpages` i uprawnień do repo).

## Backend (osobne repo)

- API jest hostowane na Renderze.
- Aby frontend z GitHub Pages mógł wywoływać API, w serwisie na Renderze ustaw zmienną **CORS_ORIGIN** na URL tego frontendu, np. `https://<twoj-login>.github.io` (lub pełny URL z ścieżką; wiele adresów oddziel przecinkami).

## Tech stack (frontend)

Angular 21, SCSS, GraphQL (HTTP), JWT, RxJS.
