import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Canvas, Bitmap, Flip, Effect, TransformTarget, Align } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { DustParticle } from "./dustparticle.js";
import { Stats } from "./stats.js";
import { StarParticle } from "./starparticle.js";
import { FlyingText } from  "./flyingtext.js";
import { Enemy } from "./enemy.js";
import { STAR_VOLUME, THEME_VOLUME } from "./volume.js";
import { clamp } from "../math/utility.js";



const DEATH_TIME : number = 60;

const STAR_EXIST_TIME : number = 1.0/20.0;
const STAR_SPEED : number = 3.0;

const INVICIBILITY_TIME : number = 60*5;
const INVICIBILITY_COLOR : number[] = [182, 255, 146];

const INSTANT_KILL_TIME : number = 180;
const INSTANT_KILL_RECOVER : number = 120;
const INSTANT_KILL_WARNING_TIME : number = 75;


export class Player extends GameObject {


    private sprBody : Sprite;
    private sprBashEffect : Sprite;
    private flip : Flip = Flip.Horizontal;
    private faceDirection : -1 | 1 = 1;

    private ledgeTimer : number = 0.0;
    private jumpTimer : number = 0.0;
    private canDoubleJump : boolean = false;
    private doubleJumping : boolean = false;

    private canHeadButt : boolean = false;
    private headButting : boolean = false;
    private headButtTimer : number = 0.0;
    private gravityFreeHeadbutt : boolean = false;
    private touchBridge : boolean = false;
    private headbuttHitbox : Rectangle;

    private dust : ParticleGenerator<DustParticle>;
    private stars : ParticleGenerator<StarParticle>;
    private flyingText : ParticleGenerator<FlyingText>;
    private dustTimer : number = 0.0;

    private hurtTimer : number = 0;
    private shakeTimer : number = 0;
    private downJumpIconTimer : number = 0;
    private deathTimer : number = 0;
    private canControl : boolean = false;

    private jumpInvincibilityTimer : number = 0; // Don't mix this up with the one below
    private invincibilityTimer : number = 0;

    private instantKillTimer : number = 0;
    private instantKillRecoverTimer : number = 0;

    private arrowWave : number = 0.0;

    public readonly stats : Stats;


    constructor(x : number, y : number, stats : Stats) {

        super(x, y, true);

        this.friction = new Vector(0.25, 0.10);
        this.collisionBox = new Rectangle(0, 6, 10, 12);
        this.hitbox = new Rectangle(0, 4, 16, 14);

        this.sprBody = new Sprite(24, 24);
        this.sprBashEffect = new Sprite(32, 32);
    
        this.dust = new ParticleGenerator<DustParticle> ();
        this.stars = new ParticleGenerator<StarParticle> ();
        this.flyingText = new ParticleGenerator<FlyingText> ();

        this.headbuttHitbox = new Rectangle();

        this.stats = stats;
    }


    private computeHeadbuttHitbox() : void {

        const WIDTH : number = 8;
        const HEIGHT : number = 24;

        const OFFSET_X : number = 12;
        const OFFSET_Y : number = 0;

        this.headbuttHitbox.x = this.pos.x + this.faceDirection*OFFSET_X;
        this.headbuttHitbox.y = this.pos.y + OFFSET_Y;
        
        this.headbuttHitbox.w = WIDTH;
        this.headbuttHitbox.h = HEIGHT;
    }


