import { ProgramEvent } from "../core/event.js";
import { Flip } from "../gfx/interface.js";
import { Enemy, StompType } from "./enemy.js";
import { Platform } from "./platform.js";


const BOUNCE_TIME : number = 24;


/*
 * Extend dog, maybe?
 */


export class Mushroom extends Enemy {


    private dir : -1 | 1 = 1;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 7);

        this.dir = Math.random() > 0.0 ? 1 : -1;

        this.checkEdgeCollision = true;

        this.stompType = StompType.Bounce;
    }


    private computeScale() : void {

        this.scale.x = 1.0;
        this.scale.y = 1.0;

        if (this.bounceRecoverTimer <= 0) {

            return;
        }

        const t : number = (1.0 - this.bounceRecoverTimer/BOUNCE_TIME)*2.0;
        const s : number = Math.sin(t*Math.PI);

        if (t < 1.0) {

            this.scale.x = 1.0 + s*0.75;
            this.scale.y = 1.0 - s*0.25;
            return;
        }

        this.scale.x = 1.0 + s*0.25;
        this.scale.y = 1.0 - s*0.25;
    }


    protected bounceEvent(event : ProgramEvent) : void {

        this.bounceRecoverTimer = BOUNCE_TIME;
    }


    protected edgeEvent(event : ProgramEvent) : void {
        
        this.dir *= -1;
        this.target.x *= -1;
        this.speed.x = this.target.x;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {
        
        const BASE_SPEED : number = 0.50;

        if (this.bounceRecoverTimer > 0) {

            this.spr.setFrame(4, this.spr.getRow());
            this.target.x = 0.0;
        }
        else {

            this.spr.animate(this.spr.getRow(), 0, 3, 6, event.tick);
            this.target.x = this.dir*globalSpeedFactor*BASE_SPEED;

            this.flip = this.target.x < 0 ? Flip.Horizontal : Flip.None;
        }
        this.speed.x = this.target.x;

        this.computeScale();
    }
}
