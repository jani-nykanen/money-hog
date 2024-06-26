import { AudioPlayer } from "../audio/audioplayer.js";
import { Bitmap, Canvas, Grid, Renderer } from "../gfx/interface.js";
import { Assets } from "./assets.js";
import { Input } from "./input.js";
import { SceneManager } from "./scenemanager.js";
import { Transition } from "./transition.js";
import { Localization } from "./localization.js";
 

export class ProgramEvent {


    private localizations : Map<string, Localization>;
    private activeLocalization : Localization | undefined = undefined;


    public readonly input : Input;
    public readonly audio : AudioPlayer;
    public readonly assets : Assets;
    public readonly transition : Transition;
    public readonly scenes : SceneManager;

    public readonly tick : number = 1.0;

    private readonly renderer : Renderer;


    public get screenWidth() : number {

        return this.renderer.canvasWidth;
    }


    public get screenHeight() : number {

        return this.renderer.canvasHeight;
    }


    public get localization() : Localization | undefined {
        
        return this.activeLocalization;
    }


    constructor(ctx : AudioContext, renderer : Renderer) {

        this.input = new Input();
        this.audio = new AudioPlayer(ctx, 0.60);
        this.assets = new Assets(this.audio, renderer);
        this.transition = new Transition();
        this.scenes = new SceneManager();

        this.renderer = renderer;

        this.localizations = new Map<string, Localization> ();

        renderer.setFetchBitmapCallback((name : string) => this.assets.getBitmap(name));
    }


    public addLocalizationJSON(key : string, jsonString : string) : void {

        this.localizations.set(key, new Localization(jsonString));
    }


    public setActiveLocalization(key : string) : void {

        this.activeLocalization = this.localizations.get(key);
    }


    public cloneCanvasToBufferTexture(forceRedraw : boolean = false) : void {

        if (forceRedraw) {

            this.renderer.drawToCanvas((canvas : Canvas) : void => {

                this.scenes.redraw(canvas);
            });
        }
        this.renderer.cloneCanvasToBufferBitmap();
    }


    public createBitmapFromPixelData(pixels : Uint8Array, width : number, height : number) : Bitmap {

        return this.renderer.createBitmapFromPixelData(pixels, width, height);
    }


    public createGrid(layers : number[][], width : number, height : number, flatten : boolean = false) : Grid {

        return this.renderer.createGrid(layers, width, height, flatten);
    }
}
