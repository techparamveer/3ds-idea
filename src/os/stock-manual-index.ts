import type { NativeLayout, NativePane } from './native-layout';

/** Titles whose electronic manual has a delivered English index. The pack is
 * owned by the application (its content 1 `Manual.bcma`), not by the
 * Instruction Manual applet that displays it. */
export const manualSources: Readonly<Record<string, { heading: string; url: string; iconUrl: string; contentIndex: number; contentId: string }>> = {
  // Heading: SMDH English long description of 0004001000022000 v9220 (manifest
  // titles[].longDescription, ExeFS/icon of content 0000003d).
  '0004001000022000': { heading: 'System Settings', url: 'packs/settings/contents/0001-00000038/manual-EUR_en.json', iconUrl: '/os/firmware/10.7.0-32E/icons/settings.png', contentIndex: 1, contentId: '00000038' },
  // Heading: SMDH English long description of 0004001000022400 v4097
  // (manifest titles[].longDescription, ExeFS/icon of content 0000001a).
  '0004001000022400': { heading: 'Nintendo 3DS Camera', url: 'packs/camera/contents/0001-00000019/manual-EUR_en.json', iconUrl: '/os/firmware/10.7.0-32E/icons/camera.png', contentIndex: 1, contentId: '00000019' },
};

export type ManualContentsEntry =
  | { kind: 'page'; page: number; title: string; category: number }
  | { kind: 'category'; category: number; title: string };

type Metadata = { name: string; type: number; value: number[] };
const metadata = (pane: NativePane | undefined, name: string): number[] | undefined =>
  ((pane as { metadata?: Metadata[] } | undefined)?.metadata ?? []).find(item => item.name === name && item.type === 1)?.value;
const scalar = (pane: NativePane | undefined, name: string): number => {
  const value = metadata(pane, name);
  if (!value || value.length !== 1 || !Number.isInteger(value[0]) || value[0] < 0) throw new Error(`Invalid manual index metadata ${pane?.name}/${name}`);
  return value[0];
};

/** Contents order from `Index.bclyt` user metadata alone: each category in
 * pane order lists its pages by `PageID_nnn`; a category whose `IsValid` is 0
 * contributes its pages without a heading band (Important Information).
 * Every page must appear exactly once, in ascending order. */
export function manualContents(layout: NativeLayout): ManualContentsEntry[] {
  const panes = new Map<string, NativePane>();
  for (const pane of layout.roots[0]?.children ?? []) panes.set(pane.name, pane);
  const meta = panes.get('MetaData'), pageCount = scalar(meta, 'PageNum'), categoryCount = scalar(meta, 'CategoryNum');
  const name = (prefix: string, index: number) => `${prefix}_${String(index).padStart(3, '0')}`;
  const text = (key: string) => {
    const pane = panes.get(key);
    if (!pane?.text || typeof pane.text.value !== 'string' || !pane.text.value) throw new Error(`Missing manual index text ${key}`);
    return pane.text.value;
  };
  const titles = Array.from({ length: pageCount }, (_, page) => text(name('PageTitle', page)));
  if (panes.has(name('PageTitle', pageCount)) || panes.has(name('Category', categoryCount))) throw new Error('Manual index has undeclared entries');
  const entries: ManualContentsEntry[] = [];
  let next = 0;
  for (let category = 0; category < categoryCount; category++) {
    const pane = panes.get(name('Category', category));
    if (!pane) throw new Error(`Missing manual index ${name('Category', category)}`);
    const valid = scalar(pane, 'IsValid'), count = scalar(pane, 'CategoryPageNum');
    if (valid > 1) throw new Error(`Invalid manual index metadata ${pane.name}/IsValid`);
    if (valid) entries.push({ kind: 'category', category, title: text(pane.name) });
    for (let item = 0; item < count; item++) {
      const page = scalar(pane, name('PageID', item));
      if (page !== next || page >= pageCount) throw new Error(`Manual index page order ${pane.name}/${page}`);
      entries.push({ kind: 'page', page, title: titles[page], category }); next++;
    }
  }
  if (next !== pageCount) throw new Error('Manual index omits pages');
  return entries;
}
