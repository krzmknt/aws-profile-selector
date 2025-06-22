/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Wrap `@inquirer/search` prompt with common UX:
 *   - ↑/↓ navigation, ESC abort, pageSize handling.
 * - Expose `runSelector()` that returns the chosen profile **or** `undefined`
 *   when the user cancels.
 *
 * UI only; delegates choice generation to `choice-builder`.
 */

import readline from 'node:readline'
import chalk from 'chalk'
import searchPrompt from '@inquirer/search'
import type { SearchChoice } from './types.js'

export interface SelectorOptions {
  pageSize: number
  choiceSource: (
    term: string | undefined,
    ctx: { signal: AbortSignal },
  ) => readonly SearchChoice[] | Promise<readonly SearchChoice[]>
}

/**
 * 対話 UI を実行し、選択された profileName を返す
 * ESC キャンセル時は undefined
 */
export async function runSelector(opts: SelectorOptions): Promise<string | undefined> {
  const ac = new AbortController()

  /* ESC でキャンセル -------------------------------- */
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode?.(true)
  const onKey = (_: unknown, k: readline.Key) => k?.name === 'escape' && ac.abort()
  process.stdin.on('keypress', onKey)

  try {
    return await searchPrompt(
      {
        message: chalk.cyanBright('Search:'),

        pageSize: opts.pageSize,
        /*  型衝突を避けるため any キャスト  */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        source: opts.choiceSource as any,
      },
      { signal: ac.signal },
    )
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortPromptError') return undefined
    throw e
  } finally {
    process.stdin.off('keypress', onKey)
    process.stdin.setRawMode?.(false)
  }
}
