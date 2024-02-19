import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { next } from "./existingobject.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { sampleWeightedUniform } from "../math/random.js";



const PLATFORM_OFFSET : number = 4;


export class Stage {


    private platforms : Platform[];
    private platformTimer : number = 0;
    private flickerTimer : number = 0.0;

    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible> | undefined = undefined;


    constructor( event : ProgramEvent) {

        this.platforms = new Array<Platform> ();

        this.createInitialPlatforms(event);
    }   


    private spawnCoins(platform : Platform) : void {

        const COIN_COUNT_WEIGHTS : number[] = [0.20, 0.60, 0.30];

        const count : number = sampleWeightedUniform(COIN_COUNT_WEIGHTS);
        if (count == 0)
            return;

        const w : number = platform.getWidth()/count;
        
        let x : number = Math.floor(Math.random()*w);
        const dy : number = platform.getY() - (PLATFORM_OFFSET - 1)/2*TILE_HEIGHT;

        for (let i = 0; i < count; ++ i) {

            const dx : number = x*TILE_WIDTH + TILE_WIDTH/2;
            this.collectibleGenerator?.spawn(CollectibleType.Coin, dx, dy);

            if (count == 2) {

                x = w + Math.floor(Math.random()*w);
                if (x >= w*2) {

                    x = w*2 - 1;
                }
            }
        }
    }


    private spawnPlatform(yoff : number, event : ProgramEvent, initial : boolean = false) : void {

        const BOTTOM_OFFSET : number = 2;

        const p : Platform = next<Platform>(this.platforms, Platform);

        p.spawn(yoff + event.screenHeight + BOTTOM_OFFSET*TILE_HEIGHT,
            (event.screenWidth/TILE_WIDTH) | 0, initial);

        if (!initial) {

            this.spawnCoins(p);
        }
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


    private updateTimers(event : ProgramEvent) : void {

        const FLICKER_TIMER_SPEED : number = 1.0/30.0;

        this.flickerTimer = (this.flickerTimer + FLICKER_TIMER_SPEED*event.tick) % 1.0;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        this.updateTimers(event);
        this.updatePlatforms(globalSpeedFactor, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpTileset : Bitmap | undefined = canvas.getBitmap("tileset");

        for (let p of this.platforms) {

            p.draw(canvas, bmpTileset, this.flickerTimer);
        }
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        if (!o.doesExist() || o.isDying())
            return;

        for (let p of this.platforms) {

            p.objectCollision(o, event);
        }
    }


    public passGenerators(collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>) : void {

        this.collectibleGenerator = collectibleGenerator;
    }
}
