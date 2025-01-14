import { Component, computed, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pane } from 'tweakpane';
import RNG from '@gouvernathor/rng';
import blackBodyColors from '../pure/black-body.json';
import { RenderOptions, Space2D, Star } from '../pure';
import { generateSeed } from '../util/random';

interface Params {
  seed: string;
  width: number;
  height: number;
}

const blobMimes = ['image/webp', 'image/png'];

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    '(window:resize)': 'onResize($event)',
  },
})
export class AppComponent {
  title = 'space-scene-2d';

  private space2d = new Space2D();
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  private canvas = computed(() => this.canvasRef().nativeElement);

  private rendering = false;
  private async render() {
    if (!this.params.seed) {
      throw new Error("Seed is empty");
    }

    if (this.rendering) {
      this.rendering = false; // Stop existing render
      console.log("Already rendering");
      await this.animationFrame();
    }

    try {
      this.rendering = true;

      const canvas = this.canvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get 2D context");
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await this.animationFrame();

      const chunkSize = 256;

      const rng = new RNG.MT(this.params.seed);

      const sceneOffset = [
        rng.randRange(-5000000, 5000000) - canvas.width / 2,
        rng.randRange(-5000000, 5000000) - canvas.height / 2,
      ];

      const near = 0;
      const far = 500;
      const layers = 2 * (far - near);

      const scale = rng.uniform(.001, .002);

      function randomIntensityBackgroundColor(): [number, number, number] {
        const intensity = rng.random();
        return Array.from(rng.choice(blackBodyColors), (v) => v * intensity) as [number, number, number];
      }

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

      for (let y = 0; y < canvas.height; y += chunkSize) {
        for (let x = 0; x < canvas.width; x += chunkSize) {
          ctx.drawImage(
            this.space2d.render(chunkSize, chunkSize, { ...opts, offset: [x + sceneOffset[0], y + sceneOffset[1]] }),
            x, canvas.height - (y + chunkSize),
          );
          await this.animationFrame();
          if (!this.rendering) {
            return;
          }
        }
      }

    } finally {
      this.rendering = false;
    }
  }

  private resizeCanvas() {
    this.canvas().width = this.params.width;
    this.canvas().height = this.params.height;
    this.scaleCanvas();
  }

  private scaleCanvas() {
    const canvas = this.canvas();
    const widthScale = window.innerWidth / canvas.width;
    const heightScale = window.innerHeight / canvas.height;
    const scale = Math.min(widthScale, heightScale);
    let width = canvas.width;
    let height = canvas.height;
    if (scale < 1) {
      width *= scale;
      height *= scale;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.left = `${Math.round((window.innerWidth - width) / 2)}px`;
    canvas.style.top = `${Math.round((window.innerHeight - height) / 2)}px`;
  }

  updateURL = false;
  /*
  TODO instead of writing it in the navbar,
  have a button that generates the URL and copies it to the clipboard
  */
  private updateParams() {
    if (this.updateURL) {
      this.router.navigate([], {
        queryParams: this.params,
        replaceUrl: true,
        relativeTo: this.route,
      });
    }
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  private params!: Params;

  async ngOnInit() {
    const queryParams = this.route.snapshot.queryParamMap;
    this.params = {
      seed: queryParams.get("seed") ?? generateSeed(),
      width: function() {
        const width = queryParams.get("width");
        return width ? parseInt(width, 10) : window.innerWidth;
      }(),
      height: function() {
        const height = queryParams.get("height");
        return height ? parseInt(height, 10) : window.innerHeight;
      }(),
    };

    this.initTweakpanePane();

    this.resizeCanvas();

    await this.animationFrame();
    this.updateParams();
    await this.render();
  }

  private initTweakpanePane() {
    const pane = new Pane({ title: "Options" });

    pane.addBinding(this.params, "seed");

    pane.addButton({ title: "Randomize & Render"}).on("click", () => {
      this.params.seed = generateSeed(new RNG(this.params.seed));
      pane.refresh();
      this.updateParams();
      this.render();
    });

    pane.addBinding(this.params, "width", { step: 1 }).on("change", () => this.resizeCanvas());
    pane.addBinding(this.params, "height", { step: 1 }).on("change", () => this.resizeCanvas());

    pane.addButton({ title: "Render"}).on("click", () => {
      this.updateParams();
      this.render();
    });

    pane.addBlade({ view: "separator" });

    pane.addBinding(this, "updateURL", { label: "URL" }).on("change", () => this.updateParams());

    pane.addButton({ title: "Download" }).on("click", () => this.downloadCanvas());
    if (navigator?.clipboard?.write !== undefined) {
      pane.addButton({ title: "Copy" }).on("click", () => this.copyCanvas());
    }
  }

  private async getBlobs() {
    const blobs: Record<string, Blob> = {};

    await Promise.allSettled(blobMimes.map(mime => {
      return new Promise<void>(resolve => {
        this.canvas().toBlob(blob => {
          if (blob === null) {
            console.warn(`Failed to extract data as ${mime} from canvas`);
          } else {
            // console.log(`${mime} canvas size: ${blob.size}`);
            blobs[mime] = blob;
          }
          resolve();
        }, mime, 1.);
      });
    }));

    return blobs;
  }

  private url: string = "";
  private async downloadCanvas() {
    const blobs = await this.getBlobs();

    for (const mime of blobMimes) {
      const blob = blobs[mime];
      if (blob) {
        const a = document.createElement("a");
        a.download = `${this.params.seed}.${mime.split("/")[1]}`;
        if (this.url) {
          URL.revokeObjectURL(this.url);
        }
        a.href = this.url = URL.createObjectURL(blob);
        a.click();
        return;
      }
    }
    console.error("No blobs to download");
  }

  private async copyCanvas() {
    const blobs = await this.getBlobs();

    for (const mime of blobMimes) {
      if (ClipboardItem.supports && !ClipboardItem.supports(mime)) {
        console.warn(`ClipboardItem does not support ${mime}`);
        continue;
      }

      const blob = blobs[mime];
      if (!blob) {
        continue;
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } catch (e) {
        console.error(`Failed to copy canvas to clipboard as ${mime}: ${e}`);
        continue;
      }
      console.log(`Copied canvas as ${mime} to clipboard`);
      return;
    }
    console.error("No blobs to copy");
  }

  onResize(event: Event) {
    this.scaleCanvas();
  }

  private animationFrame() {
    return new Promise<number>((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
}
