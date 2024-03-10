import { ProgramEvent } from "../core/event.js";
import { Enemy } from "./enemy.js";
import { Platform } from "./platform.js";


export class SpikeSlime extends Enemy {


    constructor(x : number, y : number, referencePlatform : Platform) {
        
        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 4);

        this.basePlatformOffset = 0;

        this.canBeMoved = false;
        this.canBeStomped = false;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent) : void {
        
        this.spr.animate(this.spr.getRow(), 0, 3, 9, event.tick);
    }
}
