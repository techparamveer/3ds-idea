import assert from 'node:assert/strict';

const corners = [[52, 76], [136, 76], [136, 160], [52, 160]];
const checks = [[59, 54], [76, 137], [160, 137], [307, 16], [160, 226]];

export function projectTouchInput(targets, x, y) {
  assert.ok(Number.isFinite(x) && x >= 0 && x < 320 && Number.isFinite(y) && y >= 0 && y < 240,
    'Touch coordinates must be inside the lower LCD');
  const read = ([tx, ty]) => {
    const point = targets?.[`Touch_${tx}_${ty}`];
    assert.ok(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), `Projected target Touch_${tx}_${ty}`);
    return point;
  };
  const [a, b, c, d] = corners.map(read);
  const dx1 = b[0] - c[0], dx2 = d[0] - c[0], dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1], dy2 = d[1] - c[1], dy3 = a[1] - b[1] + c[1] - d[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  assert.ok(Number.isFinite(determinant) && Math.abs(determinant) > 1e-8, 'Touch projection must be nondegenerate');
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  // A perspective projection of this planar LCD is a homography, not a bilinear interpolation.
  const project = (tx, ty) => {
    const u = (tx - 52) / 84, v = (ty - 76) / 84, w = g * u + h * v + 1;
    assert.ok(Number.isFinite(w) && Math.abs(w) > 1e-8, 'Touch projection cannot cross the camera plane');
    const point = [((b[0] - a[0] + g * b[0]) * u + (d[0] - a[0] + h * d[0]) * v + a[0]) / w,
      ((b[1] - a[1] + g * b[1]) * u + (d[1] - a[1] + h * d[1]) * v + a[1]) / w];
    assert.ok(point.every(Number.isFinite), 'Touch projection must be finite');
    return point;
  };
  const validation = checks.map(coordinate => {
    const observed = read(coordinate), projected = project(...coordinate);
    const errorPx = Math.hypot(projected[0] - observed[0], projected[1] - observed[1]);
    assert.ok(errorPx <= 0.01, `Independent projected target Touch_${coordinate.join('_')} disagrees by ${errorPx}px`);
    return { coordinate, observed, errorPx };
  });
  return { point: project(x, y), projection: { method: 'Four published coplanar touch targets; independent published-target checks.',
    corners: corners.map((coordinate, index) => ({ coordinate, point: [a, b, c, d][index] })), validation } };
}

export function createProjectedTouchInput(page, inputs) {
  let latest = null;
  const locate = async (x, y) => {
    const targets = await page.locator('.console-stage').evaluate(host => JSON.parse(host.dataset.targets));
    const located = { x, y, target: `Touch_${x}_${y}`, ...projectTouchInput(targets, x, y) };
    const viewport = page.viewportSize();
    assert.ok(located.point[0] >= 0 && located.point[0] < viewport.width
      && located.point[1] >= 0 && located.point[1] < viewport.height, 'Projected touch is inside viewport');
    return located;
  };
  const record = (phase, located) => inputs.push({ kind: 'touch', phase, ...located, at: Date.now() });
  const move = async (x, y) => {
    latest = await locate(x, y);
    record('move', latest);
    await page.mouse.move(...latest.point);
  };
  return {
    move,
    down: async (x, y) => { await move(x, y); record('down', latest); await page.mouse.down(); },
    up: async () => { assert.ok(latest, 'Pointer release requires a preceding touch location'); record('up', latest); await page.mouse.up(); },
    click: async (x, y) => { const located = await locate(x, y); record('click', located); await page.mouse.click(...located.point); },
  };
}
