/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Calculate column widths from profile list.
 * - Generate header / border strings.
 * - Provide `formatRow()` to render **one row** with proper padding.
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
  formatRow: (row: Profile) => string
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
    chalk.gray(' │ ') +
    chalk.bold.white(pad(headerTitleName, widthName)) +
    chalk.gray(' │ ') +
    chalk.bold.white(pad(headerTitleAccountId, widthAccountId)) +
    chalk.gray(' │')

  const formatRow = (profileRow: Profile): string =>
    chalk.gray('│ ') +
    pad(profileRow.profileName, widthName) +
    chalk.gray(' │ ') +
    pad(profileRow.accountId, widthAccountId) +
    chalk.gray(' │')

  return {
    formatRow,
    header,
    borderTop: border('\n  ┌', '┬', '┐', widthName, widthAccountId),
    borderMid: border(' ├', '┼', '┤', widthName, widthAccountId),
    borderBot: border(' └', '┴', '┘', widthName, widthAccountId),
  }
}
