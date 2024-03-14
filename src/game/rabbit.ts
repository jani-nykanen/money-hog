import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";



const DISTANCE : number = Math.SQRT2*Math.max(TILE_WIDTH, TILE_HEIGHT)*1.5;


export class Rabbit extends Enemy {


    private dir : -1 | 1 = 1;
    private angle : number = 0.0;
    private baseX : number;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 6);

        this.dir = Math.random() > 0.0 ? 1 : -1;

        this.angle = Math.random()*Math.PI*2;

        this.fixedY = false;
        this.canBeMoved = false;
        this.checkEdgeCollision = false;
        this.canMoveOthers = false;

        this.basePlatformOffset = this.spr.height/2 + TILE_HEIGHT/2;

        this.baseX = this.pos.x;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {

        const ROTATION_SPEED : number = Math.PI*2/120.0;
        const GLOBAL_SPEED_WEIGHT : number = 0.5;

        const weight : number = 1.0 + Math.max(0.0, globalSpeedFactor - 1.0)*GLOBAL_SPEED_WEIGHT;

        this.angle = (this.angle + ROTATION_SPEED*weight*event.tick) % (Math.PI*2);

        this.pos.x = this.baseX + this.dir*Math.cos(this.angle)*DISTANCE;
        this.pos.y = this.baseY + Math.sin(this.angle)*DISTANCE;

        this.spr.animate(this.spr.getRow(), 0, 3, 8, event.tick);
    }


    public preDraw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist || this.dying)
            return;

        const CHAIN_COUNT : number = 4;

        const cx : number = Math.round(this.baseX);
        const cy : number = Math.round(this.baseY);

        const c : number = Math.cos(this.angle);
        const s : number = Math.sin(this.angle);

        for (let i = 0; i < CHAIN_COUNT; ++ i) {

            const distance : number = i*DISTANCE/CHAIN_COUNT;

            const chainx : number = Math.round(cx + this.dir*c*distance);
            const chainy : number = Math.round(cy + s*distance);

            canvas.drawBitmap(bmp, Flip.None, chainx - 12, chainy - 12, 96, 144, 24, 24);
        }
    }
}