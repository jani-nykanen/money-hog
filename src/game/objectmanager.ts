import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Stage } from "./stage.js";
import { Vector } from "../math/vector.js";


export class ObjectManager {


    private player : Player;


    constructor(stage : Stage, event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, event.screenHeight/2);
    }


    public update(globalSpeedFactor : number, stage : Stage, event : ProgramEvent) {

        this.player.update(globalSpeedFactor, event);
        stage.objectCollision(this.player, event);
    }


    public draw(canvas : Canvas) : void {

        this.player.drawDust(canvas);

        this.player.draw(canvas);
    }
}
