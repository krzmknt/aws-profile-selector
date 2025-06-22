import { createLayout } from '../src/table-layout'

describe('table-layout', () => {
  it('calculates width & formats rows', () => {
    const rows = [
      { profileName: 'aaa', accountId: '1' },
      { profileName: 'long-profile', accountId: '222' },
    ]
    const layout = createLayout(rows)

    expect(layout.borderTop).toMatch(/┐$/)
    expect(layout.header).toContain('Profile')

    const rendered = layout.formatRow(rows[1])
    expect(rendered).toContain('long-profile')
    // 端に │ があるか
    expect(rendered.startsWith('│')).toBe(false) // indent 付けていない
    expect(rendered.trim()).toContain('long-profile')
  })
})
