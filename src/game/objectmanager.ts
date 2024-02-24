import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Stage } from "./stage.js";
import { Vector } from "../math/vector.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { Stats } from "./stats.js";
import { Enemy, EnemyType } from "./enemy.js";


export class ObjectManager {


    private player : Player;
    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>;
    private enemyGenerator : ObjectGenerator<EnemyType, Enemy>;


    constructor(stage : Stage, stats : Stats, event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, event.screenHeight/2, stats);

        this.collectibleGenerator = new ObjectGenerator<CollectibleType, Collectible> (Collectible);
        this.enemyGenerator = new ObjectGenerator<EnemyType, Enemy> (Enemy);

        stage.passGenerators(this.collectibleGenerator, this.enemyGenerator);
        stage.createInitialPlatforms(stats, event);
    }


    public update(globalSpeedFactor : number, stage : Stage, event : ProgramEvent) {

        this.player.update(globalSpeedFactor, event);
        stage.objectCollision(this.player, event);

        this.collectibleGenerator.update(globalSpeedFactor, this.player, stage, event);
        this.enemyGenerator.update(globalSpeedFactor, this.player, stage, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpCollectibles : Bitmap | undefined = canvas.getBitmap("collectibles");
        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        this.player.drawDust(canvas);

        this.enemyGenerator.draw(canvas, bmpEnemies);
        this.collectibleGenerator.draw(canvas, bmpCollectibles);
        this.player.draw(canvas);
    }


    public applyShake(canvas : Canvas) : void {

        this.player.applyShake(canvas);
    }
}
