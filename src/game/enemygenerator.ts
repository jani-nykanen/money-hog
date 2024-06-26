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
            stage.objectCollision(o, globalSpeedFactor, event);
            o.playerCollision(player, event, globalSpeedFactor);

            if (!o.doesExist()) {

                this.enemies.splice(i, 1);
                // console.log("Enemy in index " + String(i) + " removed");
            }
            else {

                for (let j = i + 1; j < this.enemies.length; ++ j) {

                    const o2 : Enemy = this.enemies[j];

                    o.enemyToEnemyCollision(o2, event);
                    o2.enemyToEnemyCollision(o, event);
                }
            }
        }
    }


    public preDraw(canvas : Canvas) : void {

        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        for (let o of this.enemies) {

            o.preDraw?.(canvas, bmpEnemies);
        }
    }


    public draw(canvas : Canvas) : void {

        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        for (let o of this.enemies) {

            o.draw(canvas, bmpEnemies);
        }
    }


    public postDraw(canvas : Canvas) : void {

        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        for (let o of this.enemies) {

            o.postDraw?.(canvas, bmpEnemies);
        }
    }


    public spawn(type : EnemyType, x : number, y : number, refPlatform : Platform) : Enemy {

        const otype : Function = getEnemyConstructor(type);

        const o : Enemy = new otype.prototype.constructor(x, y, refPlatform);

        this.enemies.push(o);

        return o;
    }


    public flush() : void {

        this.enemies.length = 0;
    }
}
