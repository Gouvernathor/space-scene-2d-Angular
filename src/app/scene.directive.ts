import { computed, Directive, ElementRef } from "@angular/core";
import RNG from "@gouvernathor/rng";
import { RenderOptions, Space2D, Star } from "../pure";
import animationFrame from "../util/animationFrame";

import blackBodyColors from '../pure/black-body.json';

export interface SceneParams {
  seed: string;
  width: number;
  height: number;
}

@Directive({
    selector: '[appScene]',
})
export class SceneDirective {
    constructor(
        private canvasRef: ElementRef<HTMLCanvasElement>,
    ) {}

    private space2d = new Space2D();
    private canvas = computed(() => this.canvasRef.nativeElement);

    private rendering = false;
    async render(params: SceneParams) {
        if (!params.seed) {
            throw new Error("Seed is empty");
        }

        if (this.rendering) {
            this.rendering = false; // Stop existing render
            console.log("Already rendering");
            await animationFrame();
        }

        try {
            this.rendering = true;

            const canvas = this.canvas();
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get 2D context");
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await animationFrame();

            const chunkSize = 256;

            const rng = new RNG.MT(params.seed);

            const sceneOffset = [
                rng.randRange(-5000000, 5000000) - canvas.width / 2,
                rng.randRange(-5000000, 5000000) - canvas.height / 2,
            ];

            const near = 0;
            const far = 500;
            const layers = 2 * (far - near);

            const scale = rng.uniform(.001, .002);

            const randomIntensityBackgroundColor = (): [number, number, number] => {
                const intensity = rng.random();
                return Array.from(rng.choice(blackBodyColors), (v) => v * intensity) as [number, number, number];
            };

            const nStars = Math.min(64, rng.randRange(canvas.width * canvas.height * scale * scale));
            const stars: Star[] = Array.from({ length: nStars }, () => {
                const color = randomIntensityBackgroundColor();
                return {
                    position: [
                        sceneOffset[0] + rng.randRange(canvas.width),
                        sceneOffset[1] + rng.randRange(canvas.height),
                        rng.uniform(near, far),
                    ],
                    color,
                    falloff: 256,
                    diffractionSpikeFalloff: 1024,
                    diffractionSpikeScale: rng.uniform(4, 8),
                };
            });

            const backgroundColor = randomIntensityBackgroundColor();

            const opts: RenderOptions = {
                stars,
                scale,
                backgroundColor,
                nebulaLacunarity: rng.uniform(1.8, 2),
                nebulaGain: .5,
                nebulaAbsorption: 1.,
                nebulaFalloff: rng.uniform(256, 1280),
                nebulaNear: near,
                nebulaFar: far,
                nebulaLayers: layers,
                nebulaDensity: rng.uniform(50, 150) / layers,
                nebulaAlbedoLow: [rng.random(), rng.random(), rng.random()],
                nebulaAlbedoHigh: [rng.random(), rng.random(), rng.random()],
                nebulaAlbedoScale: rng.uniform(8),
            };

            for (let y = 0; y < canvas.height && this.rendering; y += chunkSize) {
                for (let x = 0; x < canvas.width && this.rendering; x += chunkSize) {
                    ctx.drawImage(
                        this.space2d.render(chunkSize, chunkSize, { ...opts, offset: [x + sceneOffset[0], y + sceneOffset[1]] }),
                        x, canvas.height - (y + chunkSize),
                    );
                    await animationFrame();
                }
            }
        } finally {
            this.rendering = false;
        }
    }
}
