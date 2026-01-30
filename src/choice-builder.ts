/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Execute fuzzy search (Fuse.js) over profile list.
 * - Return filtered profile list based on search term.
 *
 * Pure transformation layer; no I/O, no UI side-effects.
 */

import Fuse from 'fuse.js'
import type { Profile } from './table-layout.js'

export interface FuzzySearcher {
  search: (term: string) => Profile[]
  getAll: () => Profile[]
}

export function createFuzzySearcher(rows: Profile[]): FuzzySearcher {
  const fuse = new Fuse(rows, {
    keys: ['profileName', 'accountId'],
    threshold: 0.4,
  })

  const search = (term: string): Profile[] => {
    if (!term) return rows
    return fuse.search(term).map((r) => r.item)
  }

  const getAll = (): Profile[] => rows

  return { search, getAll }
}
