import { ProgramEvent } from "../core/event.js";
import { Player } from "./player.js";
import { Bitmap, Canvas } from "../gfx/interface.js";
import { Stage } from "./stage.js";
import { Vector } from "../math/vector.js";
import { ObjectGenerator } from "./objectgenerator.js";
import { Collectible, CollectibleType } from "./collectible.js";
import { Stats } from "./stats.js";
import { EnemyGenerator } from "./enemygenerator.js";
import { EnemyType } from "./enemytypes.js";
import { TILE_HEIGHT } from "./tilesize.js";
import { sampleInterpolatedWeightedUniform } from "../math/random.js";
import { ParticleGenerator } from "./particlegenerator.js";
import { DustParticle } from "./dustparticle.js";
import { Missile } from "./missile.js";


const INITIAL_MISSILE_TIME_MIN : number = 2700;
const INITIAL_MISSILE_TIME_MAX : number = 4800;
const MISSILE_TIME_MAX : number[] = [600, 180];
const MISSILE_TIME_MIN : number[] = [300, 120];
const MISSILE_COUNT_WEIGHTS_INITIAL : number[] = [1.0, 0.0];
const MISSILE_COUNT_WEIGHTS_FINAL : number[] = [0.60, 0.40];


export class ObjectManager {


    private player : Player;
    private collectibleGenerator : ObjectGenerator<CollectibleType, Collectible>;
    private enemyGenerator : EnemyGenerator;

    private missileTimer : number = 0.0;
    private missileDust : ParticleGenerator<DustParticle>;


    constructor(stage : Stage, stats : Stats, event : ProgramEvent) {

        this.player = new Player(event.screenWidth/2, 0, stats);

        this.collectibleGenerator = new ObjectGenerator<CollectibleType, Collectible> (Collectible);
        this.enemyGenerator = new EnemyGenerator();

        stage.passGenerators(this.collectibleGenerator, this.enemyGenerator);
        stage.createInitialPlatforms(stats, event);

        this.computeInitialMissileTime();

        this.missileDust = new ParticleGenerator<DustParticle> ();
    }


    private computeInitialMissileTime() : void {
        
        this.missileTimer = INITIAL_MISSILE_TIME_MIN + 
            Math.floor(Math.random()*(INITIAL_MISSILE_TIME_MAX - INITIAL_MISSILE_TIME_MIN));
    }


    private computeNewMissileTime(t : number) : void {

        const min : number = MISSILE_TIME_MIN[0]*(1.0 - t) + MISSILE_TIME_MIN[1]*t;
        const max : number = MISSILE_TIME_MAX[0]*(1.0 - t) + MISSILE_TIME_MAX[1]*t;

        this.missileTimer = min + (Math.random()*(max - min) | 0);
    }


    private spawnMissiles(weight : number, event : ProgramEvent) : void {

        const TOP_OFF : number = 32;
        const BOTTOM_OFF : number = TILE_HEIGHT/2;

        this.missileTimer -= event.tick;
        if (this.missileTimer > 0)
            return;

        this.computeNewMissileTime(weight);

        const count : number = sampleInterpolatedWeightedUniform(
            MISSILE_COUNT_WEIGHTS_INITIAL, 
            MISSILE_COUNT_WEIGHTS_FINAL, 
            weight) + 1;

        let dir : -1 | 1 = Math.random() > 0.5 ? 1 : -1;

        for (let i = 0; i < count; ++ i) {

            const dx : number = dir > 0 ? 0 : event.screenWidth;
            const dy : number = TOP_OFF + Math.random()*(event.screenHeight - (TOP_OFF + BOTTOM_OFF));

            const e : Missile = this.enemyGenerator.spawn(EnemyType.Missile, dx, dy, undefined) as Missile;
            e?.setDustGenerator(this.missileDust);

            dir *= -1;
        }
    }


    private drawMissileDust(canvas : Canvas) : void {

        const bmpEnemies : Bitmap | undefined = canvas.getBitmap("enemies");

        // canvas.setColor(255, 255, 255, 0.67);
        this.missileDust.draw(canvas, bmpEnemies);
        // canvas.setColor();
    }


    public update(weight : number, globalSpeedFactor : number, stage : Stage, event : ProgramEvent) {

        this.player.update(globalSpeedFactor, event);
        stage.objectCollision(this.player, globalSpeedFactor, event);

        this.spawnMissiles(weight, event);
        this.missileDust.update(globalSpeedFactor, event);

        this.collectibleGenerator.update(globalSpeedFactor, this.player, stage, event);
        this.enemyGenerator.update(globalSpeedFactor, stage, this.player, event);
    }


    public draw(canvas : Canvas) : void {

        const bmpCollectibles : Bitmap | undefined = canvas.getBitmap("collectibles");

        this.drawMissileDust(canvas);
        this.enemyGenerator.preDraw(canvas);

        this.player.drawParticles(canvas);

        this.enemyGenerator.draw(canvas);
        this.collectibleGenerator.draw(canvas, bmpCollectibles);
        this.player.draw(canvas);

        this.enemyGenerator.postDraw(canvas);

        this.player.postDraw(canvas);
    }


    public applyShake(canvas : Canvas) : void {

        this.player.applyShake(canvas);
    }


    public reset(stats : Stats, event : ProgramEvent) : void {

        this.player = new Player(event.screenWidth/2, 0, stats);
        this.missileDust.flush();

        this.collectibleGenerator.flush();
        this.enemyGenerator.flush();

        this.computeInitialMissileTime();
    }


    public isPlayerDying = () : boolean => this.player.isDying();
    public doesPlayerExist = () : boolean => this.player.doesExist();
    public canControlPlayer = () : boolean => this.player.canBeControlled();
    public getPlayerPosition = () : Vector => this.player.getPosition();
}
