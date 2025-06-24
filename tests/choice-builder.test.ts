import { createChoiceBuilder } from '../src/choice-builder'
import { createLayout } from '../src/table-layout'

const length = 10
const rows = Array.from({ length }, (_, i) => ({
  profileName: `${i.toString().padStart(2, '0')}.example`,
  accountId: `012345678901${i}`,
}))

describe('choice-builder', () => {
  const layout = createLayout(rows)
  const { source } = createChoiceBuilder(rows, layout)

  it('returns all rows when term is undefined', async () => {
    const list = await source(undefined, { signal: new AbortController().signal })
    // borderTop, header, borderMid, body(10), borderBot = 14
    expect(list.length).toBe(length + 4)
  })

  it('filters rows by fuzzy term', async () => {
    const list = await source('02', { signal: new AbortController().signal })
    const names = list
      .filter((i) => typeof i !== 'string' && 'value' in i)
      .map((i) => (i as any).value)
    expect(names).toEqual(['02.example'])
  })

  it('returns empty body when nothing matched', async () => {
    const list = await source('zzz', { signal: new AbortController().signal })
    // borderTop, header, borderMid, borderBot (no body) = 4
    expect(list.length).toBe(4)
  })
})
