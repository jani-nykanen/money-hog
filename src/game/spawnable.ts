import { ProgramEvent } from "../core/event.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";



export class Spawnable<T> extends GameObject {


    protected type : T;
    protected dynamic : boolean = false;


    protected spawnEvent?() : void;


    public spawn(type : T, x : number, y : number, 
        speedx : number = 0.0, speedy : number = 0.0,
        dynamic : boolean = false) : void {

        this.speed = new Vector(speedx, speedy);
        this.target = this.speed.clone();

        this.type = type;
        this.dynamic = dynamic;

        this.pos.x = x;
        this.pos.y = y;

        this.spawnEvent?.();

        this.exist = true;
    }


    public playerCollision?(player : Player, event : ProgramEvent) : void
    public objectToObjectCollision?(o : Spawnable<T>, event : ProgramEvent) : void;
}
