import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Stage } from "./stage.js";
import { Vector } from "../math/vector.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { Stats } from "./stats.js";
import { Enemy } from "./enemy.js";
import { EnemyGenerator } from "./enemygenerator.js";


export class ObjectManager {


    private player : Player;
    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>;
    private enemyGenerator : EnemyGenerator;


    constructor(stage : Stage, stats : Stats, event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, 0, stats);

        this.collectibleGenerator = new ObjectGenerator<CollectibleType, Collectible> (Collectible);
        this.enemyGenerator = new EnemyGenerator();

        stage.passGenerators(this.collectibleGenerator, this.enemyGenerator);
        stage.createInitialPlatforms(stats, event);
    }


    public update(globalSpeedFactor : number, stage : Stage, event : ProgramEvent) {

        this.player.update(globalSpeedFactor, event);
        stage.objectCollision(this.player, event);

        this.collectibleGenerator.update(globalSpeedFactor, this.player, stage, event);
        this.enemyGenerator.update(globalSpeedFactor, stage, this.player, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpCollectibles : Bitmap | undefined = canvas.getBitmap("collectibles");

        this.enemyGenerator.preDraw(canvas);

        this.player.drawParticles(canvas);

        this.enemyGenerator.draw(canvas);
        this.collectibleGenerator.draw(canvas, bmpCollectibles);
        this.player.draw(canvas);

        this.player.postDraw(canvas);
    }


    public applyShake(canvas : Canvas) : void {

        this.player.applyShake(canvas);
    }


    public reset(stats : Stats, event : ProgramEvent) : void {

        this.player = new Player(event.screenWidth/2, 0, stats);

        this.collectibleGenerator.flush();
        this.enemyGenerator.flush();
    }


    public isPlayerDying = () : boolean => this.player.isDying();
    public doesPlayerExist = () : boolean => this.player.doesExist();
    public canControlPlayer = () : boolean => this.player.canBeControlled();
    public getPlayerPosition = () : Vector => this.player.getPosition();
}
