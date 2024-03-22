import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Align, Bitmap, Canvas, Flip } from "../gfx/interface.js";
import { TextBox } from "../ui/textbox.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { ObjectManager } from "./objectmanager.js";
import { MENU_VOLUME, THEME_VOLUME } from "./volume.js";
import { getSFXText, getMusicText } from "./pause.js";


export class TitleScreen implements Scene {


    private menu : Menu | undefined = undefined;

    private gameMode : number = 0;


    constructor() { }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.menu = new Menu([

            new MenuButton("Normal Game", () => {

                event.audio.stopMusic();

                event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
                (event : ProgramEvent) => {

                    event.transition.deactivate();
                    event.transition.activate(false, TransitionType.Fade, 1.0/20.0, event);

                    this.gameMode = 0;

                    event.scenes.changeScene("story", event);
                })
            }),


            new MenuButton("Impossible Game", () => {
                
                event.audio.stopMusic();

                event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
                (event : ProgramEvent) => {

                    event.transition.deactivate();
                    event.transition.activate(false, TransitionType.Fade, 1.0/20.0, event);

                    this.gameMode = 1;

                    event.scenes.changeScene("story", event);
                })
            }),


            new MenuButton("Controls",
                (event : ProgramEvent) => {

                    event.audio.playSample(event.assets.getSample("reject"), 0.60);
                }),


            new MenuButton(getSFXText(event),
                (event : ProgramEvent) => {

                    event.audio.toggleSFX();
                    this.menu?.changeButtonText(3, getSFXText(event));
                }),

            new MenuButton(getMusicText(event),
                (event : ProgramEvent) => {

                    if (event.audio.isMusicEnabled()) {

                        event.audio.pauseMusic();
                    }

                    event.audio.toggleMusic();
                    this.menu?.changeButtonText(4, getMusicText(event));

                    if (event.audio.isMusicEnabled()) {

                        if (!event.audio.resumeMusic()) {

                            event.audio.fadeInMusic(event.assets.getSample("menu"), MENU_VOLUME, 1000);
                        }
                    }
                })

        ], true);

        event.audio.fadeInMusic(event.assets.getSample("menu"), MENU_VOLUME, 1000);
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
       
        return this.gameMode;
    }

}
