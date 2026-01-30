#!/usr/bin/env node

/**
 * @packageDocumentation
 *
 * ## Responsibility
 * - CLI entry point (`#!/usr/bin/env node`).
 * - Glue together:
 *   1. Read & parse AWS config (`config-reader`)
 *   2. Build table layout (`table-layout`)
 *   3. Create fuzzy searcher (`choice-builder`)
 *   4. Run interactive UI (`selector-ui`)
 * - Output either `export AWS_PROFILE=…` or raw profile name (`--pure`).
 *
 * All heavy lifting is delegated to src/ modules; keeps main thin.
 */

import fs from 'node:fs/promises'
import { createFuzzySearcher } from '../src/choice-builder.js'
import { createLayout, type Profile } from '../src/table-layout.js'
import { readAwsConfig } from '../src/config-reader.js'
import { runSelector } from '../src/selector-ui.js'
import { isSessionValid } from '../src/session-checker.js'

/** Simple CLI argument parser */
function parseArgs(): { pure: boolean; out?: string } {
  const args = process.argv.slice(2)
  let pure = false
  let out: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pure') {
      pure = true
    } else if (args[i] === '--out' && args[i + 1]) {
      out = args[++i]
    }
  }

  return { pure, out }
}

const { pure, out: outFile } = parseArgs()

try {
  const config = readAwsConfig()
  const profiles: Profile[] = Object.entries(config)
    .map(([profileName, kv]) => ({
      profileName,
      accountId: kv.sso_account_id ?? 'N/A',
      hasValidSession: isSessionValid(kv.sso_session),
    }))
    .sort((a, b) => a.profileName.localeCompare(b.profileName))

  if (profiles.length === 0) {
    console.error('No profiles found.')
    process.exit(1)
  }

  const layout = createLayout(profiles)
  const searcher = createFuzzySearcher(profiles)
  const currentProfile = process.env.AWS_PROFILE

  const picked = await runSelector({ searcher, layout, pageSize: 20, currentProfile })

  if (picked === undefined) {
    console.log('Cancelled.')
    process.exit(0)
  }

  if (outFile) {
    await fs.writeFile(outFile, picked, 'utf8')
  } else {
    console.log(pure ? picked : `export AWS_PROFILE=${picked}`)
  }
  process.exit(0)
} catch (err) {
  console.error((err as Error).message)
  process.exit(1)
}
