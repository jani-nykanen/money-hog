import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Bitmap, Canvas, Flip } from "../gfx/interface.js";


export class Ending implements Scene {


    constructor() { }


    public init(param : SceneParameter, event : ProgramEvent) : void { }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive())
            return;

        if (event.input.isAnyPressed()) {

            event.audio.playSample(event.assets.getSample("select"), 0.50);

            event.transition.activate(true, TransitionType.Fade, 1.0/60.0, event,
                (event : ProgramEvent) : void => {

                    event.transition.activate(false, TransitionType.Circle, 1.0/30.0, event);
                    event.scenes.changeScene("title", event);
                });
        }
    }


    public redraw(canvas : Canvas) : void {

        canvas.clear(0, 0, 0);

        const bmp : Bitmap | undefined = canvas.getBitmap("ending");

        const dx : number = canvas.width/2 - (bmp?.width ?? 0)/2;
        const dy : number = canvas.height/2 - (bmp?.height ?? 0)/2;

        canvas.drawBitmap(bmp, Flip.None, dx, dy);
    }


    public dispose() : SceneParameter {
       
        return 0;
    }

}
