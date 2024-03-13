import { ProgramEvent } from "../core/event.js";
import { Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";
import { PLATFORM_OFFSET } from "./stage.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";



export class Bat extends Enemy {


    private waveTimer : number = 0.0;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 3);

        this.basePlatformOffset = -TILE_HEIGHT;

        this.waveTimer = Math.random()*Math.PI*2;

        this.canBeMoved = false;
        this.fixedY = false;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {

        const WAVE_SPEED : number = Math.PI*2/120.0;
        const PLATFORM_OFFSET_FACTOR : number = 0.90;

        this.waveTimer += WAVE_SPEED*globalSpeedFactor*event.tick;
        if (this.waveTimer >= Math.PI*2) {

            this.waveTimer %= Math.PI*2;
        }
        // this.waveTimer = (this.waveTimer + WAVE_SPEED*globalSpeedFactor*event.tick) % (Math.PI*2);

        this.pos.y = this.baseY + Math.sin(this.waveTimer)*((PLATFORM_OFFSET - 2)*(TILE_WIDTH*PLATFORM_OFFSET_FACTOR)/2);

        this.spr.animate(this.spr.getRow(), 0, 3, 8, event.tick);
    }
}