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
import { Background } from "./background.js";
import { ControlsGuide } from "./controlsguide.js";


const PRESS_ENTER_TIME : number = 60;


export class TitleScreen implements Scene {


    private menu : Menu | undefined = undefined;
    private difficultyMenu : Menu | undefined = undefined;

    private gameMode : number = 0;

    private titlePhase : number = 0;
    private pressEnterTimer : number = PRESS_ENTER_TIME - 1;
    private logoWave : number = 0.0;

    private controls : ControlsGuide;

    private background : Background;


    constructor() { 

        this.background = new Background();
        this.controls = new ControlsGuide();
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.menu = new Menu([

            new MenuButton("Play Game", () => {

                this.menu.deactivate();
                this.difficultyMenu.activate(0);
            }),


            new MenuButton("Controls",
                (event : ProgramEvent) => {

                    this.controls.activate();
                }),


            new MenuButton(getSFXText(event),
                (event : ProgramEvent) => {

                    event.audio.toggleSFX();
                    this.menu?.changeButtonText(2, getSFXText(event));
                }),

            new MenuButton(getMusicText(event),
                (event : ProgramEvent) => {

                    if (event.audio.isMusicEnabled()) {

                        event.audio.pauseMusic();
                    }

                    event.audio.toggleMusic();
                    this.menu?.changeButtonText(3, getMusicText(event));

                    if (event.audio.isMusicEnabled()) {

                        if (!event.audio.resumeMusic()) {

                            event.audio.fadeInMusic(event.assets.getSample("menu"), MENU_VOLUME, 1000);
                        }
                    }
                })

        ], param !== undefined);
        

        this.difficultyMenu = new Menu([
            new MenuButton("Normal", 
                (event : ProgramEvent) : void => {

                    this.goToGame(0, event);
                }
            ),

            new MenuButton("Impossible", 
                (event : ProgramEvent) : void => {
                    
                    this.goToGame(1, event);
                }
            ),


            new MenuButton("Back", 
                (event : ProgramEvent) : void => {

                    this.difficultyMenu.deactivate();
                    this.menu.activate(0);
                } 
            )
        ]);


        event.audio.fadeInMusic(event.assets.getSample("menu"), MENU_VOLUME, 1000);
    }


    private goToGame(difficulty : number, event : ProgramEvent) : void {

        event.audio.stopMusic();

        event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
            (event : ProgramEvent) => {

            event.transition.deactivate();
            event.transition.activate(false, TransitionType.Fade, 1.0/20.0, event);

            this.gameMode = difficulty;

            event.scenes.changeScene("story", event);
        });
    }


    public update(event : ProgramEvent) : void {

        const LOGO_WAVE_SPEED : number = Math.PI*2/90.0;

        this.background.update(event);

        this.logoWave = (this.logoWave + LOGO_WAVE_SPEED*event.tick) % (Math.PI*2);

        if (event.transition.isActive())
            return;

        if (this.controls.isActive()) {

            this.controls.update(event);
            return;
        }

        if (this.titlePhase == 0) {

            this.pressEnterTimer = (this.pressEnterTimer + 1) % PRESS_ENTER_TIME;

            if (event.input.getAction("select") == InputState.Pressed) {

                this.titlePhase = 1;
                event.audio.playSample(event.assets.getSample("pause"), 0.50);

                this.menu?.activate(0);
            }
            return;
        }

        // To avoid "double activation", we need to avoid
        // calling both functions the same time, thus the
        // "unnecessary" if statements
        if (this.menu?.isActive()) {

            this.menu?.update(event);
        }
        else if (this.difficultyMenu?.isActive()) {

            if (event.input.getAction("back") == InputState.Pressed ||
                event.input.getAction("back2") == InputState.Pressed) {

                this.difficultyMenu?.deactivate();
                this.menu?.activate(0);

                event.audio.playSample(event.assets.getSample("reject"), 0.60);

                return;
            }

            this.difficultyMenu?.update(event);
        }
    }


    public redraw(canvas : Canvas) : void {

        const bmpOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");
        const bmpFont : Bitmap | undefined = canvas.getBitmap("font");
        const bmpLogo : Bitmap | undefined = canvas.getBitmap("logo");

        // canvas.clear(146, 182, 255);
        this.background.draw(canvas);
        
        // Logo
        canvas.drawVerticallyWavingBitmap(bmpLogo, canvas.width/2 - (bmpLogo?.width ?? 0)/2, 32, 0, 0, 160, 112, Math.PI*4, 4, this.logoWave);

        canvas.setColor(0, 0, 0);
        canvas.drawText(bmpFont, "*2024 Jani Nyk@nen", 
                    canvas.width/2, canvas.height - 10, 0, 0, Align.Center);
        canvas.setColor();

        if (this.titlePhase == 0) {

            if (this.pressEnterTimer < PRESS_ENTER_TIME/2) {

                canvas.setColor(182, 255, 0);
                canvas.drawText(bmpOutlines, "Press Enter to Start", 
                    canvas.width/2, canvas.height - 64, -8, 0, Align.Center);
                canvas.setColor();
            }
            return;
        }

        if (this.controls.isActive()) {

            this.controls.draw(canvas, true);
            return;
        }

        this.menu?.draw(canvas, 0, 64);
        this.difficultyMenu?.draw(canvas, 0, 64);

        if (this.difficultyMenu?.isActive()) {

            
            canvas.setColor(255, 255, 146);
            canvas.drawText(bmpOutlines, "Choose difficulty:", canvas.width/2, 152, -8, 0, Align.Center);
            canvas.setColor();
        }
    }


    public dispose() : SceneParameter {
       
        return this.gameMode;
    }

}
