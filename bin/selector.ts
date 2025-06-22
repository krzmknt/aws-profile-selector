#!/usr/bin/env node

/**
 * @packageDocumentation
 *
 * ## Responsibility
 * - CLI entry point (`#!/usr/bin/env node`).
 * - Glue together:
 *   1. Read & parse AWS config (`config-reader`)
 *   2. Build table layout (`table-layout`)
 *   3. Create fuzzy choice source (`choice-builder`)
 *   4. Run interactive UI (`selector-ui`)
 * - Output either `export AWS_PROFILE=…` or raw profile name (`--pure`).
 *
 * All heavy lifting is delegated to src/ modules; keeps main thin.
 */

import fs from 'node:fs/promises'
import { Command } from 'commander'
import { createChoiceBuilder } from '../src/choice-builder.js'
import { createLayout, type Profile } from '../src/table-layout.js'
import { readAwsConfig } from '../src/config-reader.js'
import { runSelector } from '../src/selector-ui.js'

const cli = new Command()
  .option('--pure', 'Print ONLY the selected profile name')
  .option('--out <file>', 'Write the selected profile name to <file>')
  .parse()

const { pure, out: outFile } = cli.opts<{ pure: boolean; out?: string }>()

try {
  const config = readAwsConfig()
  const profiles: Profile[] = Object.entries(config)
    .map(([profileName, kv]) => ({
      profileName,
      accountId: kv.sso_account_id ?? 'N/A',
    }))
    .sort((a, b) => a.profileName.localeCompare(b.profileName))

  if (profiles.length === 0) {
    console.error('No profiles found.')
    process.exit(1)
  }

  const layout = createLayout(profiles)
  const { source } = createChoiceBuilder(profiles, layout)

  const picked = await runSelector({ pageSize: 20, choiceSource: source })

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
