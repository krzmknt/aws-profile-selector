/**
 * @packageDocumentation
 *
 * ## Responsibility
 * - Main UI controller for profile selection
 * - Integrates KeyboardHandler + TerminalRenderer
 * - Manages UIState (filterText, cursorPosition, selectedIndex, scrollOffset)
 * - Handles scrolling and selection logic
 */

import { createKeyboardHandler, type KeyType } from './keyboard-handler.js'
import { createTerminalRenderer } from './terminal-renderer.js'
import { type FuzzySearcher } from './choice-builder.js'
import { type Layout, type Profile } from './table-layout.js'

export interface SelectorOptions {
  searcher: FuzzySearcher
  layout: Layout
  pageSize: number
  currentProfile?: string
}

interface UIState {
  filterText: string
  cursorPosition: number
  selectedIndex: number
  scrollOffset: number
  filteredProfiles: Profile[]
}

export async function runSelector(opts: SelectorOptions): Promise<string | undefined> {
  const { searcher, layout, pageSize, currentProfile } = opts

  return new Promise((resolve) => {
    const keyboard = createKeyboardHandler()
    const renderer = createTerminalRenderer()

    const state: UIState = {
      filterText: '',
      cursorPosition: 0,
      selectedIndex: 0,
      scrollOffset: 0,
      filteredProfiles: searcher.getAll(),
    }

    const buildTableRows = (): string[] => {
      const { filteredProfiles, selectedIndex } = state
      const rows: string[] = []

      rows.push(layout.borderTop)
      rows.push(layout.header)
      rows.push(layout.borderMid)

      for (let i = 0; i < filteredProfiles.length; i++) {
        const profile = filteredProfiles[i]
        const isCurrent = profile.profileName === currentProfile
        if (i === selectedIndex) {
          rows.push(layout.formatSelectedRow(profile, isCurrent))
        } else {
          rows.push(layout.formatUnselectedRow(profile, isCurrent))
        }
      }

      rows.push(layout.borderBot)

      return rows
    }

    const adjustScroll = (): void => {
      const { selectedIndex, scrollOffset } = state
      // Account for header rows (borderTop, header, borderMid = 3 rows)
      const headerRows = 3
      const footerRows = 1
      const dataPageSize = pageSize - headerRows - footerRows

      // Adjust selectedIndex scroll position within data rows
      if (selectedIndex < scrollOffset) {
        state.scrollOffset = selectedIndex
      } else if (selectedIndex >= scrollOffset + dataPageSize) {
        state.scrollOffset = selectedIndex - dataPageSize + 1
      }
    }

    const render = (): void => {
      const rows = buildTableRows()
      renderer.render({
        filterText: state.filterText,
        cursorPosition: state.cursorPosition,
        rows,
        selectedIndex: state.selectedIndex + 3, // offset for header rows
        scrollOffset: state.scrollOffset,
        pageSize,
      })
    }

    const updateFilter = (): void => {
      state.filteredProfiles = searcher.search(state.filterText)
      state.selectedIndex = 0
      state.scrollOffset = 0
    }

    const cleanup = (): void => {
      keyboard.stop()
      renderer.clear()
      renderer.showCursor()
    }

    const handleKey = (key: KeyType): void => {
      switch (key.type) {
        case 'up':
          if (state.filteredProfiles.length > 0) {
            state.selectedIndex =
              (state.selectedIndex - 1 + state.filteredProfiles.length) %
              state.filteredProfiles.length
            adjustScroll()
          }
          break

        case 'down':
          if (state.filteredProfiles.length > 0) {
            state.selectedIndex = (state.selectedIndex + 1) % state.filteredProfiles.length
            adjustScroll()
          }
          break

        case 'left':
          if (state.cursorPosition > 0) {
            state.cursorPosition--
          }
          break

        case 'right':
          if (state.cursorPosition < state.filterText.length) {
            state.cursorPosition++
          }
          break

        case 'enter':
          if (state.filteredProfiles.length > 0) {
            const selected = state.filteredProfiles[state.selectedIndex]
            cleanup()
            resolve(selected.profileName)
            return
          }
          break

        case 'escape':
          cleanup()
          resolve(undefined)
          return

        case 'backspace':
          if (state.cursorPosition > 0) {
            state.filterText =
              state.filterText.slice(0, state.cursorPosition - 1) +
              state.filterText.slice(state.cursorPosition)
            state.cursorPosition--
            updateFilter()
          }
          break

        case 'char':
          state.filterText =
            state.filterText.slice(0, state.cursorPosition) +
            key.char +
            state.filterText.slice(state.cursorPosition)
          state.cursorPosition++
          updateFilter()
          break

        case 'ctrl-a':
          // Move cursor to beginning of line
          state.cursorPosition = 0
          break

        case 'ctrl-e':
          // Move cursor to end of line
          state.cursorPosition = state.filterText.length
          break

        case 'ctrl-k':
          // Kill text from cursor to end of line
          if (state.cursorPosition < state.filterText.length) {
            state.filterText = state.filterText.slice(0, state.cursorPosition)
            updateFilter()
          }
          break
      }

      render()
    }

    // Initial render
    renderer.hideCursor()
    render()

    // Start keyboard handling
    keyboard.start(handleKey)
  })
}
