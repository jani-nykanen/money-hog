import { ExistingObject } from "./existingobject.js";
import { ProgramEvent } from "../core/event.js";
import { GameObject } from "./gameobject.js";
import { Canvas, Bitmap, Flip } from "../gfx/interface.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { sampleInterpolatedWeightedUniform, sampleWeightedUniform } from "../math/random.js";
import { ENEMY_TYPE_COUNT, ENEMY_WEIGHTS_FINAL, ENEMY_WEIGHTS_INITIAL, EnemyType } from "./enemytypes.js";
import { EnemyGenerator } from "./enemygenerator.js";
import { clamp } from "../math/utility.js";


const enum TileType {

    Gap = 0,
    Ground = 1,
    Bridge = 2,

    Last = 2,
}


const enum Decoration {

    None = 0,
    BigBush = 1,
    SmallBush = 2,
    Rock = 3,
    Mushroom = 4,
    TallMushroom = 5,
    Tree = 6,
    FenceLeft = 7,
    Fence = 8,
    FenceRight = 9,

    Last = 9,
    LastNonFence = 6,
}


const DECORATION_SX : number[] = [0, 32, 0, 16, 32, 48, 64, 80, 96];
const DECORATION_SY : number[] = [16, 16, 32, 32, 32, 16, 16, 16, 16];
const DECORATION_SW : number[] = [32, 16, 16, 16, 16, 16, 16, 16, 16];
const DECORATION_SH : number[] = [16, 16, 16, 16, 16, 32, 16, 16, 16];


export class Platform implements ExistingObject {


    private y : number = -16;

    private tiles : TileType[] = [];
    private decorations : Decoration[] = [];
    private spikes : boolean[] = [];

    private exist : boolean = false;

    private width : number;


    constructor() {

        // ...
    }


    private createSpikes() : void {

        const SPIKE_MIN_DISTANCE : number = 1;
        const SPIKE_WEIGHTS : number[] = [0.30, 0.50, 0.20];

        let admissableTileCount : number = 0;
        let admissablePositions : boolean[] = (new Array<boolean> (this.width)).fill(false);

        // Find "admissable" locations for spikes and compute the number of
        // them
        for (let i = 0; i < this.width; ++ i) {

            // If not a ground tile OR overlaps a bridge fence
            if (this.tiles[i] != TileType.Ground ||
                (i > 0 && this.tiles[i - 1] == TileType.Bridge) ||
                (i < this.width - 1 && this.tiles[i + 1] == TileType.Bridge)) {

                continue;
            }

            ++ admissableTileCount;
            admissablePositions[i] = true;
        }

        const maxSpikeCount : number = Math.min(
            sampleWeightedUniform(SPIKE_WEIGHTS),
            Math.floor(Math.random()*(admissableTileCount - 1))
        );
        if (maxSpikeCount <= 0)
            return;

        let x : number = Math.floor(Math.random()*this.width);
        let count : number = 0;

        while (count < admissableTileCount && x < this.width) {

            if (!admissablePositions[x]) {

                ++ x;
                continue;
            }

            this.spikes[x] = true;

            ++ count;
            if (count > maxSpikeCount)
                break;
            
            x += SPIKE_MIN_DISTANCE + (1 + Math.floor(Math.random()*this.width));
        }
    }