    private handleHeadButting(globalSpeedFactor : number, event : ProgramEvent) : void {

        const HEADBUTT_SPEED : number = 4.0;
        const MAX_HEADBUTT_TIME : number = 16;
        const MIN_HEADBUTT_RELEASE_TIME : number = 8;
        const FLOOR_HEADBUTT_JUMP : number = -1.125;

        const attackButton : InputState = event.input.getAction("attack");

        if (!this.headButting &&
            this.canHeadButt &&
            attackButton == InputState.Pressed) {

            this.headButting = true;
            this.headButtTimer = MAX_HEADBUTT_TIME;

            this.canHeadButt = false;
            this.gravityFreeHeadbutt = !this.touchFloor;
            if (!this.gravityFreeHeadbutt) {

                this.speed.y = FLOOR_HEADBUTT_JUMP*(1.0 + globalSpeedFactor);
            }

            event.audio.playSample(event.assets.getSample("headbutt"), 0.50);
        }
        else if (this.headButting) {

            this.headButtTimer -= event.tick;
            if (((attackButton & InputState.DownOrPressed) == 0 &&
                this.headButtTimer <= MIN_HEADBUTT_RELEASE_TIME) ||
                this.headButtTimer <= 0) {

                this.headButtTimer = 0;
                this.headButting = false;
                this.doubleJumping = false;

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
        const DOUBLE_JUMP_TIME : number = 10.0;
        const DOWN_JUMP_EPS : number = 0.25;
        const DOWN_JUMP_SHIFT : number = 4.0;
        const DOWN_JUMP_INITIAL_SPEED : number = 0.0;

        const JUMP_VOLUME : number = 0.50;

        const jumpButton : InputState = event.input.getAction("jump");

        if (jumpButton == InputState.Pressed) {

            if (event.input.stick.y > DOWN_JUMP_EPS) {

                if (this.touchBridge) {

                    this.pos.y += DOWN_JUMP_SHIFT;
                    this.touchFloor = false;
                    this.touchBridge = false;
                    this.speed.y = DOWN_JUMP_INITIAL_SPEED;

                    event.audio.playSample(event.assets.getSample("jump"), JUMP_VOLUME);
                }
                else {

                    event.audio.playSample(event.assets.getSample("reject"), 0.50);
                }

                return;
            }

            if (this.ledgeTimer > 0 || this.canDoubleJump) {

                this.jumpTimer = this.ledgeTimer > 0 ? JUMP_TIME : DOUBLE_JUMP_TIME;
                if (this.ledgeTimer <= 0) {

                    this.canDoubleJump = false;
                    this.doubleJumping = true;
                }

                this.ledgeTimer = 0.0;   

                event.audio.playSample(event.assets.getSample("jump"), JUMP_VOLUME);
            }
        }
        else if ((jumpButton & InputState.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private control(globalSpeedFactor : number, event : ProgramEvent) : void {

        const EPS : number = 0.1;
        const WALK_SPEED : number = 1.5;
        const STAR_WALK_SPEED : number = 2.25;
        const BASE_GRAVITY : number = 4.0;

        if (!this.canControl) {

            this.target.y = BASE_GRAVITY;
            return;
        }

        const stick : Vector = event.input.stick;

        if (!this.headButting && Math.abs(stick.x) > EPS) {

            this.faceDirection = stick.x > 0 ? 1 : -1;
            this.flip = stick.x > 0 ? Flip.Horizontal : Flip.None;
        }

        this.handleHeadButting(globalSpeedFactor, event);
        if (this.headButting) {

            return;
        }

        this.target.x = stick.x*(this.invincibilityTimer > 0 ? STAR_WALK_SPEED : WALK_SPEED);
        this.target.y = BASE_GRAVITY;

        this.handleJumping(event);
    }


    private updateTimers(globalSpeedFactor : number, event : ProgramEvent) : void {

        const JUMP_SPEED : number = -1.5;
        const STAR_JUMP_SPEED : number = -1.75;
        const DOWN_ICON_ANIMATION_SPEED : number = 1.0/30.0;
        const ARROW_WAVE_SPEED : number = Math.PI*2/120.0;

        if (this.jumpInvincibilityTimer > 0) {

            this.jumpInvincibilityTimer -= event.tick;
        }

        if (this.jumpTimer > 0.0) {

            this.jumpTimer -= event.tick;
            this.speed.y = (this.invincibilityTimer > 0 ? STAR_JUMP_SPEED : JUMP_SPEED) - globalSpeedFactor;
            this.target.y = this.speed.y;
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

        if (this.invincibilityTimer > 0) {

            this.invincibilityTimer -= event.tick;
            if (this.invincibilityTimer <= 0) {

                event.audio.stopMusic();
                event.audio.playMusic(event.assets.getSample("theme"), THEME_VOLUME);
            }
        }
        
        if (this.touchBridge) {

            this.downJumpIconTimer = (this.downJumpIconTimer + DOWN_ICON_ANIMATION_SPEED*event.tick) % 1.0;
        }

        if (this.dying)
            return;
    
        this.arrowWave = (this.arrowWave + ARROW_WAVE_SPEED*event.tick) % (Math.PI*2);

        if (this.canControl && this.pos.y < -this.sprBody.height/2) {

            const oldTime : number = this.instantKillTimer;

            this.instantKillRecoverTimer = 0;
            this.instantKillTimer += event.tick;
            if (this.instantKillTimer >= INSTANT_KILL_TIME) {

                this.stats.changeLives(-3);
                this.hurt(event);
                this.checkDeath(event);
            }
            else if (oldTime < INSTANT_KILL_TIME - INSTANT_KILL_WARNING_TIME &&
                this.instantKillTimer >= INSTANT_KILL_TIME - INSTANT_KILL_WARNING_TIME) {

                event.audio.playSample(event.assets.getSample("warning2"), 0.55);
            }
        }
        else if (this.instantKillTimer > 0) {

            this.instantKillRecoverTimer += event.tick;
            if (this.instantKillRecoverTimer >= INSTANT_KILL_RECOVER) {

                this.instantKillTimer = 0;
                this.instantKillRecoverTimer = 0;
            }
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
        const DOUBLE_JUMP_ANIM_EPS : number = 0.5; 

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

        if (this.doubleJumping && this.speed.y < DOUBLE_JUMP_ANIM_EPS) {

            this.sprBody.animate(2, 0, 3, 3, event.tick);
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


    private spawnStars(xoff : number, yoff : number,
        count : number, startAngle : number,
        baseSpeed : number, existTime : number,
        speedFactorX : number, speedFactorY : number) : void {

        const angleStep : number = Math.PI*2/count;

        for (let i = 0; i < count; ++ i) {

            const angle : number = startAngle + angleStep*i;

            const speedx : number = Math.cos(angle)*baseSpeed*speedFactorX;
            const speedy : number = Math.sin(angle)*baseSpeed*speedFactorY;

            this.stars.spawn(StarParticle, 
                this.pos.x + xoff, this.pos.y + yoff,
                speedx, speedy, existTime);
        }
    }


    private checkBorderCollision(event : ProgramEvent) : void {

        if (this.speed.x < 0 && this.pos.x + this.collisionBox.x - this.collisionBox.w/2 <= 0) {

            this.speed.x = 0;
            this.pos.x = -this.collisionBox.x + this.collisionBox.w/2;
            return;
        }

        if (this.speed.x > 0 && this.pos.x + this.collisionBox.x + this.collisionBox.w/2 >= event.screenWidth) {

            this.speed.x = 0;
            this.pos.x = event.screenWidth - this.collisionBox.x - this.collisionBox.w/2;
        }
    }


    private checkDeath(event : ProgramEvent) : boolean {

        if (this.stats.getHealth() > 0)
            return false;

        // TODO: Move elsewhere, maybe?
        event.audio.stopMusic();

        this.dying = true;
        this.deathTimer = 0;
        this.hurtTimer = 0;

        this.stats.stopScoreFlow();
        return true;
    }


    // Draw what now?
    private drawDeathBalls(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const ORB_COUNT : number = 8;
        const ORB_DISTANCE : number = 64;

        const t : number = this.deathTimer/DEATH_TIME;
        const step : number = Math.PI*2/ORB_COUNT;

        const dx : number = Math.round(this.pos.x);
        const dy : number = Math.round(this.pos.y);

        for (let i = 0; i < ORB_COUNT; ++ i) {

            const angle : number = step*i;

            this.sprBody.draw(canvas, bmp,
                dx + Math.round(Math.cos(angle)*t*ORB_DISTANCE) - 12,
                dy + Math.round(Math.sin(angle)*t*ORB_DISTANCE) - 12);
        }
    }


    private drawStarPowerBar(canvas : Canvas, alpha : number = 0.67) : void {

        const BOTTOM_OFFSET : number = 16;
        const WIDTH : number = 16;
        const HEIGHT : number = 2;

        if (this.invincibilityTimer < 60 &&
            Math.floor(this.invincibilityTimer/4) % 2 == 1) {

            return;
        }

        const dx : number = Math.round(this.pos.x) - (WIDTH + 4)/2;
        const dy : number = Math.round(this.pos.y) + BOTTOM_OFFSET;

        const t : number = this.invincibilityTimer/INVICIBILITY_TIME;
        const w : number = clamp(Math.round(t*WIDTH), 0, WIDTH);
        
        canvas.toggleSilhouetteRendering(true);

        canvas.setColor(182, 255, 73, alpha);
        canvas.fillRect(dx, dy, w, HEIGHT);

        canvas.setColor(146, 146, 146, alpha);
        canvas.fillRect(dx, dy, WIDTH, HEIGHT);

        canvas.setColor(0, 0, 0, alpha);
        canvas.fillRect(dx - 1, dy - 1, WIDTH + 2, HEIGHT + 2);

        // TODO: For loop & lookup table
        canvas.setColor(255, 255, 255, alpha);
        canvas.fillRect(dx - 2, dy - 2, WIDTH + 4, HEIGHT + 4);

        canvas.toggleSilhouetteRendering(false);
        canvas.setColor();
    }


    private drawInstantKillBar(canvas : Canvas) : void {

        const WIDTH : number = 80;
        const YOFF : number = -16;
        const BASE_ALPHA : number = 0.80;
        const RECOVER_FADE_TIME : number = 60;
        
        if (this.instantKillTimer <= 0)
            return;

        const bmpHUD : Bitmap | undefined = canvas.getBitmap("hud");

        const dx : number = canvas.width/2 - WIDTH/2;
        const dy : number = canvas.height + YOFF;

        let alpha : number = BASE_ALPHA;
        const threshold : number = INSTANT_KILL_RECOVER - RECOVER_FADE_TIME;
        if (this.instantKillRecoverTimer > threshold) {

            alpha = BASE_ALPHA*(1.0 - (this.instantKillRecoverTimer - threshold)/RECOVER_FADE_TIME);
        }

        canvas.toggleSilhouetteRendering(true);
        canvas.setColor(255, 255, 255, alpha);

        // Bar
        const t : number = this.instantKillTimer/INSTANT_KILL_TIME;
        const w : number = Math.round((1.0 - t)*WIDTH);

        let shiftx : number = 0;
        if (this.pos.y < -this.sprBody.height/2 &&
            this.instantKillTimer >= INSTANT_KILL_TIME - INSTANT_KILL_WARNING_TIME) {
            
            shiftx = (Math.floor(this.instantKillTimer/4) % 2)*4;
        }

        canvas.drawBitmap(bmpHUD, Flip.None, dx, dy, 64 + shiftx, 18, 4, 12, w, 12);

        // Background
        canvas.drawBitmap(bmpHUD, Flip.None, dx + 2, dy, 76, 18, 4, 12, WIDTH - 4, 12);
        canvas.drawBitmap(bmpHUD, Flip.None, dx - 2, dy, 72, 18, 4, 12);
        canvas.drawBitmap(bmpHUD, Flip.None, dx + WIDTH - 2, dy, 80, 18, 4, 12);

        // Icon
        canvas.drawBitmap(bmpHUD, Flip.None, dx - 18, dy - 3, 48, 16, 16, 16);

        canvas.toggleSilhouetteRendering(false);
        canvas.setColor();
    }


    protected die(globalSpeedFactor : number, event : ProgramEvent) : boolean {
        
        this.updateTimers(globalSpeedFactor, event);

        this.dust.update(globalSpeedFactor, event);
        this.flyingText.update(globalSpeedFactor, event);
        this.stars.update(globalSpeedFactor, event);

        this.deathTimer += event.tick;
        this.sprBody.animate(4, 0, 3, 3, event.tick);

        return this.deathTimer >= DEATH_TIME;
    }


    protected floorCollisionEvent(event : ProgramEvent, touchBridge : boolean = false): void {
        
        const LEDGE_TIME : number = 8.0;

        this.canControl = true;

        this.ledgeTimer = LEDGE_TIME;
        this.canHeadButt = true;

        this.canDoubleJump = true;
        this.doubleJumping = false;
        
        this.touchBridge ||= touchBridge;

        if (this.invincibilityTimer <= 0) {

            this.stats.resetBonus();
        }
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {

        if (this.canControl &&
            (// this.pos.y + this.sprBody.height/2 <= 0 ||
            this.pos.y - this.sprBody.height/2 >= event.screenHeight)) {

            this.stats.changeLives(-3);
            this.hurt(event);
        }

        if (this.checkDeath(event)) {

            return;
        }

        this.control(globalSpeedFactor, event);
        this.updateTimers(globalSpeedFactor, event);
        this.updateDust(globalSpeedFactor, event);
        this.animate(event);

        if (this.pos.x < 0) {

            this.pos.x += event.screenWidth;
        }
        else if (this.pos.x > event.screenWidth) {

            this.pos.x -= event.screenWidth;
        }

        this.stars.update(globalSpeedFactor, event);
        this.flyingText.update(globalSpeedFactor, event);

        this.touchBridge = false;

        this.checkBorderCollision(event);
    }


    protected postMovementEvent(globalSpeedFactor : number, event : ProgramEvent) : void {
        
        if (this.headButting) {

            this.computeHeadbuttHitbox();
        }
    }


    public drawParticles(canvas : Canvas) : void {

        const DUST_ALPHA : number = 0.67;

        if (!this.exist)
            return;

        const bmp : Bitmap | undefined = canvas.getBitmap("player");
        const bmpStarParticles : Bitmap | undefined = canvas.getBitmap("star_particles");

        canvas.toggleSilhouetteRendering(true);

        canvas.applyEffect(Effect.FixedColor);

        if (this.invincibilityTimer > 0 &&
            Math.floor(this.invincibilityTimer/4) % 2 != 0) {

            canvas.setColor(...INVICIBILITY_COLOR, DUST_ALPHA);
        }
        else {

            canvas.setColor(255, 173, 219, DUST_ALPHA);
        }

        this.dust.draw(canvas, bmp);

        canvas.applyEffect(Effect.None);
        canvas.setColor();

        canvas.toggleSilhouetteRendering(false);

        this.stars.draw(canvas, bmpStarParticles);
    }


    public draw(canvas: Canvas): void {

        if (!this.exist)
            return;

        if (this.dying) {

            const bmp : Bitmap | undefined = canvas.getBitmap("player");
            this.drawDeathBalls(canvas, bmp);
            return;
        }

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer/4) % 2 == 0) {
            
            return;
        }

        const bmpBody : Bitmap | undefined = canvas.getBitmap("player");
        const bmpBashEffect : Bitmap | undefined = canvas.getBitmap("bash_effect");

        const BASH_EFFECT_OFFSET_X : number[] = [-22, 14];
        const BASH_EFFECT_OFFSET_Y : number = -4;

        const dx : number = Math.round(this.pos.x) - 12;
        const dy : number = Math.round(this.pos.y) - 12 + 1;

        // this.setInvicibilityColor(canvas);
        if (this.invincibilityTimer > 0 &&
            Math.floor(this.invincibilityTimer/4) % 2 == 0) {

            canvas.applyEffect(Effect.FixedColor);
            canvas.setColor(...INVICIBILITY_COLOR);
        }

        this.sprBody.draw(canvas, bmpBody, dx, dy, this.flip);

        if (this.invincibilityTimer > 0) {

            canvas.applyEffect(Effect.None);
            canvas.setColor();
        }

        if (this.headButting) {

            this.sprBashEffect.draw(canvas, bmpBashEffect, 
                dx + BASH_EFFECT_OFFSET_X[this.flip as number],
                dy + BASH_EFFECT_OFFSET_Y, this.flip);
        }
    }


    public postDraw(canvas : Canvas) : void {
        
        if (this.dying || !this.exist)
            return;

        const bmpSmallNumbers : Bitmap | undefined = canvas.getBitmap("small_numbers");
        const bmpPlayer : Bitmap | undefined = canvas.getBitmap("player");

        // canvas.setColor(255, 255, 173);
        this.flyingText.draw(canvas, bmpSmallNumbers);
        // canvas.setColor();

        const dx : number = Math.round(this.pos.x);
        const dy : number = Math.round(this.pos.y) - 24;

        if (this.touchBridge) {

            const frame : number = Math.floor(this.downJumpIconTimer*2);
            canvas.drawBitmap(bmpPlayer, Flip.None, dx - 12, dy - 4, frame*24, 72, 24, 24);
        }

        if (this.invincibilityTimer > 0) {
            
            this.drawStarPowerBar(canvas);
        }

        if (this.stats.getBonus() <= 10)
            return;

        canvas.setColor(182, 255, 146, 0.67);

        const scale : number = 1.0 + this.stats.getBonusUpdateTimer()*0.5;
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        canvas.drawText(bmpFontOutlines, "*" + this.stats.bonusToString(), 
            dx, dy - 8*(scale - 1.0) , -8, 0, Align.Center, scale, scale);

        canvas.setColor();

        /*
        if (this.pos.y + this.sprBody.height/2 <= 0) {

            canvas.setColor(255, 255, 255, 0.67);
            canvas.drawBitmap(bmpPlayer, Flip.None, dx - 12, 0, 48, 72, 24, 24);
            canvas.setColor();
        }
        */  
    }


    // TODO: Rename, this also draws the instant kill bar
    public drawArrow(canvas : Canvas) : void {

        const YOFF : number = 0;
        const AMPLITUDE : number = 2;

        if (this.dying ||
            !this.exist ||
            !this.canControl)
            return;

        this.drawInstantKillBar(canvas);

        if (this.pos.y > -this.sprBody.height/2)
            return;

        const bmpPlayer : Bitmap | undefined = canvas.getBitmap("player");

        const dx : number = Math.round(this.pos.x) - 12;
        const dy : number = YOFF + Math.round(Math.sin(this.arrowWave)*AMPLITUDE);

        canvas.setColor(255, 255, 255, 0.75);
        canvas.drawBitmap(bmpPlayer, Flip.None, dx, dy, 48, 72, 24, 24);
        canvas.setColor();
    }


    public hurt(event : ProgramEvent) : void {

        const HURT_TIME : number = 60;

        this.hurtTimer = HURT_TIME;
        this.shakeTimer = HURT_TIME/2;

        this.stats.changeLives(-1);
        this.stats.resetBonus();

        if (this.stats.getHealth() <= 0) {

            event.audio.playSample(event.assets.getSample("die"), 0.65);
            return;
        }
        event.audio.playSample(event.assets.getSample("hurt"), 0.60);
    }


    public hurtCollision(x : number, y : number, w : number, h : number, event : ProgramEvent, enemyHurt : boolean = false) : boolean {

        if (!this.exist || this.dying || this.hurtTimer > 0 ||
            (enemyHurt && this.jumpInvincibilityTimer > 0) ||
            this.invincibilityTimer > 0 ||
            !overlayRect(this.pos, this.collisionBox, new Vector(x + w/2, y + h/2), new Rectangle(0, 0, w, h)))
            return false;

        this.hurt(event);
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


    public bump(amount : number, event : ProgramEvent, createStars : boolean = true) : void {

        const STAR_COUNT : number = 6;
        const STAR_SPEED_FACTOR_Y : number = 0.67; 
        const JUMP_INVICIBILITY_TIME : number = 6;

        this.speed.y = amount;
        
        this.canHeadButt = true;
        this.headButting = false;
        this.headButtTimer = 0;
        this.canDoubleJump = true;
        this.doubleJumping = false;

        this.jumpTimer = 0;

        this.jumpInvincibilityTimer = JUMP_INVICIBILITY_TIME;

        if (createStars) {

            this.spawnStars(0.0, this.hitbox.y + this.hitbox.h/2, 
                STAR_COUNT, 0.0, STAR_SPEED, STAR_EXIST_TIME, 
                1.0, STAR_SPEED_FACTOR_Y);
        }
    }


    public directionalBump(dir : Vector, center : Vector, shift : number, speed : number, event : ProgramEvent) : void {

        // This is just a random magic number
        const HORIZONTAL_SCALE_FACTOR : number = 1.33;

        this.headButting = false;
        this.doubleJumping = false;
        this.canDoubleJump = true;

        this.jumpTimer = 0;

        this.speed.x = dir.x*speed*HORIZONTAL_SCALE_FACTOR;
        this.speed.y = dir.y*speed;

        this.pos.x = center.x + dir.x*shift;
        this.pos.y = center.y + dir.y*shift;
    }


    public stopHeadbutt(globalSpeedFactor : number, createStars : boolean = true, knockback : boolean = false) : void {

        const STAR_COUNT : number = 4;
        const STAR_SPEED : number = 3.0;
        const JUMP_FACTOR : number = 2.0;
        const HURT_KNOCKBACK : number = 4.0;

        this.speed.x = 0.0;
        if (this.gravityFreeHeadbutt) {
            
            this.speed.y = -globalSpeedFactor*JUMP_FACTOR;
        }
        this.headButting = false;
        this.headButtTimer = 0.0;
        this.canDoubleJump = true;
        this.doubleJumping = false;

        this.jumpTimer = 0;

        if (createStars) {
            
            this.spawnStars(this.faceDirection*20, 0.0,
                STAR_COUNT, Math.PI/4, STAR_SPEED, STAR_EXIST_TIME, 1.0, 1.0);
        }

        if (knockback) {

            this.speed.x = -this.faceDirection*HURT_KNOCKBACK;
        }
    }


    // Oh no no no no no no
    public spawnInvicibilityKnockStars(o : Enemy) : void {

        const STAR_COUNT : number = 8;
        const SPEED_FACTOR : number = 1.5;

        const d : Vector = Vector.subtract(o.getPosition(), this.pos);

        const xoff : number = d.x/2;
        const yoff : number = d.y/2;

        this.spawnStars(xoff, yoff, STAR_COUNT, 0, STAR_SPEED*SPEED_FACTOR, STAR_EXIST_TIME*SPEED_FACTOR, 1.0, 1.0);
    }


    public addPoints(dx : number, dy : number, base : number) : void {

        const TEXT_SPEED : number = -3.0;

        const points : number = this.stats.addPoints(base);

        const o : FlyingText = this.flyingText.spawn(
            FlyingText, dx, dy, 0, TEXT_SPEED, 1.0/30.0);
        o.setValue(points);
    }


    public toggleInvicibility(event : ProgramEvent) : void {

        this.invincibilityTimer = INVICIBILITY_TIME;

        event.audio.stopMusic();
        event.audio.playMusic(event.assets.getSample("star"), STAR_VOLUME);
    }


    public kill(event : ProgramEvent) : void {

        this.stats.changeLives(-3);
        this.hurt(event);
    }


    public isHeadbutting = () : boolean => this.headButting;
    public getHeadbuttHitbox = () : Rectangle => this.headbuttHitbox.clone();
    public canBeControlled = () : boolean => this.canControl;
    public isInvincible = () : boolean => this.invincibilityTimer > 0;

}
