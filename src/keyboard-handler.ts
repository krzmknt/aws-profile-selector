/**
 * @packageDocumentation
 *
 * ## Responsibility
 * - Manage raw mode for stdin
 * - Parse keyboard events (arrows, Enter, ESC, Backspace, character input)
 * - Emit typed key events
 */

import * as readline from 'node:readline'

export type KeyType =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'enter' }
  | { type: 'escape' }
  | { type: 'backspace' }
  | { type: 'char'; char: string }

export type KeyHandler = (key: KeyType) => void

export interface KeyboardHandler {
  start: (handler: KeyHandler) => void
  stop: () => void
}

export function createKeyboardHandler(): KeyboardHandler {
  let currentHandler: KeyHandler | null = null
  let keypressListener: ((str: string, key: readline.Key) => void) | null = null

  const start = (handler: KeyHandler): void => {
    currentHandler = handler

    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    keypressListener = (_str: string, key: readline.Key) => {
      if (!currentHandler) return

      if (key.name === 'up') {
        currentHandler({ type: 'up' })
      } else if (key.name === 'down') {
        currentHandler({ type: 'down' })
      } else if (key.name === 'return') {
        currentHandler({ type: 'enter' })
      } else if (key.name === 'escape') {
        currentHandler({ type: 'escape' })
      } else if (key.name === 'backspace') {
        currentHandler({ type: 'backspace' })
      } else if (key.ctrl && key.name === 'c') {
        // Ctrl+C: exit immediately
        process.exit(130)
      } else if (key.sequence && !key.ctrl && !key.meta) {
        // Regular character input
        const char = key.sequence
        if (char && char.length === 1 && char.charCodeAt(0) >= 32) {
          currentHandler({ type: 'char', char })
        }
      }
    }

    process.stdin.on('keypress', keypressListener)
    process.stdin.resume()
  }

  const stop = (): void => {
    if (keypressListener) {
      process.stdin.off('keypress', keypressListener)
      keypressListener = null
    }
    currentHandler = null

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.pause()
  }

  return { start, stop }
}
