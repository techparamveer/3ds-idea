import { MusicSynthesisController } from './synthesis-controller.ts';
interface WorkerScope {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}
const scope = globalThis as unknown as WorkerScope;
const controller = new MusicSynthesisController(message => scope.postMessage(message), {
  schedule: run => setTimeout(run, 0), cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
});
scope.onmessage = event => { void controller.control(event.data).then(() => { if (controller.status().state === 'disposed') { scope.onmessage = null; scope.close(); } }); };
