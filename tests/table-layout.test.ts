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

    // Test unselected row
    const unselected = layout.formatUnselectedRow(rows[1])
    expect(unselected).toContain('long-profile')
    expect(unselected.trim()).toContain('long-profile')

    // Test selected row
    const selected = layout.formatSelectedRow(rows[1])
    expect(selected).toContain('long-profile')
    expect(selected).toContain('┃') // thick border for selected
  })
})
