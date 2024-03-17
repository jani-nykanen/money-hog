import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Platform } from "./platform.js";
import { Player } from "./player.js";


const FLATTEN_ANIMATION_TIME : number = 10;
const FLATTEN_WAIT : number = 30;


export const enum StompType {

    Stomp = 0,
    Hurt = 1,
    Bounce = 2
}


export class Enemy extends GameObject {


    protected scale : Vector;
    protected shift : Vector;

    protected spr : Sprite;
    protected flip : Flip = Flip.None;

    protected referencePlatform : Platform;

    protected flattenedTimer : number = 0;

    protected basePlatformOffset : number = 0;
    protected baseY : number = 0;
    protected fixedY : boolean = true;
    
    protected checkEdgeCollision : boolean = false;

    protected canBeMoved : boolean = true;
    protected canMoveOthers : boolean = true;
    protected canBeHeadbutted : boolean = true;
    protected harmful : boolean = true;

    protected stompType : StompType = StompType.Stomp;
    protected bounceRecoverTimer : number = 0.0;

    protected baseScore : number = 50;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, true);

        this.scale = new Vector(1, 1);
        this.shift = new Vector();

        this.spr = new Sprite(24, 24);

        this.hitbox = new Rectangle(0, 4, 12, 16);
        this.collisionBox = new Rectangle(0, 0, 8, 20);

        this.friction.x = 0.10;
        this.friction.y = 0.15;

        this.referencePlatform = referencePlatform;

        this.omitFloorCollision = true;

        this.baseY = this.pos.y;
    }


    private stompCollision(player : Player, offsetx : number, event : ProgramEvent) : boolean {

        const STOMP_WIDTH : number = 20; // TODO: Use hitbox/collisionbox?
        const STOMP_HEIGHT : number = 8;
        const STOMP_OFFSET_Y : number = -2;
        const STOMP_MIN_SPEED : number = -1.0;

        if (player.getSpeed().y < STOMP_MIN_SPEED) {

            return false;
        }

        const stompx : number = this.pos.x + this.hitbox.x - STOMP_WIDTH/2;
        const stompy : number = this.pos.y + this.hitbox.y - this.hitbox.h/2 + STOMP_OFFSET_Y;

        const phitbox : Rectangle = player.getHitbox();
        const ppos : Vector = player.getPosition();

        const bottom : number = ppos.y + phitbox.y + phitbox.h/2;
        const left : number = ppos.x + offsetx + phitbox.x - phitbox.w/2;

        if (left + phitbox.w >= stompx && left <= stompx + STOMP_WIDTH &&
            bottom >= stompy && bottom <= stompy + STOMP_HEIGHT*event.tick) {

            player.bump(-3.0, event, true);
            if (this.stompType != StompType.Stomp) {

                if (this.stompType == StompType.Bounce) {

                    this.bounceEvent?.(event);
                    this.addPoints(player);
                }
                else {

                    player.hurt(event);
                }
                return false;
            }

            this.dying = true;
            this.flattenedTimer = FLATTEN_ANIMATION_TIME + FLATTEN_WAIT;

            this.scale.x = 1.0;
            this.scale.y = 1.0;

            this.basePlatformOffset += (this.pos.y - this.baseY);

            return true;
        }

        return false;
    }


    private headbuttCollision(globalSpeedFactor : number, player : Player, offsetx : number, event : ProgramEvent) : boolean {

        const FLY_SPEED : number = 4.0;
        const BASE_JUMP : number = -3.0;
        const JUMP_FACTOR : number = 8.0;

        if (!player.isHeadbutting()) {

            return false;
        }

        const hitbox : Rectangle = player.getHeadbuttHitbox();

        if (overlayRect(this.pos, this.hitbox, new Vector(offsetx, 0), hitbox)) {

            if (this.canBeHeadbutted) {

                this.dying = true;

                this.speed.x = FLY_SPEED*Math.sign(this.pos.x - player.getPosition().x);
                this.target.x = this.speed.x;
                this.speed.y = BASE_JUMP + (this.pos.y - player.getPosition().y)/JUMP_FACTOR;

                this.flattenedTimer = 0.0;

                this.flip |= Flip.Vertical;
                this.spr.setFrame(0, this.spr.getRow());
            }
            else {

                player.hurt(event);
            }

            player.stopHeadbutt(globalSpeedFactor, this.canBeHeadbutted, !this.canBeHeadbutted);

            return this.canBeHeadbutted;
        }
        return false;
    }


    protected edgeEvent?(event : ProgramEvent) : void;
    protected updateAI?(globalSpeedFactor : number, event : ProgramEvent) : void;
    protected bounceEvent?(event : ProgramEvent) : void;
    protected playerEvent?(globalSpeedFactor : number, player : Player, event : ProgramEvent) : boolean;
    protected deathEvent?(globalSpeedFactor : number, event : ProgramEvent) : void;


    protected addPoints(player : Player) : void {

        player.addPoints(this.pos.x, this.pos.y - this.spr.height/2, this.baseScore);
        player.stats.increaseBonus();
    }


    protected die(globalSpeedFactor : number, event : ProgramEvent) : boolean {

        const BASE_GRAVITY : number = 4.0;

        this.deathEvent?.(globalSpeedFactor, event);

        if (this.flattenedTimer > 0) {

            if (this.fixedY &&
                this.referencePlatform !== undefined) {

                this.pos.y = this.referencePlatform.getY() - this.spr.height/2 + this.basePlatformOffset;
            }
            else {

                this.target.x = 0.0;
                this.speed.x = 0.0;
                this.target.y = BASE_GRAVITY;
                this.forceDeathCollision = true;
                // this.omitFloorCollision = false;

                this.collisionBox.y = 2;

                this.updateMovement(event);
            }

            this.flattenedTimer -= event.tick;
            if (this.flattenedTimer <= 0) {

                return true;
            }
            return false;
        }

        this.target.y = BASE_GRAVITY;
        this.updateMovement(event);

        return this.pos.y >= event.screenHeight + this.spr.height/2 ||
            this.pos.x < - this.spr.width/2 ||
            this.pos.x > event.screenWidth + this.spr.width/2;
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        if (this.referencePlatform !== undefined) {

            this.baseY = this.referencePlatform.getY() - this.spr.height/2 + this.basePlatformOffset;
        }

        if (this.fixedY) {

            this.pos.y = this.baseY;
        }

        if (this.bounceRecoverTimer > 0.0) {

            this.bounceRecoverTimer -= event.tick;
        }

        this.updateAI?.(globalSpeedFactor, event);

        this.edgeCollision(0, -64, event.screenHeight + 128, -1, event, true);
        this.edgeCollision(event.screenWidth, -64, event.screenHeight + 128, 1, event, true);
        
        if ((this.referencePlatform !== undefined && !this.referencePlatform.doesExist()) ||
            this.pos.y < -this.spr.height/2 ||
            (this.speed.y > 0 && this.pos.y > event.screenHeight + this.spr.height)) {

            this.exist = false;
        }
    }


    public preDraw?(canvas : Canvas, bmp : Bitmap | undefined) : void;
    public postDraw?(canvas : Canvas, bmp : Bitmap | undefined) : void;


    public playerCollision(player : Player, event : ProgramEvent, globalSpeedFactor : number = 0.0) : void {
        
        if (this.dying || !this.exist || player.isDying() || !player.doesExist())
            return;

        if (this.playerEvent?.(globalSpeedFactor, player, event)) {

            return;
        }

        if (!this.harmful) {

            return;
        }

        if (this.headbuttCollision(globalSpeedFactor, player, 0, event) ||
            this.stompCollision(player, 0, event)) {

            this.addPoints(player);
            return;
        }

        if (this.bounceRecoverTimer > 0) {
            
            return;
        }

        //for (let i = -1; i <= 1; ++ i) {

            player.hurtCollision(
                this.pos.x + this.hitbox.x - this.hitbox.w/2, 
                this.pos.y + this.hitbox.y - this.hitbox.h/2, 
                this.hitbox.w, this.hitbox.h, event, true);
        //}
    }


    public edgeCollision(x : number, y : number, h : number, dir : 1 | -1, 
        event : ProgramEvent, force : boolean = false) : boolean {

        const NEAR_MARGIN : number = 1;
        const FAR_MARGIN : number = 4;

        if (!this.exist || this.dying || (!force && !this.checkEdgeCollision) || !this.canBeMoved)
            return false;

        const bottom : number = this.pos.y + this.collisionBox.y + this.collisionBox.h/2;
        const top : number = bottom - this.collisionBox.h;

        if (bottom < y || top >= y + h ||
            (dir < 0 && this.speed.x > 0) || (dir > 0 && this.speed.x < 0))
            return false;

        const edge : number = this.pos.x + this.collisionBox.x + this.collisionBox.w/2*dir;

        if ((dir > 0 && edge >= x - NEAR_MARGIN*event.tick && edge <= x + (this.speed.x + FAR_MARGIN)*event.tick) ||
            (dir < 0 && edge <= x + NEAR_MARGIN*event.tick && edge >= x + (this.speed.x - FAR_MARGIN)*event.tick) ){

            this.pos.x = x + this.collisionBox.x - this.collisionBox.w/2*dir;
            this.edgeEvent?.(event);
                
            return true;
        }

        return false;
    }


    public enemyToEnemyCollision(o : Enemy, event : ProgramEvent) : void {

        if (!this.canMoveOthers || !o.canMoveOthers || 
            !this.exist || !o.exist || this.dying || o.dying)
            return;

        const ox : number = o.pos.x + o.collisionBox.x - o.collisionBox.w/2;
        const oy : number = o.pos.y + o.collisionBox.y - o.collisionBox.h/2;

        this.edgeCollision(ox, oy, o.collisionBox.h, 1, event, true);
        this.edgeCollision(ox + o.collisionBox.w, oy, o.collisionBox.h, -1, event, true);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        const FLATTEN_HEIGHT : number = 4;

        if (!this.exist)
            return;

        let dw : number = Math.round(this.spr.width*this.scale.x);
        let dh : number = Math.round(this.spr.height*this.scale.y);

        if (this.flattenedTimer > 0) {

            const t : number = 1.0 - Math.max(0.0, (this.flattenedTimer - FLATTEN_WAIT)/FLATTEN_ANIMATION_TIME);

            dw = Math.round(this.spr.width*(1.0 + 0.5*t));
            dh = Math.round(this.spr.height*(1.0 - t) + t*FLATTEN_HEIGHT);
        }

        const dx : number = Math.round(this.pos.x + this.shift.x - dw/2) ;
        const dy : number = Math.round(this.pos.y + this.shift.y + this.spr.height/2 - dh) + 1;

        this.spr.draw(canvas, bmp, dx, dy, this.flip, dw, dh);
    }


    protected floorCollisionEvent(event : ProgramEvent, isBridge? : boolean, platformRef? : Platform): void {

        if (!this.fixedY && this.flattenedTimer > 0) {

            this.referencePlatform = platformRef;
            this.fixedY = true;

            this.target.zeros();
            this.speed.zeros();

            this.basePlatformOffset = 0;
        }
    }
}
