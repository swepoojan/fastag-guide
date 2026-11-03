// Reads the site's base URL for build scripts: VITE_SITE_URL from the environment, else from .env.
import { readFileSync, existsSync } from 'node:fs'

function fromDotEnv() {
  const file = new URL('../.env', import.meta.url)
  if (!existsSync(file)) return undefined
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.trim().startsWith('VITE_SITE_URL='))
  return line?.split('=').slice(1).join('=').trim()
}

const raw = process.env.VITE_SITE_URL || fromDotEnv()
if (!raw) throw new Error('VITE_SITE_URL is not set. Add it to .env or the build environment.')
export const SITE_URL = raw.replace(/\/+$/, '')
