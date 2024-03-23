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
import { sampleInterpolatedWeightedUniform, sampleWeightedUniform } from "../math/random.js";
import { Stats } from "./stats.js";
import { Enemy } from "./enemy.js";
import { EnemyGenerator } from "./enemygenerator.js";
import { Difficulty } from "./difficulty.js";


export const PLATFORM_OFFSET : number = 4;


const ENEMY_COUNT_WEIGHTS_INITIAL : number[][] = [
    [0.30, 0.50, 0.20, 0.0],
    [0.30, 0.40, 0.25, 0.05],
];
const ENEMY_COUNT_WEIGHTS_FINAL : number[][] = [
    [0.1, 0.20, 0.50, 0.20, 0.0],
    [0.0, 0.10, 0.50, 0.40, 0.10]
];


const COIN_COUNT_WEIGHTS_INITIAL : number[][] = [

    [0.20, 0.60, 0.30, 0.0],
    [0.10, 0.50, 0.30, 0.10, 0.0]
];
const COIN_COUNT_WEIGHTS_FINAL: number[][] = [

    [0.0, 0.30, 0.50, 0.20],
    [0.0, 0.20, 0.40, 0.30, 0.10]
];


export class Stage {


    private platforms : Platform[];
    private platformTimer : number = 0;
    private flickerTimer : number = 0.0;

    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible> | undefined = undefined;
    private enemyGenerator : EnemyGenerator | undefined = undefined;


    constructor(stats : Stats, event : ProgramEvent) {

        this.platforms = new Array<Platform> ();
    }   


    private spawnCoins(difficulty : number, weight : number, platform : Platform, stats : Stats) : void {

        const TYPE_WEIGHTS : number[] = [0.90, 0.025, 0.075];
        const HEART_PROB_FACTOR : number = 0.33;

        const count : number = sampleInterpolatedWeightedUniform(
            COIN_COUNT_WEIGHTS_INITIAL[difficulty] ?? [], 
            COIN_COUNT_WEIGHTS_FINAL[difficulty] ?? [],
            weight);
        if (count == 0)
            return;

        const heartProb : number = (1.0 - stats.getHealth()/stats.maxHealth)*HEART_PROB_FACTOR;

        const w : number = platform.getWidth()/count;
        const dy : number = platform.getY() - (PLATFORM_OFFSET - 1)/2*TILE_HEIGHT;

        let specialItemCreated : boolean = false;
        for (let i = 0; i < count; ++ i) {

            const x = i*w + Math.floor(Math.random()*w);
            const dx : number = x*TILE_WIDTH + TILE_WIDTH/2;
            
            let type : CollectibleType = sampleWeightedUniform(TYPE_WEIGHTS) + 1;
            if (type != CollectibleType.Coin && specialItemCreated) {

                type = CollectibleType.Coin;
            }

            if (type == CollectibleType.Coin && 
                !specialItemCreated &&
                Math.random() < heartProb) {

                type = CollectibleType.Heart;
            }
            specialItemCreated ||= type != CollectibleType.Coin;

            this.collectibleGenerator?.spawn(type, dx, dy);

            
        }
    }


    private spawnEnemies(difficulty : Difficulty, weight : number, platform : Platform) : void {

        const count : number = sampleInterpolatedWeightedUniform(
            ENEMY_COUNT_WEIGHTS_INITIAL[difficulty] ?? [], 
            ENEMY_COUNT_WEIGHTS_FINAL[difficulty] ?? [],
            weight);
        if (count == 0)
            return;

        platform.spawnEnemies(weight, this.enemyGenerator, count);
    }


    private spawnPlatform(difficulty : Difficulty, weight : number, 
        yoff : number, stats : Stats, event : ProgramEvent, 
        initial : boolean = false, noEnemies : boolean = false) : void {

        const BOTTOM_OFFSET : number = PLATFORM_OFFSET; // 2;

        const p : Platform = next<Platform>(this.platforms, Platform);

        p.spawn(difficulty, weight, yoff + event.screenHeight + BOTTOM_OFFSET*TILE_HEIGHT,
            (event.screenWidth/TILE_WIDTH) | 0, initial);

        if (!initial) {

            this.spawnCoins(difficulty, weight, p, stats);

            if (!noEnemies) {

                this.spawnEnemies(difficulty, weight, p);
            }
        }
    }


    private updatePlatforms(difficulty : Difficulty, weight : number, 
        globalSpeedFactor : number, stats : Stats, event : ProgramEvent) : void {

        // Update existing platforms
        for (let p of this.platforms) {

            p.update(globalSpeedFactor, event);
        }

        // Generate new platforms
        this.platformTimer += globalSpeedFactor*event.tick;
        if (this.platformTimer >= PLATFORM_OFFSET*TILE_HEIGHT) {

            this.spawnPlatform(difficulty, weight, 0.0, stats, event);
            this.platformTimer -= PLATFORM_OFFSET*TILE_HEIGHT;
        }
    } 


    private updateTimers(event : ProgramEvent) : void {

        const FLICKER_TIMER_SPEED : number = 1.0/30.0;

        this.flickerTimer = (this.flickerTimer + FLICKER_TIMER_SPEED*event.tick) % 1.0;
    }


    public update(difficulty : Difficulty, weight : number, 
        globalSpeedFactor : number, stats : Stats, event : ProgramEvent) : void {

        this.updateTimers(event);
        this.updatePlatforms(difficulty, weight, globalSpeedFactor, stats, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpTileset : Bitmap | undefined = canvas.getBitmap("tileset");

        for (let p of this.platforms) {

            p.draw(canvas, bmpTileset, this.flickerTimer);
        }
    }


    public objectCollision(o : GameObject, globalSpeedFactor : number, event : ProgramEvent) : void {

        if (!o.doesExist() || (!o.doesForceDeathCollision() && o.isDying()))
            return;

        for (let p of this.platforms) {

            p.objectCollision(o, globalSpeedFactor, event);
        }
    }


    public createInitialPlatforms(stats : Stats, event : ProgramEvent) : void {

        const COUNT : number = 3;

        for (let i = 0; i < COUNT; ++ i) {

            this.spawnPlatform(0, 0.0, -PLATFORM_OFFSET*TILE_HEIGHT*i, stats, event, i == COUNT - 1, true);
        }
    }


    public passGenerators(
        collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>,
        enemyGenerator : EnemyGenerator) : void {

        this.collectibleGenerator = collectibleGenerator;
        this.enemyGenerator = enemyGenerator;
    }


    public reset(stats : Stats, event : ProgramEvent) : void {

        for (let p of this.platforms) {

            p.forceKill();
        }

        this.platformTimer = 0;
        this.createInitialPlatforms(stats, event);
    }
}
