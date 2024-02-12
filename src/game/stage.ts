import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { next } from "./existingobject.js";



const PLATFORM_OFFSET : number = 4;


export class Stage {


    private platforms : Platform[];
    private platformTimer : number = 0;


    constructor(event : ProgramEvent) {

        this.platforms = new Array<Platform> ();

        this.createInitialPlatforms(event);
    }   


    private spawnPlatform(yoff : number, event : ProgramEvent, initial : boolean = false) : void {

        const BOTTOM_OFFSET : number = 1;

        next<Platform>(this.platforms, Platform).spawn(
            yoff + event.screenHeight + BOTTOM_OFFSET*TILE_HEIGHT,
            (event.screenWidth/TILE_WIDTH) | 0, initial);
    }


    private createInitialPlatforms(event : ProgramEvent) : void {

        const COUNT : number = 3;

        for (let i = 0; i < COUNT; ++ i) {

            this.spawnPlatform(-PLATFORM_OFFSET*TILE_HEIGHT*i, event, i == COUNT - 1);
        }
    }


    private updatePlatforms(globalSpeedFactor : number, event : ProgramEvent) : void {

        // Update existing platforms
        for (let p of this.platforms) {

            p.update(globalSpeedFactor, event);
        }

        // Generate new platforms
        this.platformTimer += globalSpeedFactor*event.tick;
        if (this.platformTimer >= PLATFORM_OFFSET*TILE_HEIGHT) {

            this.spawnPlatform(0.0, event);
            this.platformTimer -= PLATFORM_OFFSET*TILE_HEIGHT;
        }
    } 


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        this.updatePlatforms(globalSpeedFactor, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpTileset : Bitmap | undefined = canvas.getBitmap("tileset");

        for (let p of this.platforms) {

            p.draw(canvas, bmpTileset);
        }
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        for (let p of this.platforms) {

            p.objectCollision(o, event);
        }
    }
}
