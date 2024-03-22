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
%s 
before midnight, 
otherwise you shall 
remain a pig for-
ever!`
],
[
`Congratulations!
You have collected
the required
%s!
`,
`However, since it
is more fun to be
a rich pig than a
poor human, you 
decide to keep the
money.`,
`It really drives
the witch crazy!`

]
]



export class StoryScreen implements Scene {


    private text : TextBox;
    private difficultyParam : number = 0;
    private isEnding : boolean = false;


    constructor() {

        this.text = new TextBox();
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.text.clear();

        this.isEnding = param === 2;

        // TODO: This is a mess
        const p : number = (typeof(param) === "number") ? (param % 2) : 0;
        const text : string[] = Array.from(STORY_TEXT[this.isEnding ? 1 : 0]);
        const replaceIndex : number = this.isEnding ? 0 : 1;

        text[replaceIndex] = text[replaceIndex].replace("%s", p == 0 ? "one million dollars" : "9.999.999 dollars");

        this.text.addText(text);
        this.text.activate(false, (event : ProgramEvent) => {

            // TODO: This is also a mess
            event.transition.activate(true, TransitionType.Fade, 1.0/20.0, event,
            (event : ProgramEvent) => {

                event.transition.activate(false, 
                    this.isEnding ? TransitionType.Fade : TransitionType.Circle, 
                    this.isEnding ? 1.0/60.0 : 1.0/30.0, event);
                event.scenes.changeScene(this.isEnding ? "ending" : "game", event);
            });
        })

        this.difficultyParam = typeof(param) === "number" ? param : 0;
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
       
        return this.difficultyParam;
    }

}
