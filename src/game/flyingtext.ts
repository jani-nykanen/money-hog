import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Particle } from "./particle.js";


export class FlyingText extends Particle {


    private value : number = 0;


    constructor() {

        super();
    }



    public updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        const LIMIT_TIME : number = 0.5;

        if (this.timer >= LIMIT_TIME) {

            this.speed.y = 0;
        }

        // this.pos.y -= globalSpeedFactor*event.tick;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined = undefined) : void {

        const FONT_OFFSET : number = -2;

        if (!this.exist)
            return;

        const str : string = String(Math.abs(this.value) | 0);

        const dx : number = Math.round(this.pos.x - (str.length + 1)*(8 + FONT_OFFSET)/2);
        const dy : number = Math.round(this.pos.y) - 8;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 8, 8);
        for (let i = 0; i < str.length; ++ i) {

            const c : number = Number(str.charAt(i));
            const sx : number = (c + 1)*8;

            canvas.drawBitmap(bmp, Flip.None, dx + (i + 1)*(8 + FONT_OFFSET), dy, sx, 0, 8, 8);
        }
    }


    public setValue(v : number) : void {

        this.value = v;
    }
}
