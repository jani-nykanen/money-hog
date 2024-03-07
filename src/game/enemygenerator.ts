import { ProgramEvent } from "../core/event.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Enemy } from "./enemy.js";
import { EnemyType, getEnemyConstructor } from "./enemytypes.js";
import { Platform } from "./platform.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class EnemyGenerator {


    private enemies : Array<Enemy>;


    constructor() {

        this.enemies = new Array<Enemy> ();
    }


    public update(globalSpeedFactor : number, stage : Stage, player : Player, event : ProgramEvent) : void {

        for (let i = 0; i < this.enemies.length; ++ i) {

            const o : Enemy = this.enemies[i];

            o.update(globalSpeedFactor, event);
            stage.objectCollision(o, event);
            o.playerCollision(player, event, globalSpeedFactor);

            if (!o.doesExist()) {

                this.enemies.splice(i, 1);
                // console.log("Enemy in index " + String(i) + " removed");
            }
        }
    }


    public draw(canvas : Canvas) : void {

        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        for (let o of this.enemies) {

            o.draw(canvas, bmpEnemies);
        }
    }


    public spawn(type : EnemyType, x : number, y : number, refPlatform : Platform) : void {

        const otype : Function = getEnemyConstructor(type);

        this.enemies.push(new otype.prototype.constructor(x, y, refPlatform));
    }
}
