import { createLayout } from '../src/table-layout'
import { stripAnsi } from '../src/ansi'

describe('table-layout', () => {
  it('calculates width & formats rows', () => {
    const rows = [
      { profileName: 'aaa', accountId: '1', hasValidSession: false },
      { profileName: 'long-profile', accountId: '222', hasValidSession: true },
    ]
    const layout = createLayout(rows)

    // Check border contains expected characters (strip ANSI for clean matching)
    expect(stripAnsi(layout.borderTop)).toMatch(/┐$/)
    expect(layout.header).toContain('Profile')
    expect(layout.header).toContain('Session')

    // Test unselected row (not current, no session)
    const unselected = layout.formatUnselectedRow(rows[0], false)
    expect(unselected).toContain('aaa')

    // Test unselected row (not current, has session)
    const unselectedWithSession = layout.formatUnselectedRow(rows[1], false)
    expect(unselectedWithSession).toContain('long-profile')
    expect(unselectedWithSession).toContain('✓')

    // Test unselected row (current profile)
    const unselectedCurrent = layout.formatUnselectedRow(rows[1], true)
    expect(unselectedCurrent).toContain('long-profile')

    // Test selected row (not current)
    const selected = layout.formatSelectedRow(rows[1], false)
    expect(selected).toContain('long-profile')
    expect(selected).toContain('▐') // thick border for selected
    expect(selected).toContain('✓') // session indicator

    // Test selected row (current profile)
    const selectedCurrent = layout.formatSelectedRow(rows[1], true)
    expect(selectedCurrent).toContain('long-profile')
    expect(selectedCurrent).toContain('▐')
  })
})
