'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
export default function Console() {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, retry] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;
    setFailed(false);
    import('@/scene/console-scene').then(async ({ createConsoleScene }) => {
      if (!host.current || cancelled) return;
      const dispose = await createConsoleScene(host.current);
      if (cancelled) dispose(); else teardown = dispose;
    }).catch(error => { console.error('3DS scene could not start:', error); if (!cancelled) setFailed(true); });
    return () => { cancelled = true; teardown?.(); };
  }, [attempt]);
  return <main aria-label="Interactive silver 3DS XL">
    <div ref={host} className="console-stage" tabIndex={0} role="application" aria-label="Nintendo 3DS XL. Drag to rotate. Click the lid to close or open. Arrow keys navigate; A or Enter opens; B or Escape returns; H opens HOME Menu; P toggles power. Space opens or closes the lid." />
    {failed && <div className="fallback"><Image src="/preview.png" alt="Silver Nintendo 3DS XL" width={1050} height={900} sizes="(max-width: 900px) 90vw, 800px"/><button className="retry" aria-label="Retry loading the interactive 3DS" onClick={()=>retry(n=>n+1)}>↻</button></div>}
  </main>;
}
