/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Calculate column widths from profile list.
 * - Generate header / border strings.
 * - Provide `formatSelectedRow()` and `formatUnselectedRow()` for table rendering.
 *
 * Does **not** read files or interact with inquirer.
 */

import stringWidth from 'string-width'
import { ansi, stripAnsi } from './ansi.js'

/**
 * 表示 1 行のデータ
 */
export interface Profile {
  profileName: string
  accountId: string
  hasValidSession: boolean
}

function pad(text: string, width: number): string {
  return text + ' '.repeat(width - stringWidth(stripAnsi(text)))
}

function border(
  left: string,
  cross1: string,
  cross2: string,
  cross3: string,
  right: string,
  widthName: number,
  widthAccountId: number,
  widthSession: number,
): string {
  return ansi.gray(
    left +
      '─'.repeat(widthName + 2) +
      cross1 +
      '─'.repeat(widthAccountId + 2) +
      cross2 +
      '─'.repeat(widthSession + 2) +
      right,
  )
}

/**
 * 列幅・罫線などレイアウト情報一式
 */
export interface Layout {
  formatSelectedRow: (row: Profile, isCurrent: boolean) => string
  formatUnselectedRow: (row: Profile, isCurrent: boolean) => string
  header: string
  borderTop: string
  borderMid: string
  borderBot: string
}

/**
 * プロファイル一覧からレイアウトを算出。
 */
export function createLayout(list: Profile[]): Layout {
  const headerTitleName = 'Profile'
  const headerTitleAccountId = 'Account ID'
  const headerTitleSession = 'Session'

  const widthName = Math.max(
    stringWidth(headerTitleName),
    ...list.map((p) => stringWidth(p.profileName)),
  )
  const widthAccountId = Math.max(
    stringWidth(headerTitleAccountId),
    ...list.map((p) => stringWidth(p.accountId)),
  )
  const widthSession = stringWidth(headerTitleSession)

  const header =
    ansi.gray('│ ') +
    ansi.bold.white(pad(headerTitleName, widthName)) +
    ansi.gray(' │ ') +
    ansi.bold.white(pad(headerTitleAccountId, widthAccountId)) +
    ansi.gray(' │ ') +
    ansi.bold.white(pad(headerTitleSession, widthSession)) +
    ansi.gray(' │')

  /** 選択行: 太い左枠線 + 背景色ハイライト (薄いグレー背景) */
  const formatSelectedRow = (profileRow: Profile, isCurrent: boolean): string => {
    // ANSI codes: 100=gray bg, 97=bright white fg, 90=gray fg, 0=reset
    // 38;2;r;g;b = RGB foreground color (indigo #6366F1 = 99,102,241)
    const bgOn = '\x1b[100m'
    const fgIndigo = '\x1b[1;38;2;99;102;241m' // bold indigo for current profile
    const fgWhite = '\x1b[97m'
    const fgGray = '\x1b[90m'
    const fgGreen = '\x1b[32m'
    const reset = '\x1b[0m'

    const profileColor = isCurrent ? fgIndigo : fgWhite
    const accountColor = isCurrent ? fgIndigo : fgWhite
    const sessionIndicator = profileRow.hasValidSession ? '✓' : ' '
    const sessionColor = profileRow.hasValidSession ? fgGreen : fgWhite

    const content =
      bgOn +
      profileColor +
      ' ' +
      pad(profileRow.profileName, widthName) +
      fgGray +
      ' │ ' +
      accountColor +
      pad(profileRow.accountId, widthAccountId) +
      fgGray +
      ' │ ' +
      sessionColor +
      pad(sessionIndicator, widthSession) +
      fgWhite +
      ' ' +
      reset

    return ansi.boldHex('#6366F1')('▐') + content + ansi.gray('│')
  }

  /** 非選択行: 通常の左枠線 │ */
  const formatUnselectedRow = (profileRow: Profile, isCurrent: boolean): string => {
    const sessionIndicator = profileRow.hasValidSession ? ansi.green('✓') : ' '

    if (isCurrent) {
      // Current profile: indigo color for profile name and account ID
      return (
        ansi.gray('│ ') +
        ansi.boldHex('#6366F1')(pad(profileRow.profileName, widthName)) +
        ansi.gray(' │ ') +
        ansi.boldHex('#6366F1')(pad(profileRow.accountId, widthAccountId)) +
        ansi.gray(' │ ') +
        pad(sessionIndicator, widthSession) +
        ansi.gray(' │')
      )
    }
    return (
      ansi.gray('│ ') +
      pad(profileRow.profileName, widthName) +
      ansi.gray(' │ ') +
      pad(profileRow.accountId, widthAccountId) +
      ansi.gray(' │ ') +
      pad(sessionIndicator, widthSession) +
      ansi.gray(' │')
    )
  }

  return {
    formatSelectedRow,
    formatUnselectedRow,
    header,
    borderTop: border('┌', '┬', '┬', '┬', '┐', widthName, widthAccountId, widthSession),
    borderMid: border('├', '┼', '┼', '┼', '┤', widthName, widthAccountId, widthSession),
    borderBot: border('└', '┴', '┴', '┴', '┘', widthName, widthAccountId, widthSession),
  }
}
