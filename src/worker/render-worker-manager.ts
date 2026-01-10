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
    resize(canvas: HTMLCanvasElement, width: number, height: number): Promise<void>;
    render(canvas: HTMLCanvasElement, options: RenderOptions): Promise<void>;
}
interface RenderWorkManagerConstructor {
    new(): RenderWorkManager;
}
export const RenderWorkManager: RenderWorkManagerConstructor = typeof Worker !== "undefined" ?
    class ActualWorkerManager {
        private readonly seenCanvasses = new WeakSet<HTMLCanvasElement>();
        private readonly worker: Worker;
        constructor() {
            this.worker = new Worker(new URL('./render-worker.worker', import.meta.url));
            this.worker.postMessage({ command: "init", id: "0" }); // debugging only
        }

        async resize(canvas: HTMLCanvasElement, width: number, height: number) {
            if (!this.seenCanvasses.has(canvas)) {
                canvas.width = width;
                canvas.height = height;
            } else {
                const [id, prom] = promiseOfResponse<void>(this.worker);

                this.worker.postMessage({ id, command: "resize", width, height });

                return prom;
            }
        }

        async render(canvas: HTMLCanvasElement, options: RenderOptions) {
            const [id, prom] = promiseOfResponse<void>(this.worker);

            if (!this.seenCanvasses.has(canvas)) {
                const [id, prom] = promiseOfResponse<void>(this.worker);

                const offscreen = canvas.transferControlToOffscreen();
                this.worker.postMessage({ id, command: "transfer-canvas", canvas: offscreen }, [ offscreen ]);

                this.seenCanvasses.add(canvas);
                await prom;
            }
            this.worker.postMessage({ id, command: "render", options });

            return prom;
        }
    } :
    class BackupWorkWanager extends SceneRenderer {
        async resize(canvas: Canvas, width: number, height: number) {
            canvas.width = width;
            canvas.height = height;
        }
    };
