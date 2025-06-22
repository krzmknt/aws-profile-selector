/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Parse **~/.aws/config** file.
 * - Return a map `{ profileName → { key: value, … } }`.
 * - No UI / formatting logic; pure data access.
 *
 * Throws `Error` when the config file is missing.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** 1 プロファイルのキー→値マップ */
export type ProfileAttributes = Record<string, string>
/** profileName→Attributes のマップ */
export type ProfileMap = Record<string, ProfileAttributes>

/**
 * ~/.aws/config を読み取り {@link ProfileMap} へ変換。
 * @throws ファイルが無ければ Error
 */
export function readAwsConfig(): ProfileMap {
  const cfgPath = path.join(os.homedir(), '.aws', 'config')
  if (!fs.existsSync(cfgPath)) {
    throw new Error(`Config not found: ${cfgPath}`)
  }

  const map: ProfileMap = {}
  let current: string | null = null

  for (const line of fs.readFileSync(cfgPath, 'utf8').split(/\r?\n/)) {
    const sec = line.match(/^\s*\[profile\s+([^\]]+)]/i)
    if (sec) {
      current = sec[1].trim()
      map[current] = {}
      continue
    }
    if (!current) continue

    const kv = line.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/)
    if (kv) map[current][kv[1].trim()] = kv[2].trim()
  }
  return map
}
