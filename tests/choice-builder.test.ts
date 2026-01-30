import { createFuzzySearcher } from '../src/choice-builder'

const length = 10
const rows = Array.from({ length }, (_, i) => ({
  profileName: `${i.toString().padStart(2, '0')}.example`,
  accountId: `012345678901${i}`,
  hasValidSession: i % 2 === 0,
}))

describe('choice-builder', () => {
  const searcher = createFuzzySearcher(rows)

  it('returns all rows when term is empty', () => {
    const list = searcher.search('')
    expect(list.length).toBe(length)
  })

  it('returns all rows via getAll', () => {
    const list = searcher.getAll()
    expect(list.length).toBe(length)
  })

  it('filters rows by fuzzy term', () => {
    const list = searcher.search('02')
    const names = list.map((p) => p.profileName)
    expect(names).toEqual(['02.example'])
  })

  it('returns empty array when nothing matched', () => {
    const list = searcher.search('zzz')
    expect(list.length).toBe(0)
  })
})
