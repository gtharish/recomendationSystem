# Goodfind — AI Product Recommender

A small React app that turns a natural-language shopping preference into product recommendations from a curated list. The browser sends the preference and products to an Express backend; the backend asks Gemini for matching product IDs, validates those IDs against the submitted list, and returns them for the React app to filter and display.

## Features

- Responsive product search with suggested prompts, loading and error states, and an empty-results state
- Ten sample products across phones, laptops, headphones, and tablets, priced in Indian rupees
- Gemini recommendations constrained to IDs from the supplied product list
- API key kept on the backend

## Tech stack

React, Vite, JavaScript, Tailwind CSS, Node.js, Express, Gemini API, dotenv, and CORS.

## Project structure

```text
.gitignore
client/
  index.html
  .env.example         Local API URL template
  vite.config.js       Local API proxy and React plugin
  tailwind.config.js
  postcss.config.js
  package.json
  src/App.jsx          Main interface and recommendation flow
  src/main.jsx         React entry point
  src/index.css        Tailwind and base styles
  src/products.js      Sample product catalog
server/
  index.js             Health and recommendation endpoints
  package.json
  .env                 Local secrets (ignored by Git)
  .env.example         Environment variable template
README.md
```

## Environment setup

In `server/.env`, add your Gemini API key from Google AI Studio. The file is ignored by Git. `client/.env` points local development at the backend on port 5000 and is also ignored by Git.

```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
PORT=5000
```

`server/.env.example` shows the required variables. For a deployed frontend, set `VITE_API_URL` to the backend's public origin (for example, `https://your-api.example.com`) in the frontend hosting settings. Set `CLIENT_ORIGIN` on the backend to the deployed frontend origin to restrict CORS.

## Run locally

In one terminal:

```bash
cd server
npm install
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the client terminal. Its development proxy forwards `/api` requests to the backend on port 5000. The backend health endpoint is available at `/api/health`.

## Recommendation flow

1. The user enters a preference in the React app.
2. The client posts the preference and catalog to `/api/recommend`.
3. The backend validates the request, asks Gemini for a JSON object containing product IDs, and checks every ID against the submitted catalog.
4. React filters its product list by the returned IDs and renders matching cards.

## Deployment

Deploy `client` as a Vercel project with the root directory set to `client`, build command `npm run build`, and output directory `dist`. Set `VITE_API_URL` to the public origin of the deployed API before building.

Deploy `server` as a Node service with its root directory set to `server` and start command `npm start`. Configure `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `PORT` (if required by the host), and `CLIENT_ORIGIN` in the hosting provider's environment settings. If the primary Gemini model is temporarily unavailable, the backend retries once with the fallback model. The backend exposes `GET /api/health` for deployment checks. The frontend and backend may be deployed separately; the frontend uses `VITE_API_URL` to reach the API.

