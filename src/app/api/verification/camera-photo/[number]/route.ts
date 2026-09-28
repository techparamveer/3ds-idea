import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ number: string }> }) {
  const root = process.env.CAMERA_FIXTURE_SDMC_ROOT;
  const url = new URL(request.url);
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');
  const number = (await context.params).number;
  if (!root || !isAbsolute(root) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || !host || !referer || !['1', '2'].includes(number)
      || url.searchParams.get('cameraFixture') !== 'hni'
      || !['same-origin', null].includes(request.headers.get('sec-fetch-site'))) return new Response(null, { status: 404 });
  try {
    const authority = new URL(`${url.protocol}//${host}`);
    const page = new URL(referer);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(authority.hostname)
        || page.origin !== authority.origin || page.searchParams.get('cameraFixture') !== 'hni') return new Response(null, { status: 404 });
    const jpeg = await readFile(join(root, 'DCIM', '100NIN03', `HNI_000${number}.JPG`));
    return new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response(null, { status: 404 }); }
}
