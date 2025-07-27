import { Component, computed, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pane } from 'tweakpane';
import RNG from '@gouvernathor/rng';
import { generateSeed } from '../util/random';
import { SceneParams, SceneDirective } from './scene.directive';
import animationFrame from '../util/animationFrame';
import BlobManager from 'canvas-blob-manager'

@Component({
  selector: 'app-root',
  imports: [SceneDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    '(window:resize)': 'onResize($event)',
  },
})
export class AppComponent {
  title = 'space-scene-2d';

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  private canvas = computed(() => this.canvasRef().nativeElement);
  private scene = viewChild.required(SceneDirective);

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

  onResize(event: Event) {
    this.scaleCanvas();
  }

  updateURL!: boolean;
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

  private blobManager = new BlobManager(this.canvas);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  private params: SceneParams = {
    seed: generateSeed(),
    width: window.innerWidth,
    height: window.innerHeight,
  }

  async ngOnInit() {
    this.route.queryParamMap.subscribe(queryParams => {
      const hasParams = queryParams.keys.length > 0;
      this.updateURL = hasParams;
      if (hasParams) {
        if (queryParams.has("seed")) {
          this.params.seed = queryParams.get("seed")!;
        }
        const width = parseInt(queryParams.get("width")!);
        if (!isNaN(width)) {
          this.params.width = width;
        }
        const height = parseInt(queryParams.get("height")!);
        if (!isNaN(height)) {
          this.params.height = height;
        }
        this.pane?.refresh();
      }
    });

    this.initTweakpanePane();

    this.resizeCanvas();

    await animationFrame();
    this.updateParams();
    await this.scene().render(this.params);
  }


  // Tweakpane options panel

  private pane!: Pane;

  private initTweakpanePane() {
    const pane = this.pane = new Pane({ title: "Options" });

    pane.addBinding(this.params, "seed");

    pane.addButton({ title: "Randomize & Render"}).on("click", () => {
      this.params.seed = generateSeed(new RNG(this.params.seed));
      pane.refresh();
      this.updateParams();
      this.scene().render(this.params);
    });

    pane.addBinding(this.params, "width", { step: 1 })
      .on("change", () => this.resizeCanvas());
    pane.addBinding(this.params, "height", { step: 1 })
      .on("change", () => this.resizeCanvas());

    pane.addButton({ title: "Render"}).on("click", () => {
      this.updateParams();
      this.scene().render(this.params);
    });

    pane.addBlade({ view: "separator" });

    pane.addBinding(this, "updateURL", { label: "Update URL" })
      .on("change", () => this.updateParams());

    pane.addButton({ title: "Download" })
      .on("click", () => this.blobManager.downloadCanvas(this.params.seed));
    if (navigator?.clipboard?.write !== undefined) {
      pane.addButton({ title: "Copy" })
        .on("click", () => this.blobManager.copyCanvas());
    }
  }
}
