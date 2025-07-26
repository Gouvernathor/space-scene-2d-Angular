import { Directive, ElementRef } from "@angular/core";

@Directive({
    selector: '[appScene]',
})
export class SceneDirective {
    constructor(
        private canvasRef: ElementRef<HTMLCanvasElement>,
    ) {}
}
