import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Align, Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { TextBox } from "../ui/textbox.js";


const STORY_TEXT : string[][] = [
[
`Oh no, an evil 
witch has turned 
you, a totally 
normal human being, 
into a pig!`,

`The witch demands 
one million dollars 
before midnight, 
otherwise you shall 
remain a pig for-
ever!`
],
[]
]



export class StoryScreen implements Scene {


    private text : TextBox;


    constructor() {

        this.text = new TextBox();
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.text.addText(STORY_TEXT[0]);
        this.text.activate(false, (event : ProgramEvent) => {

            event.transition.activate(true, TransitionType.Fade, 1.0/20.0, event,
            (event : ProgramEvent) => {

                event.transition.deactivate();
                event.scenes.changeScene("game", event);
            });
        })
    }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive())
            return;

        this.text.update(event);
    }


    public redraw(canvas : Canvas) : void {

        canvas.clear(0, 0, 0);

        const bmpBackground : Bitmap | undefined = canvas.getBitmap("story_background");

        canvas.drawBitmap(bmpBackground, Flip.None, 
            canvas.width/2 - (bmpBackground?.width ?? 0)/2, 16, 0, 0, 160, 128);

        this.text.draw(canvas, 0, 64, 4, false, true);
    }


    public dispose() : SceneParameter {
       
        return undefined;
    }

}
