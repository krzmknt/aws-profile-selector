/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Check AWS SSO session validity for profiles
 * - Read cached session tokens from ~/.aws/sso/cache/
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

interface SsoCacheEntry {
  startUrl: string
  region: string
  accessToken: string
  expiresAt: string
}

/**
 * Check if a profile has a valid SSO session
 * @param ssoSession The SSO session name from the profile config
 * @returns true if session is valid, false otherwise
 */
export function isSessionValid(ssoSession: string | undefined): boolean {
  if (!ssoSession) return false

  try {
    const cacheDir = path.join(os.homedir(), '.aws', 'sso', 'cache')
    if (!fs.existsSync(cacheDir)) return false

    // Cache file name is SHA1 hash of sso_session name
    const hash = crypto.createHash('sha1').update(ssoSession).digest('hex')
    const cacheFile = path.join(cacheDir, `${hash}.json`)

    if (!fs.existsSync(cacheFile)) return false

    const cacheContent = fs.readFileSync(cacheFile, 'utf8')
    const cache: SsoCacheEntry = JSON.parse(cacheContent)

    if (!cache.expiresAt) return false

    // Check if session has not expired
    const expiresAt = new Date(cache.expiresAt)
    const now = new Date()

    return expiresAt > now
  } catch {
    return false
  }
}
