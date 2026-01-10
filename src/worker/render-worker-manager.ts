import { computed } from "@angular/core";
import { Canvas } from "canvas-blob-manager/canvasToBlobConverter";
import { RenderOptions, SceneRenderer } from "../renderer";

/**
 * Prepares listening to a response from a worker.
 * @returns the id which will be listened to,
 * which that should be passed to the worker so that it includes it in the response,
 * and a promise that resolves to the response.
 */
function promiseOfResponse<T>(worker: Worker): [string, Promise<T>] {
    // To avoid mixups between different render calls, we use a unique ID
    const id = crypto.randomUUID();

    // Prepare reception of the response
    const prom = new Promise<T>((resolve) => {
        const listener = ({ data: { id: receivedId, result } }: MessageEvent) => {
            if (receivedId === id) {
                worker.removeEventListener("message", listener);
                resolve(result);
            }
        };
        worker.addEventListener("message", listener);
    });

    return [id, prom];
}

export interface RenderWorkManager {
    render(options: RenderOptions): Promise<void>;
}
interface RenderWorkManagerConstructor {
    new(
        getCanvas: () => HTMLCanvasElement,
    ): RenderWorkManager;
}
export const RenderWorkManager: RenderWorkManagerConstructor = typeof Worker !== "undefined" ?
    class ActualWorkerManager {
        private readonly getOffscreenCanvas: () => OffscreenCanvas;
        private readonly worker: Worker;
        constructor(
            getCanvas: () => HTMLCanvasElement,
        ) {
            this.getOffscreenCanvas = computed(() => getCanvas().transferControlToOffscreen());
            this.worker = new Worker(new URL('./render-worker.worker', import.meta.url));
            this.worker.postMessage({ command: "init", id: "0" }); // debugging only
        }

        render(options: RenderOptions) {
            const [id, prom] = promiseOfResponse<void>(this.worker);

            const canvas = this.getOffscreenCanvas();
            this.worker.postMessage({ command: "render", id, canvas, options }, [ canvas ]);

            return prom;
        }
    } :
    class BackupWorkManager {
        private readonly scene = new SceneRenderer();
        constructor(
            private readonly getCanvas: () => Canvas,
        ) {}

        async render(options: RenderOptions) {
            return this.scene.render(this.getCanvas(), options);
        }
    };
