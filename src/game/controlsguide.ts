import { ProgramEvent } from "../core/event.js";
import { Align, Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { drawUIBox } from "../ui/box.js";


export class ControlsGuide {


    private active : boolean = false;


    constructor() {}


    public update(event : ProgramEvent) : void {

        if (!this.active)
            return;

        if (event.input.isAnyPressed()) {

            event.audio.playSample(event.assets.getSample("select"), 0.45);
            this.active = false;
        }
    }


    public draw(canvas : Canvas, darken : boolean = false, forceDraw : boolean = false) : void {

        const WIDTH : number = 136;
        const HEIGHT : number = 128;
        const SHADOW_OFFSET : number = 4;
        const YOFF : number = 8;

        if (!this.active && !forceDraw)
            return;

        canvas.setColor(0, 0, 0, 0.33);

        if (darken) {

            canvas.fillRect();
        }

        const cornerx : number = canvas.width/2 - WIDTH/2;
        const cornery : number = canvas.height/2 - HEIGHT/2;

        canvas.fillRect(cornerx + SHADOW_OFFSET, cornery + SHADOW_OFFSET, WIDTH, HEIGHT);

        canvas.setColor();
        drawUIBox(canvas, cornerx, cornery, WIDTH, HEIGHT);

        const bmpControls : Bitmap | undefined = canvas.getBitmap("controls");

        const w : number = bmpControls?.width ?? 0;
        const h : number = bmpControls?.height ?? 0;

        canvas.drawBitmap(bmpControls, Flip.None, 
            canvas.width/2 - w/2, 
            canvas.height/2 - h/2 + YOFF);

        const bmpFont : Bitmap | undefined = canvas.getBitmap("font");

        canvas.drawText(bmpFont, "CONTROLS:", canvas.width/2, cornery + 8, 0, 0, Align.Center);
    }


    public activate() : void {

        this.active = true;
    }


    public isActive = () : boolean => this.active;
}
