/// <reference lib="webworker" />

import { SceneRenderer } from "../renderer";

const sceneRenderer = new SceneRenderer();

addEventListener('message', ({ data: { command, id, ...data } }) => {
    switch (command) {
        case "init": {
            postMessage({ id, message: "initialized" }); // for debugging only
        } break;
    }
});
