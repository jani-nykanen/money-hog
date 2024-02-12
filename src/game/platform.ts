import { ExistingObject } from "./existingobject.js";
import { ProgramEvent } from "../core/event.js";
import { GameObject } from "./gameobject.js";
import { Canvas, Bitmap, Flip, Effect } from "../gfx/interface.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";


const enum TileType {

    Gap = 0,
    Ground = 1,
    Bridge = 2,

    Last = 2,
}


const enum Modifier {

    None = 0,
    Spike = 1
}


export class Platform implements ExistingObject {


    private y : number = -16;

    private tiles : TileType[] = [];
    private modifiers : Modifier[] = [];

    private exist : boolean = false;

    private width : number;


    constructor() {

        // ...
    }


    private sampleInitialType() : TileType {

        const WEIGHTS : number[] = [0.40, 0.40, 0.20];

        const p : number = Math.random();

        let sum : number = 0.0;
        for (let i = 0; i <= TileType.Last; ++ i) {

            sum += WEIGHTS[i];
            if (p <= sum) {

                return i as TileType;
            }
        }
        return TileType.Bridge;
    }


    private createInitialPlatform() : void {

        const middle : number = Math.floor(this.width/2);
        const w : number = Math.floor(this.width/4);

        for (let x = middle - w; x < middle + w; ++ x) {

            this.tiles[x] = TileType.Ground;
        }
    }


    private createPlatform(initial : boolean = false) : void {

        const SAFE_MARGIN_OFFSET : number = 3;
        const BRIDGE_PROB : number = 0.20;

        this.tiles.fill(TileType.Gap);
        this.modifiers.fill(Modifier.None);

        if (initial) {
            
            this.createInitialPlatform();
            return;
        }

        // TODO: Different contruction method for different levels?

        const maxWidth : number = Math.floor(this.width/2) - 1;
        const maxBridgeWidth : number = Math.floor(this.width/3);

        let wait : number = 1 + Math.floor(Math.random()*maxWidth);

        let fillType : TileType = this.sampleInitialType();
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


    public spawn(y : number, width : number, initial : boolean = false) : void {

        if (this.tiles.length == 0)
            this.tiles = new Array<TileType> (width);

        if (this.modifiers.length == 0)
            this.modifiers = new Array<number> (width);

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

        // Round 1: bridge tiles
        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] != TileType.Bridge)
                continue;

            this.drawBridgeTile(canvas, bmp, x);
        }

        // Round 2: ground tiles
        for (let x = 0; x < this.width; ++ x) {

            if (this.tiles[x] != TileType.Ground)
                continue;

            this.drawGroundTile(canvas, bmp, x);
        }
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
