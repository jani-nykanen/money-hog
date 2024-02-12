import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Rectangle } from "../math/rectangle.js";
import { negMod } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {


    private ledgeTimer : number = 0.0;
    private jumpTimer : number = 0.0;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.10);
        this.collisionBox = new Rectangle(0, 2, 12, 12);
    }


    private handleJumping(event : ProgramEvent) : void {

        const JUMP_TIME : number = 16.0;
        const DOWN_JUMP_EPS : number = 0.25;
        const DOWN_JUMP_SHIFT : number = 4.0;
        const DOWN_JUMP_INITIAL_SPEED : number = 0.0;

        const jumpButton : InputState = event.input.getAction("jump");

        if (jumpButton == InputState.Pressed) {

            if (this.touchFloor && event.input.stick.y > DOWN_JUMP_EPS) {

                this.pos.y += DOWN_JUMP_SHIFT;
                this.touchFloor = false;
                this.speed.y = DOWN_JUMP_INITIAL_SPEED;

                return;
            }

            if (this.ledgeTimer > 0) {

                this.jumpTimer = JUMP_TIME;
                this.ledgeTimer = 0.0;
            }
        }
        else if ((jumpButton & InputState.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private control(event : ProgramEvent) : void {

        const WALK_SPEED : number = 1.5;
        const BASE_GRAVITY : number = 4.0;

        const stick : Vector = event.input.stick;

        this.target.x = stick.x*WALK_SPEED
        this.target.y = BASE_GRAVITY;

        this.handleJumping(event);
    }


    private updateTimers(event : ProgramEvent) : void {

        const JUMP_SPEED : number = -2.5;

        if (this.jumpTimer > 0.0) {

            this.jumpTimer -= event.tick;
            this.speed.y = JUMP_SPEED;
            this.target.y = JUMP_SPEED;
        }

        if (this.ledgeTimer > 0) {

            this.ledgeTimer -= event.tick;
        }
    }


    private animate(event : ProgramEvent) : void {

        // ...
    }


    private drawBase(canvas : Canvas, xoff : number): void {

        const dx : number = Math.round(this.pos.x) - 8 + xoff;
        const dy : number = Math.round(this.pos.y) - 8 + 1;

        canvas.setColor(255, 0, 0);
        canvas.fillRect(dx, dy, 16, 16);
        canvas.setColor();
    }


    protected floorCollisionEvent(event : ProgramEvent): void {
        
        const LEDGE_TIME : number = 8.0;

        this.ledgeTimer = LEDGE_TIME;
    }


    protected updateEvent(event : ProgramEvent): void {

        this.control(event);
        this.updateTimers(event);
        this.animate(event);

        if (this.pos.x < 0) {

            this.pos.x += event.screenWidth;
        }
        else if (this.pos.x > event.screenWidth) {

            this.pos.x -= event.screenWidth;
        }
    }


    public draw(canvas: Canvas): void {

        if (!this.exist)
            return;

        if (this.pos.x < 8) {

            this.drawBase(canvas, canvas.width);
        }
        else if (this.pos.x > canvas.width - 8) {

            this.drawBase(canvas, -canvas.width);
        }
        this.drawBase(canvas, 0);
    }
}