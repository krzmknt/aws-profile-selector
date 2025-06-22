import { createChoiceBuilder } from '../src/choice-builder'
import { createLayout } from '../src/table-layout'

const length = 10
const rows = Array.from({ length }, (_, i) => ({
  profileName: `${i}.example.com`,
  accountId: `012345678901${i}`,
}))

describe('choice-builder', () => {
  const layout = createLayout(rows)
  const { source } = createChoiceBuilder(rows, layout)

  it('returns all rows when term is undefined', async () => {
    const list = await source(undefined, { signal: new AbortController().signal })
    // 区切り(上部3) + body3 + 下部2 = 8
    expect(list.length).toBe(length + 5)
  })

  it('filters rows by fuzzy term', async () => {
    const list = await source('02', { signal: new AbortController().signal })
    const names = list
      .filter((i) => typeof i !== 'string' && 'value' in i)
      .map((i) => (i as any).value)
    expect(names).toEqual(['02.example'])
  })

  it('returns "No matches" when nothing matched', async () => {
    const list = await source('zzz', { signal: new AbortController().signal })
    expect(
      list.some(
        (i) => typeof i !== 'string' && 'line' in i && (i as any).line.includes('No matches'),
      ),
    ).toBe(true)
  })
})
