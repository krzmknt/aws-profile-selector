/**
 * @packageDocumentation
 *
 * ## Responsibility
 * - ANSI escape code helpers (cursor movement, screen clear)
 * - Screen rendering logic for the table UI
 */

import { ansi } from './ansi.js'

/** ANSI escape codes */
const ESC = '\x1b['
const CLEAR_LINE = `${ESC}2K`
const HIDE_CURSOR = `${ESC}?25l`
const SHOW_CURSOR = `${ESC}?25h`

/** Move cursor up N lines */
const cursorUp = (n: number): string => (n > 0 ? `${ESC}${n}A` : '')

/** Move cursor to column 1 */
const cursorToColumn1 = `${ESC}1G`

export interface RenderState {
  filterText: string
  rows: string[]
  selectedIndex: number
  scrollOffset: number
  pageSize: number
}

export interface TerminalRenderer {
  render: (state: RenderState) => void
  clear: () => void
  showCursor: () => void
  hideCursor: () => void
}

export function createTerminalRenderer(): TerminalRenderer {
  let lastRenderedLineCount = 0

  const write = (text: string): void => {
    process.stdout.write(text)
  }

  const render = (state: RenderState): void => {
    const { filterText, rows, scrollOffset, pageSize } = state

    // Move cursor to the beginning of previously rendered content
    if (lastRenderedLineCount > 0) {
      write(cursorUp(lastRenderedLineCount - 1) + cursorToColumn1)
    }

    const lines: string[] = []

    // Filter prompt line (indigo/blue-purple color)
    const cursor = ansi.gray('█')
    lines.push(`${ansi.hex('#6366F1')('Filter:')} ${filterText}${cursor}`)

    // Calculate visible window
    const visibleRows = rows.slice(scrollOffset, scrollOffset + pageSize)

    // Add each row
    for (const row of visibleRows) {
      lines.push(row)
    }

    // Output all lines, clearing each line before writing
    for (let i = 0; i < lines.length; i++) {
      write(CLEAR_LINE + lines[i])
      if (i < lines.length - 1) {
        write('\n')
      }
    }

    // If previous render had more lines, clear the extra lines
    if (lastRenderedLineCount > lines.length) {
      for (let i = lines.length; i < lastRenderedLineCount; i++) {
        write('\n' + CLEAR_LINE)
      }
      // Move cursor back up to the last line of current content
      write(cursorUp(lastRenderedLineCount - lines.length))
    }

    lastRenderedLineCount = lines.length
  }

  const clear = (): void => {
    if (lastRenderedLineCount > 0) {
      // Move to top of rendered content
      write(cursorUp(lastRenderedLineCount - 1) + cursorToColumn1)
      // Clear all lines
      for (let i = 0; i < lastRenderedLineCount; i++) {
        write(CLEAR_LINE)
        if (i < lastRenderedLineCount - 1) {
          write('\n')
        }
      }
      // Move back to top
      if (lastRenderedLineCount > 1) {
        write(cursorUp(lastRenderedLineCount - 1) + cursorToColumn1)
      }
      lastRenderedLineCount = 0
    }
    write(SHOW_CURSOR)
  }

  const showCursor = (): void => {
    write(SHOW_CURSOR)
  }

  const hideCursor = (): void => {
    write(HIDE_CURSOR)
  }

  return { render, clear, showCursor, hideCursor }
}
