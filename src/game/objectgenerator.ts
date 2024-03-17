import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap } from "../gfx/interface.js";
import { Player } from "./player.js";
import { next } from "./existingobject.js";
import { Stage } from "./stage.js";
import { Spawnable } from "./spawnable.js";


export class ObjectGenerator<T, S extends Spawnable<T>> {


    private objects : S[];

    private baseType : Function;


    constructor(baseType : Function) {

        this.objects = new Array<S> ();

        this.baseType = baseType;
    }


    public spawn(type : T, x : number, y : number, 
        speedx : number = 0.0, speedy : number = 0.0,
        dynamic : boolean = false) : S {

        const o : S = next<S> (this.objects, this.baseType);
        
        o.spawn(type, x, y, speedx, speedy, dynamic);

        return o;
    }


    public update(globalSpeedFactor : number, player : Player, stage : Stage, event : ProgramEvent) : void {

        for (let o of this.objects) {

            o.update(globalSpeedFactor, event);
            o.playerCollision?.(player, event, globalSpeedFactor);
            stage.objectCollision(o, globalSpeedFactor, event);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let o of this.objects) {

            o.draw?.(canvas, bmp);
        }
    }


    public flush() : void {

        for (let o of this.objects) {

            o.forceKill();
        }
    }
}
