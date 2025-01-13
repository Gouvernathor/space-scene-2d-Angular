import { Component, computed, ElementRef, viewChild } from '@angular/core';
import * as blackBodyColors from '../pure/black-body.json';
import { Space2D } from '../pure';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'space-scene-2d';

  private readonly blackBodyColors = blackBodyColors as [number, number, number][];
  private space2d = new Space2D();
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private canvas = computed(() => this.canvasRef().nativeElement);
  private rendering = false;

  private async render(seed: string) {
    // TODO
  }

  // call generateSeed() and pass it either this.rng or a new RNG instance seeded with this.seed

  private resizeCanvas(width: number, height: number) {
    this.canvas().width = width;
    this.canvas().height = height;
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
  private updateParams(params: unknown) {
    // TODO
  }

  private animationFrame() {
    return new Promise<number>((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
}
