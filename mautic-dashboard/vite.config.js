import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Runs the Vercel-style /api/*.js handlers inside the Vite dev server, so
// `npm run dev` works without the Vercel CLI. Production still uses Vercel.
function vercelApiDev() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace(/^\/+|\/+$/g, '')
        const file = path.resolve('api', `${name}.js`)
        if (!name || name.startsWith('_') || !fs.existsSync(file)) return next()

        req.query = Object.fromEntries(url.searchParams)
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (body) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
          return res
        }

        try {
          const { default: handler } = await server.ssrLoadModule(file)
          await handler(req, res)
        } catch (err) {
          res.status(500).json({ error: err.message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose Mautic + Redis vars from .env to the API handlers (server-side only).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ['MAUTIC_', 'KV_', 'UPSTASH_']))

  return {
    plugins: [react(), vercelApiDev()],
  }
})
