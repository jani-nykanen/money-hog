import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { Platform } from "./platform.js";
import { Player } from "./player.js";
import { Spawnable } from "./spawnable.js";


export const enum EnemyType {

    Unknown = 0,
    Slime = 1,
}


const START_FRAME : number[] = [0];
const END_FRAME : number[] = [3];
const ANIMATION_SPEED : number[] = [9];

const FLATTEN_ANIMATION_TIME : number = 10;
const FLATTEN_WAIT : number = 30;


export class Enemy extends Spawnable<EnemyType> {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private referencePlatform : Platform | undefined = undefined;

    private flattenedTimer : number = 0;


    constructor() {

        super();

        this.spr = new Sprite(24, 24);

        this.hitbox = new Rectangle(0, 4, 12, 16);

        this.friction.x = 0.10;
        this.friction.y = 0.15;
    }


    private animate(event : ProgramEvent) : void {

        const start : number = START_FRAME[this.type - 1] ?? 0;
        const end : number = END_FRAME[this.type - 1] ?? 3;
        const speed : number = ANIMATION_SPEED[this.type - 1] ?? 6;

        this.spr.animate(this.spr.getRow(), start, end, speed, event.tick);
    }


    private stompCollision(player : Player, offsetx : number, event : ProgramEvent) : boolean {

        const STOMP_WIDTH : number = 20; // TODO: Use hitbox/collisionbox?
        const STOMP_HEIGHT : number = 8;
        const STOMP_OFFSET_Y : number = -2;
        const STOMP_MIN_SPEED : number = -1.0;

        if (player.getSpeed().y < STOMP_MIN_SPEED) {

            return false;;
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

            player.bump(-3.0, event);
            return true;
        }

        return false;
    }


    private headbuttCollision(player : Player, offsetx : number, event : ProgramEvent) : boolean {

        const FLY_SPEED : number = 3.0;
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

            player.stopHorizontalMovement();

            return true;
        }
        return false;
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


    protected spawnEvent() : void {
        
        if (this.type != EnemyType.Unknown) {

            const start : number = START_FRAME[this.type - 1] ?? 0;
            const end : number = END_FRAME[this.type - 1] ?? 3;

            const initialFrame : number = start + Math.floor(Math.random()*(end - start));

            this.spr.setFrame(initialFrame, this.type - 1);
        }

        this.flip = Flip.None;
        this.flattenedTimer = 0;
    }


    protected die(globalSpeedFactor : number, event : ProgramEvent) : boolean {

        const BASE_GRAVITY : number = 4.0;

        if (this.flattenedTimer > 0) {

            if (this.referencePlatform !== undefined) {

                this.pos.y = this.referencePlatform.getY() - this.spr.height/2
            }

            this.flattenedTimer -= event.tick;
            if (this.flattenedTimer <= 0) {

                return true;
            }
            return false;
        }

        this.target.y = BASE_GRAVITY;
        this.updateMovement(event);

        if (this.pos.x < -this.spr.width/2) {

            this.pos.x += event.screenWidth;
        }
        else if (this.pos.x > event.screenWidth + this.spr.width/2) {

            this.pos.x -= event.screenWidth;
        }

        return this.pos.y >= event.screenHeight + this.spr.height/2;
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {
        
        this.animate(event);

        if (this.referencePlatform !== undefined) {

            this.pos.y = this.referencePlatform.getY() - this.spr.height/2
        }
        else {

            this.pos.y -= globalSpeedFactor*event.tick;
        }

        if (this.pos.y < 0 ||
            (this.speed.y > 0 && this.pos.y > event.screenHeight + this.spr.height)) {

            this.exist = false;
        }
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {
        
        if (this.dying || !this.exist || player.isDying() || !player.doesExist())
            return;

        if (this.headbuttCollision(player, 0, event) ||
            this.headbuttCollision(player, event.screenWidth, event) ||
            this.headbuttCollision(player, -event.screenWidth, event)) {

            return;
        }

        if (this.stompCollision(player, 0, event) ||
            this.stompCollision(player, event.screenWidth, event) ||
            this.stompCollision(player, -event.screenWidth, event)) {

            return;
        }

        for (let i = -1; i <= 1; ++ i) {

            player.hurtCollision(
                this.pos.x + this.hitbox.x - this.hitbox.w/2 + event.screenWidth*i, 
                this.pos.y + this.hitbox.y - this.hitbox.h/2, 
                this.hitbox.w, this.hitbox.h, event);
        }
    }


    public objectToObjectCollision(o : Spawnable<EnemyType>, event : ProgramEvent) : void {
        
        const HIT_RADIUS : number = 12; // Hitbox is too big...

        const target : Enemy = o as Enemy;

        if (!this.exist || !target.exist || 
            !this.dying || target.dying ||
            this.flattenedTimer > 0) {

            return;
        }

        // TODO: Might need to also check "looping" objects

        if (Vector.distance(this.pos, target.pos) < HIT_RADIUS) {

            target.dying = true;
            target.flattenedTimer = 0.0;

            target.flip |= Flip.Vertical;

            target.speed = Vector.scalarMultiply(Vector.direction(this.pos, target.pos), this.speed.length);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {
        
        if (!this.exist)
            return;

        if (this.pos.x < this.spr.width/2) {

            this.drawBase(canvas, bmp, canvas.width);
        }
        else if (this.pos.x > canvas.width - this.spr.width/2) {

            this.drawBase(canvas, bmp, -canvas.width);
        }
        this.drawBase(canvas, bmp);
    }


    public setReferencePlatform(p : Platform | undefined) : void {

        this.referencePlatform = p;
    }
    
}
