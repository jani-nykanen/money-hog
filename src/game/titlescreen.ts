import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Align, Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { TextBox } from "../ui/textbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { ObjectManager } from "./objectmanager.js";
import { THEME_VOLUME } from "./volume.js";
import { getSFXText, getMusicText } from "./pause.js";


export class TitleScreen implements Scene {


    private menu : Menu | undefined = undefined;


    constructor() { }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.menu = new Menu([

            new MenuButton("Play Game", () => {

                event.audio.stopMusic();

                event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
                (event : ProgramEvent) => {

                    event.transition.deactivate();
                    event.transition.activate(false, TransitionType.Fade, 1.0/20.0, event);

                    event.scenes.changeScene("story", event);
                })
            }),


            new MenuButton(getSFXText(event),
                (event : ProgramEvent) => {

                    event.audio.toggleSFX();
                    this.menu?.changeButtonText(1, getSFXText(event));
                }),

            new MenuButton(getMusicText(event),
                (event : ProgramEvent) => {

                    if (event.audio.isMusicEnabled()) {

                        event.audio.pauseMusic();
                    }

                    event.audio.toggleMusic();
                    this.menu?.changeButtonText(2, getMusicText(event));

                    if (event.audio.isMusicEnabled()) {

                        event.audio.resumeMusic();
                    }
                })

        ], true);
    }


    public update(event : ProgramEvent) : void {

        if (event.transition.isActive())
            return;

        this.menu?.update(event);
    }


    public redraw(canvas : Canvas) : void {

        canvas.clear(146, 182, 255);

        this.menu?.draw(canvas, 0, 64);
    }


    public dispose() : SceneParameter {
       
        return undefined;
    }

}
