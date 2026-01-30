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

import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import stringWidth from 'string-width'

/**
 * 表示 1 行のデータ
 */
export interface Profile {
  profileName: string
  accountId: string
}

function pad(text: string, width: number): string {
  return text + ' '.repeat(width - stringWidth(stripAnsi(text)))
}

function border(
  left: string,
  cross: string,
  right: string,
  widthName: number,
  widthAccountId: number,
): string {
  return chalk.gray(
    left + '─'.repeat(widthName + 2) + cross + '─'.repeat(widthAccountId + 2) + right,
  )
}

/**
 * 列幅・罫線などレイアウト情報一式
 */
export interface Layout {
  formatSelectedRow: (row: Profile) => string
  formatUnselectedRow: (row: Profile) => string
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

  const widthName = Math.max(
    stringWidth(headerTitleName),
    ...list.map((p) => stringWidth(p.profileName)),
  )
  const widthAccountId = Math.max(
    stringWidth(headerTitleAccountId),
    ...list.map((p) => stringWidth(p.accountId)),
  )

  const header =
    chalk.gray('│ ') +
    chalk.bold.white(pad(headerTitleName, widthName)) +
    chalk.gray(' │ ') +
    chalk.bold.white(pad(headerTitleAccountId, widthAccountId)) +
    chalk.gray(' │')

  /** 選択行: 太い左枠線 ┃ + 背景色ハイライト (薄いグレー背景) */
  const formatSelectedRow = (profileRow: Profile): string => {
    // ANSI codes: 100=gray bg, 97=bright white fg, 90=gray fg, 0=reset
    const bgOn = '\x1b[100m'
    const fgWhite = '\x1b[97m'
    const fgGray = '\x1b[90m'
    const reset = '\x1b[0m'

    const content =
      bgOn +
      fgWhite +
      ' ' +
      pad(profileRow.profileName, widthName) +
      fgGray +
      ' │ ' +
      fgWhite +
      pad(profileRow.accountId, widthAccountId) +
      ' ' +
      reset

    return chalk.bold.hex('#6366F1')('▐') + content + chalk.gray('│')
  }

  /** 非選択行: 通常の左枠線 │ */
  const formatUnselectedRow = (profileRow: Profile): string =>
    chalk.gray('│ ') +
    pad(profileRow.profileName, widthName) +
    chalk.gray(' │ ') +
    pad(profileRow.accountId, widthAccountId) +
    chalk.gray(' │')

  return {
    formatSelectedRow,
    formatUnselectedRow,
    header,
    borderTop: border('┌', '┬', '┐', widthName, widthAccountId),
    borderMid: border('├', '┼', '┤', widthName, widthAccountId),
    borderBot: border('└', '┴', '┘', widthName, widthAccountId),
  }
}
