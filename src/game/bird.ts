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

        this.basePlatformOffset = -TILE_HEIGHT*0.75;

        this.waveTimer = Math.random()*Math.PI*2;

        this.fixedY = false;
        this.canBeMoved = true;
        this.canBeHeadbutted = false;
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
        const GLOBAL_SPEED_WEIGHT : number = 0.5;

        const weight : number = 1.0 + Math.max(0.0, globalSpeedFactor - 1.0)*GLOBAL_SPEED_WEIGHT;

        this.target.x = this.dir*weight*BASE_SPEED;
        this.speed.x = this.target.x;

        this.waveTimer = (this.waveTimer + WAVE_SPEED*weight*event.tick) % (Math.PI*2);
        this.pos.y = this.baseY + Math.sin(this.waveTimer)*AMPLITUDE;

        this.spr.animate(this.spr.getRow(), 0, 3, 4, event.tick);

        this.flip = this.speed.x < 0 ? Flip.Horizontal : Flip.None;
    }

/*
    // This did not work properly
    protected playerEvent(globalSpeedFactor : number, player : Player, event : ProgramEvent) : boolean {
        
        const COLLISION_WIDTH : number = 32;
        const COLLISION_HEIGHT : number = 18;

        const Y_OFFSET : number = 6;

        const left : number = this.pos.x - COLLISION_WIDTH/2;
        const top : number = this.pos.y + Y_OFFSET - COLLISION_HEIGHT/2;

        if (player.isHeadbutting() &&
            player.hurtCollision(left, top, COLLISION_WIDTH, COLLISION_HEIGHT, event)) {

            player.stopHeadbutt(globalSpeedFactor, false, true);
            return true;
        }
        return false;
    }
    */
}