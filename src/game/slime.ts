import { ProgramEvent } from "../core/event.js";
import { Enemy } from "./enemy.js";


export class Slime extends Enemy {


    protected spawnEvent() : void {
        
        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 0);

        this.basePlatformOffset = 0;
    }


    protected updateAI(globalSpeedFactor : number, event : ProgramEvent) : void {
        
        this.spr.animate(this.spr.getRow(), 0, 3, 9, event.tick);
    }
}
