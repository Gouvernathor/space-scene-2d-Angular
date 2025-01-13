import { Component, computed, ElementRef, viewChild } from '@angular/core';
import * as blackBodyColors from '../pure/black-body.json';
import { Space2D } from '../pure';
import RNG from '@gouvernathor/rng';

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
    // TODO
  }

  private updateParams(params: unknown) {
    // TODO
  }

  private animationFrame() {
    return new Promise<number>((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
}
