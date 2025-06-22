/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Execute fuzzy search (Fuse.js) over profile list.
 * - Convert search results into **SearchChoice[]** for `@inquirer/search`.
 * - Insert real `Separator` rows (header / borders / "No matches").
 *
 * Pure transformation layer; no I/O, no UI side-effects.
 */

import Fuse from 'fuse.js'
import { Separator } from '@inquirer/prompts'
import type { Layout, Profile } from './table-layout.js'
import type { SearchChoice, ChoiceObject } from './types.js'

export function createChoiceBuilder(rows: Profile[], layout: Layout) {
  const fuse = new Fuse(rows, {
    keys: ['profileName', 'accountId'],
    threshold: 0.4,
  })

  /* 追加: 先頭に 2 スペースを足すユーティリティ */
  const withIndent = (text: string): string => `${text}`

  /* 本物の Separator を返すヘルパ (indent 付き) */
  const separator = (text: string): SearchChoice =>
    new Separator(withIndent(text)) as unknown as SearchChoice

  /* No-matches 用・row→choice 変換も indent 付き */
  const toChoices = (matched: Profile[]): readonly SearchChoice[] => {
    const body: SearchChoice[] = matched.map(
      (p): ChoiceObject => ({
        name: withIndent(layout.formatRow(p)),
        value: p.profileName,
        short: p.profileName,
      }),
    )

    return [
      separator(layout.borderTop),
      separator(layout.header),
      separator(layout.borderMid),
      ...body,
      separator(layout.borderBot),
    ] as const
  }

  async function source(
    term: string | undefined,
    { signal }: { signal: AbortSignal },
  ): Promise<readonly SearchChoice[]> {
    if (signal.aborted) return []
    const matched = term ? fuse.search(term).map((r) => r.item) : rows
    return toChoices(matched)
  }

  return { source }
}
