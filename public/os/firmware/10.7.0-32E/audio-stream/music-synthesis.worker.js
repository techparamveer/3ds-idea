import { MusicSynthesisController } from "./synthesis-controller.js";
import { createTaskScheduler } from "./task-scheduler.js";
const scope = globalThis;
const scheduler = createTaskScheduler();
const controller = new MusicSynthesisController(message => scope.postMessage(message), scheduler);
scope.onmessage = event => {
    void controller.control(event.data).then(() => {
        if (controller.status().state === 'disposed') {
            scheduler.dispose();
            scope.onmessage = null;
            scope.close();
        }
    });
};
