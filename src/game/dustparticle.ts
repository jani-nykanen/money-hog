import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Particle } from "./particle.js";


export class DustParticle extends Particle {


    private spr : Sprite;
    private flip : Flip = Flip.None;


    constructor() {

        super();

        this.spr = new Sprite();
    }


    public updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        this.pos.y -= globalSpeedFactor*event.tick;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined = undefined) : void {

        if (!this.exist)
            return;

        const t : number = 1.0 - this.timer;
        const scalex : number = Math.floor(this.spr.width*t);
        const scaley : number = Math.floor(this.spr.height*t);

        const dx : number = Math.round(this.pos.x - scalex/2);
        const dy : number = Math.round(this.pos.y - scaley/2);

        this.spr.draw(canvas, bmp, dx, dy, this.flip, scalex, scaley);
    }


    public setSprite(width : number, height : number, column : number, row : number, flip : Flip) : void {

        this.spr.setDimensions(width, height);
        this.spr.setFrame(column, row);

        this.flip = flip;
    }
}
