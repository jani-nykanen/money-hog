import { ProgramEvent } from "../core/event.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { Sprite } from "../gfx/sprite.js";
import { Rectangle, overlayRect } from "../math/rectangle.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Spawnable } from "./spawnable.js";


export const enum CollectibleType {

    Unknown = 0,
    Coin = 1,
    Star = 2,
    Gem = 3,
    Heart = 4,
}


export class Collectible extends Spawnable<CollectibleType> {


    private spr : Sprite;


    constructor() {

        super(0, 0, false);

        this.spr = new Sprite(32, 32);

        this.friction = new Vector(0.01, 0.15);
        
        this.hitbox = new Rectangle(0, 0, 14, 14);
        this.collisionBox = new Rectangle(0, 4, 12, 12);
    }


    private updateStaticLogic(globalSpeedFactor : number, event : ProgramEvent) : void {
        
        const ANIM_SPEED : number = 6;

        this.pos.y -= globalSpeedFactor*event.tick;

        if (this.type == CollectibleType.Unknown)
            return;

        this.spr.animate(this.type - 1, 0, 3, ANIM_SPEED, event.tick);
    }


    private updateDynamicLogic(event : ProgramEvent) : void {

        const BASE_GRAVITY : number = 4.0;

        this.target.x = 0.0;
        this.target.y = BASE_GRAVITY;
    }


    private handleCollision(player : Player, event : ProgramEvent) : void {

        this.dying = true;
        this.spr.setFrame(4, this.spr.getRow());

        switch (this.type) {

        case CollectibleType.Coin:

            player.addPoints(this.pos.x, this.pos.y - this.spr.height/2, 10);
            player.stats.addCoins(1);
            break;

        case CollectibleType.Gem:

            player.addPoints(this.pos.x, this.pos.y - this.spr.height/2, 100);
            break;

        case CollectibleType.Heart:

            player.stats.changeLives(1);
            break;

        case CollectibleType.Star:

            // TODO: Make the player invincible
            break;

        default:
            break;
        }
    }


    protected spawnEvent() : void {

        if (this.type != CollectibleType.Unknown)
            this.spr.setFrame(0, this.type - 1);
    }


    protected die(globalSpeedFactor : number, event : ProgramEvent) : boolean {

        const DIE_ANIM_SPEED : number = 4;

        this.spr.animate(this.spr.getRow(), 4, 8, DIE_ANIM_SPEED, event.tick);

        this.pos.y -= globalSpeedFactor*event.tick;

        return this.spr.getColumn() >= 8;
    }


    protected updateEvent(globalSpeedFactor : number, event : ProgramEvent): void {

        if (!this.dynamic) {

            this.updateStaticLogic(globalSpeedFactor, event);
            return;
        }
        this.updateDynamicLogic(event);
 
    }


    public playerCollision(player : Player, event : ProgramEvent) : void {

        if (!this.exist || this.dying || !player.doesExist() || player.isDying())
            return;

        if (player.overlay(this)) {

            this.handleCollision(player, event);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        const dx : number = Math.round(this.pos.x) - this.spr.width/2;
        const dy : number = Math.round(this.pos.y) - this.spr.height/2;

        this.spr.draw(canvas, bmp, dx, dy, Flip.None);
    }

}
