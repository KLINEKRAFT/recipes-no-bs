# Recipes with No Bullshit

Recipes stripped clean. No life stories. No ads. Just ingredients and steps.

## How It Works

1. Browse by category or search for any recipe
2. Click a recipe card — the app fetches the source page via the Anthropic API
3. Claude strips out all the filler and returns just the recipe
4. Ingredients and steps displayed in a clean editorial layout

## Tech Stack

- **Frontend**: React + Vite
- **Hosting**: Cloudflare Pages
- **API Proxy**: Cloudflare Pages Function (keeps API key server-side)
- **AI**: Anthropic Claude Sonnet with web search

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get an Anthropic API key

Go to [console.anthropic.com](https://console.anthropic.com) and create an API key.

### 3. Local development

Create a `.dev.vars` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then run:

```bash
npx wrangler pages dev -- npm run dev
```

This runs Vite + the Cloudflare Function locally.

### 4. Deploy to Cloudflare Pages

1. Push to GitHub
2. In Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Go to Settings → Environment Variables and add:
   - `ANTHROPIC_API_KEY` = your API key
5. Deploy

### 5. Custom domain (optional)

In Cloudflare Pages → Custom domains, add your domain.
If using Cloudflare DNS, it'll configure automatically.

## Project Structure

```
recipes-no-bs/
  functions/
    api/
      recipes.js      ← Cloudflare Function (API proxy)
  src/
    App.jsx            ← Main React app
    main.jsx           ← Entry point
  index.html           ← HTML shell
  package.json
  vite.config.js
```
