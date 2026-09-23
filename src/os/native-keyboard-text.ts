import type { NativeLayout, NativePane, PaneOverrides } from './native-layout';
import type { NativeNicknameEditState } from './native-keyboard-edit';

// TextArea_02, ordinary existing-profile Settings name request: maximum 10,
// fixed width, one row, no composition. These are
// the float32 outputs of the native initialization, not generic keyboard sizes.
const SCALE = 1.5882350206375122;
const FIRST_X = -85.00001525878906;
const PICTURE_Y = 11.96296501159668;
const TEXT_Y = 8.96296501159668;
const MAXIMUM = 10;

export type NativeNicknameTextPose = {
  cursor: number;
  selectionAnchor: number;
  selectionActive: boolean;
  textArea: PaneOverrides;
  cursorLayout: PaneOverrides;
  /** Four separate DecorArea_select instances attached at N_decor, in order. */
  selectionLayouts: PaneOverrides[];
  /** Applied separately to each instance, since their roots share a name. */
  hiddenDecorations: readonly string[];
};

function findPane(layout: NativeLayout, name: string): NativePane {
  const visit = (panes: NativePane[]): NativePane | undefined => {
    for (const pane of panes) {
      if (pane.name === name) return pane;
      const child = visit(pane.children);
      if (child) return child;
    }
  };
  const pane = visit(layout.roots);
  if (!pane) throw new Error(`Missing native nickname pane ${name}`);
  return pane;
}

/** Local first-text-update pose, before the native layout/controller pass.
 * The caller supplies decoded TextArea_02 and normalized single-line text.
 * This does not filter input, perform an edit, advance blink, attach child
 * layouts, or establish the full keyboard's first rendered frame.
 */
export function nativeNicknameInitialTextPose(text: string, textArea: NativeLayout): NativeNicknameTextPose {
  return nativeNicknameTextPose({ value: text, cursor: text.length, anchor: text.length, selectionActive: false }, textArea);
}

/** Local non-composing text update, with an explicit model cursor/selection.
 * Child attachment order and controller sampling remain the painter's work.
 */
export function nativeNicknameTextPose(state: NativeNicknameEditState, textArea: NativeLayout): NativeNicknameTextPose {
  const text = state.value;
  if (text.length > MAXIMUM || /[\u0000-\u001f]/u.test(text)) {
    throw new Error('Native nickname pose requires normalized text of at most 10 UTF-16 units');
  }
  if (!Number.isInteger(state.cursor) || state.cursor < 0 || state.cursor > text.length
    || !Number.isInteger(state.anchor) || state.anchor < 0 || state.anchor > text.length) {
    throw new Error('Invalid native nickname cursor or selection anchor');
  }
  const occupied = findPane(textArea, 'P_textAreaMSC01').picture?.colors;
  const empty = findPane(textArea, 'P_textAreaMSC02').picture?.colors;
  if (!occupied || !empty) throw new Error('Missing native nickname cell colors');
  const overrides: PaneOverrides = {
    N_textAreaMSC: { scale: [SCALE, SCALE] },
    N_decor: { translation: [FIRST_X, TEXT_Y, 0] },
    N_transDecor: { translation: [FIRST_X, TEXT_Y, 0] },
    T_trans: { text: ' ' },
  };
  for (let index = 0; index < 32; index++) {
    const suffix = String(index + 1).padStart(2, '0');
    const picture = `P_textAreaMSC${suffix}`, label = `T_textAreaMSC${suffix}`;
    // A missing pane is an asset contract error; do not silently render only
    // part of the row. Hidden authored cells retain their text and geometry.
    findPane(textArea, picture);
    findPane(textArea, label);
    if (index >= MAXIMUM) {
      overrides[picture] = { visible: false };
      overrides[label] = { visible: false };
      continue;
    }
    const x = Math.fround(FIRST_X + index * 17);
    overrides[picture] = {
      visible: true, translation: [x, PICTURE_Y, 0],
      vertexColors: (index < text.length ? occupied : empty).map(color => [...color]),
    };
    // Native set-text writes one UTF-16 unit. JS indexing intentionally retains
    // that behavior rather than turning a surrogate pair into one wider cell.
    overrides[label] = { visible: true, translation: [x, TEXT_Y, 0], text: text[index] ?? ' ' };
  }
  overrides.T_textAreaMSC01.lineSpacing = -5.03703498840332;

  const width = Math.fround(2 / SCALE);
  // Original 187310..187324, then 186c54..186ca0 at a full buffer only.
  const endOffset = Math.fround(-Math.floor(Math.fround(Math.fround(width + SCALE) + 0.5)) / SCALE);
  const cursorX = Math.fround(state.cursor * 17 + (state.cursor === MAXIMUM ? endOffset : 0));
  const selected = state.selectionActive && state.cursor !== state.anchor;
  const selectionLayouts: PaneOverrides[] = Array.from({ length: 4 }, () => ({ RootPane: { visible: false } }));
  if (selected) {
    // Original selection update, then 186ca4..186ce8 adds obj+744 (-width).
    // The one-line name occupies only the first of four decoration instances.
    selectionLayouts[0] = {
      RootPane: { visible: true },
      P_decorArea: {
        translation: [17 * Math.min(state.cursor, state.anchor), 0, 0],
        size: [Math.fround(17 * Math.abs(state.cursor - state.anchor) - width), 18],
      },
    };
  }
  return {
    cursor: state.cursor, selectionAnchor: state.anchor, selectionActive: state.selectionActive,
    textArea: overrides,
    cursorLayout: {
      RootPane: { visible: true },
      N_decorCursor: { translation: [cursorX, 3, 0] },
      P_decorCursor: { visible: false },
      P_decorCursorMS: { visible: true, size: [width, 23] },
    },
    selectionLayouts,
    hiddenDecorations: [...(selected ? [] : ['DecorArea_select']), 'DecorArea_roman', 'DecorTrans', 'DecorArea_cellphone'],
  };
}
