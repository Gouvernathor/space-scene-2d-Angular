/// <reference lib="webworker" />

import { SceneRenderer } from "../renderer";

const sceneRenderer = new SceneRenderer();
let canvas: OffscreenCanvas;

addEventListener('message', async ({ data: { command, id, ...data } }) => {
    switch (command) {
        case "init": {
            postMessage({ id, message: "initialized" }); // for debugging only
        } break;

        case "transfer-canvas": {
            canvas = data.canvas;

            postMessage({ id, message: "canvas received" });
        } break;

        case "resize": {
            const { width, height } = data;

            canvas.width = width;
            canvas.height = height;

            postMessage({ id, message: "resized successfully" });
        } break;

        case "render": {
            const { options } = data;
            const { seed, width, height } = options;

            await sceneRenderer.render(canvas, { seed, width, height });

            postMessage({ id, message: "render complete" });
        } break;
    }
});
