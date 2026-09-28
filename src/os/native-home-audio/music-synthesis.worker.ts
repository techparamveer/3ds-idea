import { MusicSynthesisController } from './synthesis-controller.ts';
import { createTaskScheduler } from './task-scheduler.ts';
interface WorkerScope {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}
const scope = globalThis as unknown as WorkerScope;
const scheduler = createTaskScheduler();
const controller = new MusicSynthesisController(message => scope.postMessage(message), scheduler);
scope.onmessage = event => { void controller.control(event.data).then(() => {
  if (controller.status().state === 'disposed') { scheduler.dispose(); scope.onmessage = null; scope.close(); }
}); };
