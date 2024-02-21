import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Platform } from "./platform.js";
import { Spawnable } from "./spawnable.js";


export const enum EnemyType {

    Unknown = 0,
    Slime = 1,
}


const START_FRAME : number[] = [0];
const END_FRAME : number[] = [3];
const ANIMATION_SPEED : number[] = [9];


export class Enemy extends Spawnable<EnemyType> {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private referencePlatform : Platform | undefined = undefined;


    constructor() {

        super();

        this.spr = new Sprite(24, 24);
    }


    private animate(event : ProgramEvent) : void {

        const start : number = START_FRAME[this.type - 1] ?? 0;
        const end : number = END_FRAME[this.type - 1] ?? 3;
        const speed : number = ANIMATION_SPEED[this.type - 1] ?? 6;

        this.spr.animate(this.spr.getRow(), start, end, speed, event.tick);
    }


    private drawBase(canvas : Canvas, bmpBody : Bitmap | undefined, xoff : number = 0): void {

        const dx : number = Math.round(this.pos.x) - 12 + xoff;
        const dy : number = Math.round(this.pos.y) - 12 + 1;

        this.spr.draw(canvas, bmpBody, dx, dy, this.flip);
    }


    protected spawnEvent() : void {
        
        if (this.type != EnemyType.Unknown) {

            const start : number = START_FRAME[this.type - 1] ?? 0;
            const end : number = END_FRAME[this.type - 1] ?? 3;

            const initialFrame : number = start + Math.floor(Math.random()*(end - start));

            this.spr.setFrame(initialFrame, this.type - 1);
        }
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        this.animate(event);

        if (this.referencePlatform !== undefined) {

            this.pos.y = this.referencePlatform.getY() - this.spr.height/2
        }
        else {

            this.pos.y -= globalSpeedFactor*event.tick;
        }

        if (this.pos.y < 0 ||
            (this.speed.y > 0 && this.pos.y > event.screenHeight + this.spr.height)) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist)
            return;

        if (this.pos.x < this.spr.width/2) {

            this.drawBase(canvas, bmp, canvas.width);
        }
        else if (this.pos.x > canvas.width - this.spr.width/2) {

            this.drawBase(canvas, bmp, -canvas.width);
        }
        this.drawBase(canvas, bmp);
    }


    public setReferencePlatform(p : Platform | undefined) : void {

        this.referencePlatform = p;
    }
}
