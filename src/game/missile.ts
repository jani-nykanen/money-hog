import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT } from "./tilesize.js";


const ENTRANCE_TIME : number = 48;


export class Missile extends Enemy {


    private dir : -1 | 1 = 1;

    private entranceTimer : number = 0.0;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 9);

        // 64 is just some number that is certainly strictly smaller than
        // the screen width. Cannot pass the event parameter here...
        this.dir = x < 64 ? 1 : -1;
        this.pos.x -= this.spr.width/2*this.dir;

        this.flip = this.dir == -1 ? Flip.Horizontal : Flip.None;

        this.fixedY = false;
        this.canBeMoved = false;
        this.harmful = false;
        this.canMoveOthers = false;

        this.friction.x = 0.05;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {

        const TARGET_SPEED : number = 6.0;
        const SPEED_FACTOR : number = 0.5;
        const ENTRANCE_WAIT : number = 16;
        const ENTRANCE_SPEED : number = (this.spr.width/2)/ENTRANCE_TIME;

        if (!this.harmful) {

            if (this.entranceTimer < ENTRANCE_TIME) {

                this.pos.x += this.dir*ENTRANCE_SPEED*event.tick;
            }
            this.entranceTimer += event.tick;

            if (this.entranceTimer >= ENTRANCE_TIME + ENTRANCE_WAIT) {

                this.speed.zeros();
                this.target.x = (1.0 + SPEED_FACTOR*globalSpeedFactor)*TARGET_SPEED*this.dir;
                
                this.harmful = true;
            }
            else {

                return;
            }
        }


        this.speed.y = -globalSpeedFactor;
        this.target.y = this.speed.y;      
        
        this.spr.animate(this.spr.getRow(), 0, 3, 4, event.tick);

        if ((this.dir > 0 && this.pos.x >= event.screenWidth + this.spr.width/2) ||
            (this.dir < 0 && this.pos.x < -this.spr.width/2)) {

            // console.log("Missile killed!");
            this.forceKill();
        }
    }


    public postDraw(canvas : Canvas, bmp : Bitmap): void {

        if (!this.exist || this.dying || this.entranceTimer >= ENTRANCE_TIME)
            return;

        const frame : number = Math.floor(this.entranceTimer/4) % 2;

        const dx : number = this.dir > 0 ? 0 : canvas.width - 24;
        const dy : number = Math.round(this.pos.y) - this.spr.height/2;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 96 + frame*24, 216, 24, 24);
    }
}