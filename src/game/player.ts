import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle } from "../math/rectangle.js";
import { negMod } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";



export class Player extends GameObject {


    private sprBody : Sprite;
    private flip : Flip = Flip.None;

    private ledgeTimer : number = 0.0;
    private jumpTimer : number = 0.0;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.10);
        this.collisionBox = new Rectangle(0, 4, 12, 16);

        this.sprBody = new Sprite(24, 24);
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

        const EPS : number = 0.1;
        const WALK_SPEED : number = 1.5;
        const BASE_GRAVITY : number = 4.0;

        const stick : Vector = event.input.stick;

        this.target.x = stick.x*WALK_SPEED
        this.target.y = BASE_GRAVITY;

        this.handleJumping(event);

        if (Math.abs(stick.x) > EPS) {

            this.flip = stick.x > 0 ? Flip.Horizontal : Flip.None;
        }
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

        const RUN_EPS : number = 0.1;
        const JUMP_FRAME_DELTA : number = 0.5;

        if (this.touchFloor) {

            if (Math.abs(this.target.x) > RUN_EPS) {

                const speed : number = 10 - Math.abs(this.speed.x)*4;

                this.sprBody.animate(0, 0, 3, speed, event.tick);
            }
            else {

                this.sprBody.setFrame(0, 0);
            }
            return;
        }

        let jumpFrame : number = 1;
        if (this.speed.y < -JUMP_FRAME_DELTA) {

            jumpFrame = 0;
        }
        else if (this.speed.y > JUMP_FRAME_DELTA) {

            jumpFrame = 2;
        }
        this.sprBody.setFrame(jumpFrame, 1);
    }


    private drawBase(canvas : Canvas, bmp : Bitmap | undefined, xoff : number): void {

        const dx : number = Math.round(this.pos.x) - 12 + xoff;
        const dy : number = Math.round(this.pos.y) - 12 + 1;

        this.sprBody.draw(canvas, bmp, dx, dy, this.flip);
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

        const bmp : Bitmap | undefined = canvas.getBitmap("player");

        if (!this.exist)
            return;

        if (this.pos.x < this.sprBody.width/2) {

            this.drawBase(canvas, bmp, canvas.width);
        }
        else if (this.pos.x > canvas.width - this.sprBody.width/2) {

            this.drawBase(canvas, bmp, -canvas.width);
        }
        this.drawBase(canvas, bmp, 0);
    }
}