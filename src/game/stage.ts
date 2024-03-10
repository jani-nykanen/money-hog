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
import { Stats } from "./stats.js";
import { Enemy } from "./enemy.js";
import { EnemyGenerator } from "./enemygenerator.js";


export const PLATFORM_OFFSET : number = 4;


export class Stage {


    private platforms : Platform[];
    private platformTimer : number = 0;
    private flickerTimer : number = 0.0;

    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible> | undefined = undefined;
    private enemyGenerator : EnemyGenerator | undefined = undefined;


    constructor(stats : Stats, event : ProgramEvent) {

        this.platforms = new Array<Platform> ();
    }   


    private spawnCoins(platform : Platform, stats : Stats) : void {

        const COIN_COUNT_WEIGHTS : number[] = [0.20, 0.60, 0.30];
        const HEART_PROB_FACTOR : number = 0.33;
        const GEM_PROB : number = 0.05;

        const count : number = sampleWeightedUniform(COIN_COUNT_WEIGHTS);
        if (count == 0)
            return;

        const heartProb : number = (1.0 - stats.getHealth()/stats.maxHealth)*HEART_PROB_FACTOR;
        const typeWeights : number[] = [(1.0 - GEM_PROB)*(1.0 - heartProb), (1.0 - GEM_PROB)*heartProb, GEM_PROB];

        const w : number = platform.getWidth()/count;
        
        let x : number = Math.floor(Math.random()*w);
        const dy : number = platform.getY() - (PLATFORM_OFFSET - 1)/2*TILE_HEIGHT;

        let specialItemCreated : boolean = false;
        for (let i = 0; i < count; ++ i) {

            const dx : number = x*TILE_WIDTH + TILE_WIDTH/2;
            const type : CollectibleType = specialItemCreated ? 
                CollectibleType.Coin : 
                (sampleWeightedUniform(typeWeights) + 1) as CollectibleType;
            
            // We want to create only one "non-coin" per platform
            specialItemCreated ||= type != CollectibleType.Coin;

            this.collectibleGenerator?.spawn(type, dx, dy);

            if (count == 2) {

                x = w + Math.floor(Math.random()*w);
                if (x >= w*2) {

                    x = w*2 - 1;
                }
            }
        }
    }


    private spawnEnemies(platform : Platform) : void {

        const ENEMY_COUNT_WEIGHTS : number[] = [0.30, 0.50, 0.20];

        const count : number = sampleWeightedUniform(ENEMY_COUNT_WEIGHTS);
        if (count == 0)
            return;

        platform.spawnEnemies(this.enemyGenerator, count);
    }


    private spawnPlatform(yoff : number, stats : Stats, event : ProgramEvent, initial : boolean = false) : void {

        const BOTTOM_OFFSET : number = PLATFORM_OFFSET // 2;

        const p : Platform = next<Platform>(this.platforms, Platform);

        p.spawn(yoff + event.screenHeight + BOTTOM_OFFSET*TILE_HEIGHT,
            (event.screenWidth/TILE_WIDTH) | 0, initial);

        if (!initial) {

            this.spawnCoins(p, stats);
            this.spawnEnemies(p);
        }
    }


    private updatePlatforms(globalSpeedFactor : number, stats : Stats, event : ProgramEvent) : void {

        // Update existing platforms
        for (let p of this.platforms) {

            p.update(globalSpeedFactor, event);
        }

        // Generate new platforms
        this.platformTimer += globalSpeedFactor*event.tick;
        if (this.platformTimer >= PLATFORM_OFFSET*TILE_HEIGHT) {

            this.spawnPlatform(0.0, stats, event);
            this.platformTimer -= PLATFORM_OFFSET*TILE_HEIGHT;
        }
    } 


    private updateTimers(event : ProgramEvent) : void {

        const FLICKER_TIMER_SPEED : number = 1.0/30.0;

        this.flickerTimer = (this.flickerTimer + FLICKER_TIMER_SPEED*event.tick) % 1.0;
    }


    public update(globalSpeedFactor : number, stats : Stats, event : ProgramEvent) : void {

        this.updateTimers(event);
        this.updatePlatforms(globalSpeedFactor, stats, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpTileset : Bitmap | undefined = canvas.getBitmap("tileset");

        for (let p of this.platforms) {

            p.draw(canvas, bmpTileset, this.flickerTimer);
        }
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        if (!o.doesExist() || (!o.doesForceDeathCollision() && o.isDying()))
            return;

        for (let p of this.platforms) {

            p.objectCollision(o, event);
        }
    }


    public createInitialPlatforms(stats : Stats, event : ProgramEvent) : void {

        const COUNT : number = 3;

        for (let i = 0; i < COUNT; ++ i) {

            this.spawnPlatform(-PLATFORM_OFFSET*TILE_HEIGHT*i, stats, event, i == COUNT - 1);
        }
    }


    public passGenerators(
        collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>,
        enemyGenerator : EnemyGenerator) : void {

        this.collectibleGenerator = collectibleGenerator;
        this.enemyGenerator = enemyGenerator;
    }
}
