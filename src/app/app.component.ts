import { Component, computed, ElementRef, viewChild } from '@angular/core';
import { Pane } from 'tweakpane';
import * as blackBodyColors from '../pure/black-body.json';
import { Space2D } from '../pure';
import { ActivatedRoute } from '@angular/router';
import { generateSeed } from '../util/random';
import RNG from '@gouvernathor/rng';

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

  private readonly blackBodyColors = blackBodyColors as [number, number, number][];
  private space2d = new Space2D();
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  private canvas = computed(() => this.canvasRef().nativeElement);
  private rendering = false;

  private async render() {
    // TODO
  }

  // call generateSeed() and pass it either this.rng or a new RNG instance seeded with this.seed

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

  /**
   * This updates the current URL - which can be done using angular
   */
  private updateParams() {
    // TODO
  }

  constructor(
    private readonly route: ActivatedRoute,
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

    pane.addButton({ title: "Randomize & Render", label: "" }).on("click", () => {
      this.params.seed = generateSeed(new RNG(this.params.seed));
      pane.refresh();
      this.updateParams();
      this.render();
    });

    pane.addBinding(this.params, "width", { step: 1 }).on("change", () => this.resizeCanvas());
    pane.addBinding(this.params, "height", { step: 1 }).on("change", () => this.resizeCanvas());

    pane.addButton({ title: "Render", label: "" }).on("click", () => {
      this.updateParams();
      this.render();
    });

    pane.addButton({ title: "Download", label: "" }).on("click", () => this.downloadCanvas());
  }

  private url: string = "";
  private async downloadCanvas() {
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

  onResize(event: Event) {
    this.scaleCanvas();
  }

  private animationFrame() {
    return new Promise<number>((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
}
