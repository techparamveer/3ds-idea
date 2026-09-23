import type { NativeLayout, NativePane, PaneOverrides } from './native-layout';

// TextArea_02, ordinary existing-profile Settings name request: maximum 10,
// fixed width, one row, no composition, initial cursor at the end. These are
// the float32 outputs of the native initialization, not generic keyboard sizes.
const SCALE = 1.5882350206375122;
const FIRST_X = -85.00001525878906;
const PICTURE_Y = 11.96296501159668;
const TEXT_Y = 8.96296501159668;
const MAXIMUM = 10;

export type NativeNicknameTextPose = {
  cursor: number;
  selectionAnchor: number;
  selectionActive: false;
  textArea: PaneOverrides;
  cursorLayout: PaneOverrides;
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
  if (text.length > MAXIMUM || /[\u0000-\u001f]/u.test(text)) {
    throw new Error('Native nickname pose requires normalized text of at most 10 UTF-16 units');
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
  const cursorX = Math.fround(text.length * 17 + (text.length === MAXIMUM ? endOffset : 0));
  return {
    cursor: text.length, selectionAnchor: text.length, selectionActive: false,
    textArea: overrides,
    cursorLayout: {
      RootPane: { visible: true },
      N_decorCursor: { translation: [cursorX, 3, 0] },
      P_decorCursor: { visible: false },
      P_decorCursorMS: { visible: true, size: [width, 23] },
    },
    hiddenDecorations: ['DecorArea_select', 'DecorArea_roman', 'DecorTrans', 'DecorArea_cellphone'],
  };
}
