import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Align, Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { TextBox } from "../ui/textbox.js";
import { ControlsGuide } from "./controlsguide.js";
import { STORY_VOLUME } from "./volume.js";


const STORY_TEXT : string[][] = [
[
`Oh no, an evil 
witch has turned 
you, a completely 
normal human being, 
into a dirty pig!`,

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

    private controls : ControlsGuide;
    private controlsShown : boolean = false;
    private forceDrawControls : boolean = false;

    private witchWave : number = 0.0;


    constructor() {

        this.text = new TextBox();
        this.controls = new ControlsGuide();
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

            event.transition.activate(true, TransitionType.Fade, 1.0/20.0, event,
            (event : ProgramEvent) => {

                event.audio.stopMusic();

                if (!this.controlsShown) {

                    this.forceDrawControls = true;
                    this.controls.activate();
                    return;
                }
                this.transitionEvent(event);
            });
        })

        this.difficultyParam = typeof(param) === "number" ? param : 0;

        event.audio.fadeInMusic(event.assets.getSample("story"), STORY_VOLUME, 1000);
    }


    private transitionEvent(event : ProgramEvent) : void {

        event.transition.activate(false, 
            this.isEnding ? TransitionType.Fade : TransitionType.Circle, 
            this.isEnding ? 1.0/60.0 : 1.0/30.0, event);
        event.scenes.changeScene(this.isEnding ? "ending" : "game", event);
    }


    private drawSprites(canvas : Canvas, bmp : Bitmap | undefined, 
        dx : number, dy : number, phase : number) : void {

        const WITCH_AMPLITUDE : number = 4.0;

        // Pig
        canvas.drawBitmap(bmp, Flip.None, dx + 40, dy + 128 - 68, 0, phase*40, 40, 40);

        // Witch
        const offset : number = Math.round(Math.sin(this.witchWave)*WITCH_AMPLITUDE);
        canvas.drawBitmap(bmp, Flip.None, dx + 112, dy + 16 + offset, 40, phase*40, 40, 40);
    }


    public update(event : ProgramEvent) : void {

        const WITCH_WAVE_SPEED : number = Math.PI*2/120.0;

        if (event.transition.isActive())
            return;

        if (!this.controlsShown && this.controls.isActive()) {

            this.controls.update(event);
            if (!this.controls.isActive()) {

                this.controlsShown = true;

                event.transition.activate(true, TransitionType.Fade, 1.0/20.0, event,
                (event : ProgramEvent) : void => {

                    this.transitionEvent(event);
                    this.forceDrawControls = false;
                });
            }
            return;
        } 

        this.text.update(event);

        this.witchWave = (this.witchWave + WITCH_WAVE_SPEED*event.tick) % (Math.PI*2);
    }


    public redraw(canvas : Canvas) : void {

        canvas.clear(0, 0, 0);

        if (this.forceDrawControls) {

            this.controls.draw(canvas, false, this.forceDrawControls);
            return;
        }

        const bmpBackground : Bitmap | undefined = canvas.getBitmap("story_background");
        const bmpSprites : Bitmap | undefined = canvas.getBitmap("story_sprites");

        const dx : number = canvas.width/2 - (bmpBackground?.width ?? 0)/2;
        const dy : number = 16;

        canvas.drawBitmap(bmpBackground, Flip.None, dx, dy, 0, 0, 160, 128);
        this.drawSprites(canvas, bmpSprites, dx, dy, Number(this.isEnding));
        
        this.text.draw(canvas, 0, 64, 4, false, true);
    }


    public dispose() : SceneParameter {
       
        return this.difficultyParam;
    }

}