    private setBridgeDecorations() : void {
        
        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] == TileType.Bridge) {

                this.decorations[x] = Decoration.Fence;
            }
            else if (x > 0 && this.tiles[x - 1] == TileType.Bridge) {

                this.decorations[x] = Decoration.FenceRight;
            }
            else if (x < this.width - 1 && this.tiles[x + 1] == TileType.Bridge) {

                this.decorations[x] = Decoration.FenceLeft;
            }
        }
    }


    private createDecorations() : void {

        const DECORATION_WIDTHS : number[] = [2, 1, 1, 1];
        // const DECORATION_WEIGHTS : number[] = [0.25, 0.25, 0.25, 0.25];

        this.setBridgeDecorations();

        let x : number = Math.floor(Math.random()*this.width);
        let type : Decoration = Math.floor(Math.random()*Decoration.LastNonFence) + 1; 
        let width : number = DECORATION_WIDTHS[type - 1];

        while (x < this.width) {

            if (this.tiles[x] != TileType.Ground || 
                this.spikes[x] || 
                this.decorations[x] != Decoration.None) {

                ++ x;
                continue;
            }

            // Check if enough room for wide objects
            if (width == 2 && 
                x < this.width - 1 && 
                this.tiles[x + 1] != TileType.Ground) {

                type = Decoration.SmallBush;
                width = 1;
            }

            let skip : boolean = false;
            for (let x2 = x; x2 < x + width; ++ x2) {

                // Do not put decorations in the same places as
                // fences or spikes (note that the spike check is also
                // needed here for wide objects)
                if ((x2 > 0 && this.decorations[x2 - 1] != Decoration.None) || 
                    (x2 < this.width - 1 && this.decorations[x2 + 1] != Decoration.None) ||
                    this.spikes[x2]) {

                    skip = true;
                    break;
                }
            }

            if (skip) {

                ++ x;
                continue;
            }
            
            this.decorations[x] = type;

            x += 1 + width + Math.floor(Math.random()*this.width);
            type = Math.floor(Math.random()*Decoration.LastNonFence) + 1
            width = DECORATION_WIDTHS[type - 1];
        }
    }


    private createInitialPlatform() : void {

        const middle : number = Math.floor(this.width/2);
        const w : number = Math.floor(this.width/6);

        for (let x = middle - w; x < middle + w; ++ x) {

            this.tiles[x] = TileType.Ground;
        }
    }


    private createPlatform(initial : boolean = false) : void {

        const INITIAL_TYPE_WEIGHTS : number[] = [0.40, 0.40, 0.20];

        const SAFE_MARGIN_OFFSET : number = 3;
        const BRIDGE_PROB : number = 0.20;

        this.tiles.fill(TileType.Gap);
        this.decorations.fill(Decoration.None);
        this.spikes.fill(false);

        if (initial) {
            
            this.createInitialPlatform();
            return;
        }

        // TODO: Different contruction method for different levels?

        const maxWidth : number = Math.floor(this.width/2) - 1;
        const maxBridgeWidth : number = Math.floor(this.width/3);

        let wait : number = 1 + Math.floor(Math.random()*maxWidth);

        let fillType : TileType = sampleWeightedUniform(INITIAL_TYPE_WEIGHTS) as TileType;
        if (fillType == TileType.Bridge) {

            wait = Math.min(maxBridgeWidth, wait);
        }

        let counter : number = 0;
        let bridgeCreated : boolean = fillType == TileType.Bridge;
        let gapCount : number = 0;

        for (let x = 0; x < this.width; ++ x) {

            this.tiles[x] = fillType;
            if (fillType == TileType.Gap) {

                ++ gapCount;
            }

            // Special case: no "wide enough" gap created 
            // and almost hit the end of the row
            if (gapCount < 2 && 
                fillType == TileType.Ground &&
                x >= this.width - SAFE_MARGIN_OFFSET) {

                counter = wait;
            }

            ++ counter;
            if (counter >= wait) {

                fillType = fillType == TileType.Ground ? TileType.Gap : TileType.Ground;
                wait = 1 + Math.floor(Math.random()*maxWidth);

                // Check if we want to create a bridge
                if (fillType == TileType.Gap && 
                    !bridgeCreated &&
                    Math.random() <= BRIDGE_PROB) {

                    bridgeCreated = true;
                    fillType = TileType.Bridge;

                    wait = Math.min(maxBridgeWidth, wait);
                }
                // One tile gaps are too small due to the hitboxes
                if (fillType == TileType.Gap && wait == 1) {

                    wait = 2;
                }

                counter = 0;
            }
        }

        this.createSpikes();
        this.createDecorations();
    }


    private drawBridgeTile(canvas : Canvas, bmp : Bitmap | undefined, x : number) : void {

        const OFFSET_Y : number = -1;

        const dx : number = x*TILE_WIDTH;
        const dy : number = Math.round(this.y);
/*
        const leftGap : boolean = x > 0 && this.tiles[x - 1] != TileType.Bridge;
        const rightGap : boolean = x < this.width - 1 && this.tiles[x + 1] != TileType.Bridge;

        // Fence
        canvas.drawBitmap(bmp, Flip.None, 
            dx, dy - TILE_HEIGHT, 
            TILE_WIDTH*5, TILE_HEIGHT, 
            TILE_WIDTH, TILE_HEIGHT);
        if (leftGap) {

            canvas.drawBitmap(bmp, Flip.None, 
                dx - TILE_WIDTH, dy - TILE_HEIGHT, 
                TILE_WIDTH*4, TILE_HEIGHT, 
                TILE_WIDTH, TILE_HEIGHT);
        }
        if (rightGap) {

            canvas.drawBitmap(bmp, Flip.None, 
                dx + TILE_WIDTH, dy - TILE_HEIGHT, 
                TILE_WIDTH*6, TILE_HEIGHT, 
                TILE_WIDTH, TILE_HEIGHT);
        }
*/
        // Base bridge
        canvas.drawBitmap(bmp, Flip.None, dx, dy + OFFSET_Y, TILE_WIDTH*6, 0, TILE_WIDTH, TILE_HEIGHT);
    }


    private drawGroundTile(canvas : Canvas, bmp : Bitmap | undefined, x : number) : void {

        const leftGap : boolean = x > 0 && this.tiles[x - 1] != TileType.Ground;
        const rightGap : boolean = x < this.width - 1 && this.tiles[x + 1] != TileType.Ground;

        const dx : number = x*TILE_WIDTH;
        const dy : number = Math.round(this.y);

        let sx : number = 2;
        if (leftGap && rightGap) {

            sx = 5;
        }
        else if (leftGap) {

            sx = 1;
        }
        else if (rightGap) {

            sx = 3;
        }

        canvas.drawBitmap(bmp, Flip.None, dx, dy, sx*TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);

        if (leftGap) {

            canvas.drawBitmap(bmp, Flip.None, dx - TILE_WIDTH, dy, 0, 0, TILE_WIDTH, TILE_HEIGHT);
        }
        if (rightGap) {

            canvas.drawBitmap(bmp, Flip.None, dx + TILE_WIDTH, dy, TILE_WIDTH*4, 0, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    private drawBridge(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let x = -1; x < this.width + 1; ++ x) {

            if (this.tiles[clamp(x, 0, this.width - 1)] != TileType.Bridge)
                continue;

            this.drawBridgeTile(canvas, bmp, x);
        }
    }


    private drawGround(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let x = -1; x < this.width + 1; ++ x) {

            if (this.tiles[clamp(x, 0, this.width - 1)] != TileType.Ground)
                continue;

            this.drawGroundTile(canvas, bmp, x);
        }
    }


    private drawDecorations(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const dy : number = Math.round(this.y);

        for (let x = 0; x < this.width; ++ x) {

            const type : Decoration = this.decorations[x];
            if (type == Decoration.None)
                continue;

            const sx : number = DECORATION_SX[type - 1];
            const sy : number = DECORATION_SY[type - 1];
            const sw : number = DECORATION_SW[type - 1];
            const sh : number = DECORATION_SH[type - 1];

            canvas.drawBitmap(bmp, Flip.None, x*TILE_WIDTH, dy - sh, sx, sy, sw, sh);
        }
    }   


    private drawSpikes(canvas : Canvas, bmp : Bitmap | undefined, flickerTime : number = 0.0) : void {

        const dy : number = Math.round(this.y);

        const frame : number = Math.floor(flickerTime*2.0);

        for (let x = 0; x < this.width; ++ x) {

            if (!this.spikes[x])
                continue;

            canvas.drawBitmap(bmp, Flip.None, 
                x*TILE_WIDTH, dy - TILE_HEIGHT, 
                7*TILE_WIDTH, frame*TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    public spawn(y : number, width : number, initial : boolean = false) : void {

        if (this.tiles.length == 0)
            this.tiles = new Array<TileType> (width);

        if (this.decorations.length == 0)
            this.decorations = new Array<number> (width);

        if (this.spikes.length == 0) 
            this.spikes = new Array<boolean> (width);

        this.y = y;
        this.width = width;

        this.createPlatform(initial);

        this.exist = true;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        if (!this.exist)
            return;

        this.y -= globalSpeedFactor*event.tick;
        if (this.y < -TILE_HEIGHT) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined, flickerTime : number = 0.0) : void {

        if (!this.exist)
            return;

        this.drawBridge(canvas, bmp);
        this.drawGround(canvas, bmp);
        this.drawDecorations(canvas, bmp);
        this.drawSpikes(canvas, bmp, flickerTime);
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        const SPIKE_WIDTH : number = 10;
        const SPIKE_HEIGHT : number = 6;

        if (!this.exist || !o.doesExist() || (!o.doesForceDeathCollision() && o.isDying()))
            return;

        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] == TileType.Gap)
                continue;

            o.floorCollision(x*TILE_WIDTH, this.y, TILE_WIDTH, event, this.tiles[x] == TileType.Bridge, this);

            // Special case 1: edge on left
            if (x == 0 && this.tiles[this.width - 1] == TileType.Gap) {

                o.floorCollision(this.width*TILE_WIDTH, this.y, TILE_WIDTH, event, this.tiles[0] == TileType.Bridge, this);
            }
            // Special case 2: edge on right
            else if (x == this.width - 1 && this.tiles[0] == TileType.Gap) {

                o.floorCollision(-TILE_WIDTH, this.y, TILE_WIDTH, event, this.tiles[this.width - 1] == TileType.Bridge, this);
            }

            // Platform edge collisions (for enemies)
            if (x > 0 && this.tiles[x - 1] == TileType.Gap) {

                o.edgeCollision?.(x*TILE_WIDTH, this.y - TILE_HEIGHT, TILE_HEIGHT, -1, event);
            }
            if (x < this.width - 1 && this.tiles[x + 1] == TileType.Gap) {

                o.edgeCollision?.((x + 1)*TILE_WIDTH, this.y - TILE_HEIGHT, TILE_HEIGHT, 1, event);
            }

            // Spikes
            if (this.spikes[x]) {

                const dx : number = x*TILE_WIDTH + (TILE_WIDTH - SPIKE_WIDTH)/2;
                const dy : number = this.y - SPIKE_HEIGHT;
                
                for (let i = -1; i <= 1; ++ i) {

                    o.hurtCollision?.(dx + i*event.screenWidth, dy, SPIKE_WIDTH, SPIKE_HEIGHT, event);
                }

                o.edgeCollision?.(x*TILE_WIDTH, this.y - TILE_HEIGHT, TILE_HEIGHT, 1, event);
                o.edgeCollision?.((x + 1)*TILE_WIDTH, this.y - TILE_HEIGHT, TILE_HEIGHT, -1, event);
            }
        }
    }


    public spawnEnemies(weight : number, enemyGenerator : EnemyGenerator, count : number) : void {

        if (count == 0)
            return;

        const segmentLength : number = Math.floor(this.width/count);

        for (let i = 0; i < count; ++ i) {

            let x : number = segmentLength*i + Math.floor(Math.random()*segmentLength);

            for (; x < segmentLength*(i + 1); ++ x) {

                if (this.tiles[x] == TileType.Gap || this.spikes[x])
                    continue;

                const type : EnemyType = sampleInterpolatedWeightedUniform(
                    ENEMY_WEIGHTS_INITIAL, ENEMY_WEIGHTS_FINAL, weight);

                enemyGenerator.spawn(type, x*TILE_WIDTH + TILE_WIDTH/2, this.y - 12, this);
                break;
            }
        }
    }


    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => false;
    public getWidth = () : number => this.width;
    public getY = () : number => this.y;


    public forceKill() : void {

        this.exist = false;
    }

}
