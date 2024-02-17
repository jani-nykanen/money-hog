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


export class Player extends GameObject {


    private sprBody : Sprite;
    private flip : Flip = Flip.None;

    private ledgeTimer : number = 0.0;
    private jumpTimer : number = 0.0;

    private dust : ParticleGenerator<DustParticle>;
    private dustTimer : number = 0.0;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.10);
        this.collisionBox = new Rectangle(0, 4, 12, 16);
        this.hitbox = new Rectangle(0, 0, 16, 14);

        this.sprBody = new Sprite(24, 24);
    
        this.dust = new ParticleGenerator<DustParticle> ();
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


    private updateDust(globalSpeedFactor : number, event : ProgramEvent) : void {

        const DUST_INTERVAL : number = 6.0;
        const VANISH_SPEED : number = 1.0/45.0;
        const EPS : number = 0.01;


        const standingStill : boolean = this.touchFloor && 
            Math.abs(this.target.x) < EPS && 
            Math.abs(this.speed.x) < EPS;

        if (!standingStill) {

            this.dustTimer += event.tick;
        }

        if (this.dustTimer >= DUST_INTERVAL) {

            this.dustTimer %= DUST_INTERVAL;

            const p : DustParticle = this.dust.spawn(DustParticle, this.pos.x, this.pos.y + 1, 0.0, 0.0, VANISH_SPEED);
            p.setSprite(
                this.sprBody.width, this.sprBody.height, 
                this.sprBody.getColumn(), this.sprBody.getRow(),
                this.flip);
        }

        this.dust.update(globalSpeedFactor, event);
    }


    private animate(event : ProgramEvent) : void {

        const RUN_EPS : number = 0.1;
        const JUMP_FRAME_DELTA : number = 0.25;

        if (this.touchFloor) {

            if (Math.abs(this.target.x) > RUN_EPS) {

                const speed : number = 12 - Math.abs(this.speed.x)*5;

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


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {

        this.control(event);
        this.updateTimers(event);
        this.updateDust(globalSpeedFactor, event);
        this.animate(event);

        if (this.pos.x < 0) {

            this.pos.x += event.screenWidth;
        }
        else if (this.pos.x > event.screenWidth) {

            this.pos.x -= event.screenWidth;
        }
    }


    public drawDust(canvas : Canvas) : void {

        if (!this.exist)
            return;

        const bmp : Bitmap | undefined = canvas.getBitmap("player");

        canvas.toggleSilhouetteRendering(true);

        canvas.applyEffect(Effect.FixedColor);
        canvas.setColor(256, 173, 219, 0.67);

        this.dust.draw(canvas, bmp);

        canvas.applyEffect(Effect.None);
        canvas.setColor();

        canvas.toggleSilhouetteRendering(false);
    }


    public draw(canvas: Canvas): void {

        if (!this.exist)
            return;

        const bmp : Bitmap | undefined = canvas.getBitmap("player");

        if (this.pos.x < this.sprBody.width/2) {

            this.drawBase(canvas, bmp, canvas.width);
        }
        else if (this.pos.x > canvas.width - this.sprBody.width/2) {

            this.drawBase(canvas, bmp, -canvas.width);
        }
        this.drawBase(canvas, bmp, 0);
    }
}