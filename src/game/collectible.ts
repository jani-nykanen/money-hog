import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { negMod } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { DustParticle } from "./dustparticle.js";


export const enum CollectibleType {

    Unknown = 0,
    Coin = 1,
    Gem = 2,
    Heart = 3
}


export class Collectible extends GameObject {


    private spr : Sprite;
    private dynamic : boolean = false;


    constructor() {

        super(0, 0, false);

        this.spr = new Sprite(32, 32);

        this.friction = new Vector(0.01, 0.15);
    }


    private updateDynamicLogic(event : ProgramEvent) : void {

        const BASE_GRAVITY : number = 4.0;

        this.target.x = 0.0;
        this.target.y = BASE_GRAVITY;
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {

        if (!this.dynamic) {

            this.pos.y -= globalSpeedFactor*event.tick;
        }
        else {

            this.updateDynamicLogic(event);
        }
    }
}
