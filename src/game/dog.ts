import { ProgramEvent } from "../core/event.js";
import { Flip } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";


export class Dog extends Enemy {


    private dir : -1 | 1 = 1;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 2);

        this.dir = Math.random() > 0.0 ? 1 : -1;

        this.checkEdgeCollision = true;
    }


    protected edgeEvent(event : ProgramEvent) : void {
        
        this.dir *= -1;
        this.target.x *= -1;
        this.speed.x = this.target.x;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent): void {
        
        const BASE_SPEED : number = 0.33;
        const GLOBAL_SPEED_WEIGHT : number = 0.5;

        const weight : number = 1.0 + Math.max(0.0, globalSpeedFactor - 1.0)*GLOBAL_SPEED_WEIGHT;

        this.target.x = this.dir*weight*BASE_SPEED;
        this.speed.x = this.target.x;

        this.spr.animate(this.spr.getRow(), 0, 3, 6, event.tick);

        this.flip = this.speed.x < 0 ? Flip.Horizontal : Flip.None;
    }
}
