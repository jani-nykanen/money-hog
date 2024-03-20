import { ProgramEvent } from "../core/event.js";
import { Vector } from "../math/vector.js";
import { Enemy, StompType } from "./enemy.js";
import { Platform } from "./platform.js";
import { Player } from "./player.js";
import { TILE_HEIGHT } from "./tilesize.js";



const EXPAND_TIME : number = 12;


export class Bumper extends Enemy {


    private expandTimer : number = 0.0;


    constructor(x : number, y : number, referencePlatform : Platform) {
        
        super(x, y, referencePlatform);

        this.spr.setFrame(0, 10);

        this.basePlatformOffset = TILE_HEIGHT + TILE_HEIGHT/4;

        this.canBeMoved = false;
        this.canMoveOthers = false;
        this.canBeHeadbutted = false;
        this.stompType = StompType.Bounce;

        this.pos.y -= 1;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent) : void {
        
        const EXPAND_SCALE : number = 0.5;

        this.scale.x = 1.0;
        this.scale.y = 1.0;

        this.shift.zeros();

        if (this.expandTimer > 0) {

            const t : number = this.expandTimer/EXPAND_TIME;
            
            this.scale.x = 1.0 + t*EXPAND_SCALE;
            this.scale.y = 1.0 + t*EXPAND_SCALE;

            this.shift.y = this.scale.y*this.spr.height/2 - this.spr.height/2;

            this.expandTimer -= event.tick;

            this.spr.setFrame(1, this.spr.getRow());
            return;
        }

        this.spr.setFrame(0, this.spr.getRow());
    }


    protected playerEvent(globalSpeedFactor : number, player : Player, event : ProgramEvent) : boolean {
        
        const COLLISION_DISTANCE : number = 16;
        const SPEED : number = 3.5;

        const dist : number = Vector.distance(this.pos, player.getPosition());

        if (this.expandTimer <= 0 && dist < COLLISION_DISTANCE) {

            const dir : Vector = Vector.direction(this.pos, player.getPosition());

            player.directionalBump(dir, this.pos, COLLISION_DISTANCE, SPEED, event);

            this.expandTimer = EXPAND_TIME;
            this.addPoints(player);

            event.audio.playSample(event.assets.getSample("bounce"), 0.60);
        }
        return true;
    }
}
