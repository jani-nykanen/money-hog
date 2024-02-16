import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Stage } from "./stage.js";
import { Vector } from "../math/vector.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Collectible, CollectibleType } from "./collectible.js";


export class ObjectManager {


    private player : Player;
    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>;


    constructor(stage : Stage, event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, event.screenHeight/2);

        this.collectibleGenerator = new ObjectGenerator<CollectibleType, Collectible> (Collectible);

        stage.passGenerators(this.collectibleGenerator);
    }


    public update(globalSpeedFactor : number, stage : Stage, event : ProgramEvent) {

        this.player.update(globalSpeedFactor, event);
        stage.objectCollision(this.player, event);

        this.collectibleGenerator.update(globalSpeedFactor, this.player, stage, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpCollectibles : Bitmap | undefined = canvas.getBitmap("collectibles");

        this.player.drawDust(canvas);

        this.collectibleGenerator.draw(canvas, bmpCollectibles);
        this.player.draw(canvas);
    }
}
