/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Provide ANSI escape code helpers for terminal colors
 * - Replace chalk dependency with minimal implementation
 */

const ESC = '\x1b['
const RESET = `${ESC}0m`

/** Wrap text with ANSI codes */
const wrap = (code: string, text: string): string => `${ESC}${code}m${text}${RESET}`

/** Convert hex color to ANSI 256 color code */
const hexToAnsi256 = (hex: string): number => {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)

  // Use 24-bit true color (more accurate)
  return -1 // Signal to use RGB instead
}

/** ANSI color helpers */
export const ansi = {
  gray: (text: string): string => wrap('90', text),
  white: (text: string): string => wrap('97', text),
  cyan: (text: string): string => wrap('36', text),
  green: (text: string): string => wrap('32', text),
  yellow: (text: string): string => wrap('33', text),
  red: (text: string): string => wrap('31', text),

  bold: {
    white: (text: string): string => wrap('1;97', text),
    cyan: (text: string): string => wrap('1;36', text),
  },

  /** Use true color (24-bit) for hex colors */
  hex: (hex: string) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return (text: string): string => `${ESC}38;2;${r};${g};${b}m${text}${RESET}`
  },

  boldHex: (hex: string) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return (text: string): string => `${ESC}1;38;2;${r};${g};${b}m${text}${RESET}`
  },
}

/** Remove ANSI escape codes from string */
export const stripAnsi = (text: string): string =>
  text.replace(/\x1b\[[0-9;]*m/g, '')
