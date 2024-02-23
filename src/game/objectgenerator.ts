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
            o.playerCollision?.(player, event);
            stage.objectCollision(o, event);
        }
    }


    public objectToObjectCollision(event : ProgramEvent) : void {

        for (let i = 0; i < this.objects.length; ++ i) {

            if (!this.objects[i].doesExist())
                continue;

            for (let j = i; j < this.objects.length; ++ j) {

                // Since we need collisions in both directions, we do (temporarily?)
                // it this way. Probably could iterate over all pairs to get the same
                // effect.
                this.objects[i].objectToObjectCollision(this.objects[j], event);
                this.objects[j].objectToObjectCollision(this.objects[i], event);
            }
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let o of this.objects) {

            o.draw?.(canvas, bmp);
        }
    }
}
