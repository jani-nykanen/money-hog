import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect, TransformTarget } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { negMod } from "../math/utility.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { DustParticle } from "./dustparticle.js";
import { Stats } from "./stats.js";


export class Player extends GameObject {


    private sprBody : Sprite;
    private sprBashEffect : Sprite;
    private flip : Flip = Flip.None;
    private faceDirection : -1 | 1 = -1;

    private ledgeTimer : number = 0.0;
    private jumpTimer : number = 0.0;

    private canHeadButt : boolean = false;
    private headButting : boolean = false;
    private headButtTimer : number = 0.0;
    private gravityFreeHeadbutt : boolean = false;

    private dust : ParticleGenerator<DustParticle>;
    private dustTimer : number = 0.0;

    private hurtTimer : number = 0;
    private shakeTimer : number = 0;

    public readonly stats : Stats;


    constructor(x : number, y : number, stats : Stats) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.10);
        this.collisionBox = new Rectangle(0, 6, 10, 12);
        this.hitbox = new Rectangle(0, 4, 16, 14);

        this.sprBody = new Sprite(24, 24);
        this.sprBashEffect = new Sprite(32, 32);
    
        this.dust = new ParticleGenerator<DustParticle> ();

        this.stats = stats;
    }


    private handleHeadButting(globalSpeedFactor : number, event : ProgramEvent) : void {

        const HEADBUTT_SPEED : number = 4.0;
        const MAX_HEADBUTT_TIME : number = 16;
        const MIN_HEADBUTT_RELEASE_TIME : number = 8;
        const FLOOR_HEADBUTT_JUMP : number = -2.25;

        const attackButton : InputState = event.input.getAction("attack");

        if (!this.headButting &&
            this.canHeadButt &&
            attackButton == InputState.Pressed) {

            this.headButting = true;
            this.headButtTimer = MAX_HEADBUTT_TIME;

            this.canHeadButt = false;
            this.gravityFreeHeadbutt = !this.touchFloor;
            if (!this.gravityFreeHeadbutt) {

                this.speed.y = FLOOR_HEADBUTT_JUMP;
            }
        }
        else if (this.headButting) {

            this.headButtTimer -= event.tick;
            if (((attackButton & InputState.DownOrPressed) == 0 &&
                this.headButtTimer <= MIN_HEADBUTT_RELEASE_TIME) ||
                this.headButtTimer <= 0) {

                this.headButtTimer = 0;
                this.headButting = false;
                return;
            }

            this.speed.x = this.faceDirection*HEADBUTT_SPEED;
            this.target.x = this.speed.x;

            if (this.gravityFreeHeadbutt) {

                this.speed.y = -globalSpeedFactor;
                this.target.y = this.speed.y;
            }
        }
    }


    private handleJumping(event : ProgramEvent) : void {

        const JUMP_TIME : number = 16.0;
        const DOWN_JUMP_EPS : number = 0.25;
        const DOWN_JUMP_SHIFT : number = 4.0;
        const DOWN_JUMP_INITIAL_SPEED : number = 0.0;

        const jumpButton : InputState = event.input.getAction("jump");

        if (jumpButton == InputState.Pressed) {

            if (this.touchFloor && 
                event.input.stick.y > DOWN_JUMP_EPS) {

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


    private control(globalSpeedFactor : number, event : ProgramEvent) : void {

        const EPS : number = 0.1;
        const WALK_SPEED : number = 1.5;
        const BASE_GRAVITY : number = 4.0;

        const stick : Vector = event.input.stick;

        if (!this.headButting && Math.abs(stick.x) > EPS) {

            this.faceDirection = stick.x > 0 ? 1 : -1;
            this.flip = stick.x > 0 ? Flip.Horizontal : Flip.None;
        }

        this.handleHeadButting(globalSpeedFactor, event);
        if (this.headButting) {

            return;
        }

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

        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.tick;
        }
    
        if (this.shakeTimer > 0) {

            this.shakeTimer -= event.tick;
        }
    }


    private updateDust(globalSpeedFactor : number, event : ProgramEvent) : void {

        const DUST_INTERVAL : number = 6.0;
        const HEADBUTT_SPEED_BONUS : number = 2.0;
        const VANISH_SPEED : number = 1.0/45.0;
        const EPS : number = 0.01;


        const standingStill : boolean = this.touchFloor && 
            Math.abs(this.target.x) < EPS && 
            Math.abs(this.speed.x) < EPS;

        if (!standingStill) {

            const dustSpeed : number = this.headButting ? HEADBUTT_SPEED_BONUS : 1.0;
            this.dustTimer += dustSpeed*event.tick;
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
        const BASH_EFFECT_FLICKER_SPEED : number = 3;

        if (this.headButting) {

            this.sprBashEffect.animate(0, 0, 3, BASH_EFFECT_FLICKER_SPEED, event.tick);
            this.sprBody.setFrame(3, 1);
            return;
        }

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


    private drawBase(canvas : Canvas, 
        bmpBody : Bitmap | undefined, bmpBashEffect : Bitmap | undefined, 
        xoff : number): void {

        const BASH_EFFECT_OFFSET_X : number[] = [-22, 14];
        const BASH_EFFECT_OFFSET_Y : number = -4;

        const dx : number = Math.round(this.pos.x) - 12 + xoff;
        const dy : number = Math.round(this.pos.y) - 12 + 1;

        this.sprBody.draw(canvas, bmpBody, dx, dy, this.flip);

        if (this.headButting) {

            this.sprBashEffect.draw(canvas, bmpBashEffect, 
                dx + BASH_EFFECT_OFFSET_X[this.flip as number],
                dy + BASH_EFFECT_OFFSET_Y, this.flip);
        }
    }


    protected floorCollisionEvent(event : ProgramEvent): void {
        
        const LEDGE_TIME : number = 8.0;

        this.ledgeTimer = LEDGE_TIME;
        this.canHeadButt = true;
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {

        this.control(globalSpeedFactor, event);
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

        if (!this.exist || 
            (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 == 0)) {
            
            return;
        }

        const bmpBody : Bitmap | undefined = canvas.getBitmap("player");
        const bmpBashEffect : Bitmap | undefined = canvas.getBitmap("bash_effect");

        if (this.pos.x < this.sprBody.width/2) {

            this.drawBase(canvas, bmpBody, bmpBashEffect, canvas.width);
        }
        else if (this.pos.x > canvas.width - this.sprBody.width/2) {

            this.drawBase(canvas, bmpBody, bmpBashEffect, -canvas.width);
        }
        this.drawBase(canvas, bmpBody, bmpBashEffect, 0);
    }


    public hurtCollision(x : number, y : number, w : number, h : number, event : ProgramEvent) : boolean {

        const HURT_TIME : number = 60;

        if (!this.exist || this.dying || this.hurtTimer > 0)
            return false;

        if (!overlayRect(this.pos, this.collisionBox, new Vector(x + w/2, y + h/2), new Rectangle(0, 0, w, h)))
            return false;

        this.hurtTimer = HURT_TIME;
        this.shakeTimer = HURT_TIME/2;

        this.stats.changeLives(-1);

        return true;
    }


    public applyShake(canvas : Canvas) : void {

        const SHAKE_MAX : number = 4;

        if (this.shakeTimer <= 0.0 || !this.exist)
            return;

        const shakex : number = Math.floor((Math.random()*2.0 - 1.0)*SHAKE_MAX);
        const shakey : number = Math.floor((Math.random()*2.0 - 1.0)*SHAKE_MAX);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.translate(shakex, shakey);
        canvas.applyTransform();
    }


    public bump(amount : number, event : ProgramEvent) : void {

        this.speed.y = amount;
        
        this.canHeadButt = true;
        this.headButting = false;
        this.headButtTimer = 0;
    }
}
