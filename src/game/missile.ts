import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { DustParticle } from "./dustparticle.js";
import { Enemy } from "./enemy.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT } from "./tilesize.js";


const ENTRANCE_TIME : number = 72;


export class Missile extends Enemy {


    private dir : -1 | 1 = 1;

    private entranceTimer : number = 0.0;

    private dust : ParticleGenerator<DustParticle> | undefined = undefined;
    private dustTimer : number = 0.0;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 9);

        // 64 is just some number that is certainly strictly smaller than
        // the screen width. Cannot pass the event parameter here...
        this.dir = x < 64 ? 1 : -1;
        this.pos.x -= this.spr.width*this.dir;

        this.flip = this.dir == -1 ? Flip.Horizontal : Flip.None;

        this.fixedY = false;
        this.canBeMoved = false;
        this.harmful = false;
        this.canMoveOthers = false;

        this.friction.x = 0.05;
    }


    private updateDust(globalSpeedFactor : number, event : ProgramEvent) : void {

        const DUST_INTERVAL : number = 5.0;
        const VANISH_SPEED : number = 1.0/30.0;
        const DUST_SPEED : number = 1.0;

        if (this.dust === undefined)
            return;

        this.dustTimer += DUST_SPEED*event.tick;

        if (this.dustTimer >= DUST_INTERVAL) {

            this.dustTimer %= DUST_INTERVAL;

            const p : DustParticle = this.dust.spawn(DustParticle, this.pos.x - 12*this.dir, this.pos.y, 0.0, 0.0, VANISH_SPEED);
            p.setSprite(
                this.spr.width, this.spr.height, 
                6, this.spr.getRow(),
                Flip.None);
        }

        // this.dust.update(globalSpeedFactor, event);
    }


    protected deathEvent(globalSpeedFactor : number, event : ProgramEvent) : void {
         
        this.dust?.update(globalSpeedFactor, event);
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {

        const TARGET_SPEED : number = 6.0;
        const SPEED_FACTOR : number = 0.5;
        const ENTRANCE_WAIT : number = 16;
        const ENTRANCE_SPEED : number = (this.spr.width)/ENTRANCE_TIME;

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

        this.updateDust(globalSpeedFactor, event);
    }


    public postDraw(canvas : Canvas, bmp : Bitmap): void {

        if (!this.exist || this.dying || this.entranceTimer >= ENTRANCE_TIME)
            return;

        const frame : number = Math.floor(this.entranceTimer/4) % 2;

        const dx : number = this.dir > 0 ? 0 : canvas.width - 24;
        const dy : number = Math.round(this.pos.y) - this.spr.height/2;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 96 + frame*24, 216, 24, 24);
    }


    public setDustGenerator(gen : ParticleGenerator<DustParticle>) : void {

        this.dust = gen;
    }
}