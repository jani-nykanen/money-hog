import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { ExistingObject } from "./existingobject.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {

    if (speed < target) {

        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
}


export class GameObject implements ExistingObject {


    protected pos : Vector;
    protected speed : Vector;
    protected target : Vector;
    protected friction : Vector;

    protected exist : boolean;
    protected dying : boolean = false;

    protected collisionBox : Rectangle;


    constructor(x : number = 0, y : number = 0, exist : boolean = false) {

        this.pos = new Vector(x, y);
        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);

        this.collisionBox = new Rectangle();

        this.exist = exist;
    }


    protected updateEvent?(event : ProgramEvent) : void;
    protected floorCollisionEvent?(event : ProgramEvent) : void;
    protected die?(event : ProgramEvent) : boolean;
    

    protected updateMovement(event : ProgramEvent) : void {

        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x*event.tick);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y*event.tick);

        this.pos.x += this.speed.x*event.tick;
        this.pos.y += this.speed.y*event.tick;
    }


    public draw?(canvas : Canvas, bmp? : Bitmap) : void;


    public update(event : ProgramEvent) : void {

        if (!this.exist) 
            return;

        if (this.dying) {

            // What an odd expression
            if (this.die?.(event) ?? true) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.updateEvent?.(event);
        this.updateMovement(event);
    }


    public floorCollision(x : number, y : number, w : number, event : ProgramEvent) : boolean {

        const BOTTOM_MARGIN : number = 12.0;
        const TOP_MARGIN : number = 6.0;

        if (!this.exist || this.dying ||
            this.pos.x + this.collisionBox.x + this.collisionBox.w/2 < x ||
            this.pos.x + this.collisionBox.x - this.collisionBox.w/2 > x + w ||
            this.speed.y < 0.0)
            return false;

        const speedMod : number = Math.abs(this.speed.y)*event.tick;
        const bottom : number = this.pos.y + this.collisionBox.y + this.collisionBox.h/2;

        if (bottom < y + BOTTOM_MARGIN + speedMod && 
            bottom >= y - TOP_MARGIN) {

            this.pos.y = y - (this.collisionBox.y + this.collisionBox.h/2);
            this.speed.y = 0;

            this.floorCollisionEvent?.(event);

            return true;
        }
        return false;
    }


    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => this.dying;


    public forceKill() : void {

        this.exist = false;
        this.dying = false;
    }


    public getPosition = () : Vector => this.pos.clone();


    public isActive = () : boolean => this.exist && !this.dying;
    
}
