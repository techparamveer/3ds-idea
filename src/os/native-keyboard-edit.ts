/** Plain, non-composing Settings name text model. Offsets are UTF-16 units. */
export type NativeNicknameEditState = {
  value: string;
  cursor: number;
  anchor: number;
  selectionActive: boolean;
};
export type NativeNicknameEdit = { type: 'insert'; unit: number } | { type: 'backspace' };
export type NativeNicknameEditResult = {
  state: NativeNicknameEditState;
  accepted: boolean;
  /** Ordered native paragraph-cache invalidation offsets; no renderer calls. */
  invalidations: number[];
};

/** Original 1401f8 / 140050 for a normalized, non-composing name buffer.
 * The caller owns validation filters, input phases, modifiers and sound.
 * This is one key's text-model operation, not the whole key event.
 */
export function editNativeNicknameText(input: NativeNicknameEditState, edit: NativeNicknameEdit): NativeNicknameEditResult {
  const length = input.value.length;
  if (length > 10 || /[\u0000-\u001f]/u.test(input.value)
    || !Number.isInteger(input.cursor) || input.cursor < 0 || input.cursor > length
    || !Number.isInteger(input.anchor) || input.anchor < 0 || input.anchor > length) {
    throw new Error('Invalid normalized native nickname edit state');
  }
  if (edit.type === 'insert' && (!Number.isInteger(edit.unit) || edit.unit < 0x20 || edit.unit > 0xffff)) {
    throw new Error('Native nickname insertion requires one UTF-16 unit at or above U+0020');
  }
  let value = input.value, cursor = input.cursor;
  const invalidations: number[] = [];
  const remove = (first: number, count: number) => {
    value = value.slice(0, first) + value.slice(first + count);
    if (cursor > first) cursor = Math.max(first, cursor - count);
    invalidations.push(first);
  };
  let accepted: boolean;
  const first = Math.min(cursor, input.anchor), count = Math.abs(cursor - input.anchor);
  if (edit.type === 'backspace') {
    if (input.selectionActive && count > 0) {
      remove(first, count);
      accepted = true;
    } else if (cursor > 0) {
      remove(cursor - 1, 1);
      accepted = true;
    } else accepted = false;
  } else {
    // Native selection deletion precedes the capacity test, so replacement is
    // accepted even when the original ten-cell buffer was full.
    if (input.selectionActive && count > 0) remove(first, count);
    accepted = value.length < 10;
    if (accepted) {
      value = value.slice(0, cursor) + String.fromCharCode(edit.unit) + value.slice(cursor);
      invalidations.push(cursor);
      cursor++;
    }
  }
  return { state: { value, cursor, anchor: cursor, selectionActive: false }, accepted, invalidations };
}
