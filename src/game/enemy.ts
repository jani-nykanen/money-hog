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


export class Enemy extends GameObject {


    protected spr : Sprite;
    protected flip : Flip = Flip.None;

    protected referencePlatform : Platform;

    protected flattenedTimer : number = 0;

    protected basePlatformOffset : number = 0;
    protected baseY : number = 0;
    protected fixedY : boolean = true;
    
    protected checkEdgeCollision : boolean = false;


    constructor(x : number, y : number, referencePlatform : Platform) {

        super(x, y, true);

        this.referencePlatform

        this.spr = new Sprite(24, 24);

        this.hitbox = new Rectangle(0, 4, 12, 16);

        this.friction.x = 0.10;
        this.friction.y = 0.15;

        this.referencePlatform = referencePlatform;

        this.spawnEvent?.(x, y);
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

            this.dying = true;
            this.flattenedTimer = FLATTEN_ANIMATION_TIME + FLATTEN_WAIT;

            player.bump(-3.0, event, true);
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

            this.dying = true;

            this.speed.x = FLY_SPEED*Math.sign(this.pos.x - player.getPosition().x);
            this.target.x = this.speed.x;
            this.speed.y = BASE_JUMP + (this.pos.y - player.getPosition().y)/JUMP_FACTOR;

            this.flattenedTimer = 0.0;

            this.flip |= Flip.Vertical;
            this.spr.setFrame(0, this.spr.getRow());

            player.stopHorizontalMovement(globalSpeedFactor);

            return true;
        }
        return false;
    }


    private dieEvent(player : Player) : void {

        const BASE_SCORE : number = 10;

        player.addPoints(this.pos.x, this.pos.y - this.spr.height/2, BASE_SCORE);
        player.stats.increaseBonus(1);
    }


    private drawBase(canvas : Canvas, bmpBody : Bitmap | undefined, xoff : number = 0): void {

        const FLATTEN_HEIGHT : number = 4;

        let dw : number = this.spr.width;
        let dh : number = this.spr.height;

        if (this.flattenedTimer > 0) {

            const t : number = 1.0 - Math.max(0.0, (this.flattenedTimer - FLATTEN_WAIT)/FLATTEN_ANIMATION_TIME);

            dw = Math.round(this.spr.width*(1.0 + 0.5*t));
            dh = Math.round(this.spr.height*(1.0 - t) + t*FLATTEN_HEIGHT);
        }

        const dx : number = Math.round(this.pos.x) - dw/2 + xoff;
        const dy : number = Math.round(this.pos.y) + this.spr.height/2 - dh + 1;

        this.spr.draw(canvas, bmpBody, dx, dy, this.flip, dw, dh);
    }


    protected edgeEvent?(event : ProgramEvent) : void;
    protected spawnEvent?(x : number, y : number) : void;
    protected updateAI?(globalSpeedFactor : number, event : ProgramEvent) : void;


    protected die(globalSpeedFactor : number, event : ProgramEvent) : boolean {

        const BASE_GRAVITY : number = 4.0;

        if (this.flattenedTimer > 0) {

            if (this.referencePlatform !== undefined) {

                this.pos.y = this.referencePlatform.getY() - this.spr.height/2 + this.basePlatformOffset;
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

        this.updateAI?.(globalSpeedFactor, event);
        
        if (this.pos.y < -this.spr.height/2 ||
            (this.speed.y > 0 && this.pos.y > event.screenHeight + this.spr.height)) {

            this.exist = false;
        }
    }


    public playerCollision(player : Player, event : ProgramEvent, globalSpeedFactor : number = 0.0) : void {
        
        if (this.dying || !this.exist || player.isDying() || !player.doesExist())
            return;

        // TODO: Use for loop, please...
        if (this.headbuttCollision(globalSpeedFactor, player, 0, event) ||
            this.headbuttCollision(globalSpeedFactor, player, event.screenWidth, event) ||
            this.headbuttCollision(globalSpeedFactor, player, -event.screenWidth, event)) {

            this.dieEvent(player);
            return;
        }

        if (this.stompCollision(player, 0, event) ||
            this.stompCollision(player, event.screenWidth, event) ||
            this.stompCollision(player, -event.screenWidth, event)) {

            this.dieEvent(player);
            return;
        }

        for (let i = -1; i <= 1; ++ i) {

            player.hurtCollision(
                this.pos.x + this.hitbox.x - this.hitbox.w/2 + event.screenWidth*i, 
                this.pos.y + this.hitbox.y - this.hitbox.h/2, 
                this.hitbox.w, this.hitbox.h, event);
        }
    }


    public edgeCollision(x : number, y : number, h : number, dir : 1 | -1, event : ProgramEvent) : boolean {

        const NEAR_MARGIN : number = 1;
        const FAR_MARGIN : number = 4;

        if (!this.exist || this.dying || !this.checkEdgeCollision)
            return false;

        const bottom : number = this.pos.y + this.hitbox.y + this.hitbox.h/2;
        const top : number = bottom - this.hitbox.h;

        if (bottom < y || top >= y + h ||
            (dir < 0 && this.speed.x > 0) || (dir > 0 && this.speed.x < 0))
            return false;

        const edge : number = this.pos.x + this.hitbox.x + this.hitbox.w/2*dir;

        if ((dir > 0 && edge >= x - NEAR_MARGIN*event.tick && edge <= x + (this.speed.x + FAR_MARGIN)*event.tick) ||
            (dir < 0 && edge <= x + NEAR_MARGIN*event.tick && edge >= x + (this.speed.x - FAR_MARGIN)*event.tick) ){

            this.pos.x = x + this.hitbox.x - this.hitbox.w/2*dir;
            this.edgeEvent?.(event);
                
            return true;
        }

        return false;
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist)
            return;

        this.drawBase(canvas, bmp);
    }
}
