import type { WorkerScheduler } from './synthesis-controller.ts';

type TaskPort = Pick<MessagePort, 'onmessage' | 'postMessage' | 'start' | 'close'>;
type TaskChannel = { port1: TaskPort; port2: TaskPort };

/** One posted message runs one task, without the nested timer minimum delay. */
export function createTaskScheduler(channel: TaskChannel = new MessageChannel()): WorkerScheduler & { dispose(): void } {
  const tasks = new Map<number, () => void>();
  let nextHandle = 0, disposed = false;
  channel.port1.onmessage = event => {
    if (disposed) return;
    const run = tasks.get(event.data);
    if (!run) return; // Cancellation also covers messages already in the port queue.
    tasks.delete(event.data);
    run(); // Task failures must remain visible to the worker/controller error path.
  };
  channel.port1.start();
  return {
    schedule(run) {
      if (disposed) throw new Error('Music task scheduler is disposed');
      if (!Number.isSafeInteger(nextHandle + 1)) throw new RangeError('Music task handles exhausted');
      const handle = ++nextHandle;
      tasks.set(handle, run);
      try { channel.port2.postMessage(handle); }
      catch (error) { tasks.delete(handle); throw error; }
      return handle;
    },
    cancel(handle) { if (typeof handle === 'number') tasks.delete(handle); },
    dispose() {
      if (disposed) return;
      disposed = true; tasks.clear(); channel.port1.onmessage = null;
      try { channel.port1.close(); } finally { channel.port2.close(); }
    },
  };
}
