import { ProgramEvent } from "../core/event.js";
import { Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { TILE_HEIGHT } from "./tilesize.js";



export class Apple extends Enemy {


    private dir : -1 | 1 = 1;

    private waveTimer : number = 0.0;


    protected spawnEvent() : void {

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 1);

        this.dir = Math.random() > 0.0 ? 1 : -1;

        this.basePlatformOffset = -TILE_HEIGHT;

        this.fixedY = false;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {
        
        const BORDER_COLLISION_OFFSET : number = 8;
        const BASE_SPEED : number = 0.5;
        const WAVE_SPEED : number = Math.PI*2/60.0;
        const AMPLITUDE : number = 4.0;

        this.target.x = this.dir*globalSpeedFactor*BASE_SPEED;
        this.speed.x = this.target.x;

        if (this.speed.x < 0 && this.pos.x < BORDER_COLLISION_OFFSET) {

            this.pos.x = BORDER_COLLISION_OFFSET;
            this.speed.x = -this.target.x;
            this.dir = 1;
        }
        else if (this.speed.x > 0 && this.pos.x > event.screenWidth - BORDER_COLLISION_OFFSET) {

            this.pos.x = event.screenWidth - BORDER_COLLISION_OFFSET;
            this.speed.x = -this.target.x;
            this.dir = -1;
        }

        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.tick) % (Math.PI*2);
        this.pos.y = this.baseY + Math.sin(this.waveTimer)*AMPLITUDE;

        this.spr.animate(this.spr.getRow(), 0, 3, 4, event.tick);

        this.flip = this.speed.x < 0 ? Flip.Horizontal : Flip.None;
    }
}