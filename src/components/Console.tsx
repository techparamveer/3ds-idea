'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ConsoleScene } from '@/scene/console-scene';
import { browserMotionSensor } from '@/os/motion-sensor';
type Motion = 'pending' | 'permission' | 'requesting' | 'armed' | 'denied' | 'silent' | 'insecure' | 'unsupported';
/** Phones and tablets: a touch screen is the only pointer. */
const isHandheld = () => window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
const promptCopy: Record<Exclude<Motion, 'pending'>, [title: string, hint: string]> = {
  permission: ['Flick your phone down to open', 'Or tap the 3DS to open it.'],
  requesting: ['Flick your phone down to open', 'Or tap the 3DS to open it.'],
  armed: ['Flick your phone down to open', 'Or tap the 3DS.'],
  denied: ['Tap the 3DS to open', 'Motion access is off, so flicking is unavailable.'],
  silent: ['Tap the 3DS to open', 'This device is not reporting motion.'],
  insecure: ['Tap the 3DS to open', 'Flick to open needs a secure (HTTPS) page.'],
  unsupported: ['Tap the 3DS to open', 'This browser has no motion sensor access.'],
};
export default function Console({modelUrl}:{modelUrl?:string}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ConsoleScene>(undefined);
  const [attempt, retry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [handheld, setHandheld] = useState(false);
  const [lidClosed, setLidClosed] = useState(false);
  const [motion, setMotion] = useState<Motion>('pending');
  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;
    const handheld = isHandheld();
    setFailed(false); setHandheld(handheld); setLidClosed(false); setMotion('pending');
    import('@/scene/console-scene').then(async ({ createConsoleScene }) => {
      if (!host.current || cancelled) return;
      const created = await createConsoleScene(host.current, modelUrl, handheld ? {
        handheld,
        onLid: open => setLidClosed(!open),
        // iOS may already hold this session's grant; a reading proves it.
        onMotion: status => setMotion(current => status === 'active' ? (current === 'permission' || current === 'silent' ? 'armed' : current) : current === 'armed' ? 'silent' : current),
      } : undefined);
      if (cancelled) { created.dispose(); return; }
      teardown = created.dispose; scene.current = created;
      if (!handheld) return;
      const { access } = browserMotionSensor();
      setMotion(access === 'available' ? 'armed' : access === 'permission-required' ? 'permission' : access);
      if (access === 'available' || access === 'permission-required') created.armFlickOpen();
    }).catch(error => { console.error('3DS scene could not start:', error); if (!cancelled) setFailed(true); });
    return () => { cancelled = true; scene.current = undefined; teardown?.(); };
  }, [attempt,modelUrl]);
  function enableMotion() {
    const { requestPermission } = browserMotionSensor();
    const granted = () => { scene.current?.armFlickOpen(); setMotion('armed'); };
    if (!requestPermission) { granted(); return; }
    setMotion('requesting');
    // iOS requires this call inside the tap handler, before any await.
    requestPermission().then(result => result === 'granted' ? granted() : setMotion('denied'), () => setMotion('denied'));
  }
  const prompt = handheld && lidClosed && !failed && motion !== 'pending' ? promptCopy[motion] : null;
  return <main aria-label="Interactive silver 3DS XL">
    <div ref={host} className="console-stage" tabIndex={0} role="application" aria-label="Nintendo 3DS XL. Drag to rotate. Pinch or scroll to zoom. Click the lid to close or open. Arrow keys navigate; A or Enter opens; B or Escape returns; H opens HOME Menu; P opens power options. M mutes sound. Space opens or closes the lid." />
    {prompt && <div className="lid-prompt" role="status" data-motion={motion}>
      {motion === 'armed' && <span className="lid-prompt-phone" aria-hidden="true" />}
      <p className="lid-prompt-title">{prompt[0]}</p>
      {(motion === 'permission' || motion === 'requesting') && <button type="button" className="lid-prompt-action" disabled={motion === 'requesting'} onClick={enableMotion}>{motion === 'requesting' ? 'Waiting for permission…' : 'Tap to enable motion'}</button>}
      <p className="lid-prompt-hint">{prompt[1]}</p>
    </div>}
    {failed && <div className="fallback"><Image src="/preview.png" alt="Silver Nintendo 3DS XL" width={1050} height={900} sizes="(max-width: 900px) 90vw, 800px"/><button className="retry" aria-label="Retry loading the interactive 3DS" onClick={()=>retry(n=>n+1)}>↻</button></div>}
  </main>;
}
