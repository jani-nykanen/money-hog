import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { TransitionType } from "../core/transition.js";
import { Canvas } from "../gfx/interface.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";
import { ControlsGuide } from "./controlsguide.js";
import { ObjectManager } from "./objectmanager.js";
import { THEME_VOLUME } from "./volume.js";


export const getSFXText = (event : ProgramEvent) : string => "Sound: " + (Number(event.audio.isSFXEnabled()) ? "On " : "Off");
export const getMusicText = (event : ProgramEvent) : string => "Music: " + (Number(event.audio.isMusicEnabled()) ? "On " : "Off");


export class Pause {


    private menu : Menu;
    private controls : ControlsGuide;

    private wasInvincibilityThemePlaying : boolean = false;


    constructor(restartEvent : (event : ProgramEvent) => void, event : ProgramEvent) {

        this.controls = new ControlsGuide();

        this.menu = new Menu([

            new MenuButton("Resume", (event : ProgramEvent) : void => {

                this.resumeMusic(event);
                this.menu.deactivate();
            }),

            new MenuButton("Restart", (event : ProgramEvent) : void => {

                this.menu.deactivate();
                event.audio.resumeMusic();
                restartEvent(event);
            }),

            new MenuButton(getSFXText(event),
            (event : ProgramEvent) : void => {

                event.audio.toggleSFX();
                this.menu.changeButtonText(2, getSFXText(event));
            }),

            new MenuButton(getMusicText(event),
            (event : ProgramEvent) : void => {

                event.audio.toggleMusic();
                this.menu.changeButtonText(3, getMusicText(event));

                if (this.wasInvincibilityThemePlaying && event.audio.isMusicEnabled()) {

                    event.audio.stopMusic();
                    event.audio.playMusic(event.assets.getSample("theme"), THEME_VOLUME);
                    event.audio.pauseMusic();

                    this.wasInvincibilityThemePlaying = false;
                }
            }),


            new MenuButton("Controls", 
                (event : ProgramEvent) : void => {

                this.controls.activate();
            }),


            new MenuButton("Main Menu", 
                (event : ProgramEvent) : void => {

                event.audio.stopMusic();
                event.transition.activate(true, TransitionType.Fade, 1.0/20.0, event,
                    (event : ProgramEvent) => {

                        event.scenes.changeScene("title", event);
                    });
                this.menu.deactivate();
            }),

        ], false);
    }


    private resumeMusic(event : ProgramEvent) : void {

        if (!event.audio.resumeMusic() && event.audio.isMusicEnabled()) {

            event.audio.playMusic(event.assets.getSample("theme"), THEME_VOLUME);
        }
    }


    public toggle(state : boolean) : void {

        if (state) {

            this.menu.activate(0);
            return;
        }
        
        this.menu.deactivate();
    }


    public isActive = () : boolean => this.menu.isActive();


    public update(objects : ObjectManager | undefined, event : ProgramEvent) : boolean {

        if (!this.menu.isActive()) {

            if (event.input.getAction("pause") == InputState.Pressed) {

                if (objects?.isPlayerInvincible() && event.audio.isMusicEnabled()) {

                    this.wasInvincibilityThemePlaying = true;
                }

                event.audio.playSample(event.assets.getSample("pause"), 0.50);
                event.audio.pauseMusic();

                this.menu.activate(0);
                return true;
            }
            else {

                return false;
            }
        }

        if (this.controls.isActive()) {

            this.controls.update(event);
            return true;
        }

        if (event.input.getAction("back") == InputState.Pressed ||
                event.input.getAction("back2") == InputState.Pressed) {

            this.menu.deactivate();
            event.audio.playSample(event.assets.getSample("reject"), 0.60);

            this.resumeMusic(event);

            return false;
        }

        this.menu.update(event);

        return true;
    }


    public draw(canvas : Canvas) : void {

        canvas.setColor(0, 0, 0, 0.67);
        canvas.fillRect();
        canvas.setColor();

        if (this.controls.isActive()) {

            this.controls.draw(canvas, true);
            return;
        }

        this.menu.draw(canvas);
    }
}
