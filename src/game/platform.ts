import { ExistingObject } from "./existingobject.js";
import { ProgramEvent } from "../core/event.js";
import { GameObject } from "./gameobject.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { sampleWeightedUniform } from "../math/random.js";


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
    Mushroom = 4
}


const DECORATION_SX : number[] = [0, 32, 0, 16];
const DECORATION_SY : number[] = [16, 16, 32, 32];
const DECORATION_SW : number[] = [32, 16, 16, 16];
const DECORATION_SH : number[] = [16, 16, 16, 16];


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

        const maxSpikeCount : number = Math.floor(Math.random()*(admissableTileCount - 1));
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
            x += SPIKE_MIN_DISTANCE + (1 + Math.floor(Math.random()*this.width));
        }
    }


    private createDecorations() : void {

        const DECORATION_WIDTHS : number[] = [2, 1, 1, 1];
        const DECORATION_WEIGHTS : number[] = [0.25, 0.25, 0.25, 0.25];

        let x : number = Math.floor(Math.random()*this.width);

        while (x < this.width) {

            if (this.tiles[x] != TileType.Ground || this.spikes[x]) {

                ++ x;
                continue;
            }

            let type : Decoration = (sampleWeightedUniform(DECORATION_WEIGHTS) + 1) as Decoration;
            let width : number = DECORATION_WIDTHS[type - 1];

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
                if ((x2 > 0 && this.tiles[x2 - 1] == TileType.Bridge) || 
                    (x2 < this.width - 1 && this.tiles[x2 + 1] == TileType.Bridge) ||
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
        }
    }


    private createInitialPlatform() : void {

        const middle : number = Math.floor(this.width/2);
        const w : number = Math.floor(this.width/4);

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

        const leftGap : boolean = x > 0 && this.tiles[x - 1] != TileType.Bridge;
        const rightGap : boolean = x < this.width - 1 && this.tiles[x + 1] != TileType.Bridge;

        const dx : number = x*TILE_WIDTH;
        const dy : number = Math.round(this.y);

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

        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] != TileType.Bridge)
                continue;

            this.drawBridgeTile(canvas, bmp, x);
        }
    }


    private drawGround(canvas : Canvas, bmp : Bitmap | undefined) : void {

        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] != TileType.Ground)
                continue;

            this.drawGroundTile(canvas, bmp, x);
        }
    }


    private drawDecorations(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const dy : number = Math.floor(this.y);

        for (let x = 0; x < this.width; ++ x) {

            const type : Decoration = this.decorations[x];
            if (type == Decoration.None)
                continue;

            const sx : number = DECORATION_SX[type - 1];
            const sy : number = DECORATION_SY[type - 1];
            const sw : number = DECORATION_SW[type - 1];
            const sh : number = DECORATION_SH[type - 1];

            canvas.drawBitmap(bmp, Flip.None, x*TILE_WIDTH, dy - TILE_HEIGHT, sx, sy, sw, sh);
        }
    }   


    private drawSpikes(canvas : Canvas, bmp : Bitmap | undefined) : void {

        const dy : number = Math.floor(this.y);

        for (let x = 0; x < this.width; ++ x) {

            if (!this.spikes[x])
                continue;

            canvas.drawBitmap(bmp, Flip.None, 
                x*TILE_WIDTH, dy - TILE_HEIGHT, 
                7*TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);
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


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        this.drawBridge(canvas, bmp);
        this.drawGround(canvas, bmp);
        this.drawDecorations(canvas, bmp);
        this.drawSpikes(canvas, bmp);
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        if (!this.exist || !o.doesExist() || o.isDying())
            return;

        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] == TileType.Gap)
                continue;

            o.floorCollision(x*TILE_WIDTH, this.y, TILE_WIDTH, event);

            // Special case 1: edge on left
            if (x == 0 && this.tiles[this.width - 1] == TileType.Gap) {

                o.floorCollision(this.width*TILE_WIDTH, this.y, TILE_WIDTH, event);
            }
            // Special case 2: edge on right
            else if (x == this.width - 1 && this.tiles[0] == TileType.Gap) {

                o.floorCollision(-TILE_WIDTH, this.y, TILE_WIDTH, event);
            }
        }
    }


    public doesExist = () : boolean => this.exist;
    public isDying = () : boolean => false;


    public forceKill() : void {

        this.exist = false;
    }

}
