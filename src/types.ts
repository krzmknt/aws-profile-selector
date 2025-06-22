/**
 * @packageDocumentation
 * @internal
 *
 * ## Responsibility
 * - Central place for shared TypeScript types used by all modules.
 * - Avoids duplicate/ diverging type definitions.
 */

/** 一般の選択肢行 */
export interface ChoiceObject {
  name: string
  value?: string
  short?: string
}

/** ヘッダー・罫線など選択不可行（Separator 互換） */
export interface FakeSeparator {
  type: 'separator'
  line: string
  /** inquirer は toString() の戻り値をそのまま表示する */
  toString(): string
}

export type SearchChoice = ChoiceObject | FakeSeparator
