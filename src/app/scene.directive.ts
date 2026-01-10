import { Directive, ElementRef, inject } from "@angular/core";
import { SceneRenderer } from "../renderer";

export interface SceneParams {
  seed: string;
  width: number;
  height: number;
}

@Directive({
    selector: '[appScene]',
})
export class SceneDirective extends SceneRenderer {
    constructor() {
        const canvas = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;
        super(() => canvas);
    }
}
