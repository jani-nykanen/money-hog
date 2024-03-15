import { Bat } from "./bat.js";
import { StompType } from "./enemy.js";
import { Platform } from "./platform.js";


export class SpikeBat extends Bat {

    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, referencePlatform);

        const initialFrame : number = Math.floor(Math.random()*3);
        this.spr.setFrame(initialFrame, 8);

        this.speedFactor = 1.25;

        this.stompType = StompType.Hurt;
    }
}
