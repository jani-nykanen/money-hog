import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {


    constructor(x : number, y : number) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.15);
        this.collisionBox = new Rectangle(0, 2, 12, 12);
    }


    private control(event : ProgramEvent) : void {

        const WALK_SPEED : number = 1.5;
        const BASE_GRAVITY : number = 4.0;

        const stick : Vector = event.input.stick;

        this.target.x = stick.x*WALK_SPEED
        this.target.y = BASE_GRAVITY;
    }


    private animate(event : ProgramEvent) : void {

        // ...
    }


    protected updateEvent(event : ProgramEvent): void {

        this.control(event);
        this.animate(event);
    }


    public draw(canvas: Canvas): void {

        if (!this.exist)
            return;

        const dx : number = Math.round(this.pos.x) - 8;
        const dy : number = Math.round(this.pos.y) - 16 + 1;

        canvas.setColor(255, 0, 0);
        canvas.fillRect(dx, dy, 16, 16);
        canvas.setColor();
    }
}