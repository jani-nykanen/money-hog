import { ProgramEvent } from "../core/event.js";
import { Tilemap } from "../tilemap/tilemap.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { Vector } from "../math/vector.js";
import { GameObject } from "./gameobject.js";



const CLOUD_COLORS : number[][] = [

    [255, 255, 255],
    [146, 182, 255],
    [73,  109, 182]
];


export class Stage {


    private cloudPosition : number[];


    constructor() {

        this.cloudPosition = (new Array<number>(3)).fill(0.0);
    }   


    private updateClouds(event : ProgramEvent) : void {

        const CLOUD_SPEED : number[] = [2.0, 1.0, 0.5];

        for (let i = 0; i < this.cloudPosition.length; ++ i) {

            this.cloudPosition[i] = (this.cloudPosition[i] + CLOUD_SPEED[i]*event.tick) % 128;
        }
    }


    private drawClouds(canvas : Canvas) : void {

        const BASE_Y : number = 160;
        const Y_OFFSET : number = -24;

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


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        this.updateClouds(event);
    }


    public draw(canvas : Canvas) : void {

        canvas.clear(109, 146, 255);

        this.drawClouds(canvas);
    }


    public objectCollision(o : GameObject, event : ProgramEvent) : void {

        // TEMP
        o.floorCollision(0, event.screenHeight, event.screenWidth, event);
    }
}
