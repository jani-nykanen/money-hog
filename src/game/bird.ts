import { ProgramEvent } from "../core/event.js";
import { Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";
import { Player } from "./player.js";
import { TILE_HEIGHT } from "./tilesize.js";



export class Bird extends Enemy {


    private dir : -1 | 1 = 1;

    private waveTimer : number = 0.0;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 5);

        this.dir = Math.random() > 0.0 ? 1 : -1;

        this.basePlatformOffset = -TILE_HEIGHT;

        this.waveTimer = Math.random()*Math.PI*2;

        this.fixedY = false;
        this.canBeMoved = true;
        // this.canBeHeadbutted = false;

        this.hitbox.y -= 1;
        this.hitbox.h += 2;
    }


    protected edgeEvent(event : ProgramEvent) : void {
        
        this.dir *= -1;
        this.target.x *= -1;
        this.speed.x = this.target.x;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {

        const BASE_SPEED : number = 0.33;
        const WAVE_SPEED : number = Math.PI*2/120.0;
        const AMPLITUDE : number = 2.0;

        this.target.x = this.dir*globalSpeedFactor*BASE_SPEED;
        this.speed.x = this.target.x;

        this.waveTimer = (this.waveTimer + WAVE_SPEED*globalSpeedFactor*event.tick) % (Math.PI*2);
        this.pos.y = this.baseY + Math.sin(this.waveTimer)*AMPLITUDE;

        this.spr.animate(this.spr.getRow(), 0, 3, 4, event.tick);

        this.flip = this.speed.x < 0 ? Flip.Horizontal : Flip.None;
    }


    protected playerEvent(globalSpeedFactor : number, player : Player, event : ProgramEvent) : boolean {
        
        const COLLISION_WIDTH : number = 32;
        const COLLISION_HEIGHT : number = 16;

        const Y_OFFSET : number = 5;

        const left : number = this.pos.x - COLLISION_WIDTH/2;
        const top : number = this.pos.y + Y_OFFSET - COLLISION_HEIGHT/2;

        if (player.isHeadbutting() &&
            player.hurtCollision(left, top, COLLISION_WIDTH, COLLISION_HEIGHT, event)) {

            player.stopHeadbutt(globalSpeedFactor, false, true);
            return true;
        }
        return false;
    }
}