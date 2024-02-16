import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { next } from "./existingobject.js";
import { Particle } from "./particle.js";



export class ParticleGenerator<T extends Particle> {


    private particles : T[];


    constructor() {

        this.particles = new Array<T> ();
    }


    public spawn(type : Function, x : number, y : number, 
        speedx : number, speedy : number, 
        timerSpeed : number = 0.0) : T {

        const p : T = next<T>(this.particles, type);

        p.spawn(x, y, speedx, speedy, timerSpeed);

        return p;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        for (let o of this.particles) {

            o.update?.(globalSpeedFactor, event);
        }
    }


    public draw(canvas : Canvas, bmp? : Bitmap | undefined) : void {

        for (let o of this.particles) {

            o.draw?.(canvas, bmp);
        }
    }
}
