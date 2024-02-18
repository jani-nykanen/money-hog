import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Align, Bitmap, Canvas, Flip, Grid, TransformTarget } from "../gfx/interface.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
import { Background } from "./background.js";
import { GameState } from "./state.js";


export class Game implements Scene {


    private objects : ObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;

    private background : Background | undefined = undefined;

    private state : GameState;


    constructor() {

        this.state = new GameState(3);
    }


    private drawHUD(canvas : Canvas) : void {

        const HEART_OFFSET_X : number = -1;
        const HEART_EDGE_OFFSET : number = 2;
        const TINY_TEXT_OFFSET : number = 1;

        const bmpHUD : Bitmap | undefined = canvas.getBitmap("hud");
        const bmpFont : Bitmap | undefined = canvas.getBitmap("font");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        // canvas.drawText(bmpFont, "Hello world?", 2, 2, 0, 0);

        // Transparent bar to make elements to stand out stronger
        canvas.setColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, canvas.width, 20);
        canvas.setColor();

        // Player lives
        for (let i = 0; i < this.state.maxHealth; ++ i) {

            const sx : number = this.state.getHealth() >= i + 1 ? 0 : 16;

            canvas.drawBitmap(bmpHUD, Flip.None, 
                HEART_EDGE_OFFSET + i*(16 + HEART_OFFSET_X), HEART_EDGE_OFFSET, 
                sx, 0, 16, 16);
        }

        // Score & bonus titles
        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width/2 - 16, TINY_TEXT_OFFSET, 
            0, 16, 32, 8);
        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width - 40, TINY_TEXT_OFFSET, 
            0, 24, 32, 8);

        // Actual score
        canvas.setColor(255, 255, 182);
        canvas.drawText(bmpFontOutlines, "12345678", 
            canvas.width/2, TINY_TEXT_OFFSET + 5, -8, 0, Align.Center);

        // Actual bonus
        canvas.setColor(182, 255, 146);
        canvas.drawText(bmpFontOutlines, "*" + this.state.bonusToNumber(), 
            canvas.width - 28, TINY_TEXT_OFFSET + 5, -8, 0, Align.Center);

        canvas.setColor();
    }

    
    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.state.reset();

        this.stage = new Stage(event);
        this.objects = new ObjectManager(this.stage, event);
        this.background = new Background();
    }


    public update(event : ProgramEvent) : void {
        
        const globalSpeedFactor : number = 1.0; // TEMP

        if (event.transition.isActive())
            return;

        this.stage?.update(globalSpeedFactor, event);
        if (this.stage !== undefined) {

            this.objects?.update(globalSpeedFactor, this.stage, event);
        }

        this.background?.update(event);
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
