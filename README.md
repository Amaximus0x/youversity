# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Deployment Targets: Vercel, Replit, Capacitor

This project supports deploying to **Vercel**, **Replit**, and **Capacitor** (for mobile) using the `ADAPTER_TARGET` environment variable.

## How to Switch Deployment Targets

- **Vercel:**
  - Set `ADAPTER_TARGET=vercel` before building/deploying.
  - Vercel will use the Vercel adapter automatically if this is set in the dashboard or your CI/CD pipeline.

- **Replit:**
  - Set `ADAPTER_TARGET=replit` before building/deploying.
  - Replit will use the Node adapter for server-side support.

- **Capacitor (Mobile):**
  - Set `ADAPTER_TARGET=capacitor` before building for mobile.
  - This will use the static adapter for a fully static build.

## Example Commands

```bash
# For Vercel
ADAPTER_TARGET=vercel npm run build

# For Replit
ADAPTER_TARGET=replit npm run build

# For Capacitor (Mobile)
ADAPTER_TARGET=capacitor npm run build
```

## Notes
- You can set the environment variable in your deployment platform's dashboard or in your local shell before building.
- No code changes are needed to switch deployment targets—just set the variable and build!
