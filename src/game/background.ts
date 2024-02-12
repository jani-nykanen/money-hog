import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";
import { Platform } from "./platform.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./tilesize.js";
import { next } from "./existingobject.js";


const CLOUD_COLORS : number[][] = [

    [255, 255, 255],
    [146, 182, 255],
    [73,  109, 182]
];




export class Background {

    
    private cloudPosition : number[];


    constructor() {

        this.cloudPosition = (new Array<number>(3)).fill(0.0);
    }   


    private drawClouds(canvas : Canvas) : void {

        const BASE_Y : number = 172;
        const Y_OFFSET : number = -28;

        const bmpClouds : Bitmap | undefined = canvas.getBitmap("clouds");
        if (bmpClouds === undefined)
            return;

        for (let i = this.cloudPosition.length - 1; i >= 0; -- i) {

            const color : number[] = CLOUD_COLORS[i];
            const dx : number = -Math.floor(this.cloudPosition[i]);
            let dy : number = BASE_Y + Y_OFFSET*i;

            canvas.setColor(...color);
            for (let j = 0; j <= 2; ++ j) {

                canvas.drawBitmap(bmpClouds, Flip.None, dx + j*bmpClouds.width, dy);
            }
            
            dy += bmpClouds.height;
            canvas.fillRect(0, dy, canvas.width, canvas.height - dy);
        }
        canvas.setColor();
    }


    private drawSkyObjects(canvas : Canvas) : void {

        const SUN_OFF_X : number = 16;
        const SUN_OFF_Y : number = 32;

        const bmpPlanets : Bitmap | undefined = canvas.getBitmap("planets");
        if (bmpPlanets === undefined)
            return;

        const w : number = bmpPlanets.width;
        const h : number = bmpPlanets.height;

        const dx : number = canvas.width - SUN_OFF_X - w;
        const dy : number = SUN_OFF_Y;

        canvas.drawBitmap(bmpPlanets, Flip.None, dx, dy, 0, 0, 64, 64);
    }



    public update(event : ProgramEvent) : void {

        const CLOUD_SPEED : number[] = [2.0, 1.0, 0.5];

        for (let i = 0; i < this.cloudPosition.length; ++ i) {

            this.cloudPosition[i] = (this.cloudPosition[i] + CLOUD_SPEED[i]*event.tick) % 128;
        }
    }


    public draw(canvas : Canvas) : void {

        canvas.clear(...CLOUD_COLORS[1]);

        this.drawSkyObjects(canvas);
        this.drawClouds(canvas);
    }
}
