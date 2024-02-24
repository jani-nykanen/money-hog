import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Particle } from "./particle.js";


export class StarParticle extends Particle {


    private spr : Sprite;


    constructor() {

        super();

        this.spr = new Sprite(16, 16);
    }


    public spawnEvent() : void {
        
        this.spr.setFrame(0, 0);
    }


    public updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        this.pos.y -= globalSpeedFactor*event.tick;

        this.spr.animate(0, 0, 3, 4, event.tick);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined = undefined) : void {

        if (!this.exist)
            return;


        const dx : number = Math.round(this.pos.x) - this.spr.width/2;
        const dy : number = Math.round(this.pos.y) - this.spr.height/2;

        this.spr.draw(canvas, bmp, dx, dy);
    }
}
