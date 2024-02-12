import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Align, Bitmap, Canvas, Flip, Grid, TransformTarget } from "../gfx/interface.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";


export class Game implements Scene {


    private objects : ObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;


    constructor() {

        // ...
    }

    
    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.stage = new Stage(event);
        this.objects = new ObjectManager(this.stage, event);
    }


    public update(event : ProgramEvent) : void {
        
        const globalSpeedFactor : number = 1.0; // TEMP

        if (event.transition.isActive())
            return;

        this.stage?.update(globalSpeedFactor, event);
        if (this.stage !== undefined) {

            this.objects?.update(this.stage, event);
        }
    }


    public redraw(canvas : Canvas) : void {

        canvas.setColor();
        canvas.clear(64, 128, 192);

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.applyTransform();    

        this.stage?.draw(canvas);
        this.objects?.draw(canvas);

        const font : Bitmap | undefined = canvas.getBitmap("font");
        canvas.drawText(font, "Hello world?", 2, 2, 0, 0);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }
}
