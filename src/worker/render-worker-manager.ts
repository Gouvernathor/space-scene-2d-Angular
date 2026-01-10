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
    render(canvas: Canvas, options: RenderOptions): Promise<void>;
}
interface RenderWorkManagerConstructor {
    new(
        getCanvas: () => HTMLCanvasElement,
    ): RenderWorkManager;
}
export const newWorkerManager: RenderWorkManagerConstructor = typeof Worker !== "undefined" ?
    class ActualWorkerManager {
        readonly getOffscreenCanvas: () => OffscreenCanvas;
        constructor(
            getCanvas: () => HTMLCanvasElement,
        ) {
            this.getOffscreenCanvas = computed(() => getCanvas().transferControlToOffscreen());
        }

        async render(canvas: Canvas, options: RenderOptions) {}
    } :
    SceneRenderer;
