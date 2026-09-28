import { localLcdExportAllowed, maxBodyBytes, writeLocalLcdCapture } from '@/scene/lcd-capture-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const root = process.env.LCD_CAPTURE_OUTPUT_ROOT;
  if (!localLcdExportAllowed(request, root)) return new Response(null, { status: 404 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({ error: 'JSON required' }, { status: 415 });
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) return Response.json({ error: 'LCD capture too large' }, { status: 413 });
  const body = await request.text();
  if (Buffer.byteLength(body) > maxBodyBytes) return Response.json({ error: 'LCD capture too large' }, { status: 413 });
  try {
    return Response.json(await writeLocalLcdCapture(root!, body), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
