import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Align, Bitmap, Canvas, Flip, Grid, TransformTarget } from "../gfx/interface.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
import { Background } from "./background.js";
import { Stats } from "./stats.js";


export class Game implements Scene {


    private objects : ObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;

    private background : Background | undefined = undefined;

    private stats : Stats;


    constructor() {

        this.stats = new Stats(3);
    }


    private drawBreakingHeart(canvas : Canvas, bmp : Bitmap | undefined,
        dx : number, dy : number, t : number) : void {

        if (t <= 0)
            return;

        const frame : number = Math.floor(2 + (1.0 - t)*4);

        canvas.drawBitmap(bmp, Flip.None, dx, dy, frame*16, 0, 16, 16);
    }


    private drawHUD(canvas : Canvas) : void {

        const HEART_OFFSET_X : number = -1;
        const HEART_EDGE_OFFSET : number = 2;
        const TINY_TEXT_OFFSET : number = 1;

        const bmpHUD : Bitmap | undefined = canvas.getBitmap("hud");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        // canvas.drawText(bmpFont, "Hello world?", 2, 2, 0, 0);

        // Transparent bar to make elements to stand out stronger
        canvas.setColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, canvas.width, 20);
        canvas.setColor();

        // Player lives
        for (let i = 0; i < this.stats.maxHealth; ++ i) {

            const sx : number = this.stats.getHealth() >= i + 1 ? 0 : 16;

            canvas.drawBitmap(bmpHUD, Flip.None, 
                HEART_EDGE_OFFSET + i*(16 + HEART_OFFSET_X), HEART_EDGE_OFFSET, 
                sx, 0, 16, 16);
        }
        this.drawBreakingHeart(canvas, bmpHUD, 
            HEART_EDGE_OFFSET + this.stats.getHealth()*(16 + HEART_OFFSET_X), 
            HEART_EDGE_OFFSET, 
            this.stats.getHealthUpdateTimer());

        // Score
        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width/2 - 16, TINY_TEXT_OFFSET, 
            0, 16, 32, 8);
        canvas.setColor(255, 255, 182);
        canvas.drawText(bmpFontOutlines, this.stats.scoreToString(8), 
            canvas.width/2, TINY_TEXT_OFFSET + 5, -8, 0, Align.Center);
        canvas.setColor();

        // Coins
        const coinStr : string = String(this.stats.getCoins());
        const coinX : number = canvas.width - 28 - coinStr.length*8;
        canvas.drawBitmap(bmpHUD, Flip.None, coinX, 2, 32, 16, 16, 16);
        canvas.drawText(bmpFontOutlines, "*", coinX + 12, 2, -8, 0, Align.Left);
        canvas.drawText(bmpFontOutlines, coinStr, 
            coinX + 21, 2, -8, 0, Align.Left);
    }

    
    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.stats.reset();

        this.stage = new Stage(this.stats, event);
        this.objects = new ObjectManager(this.stage, this.stats, event);
        this.background = new Background();
    }


    public update(event : ProgramEvent) : void {
        
        const globalSpeedFactor : number = 1.0; // TEMP

        if (event.transition.isActive())
            return;

        this.background?.update(event);
        this.stage?.update(globalSpeedFactor, this.stats, event);
        if (this.stage !== undefined) {

            this.objects?.update(globalSpeedFactor, this.stage, event);
        }

        this.stats.update(globalSpeedFactor, event);
    }


    public redraw(canvas : Canvas) : void {

        canvas.setColor();

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.applyTransform();    
        this.background?.draw(canvas);

        this.objects.applyShake(canvas);
        this.stage?.draw(canvas);
        this.objects?.draw(canvas);

        // Reset camera since shake is possibly applied
        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();   

        this.drawHUD(canvas);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }
}
