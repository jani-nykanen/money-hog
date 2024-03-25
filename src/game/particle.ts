import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { ExistingObject } from "./existingobject.js";


export class Particle implements ExistingObject {


    protected pos : Vector;
    protected speed : Vector;

    protected timer : number = 0.0;
    protected timerSpeed : number = 1.0;

    protected exist : boolean = false;


    constructor() {

        this.pos = new Vector();
        this.speed = new Vector();
    }


    public spawnEvent?() : void;
    public updateEvent?(globalSpeedFactor : number, event : ProgramEvent) : void;
    public draw?(canvas : Canvas, bmp? : Bitmap | undefined) : void;


    public spawn(x : number, y : number, speedx : number, speedy : number, timerSpeed : number = 0.0) : void {

        this.pos = new Vector(x, y);
        this.speed = new Vector(speedx, speedy);

        this.timer = 0;
        this.timerSpeed = timerSpeed;

        this.exist = true;

        this.spawnEvent?.();
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        if (!this.exist)
            return;

        this.timer += this.timerSpeed*event.tick;
        if (this.timer >= 1.0) {

            this.exist = false;
            return;
        }

        this.updateEvent?.(globalSpeedFactor, event);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => false;


    public forceKill() : void {

        this.exist = false;
    }
}
