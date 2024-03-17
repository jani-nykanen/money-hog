import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Align, Bitmap, Canvas, Flip, Grid, TransformTarget } from "../gfx/interface.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
import { Background } from "./background.js";
import { Stats } from "./stats.js";
import { TransitionType } from "../core/transition.js";
import { RGBA } from "../math/rgba.js";
import { Vector } from "../math/vector.js";


const APPEAR_TIME : number = 45;
const GO_TIME : number = 60;

const SPEED_UP_WAIT : number = 90;
const SPEED_UP_INITIAL : number = 30;


export class Game implements Scene {


    private globalSpeed : number = 0.0;

    private goTimer : number = 0.0;
    private appearTimer : number = 0.0;
    private readyGoPhase : number = 0;

    private gameTimer : number = 0.0;

    private speedPhase : number = 0;
    private speedUpTimer : number = 0.0;

    private objects : ObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;

    private background : Background | undefined = undefined;

    private stats : Stats;

    private paused : boolean = false;


    constructor() {

        this.stats = new Stats(3);
    }


    private computeGlobalSpeedTarget(event : ProgramEvent) : number {

        const SPEED_UP_TIMES : number[] = [45, 120, 240, 420, 630];
        const BASE_SPEED : number = 0.5;
        const SPEED_ADD : number = 0.25;

        let i = 0
        for (let i = 0; i < SPEED_UP_TIMES.length; ++ i) {

            if (this.speedPhase < i + 1 &&
                this.gameTimer >= SPEED_UP_TIMES[i]*60) {

                this.speedPhase = i + 1;
                this.speedUpTimer = SPEED_UP_INITIAL + SPEED_UP_WAIT;

                break
            }
        }

        return BASE_SPEED + SPEED_ADD*this.speedPhase ;
    }   


    private updateGlobalTimer(event : ProgramEvent) : void {

        const TIMER_SPEED_UP : number = 1.0/120.0;
        const TIMER_SPEED_DEATH : number = 1.0/30.0;
        // const INITIAL_SPEED : number = 1.0;

        if (!this.objects.canControlPlayer() ||
            this.objects?.doesPlayerExist() !== true) // since "undefined" is not true
            return;

        if (this.objects?.isPlayerDying()) {

            this.globalSpeed = Math.max(0.0, this.globalSpeed - TIMER_SPEED_DEATH*event.tick);
            this.speedUpTimer = 0;
            return;
        }

        const target : number = this.computeGlobalSpeedTarget(event);

        if (this.globalSpeed < target) {

            this.globalSpeed += TIMER_SPEED_UP*event.tick;
            if (this.globalSpeed >= target) {

                this.globalSpeed = target;
            }
        }

        if (this.speedUpTimer > 0) {

            this.speedUpTimer -= event.tick;
        }
    }


    private updateReadyGo(event : ProgramEvent) : void {

        if (this.readyGoPhase == 2) {

            this.appearTimer = Math.min(APPEAR_TIME, this.appearTimer + event.tick);

            if (this.objects?.canControlPlayer()) {

                this.readyGoPhase = 1;
                this.goTimer = GO_TIME;
            }
        }
        else if (this.readyGoPhase == 1) {

            this.goTimer -= event.tick;
            if (this.goTimer <= 0.0) {

                this.readyGoPhase = 0;
            }
        }
    }


    private reset(event : ProgramEvent) : void {

        this.stats.reset();
        this.stage?.reset(this.stats, event);
        this.objects?.reset(this.stats, event);

        this.goTimer = 0.0;
        this.readyGoPhase = 2;
        this.appearTimer = 0.0;
        this.gameTimer = 0.0;

        this.speedUpTimer = 0;
        this.speedPhase = 0;

        event.transition.setCenter(new Vector(event.screenWidth/2, event.screenHeight/2));
    }


    private updateComponents(event : ProgramEvent) : void {

        const MAX_WEIGHT_TIME : number = 60*60*8;

        const weight : number = Math.min(1.0, this.gameTimer/MAX_WEIGHT_TIME);

        this.background?.update(event);
        this.stage?.update(weight, this.globalSpeed, this.stats, event);
        if (this.stage !== undefined) {

            this.objects?.update(weight, this.globalSpeed, this.stage, event);
        }
        this.stats.update(this.globalSpeed, event);
    }


    private drawBreakingHeart(canvas : Canvas, bmp : Bitmap | undefined,
        dx : number, dy : number, t : number) : void {

        if (t <= 0)
            return;

        const frame : number = Math.floor(2 + (1.0 - t)*4);

        canvas.drawBitmap(bmp, Flip.None, dx, dy, frame*16, 0, 16, 16);
    }


    private drawHUD(canvas : Canvas) : void {

        const HEART_OFFSET_X : number = -1;
        const HEART_EDGE_OFFSET : number = 2;
        const TINY_TEXT_OFFSET : number = 1;

        const bmpHUD : Bitmap | undefined = canvas.getBitmap("hud");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        // canvas.drawText(bmpFont, "Hello world?", 2, 2, 0, 0);

        // Transparent bar to make elements to stand out stronger
        canvas.setColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, canvas.width, 20);
        canvas.setColor();

        // Player lives
        for (let i = 0; i < this.stats.maxHealth; ++ i) {

            const sx : number = this.stats.getHealth() >= i + 1 ? 0 : 16;

            canvas.drawBitmap(bmpHUD, Flip.None, 
                HEART_EDGE_OFFSET + i*(16 + HEART_OFFSET_X), HEART_EDGE_OFFSET, 
                sx, 0, 16, 16);
        }
        this.drawBreakingHeart(canvas, bmpHUD, 
            HEART_EDGE_OFFSET + this.stats.getHealth()*(16 + HEART_OFFSET_X), 
            HEART_EDGE_OFFSET, 
            this.stats.getHealthUpdateTimer());

        // Score
        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width/2 - 16, TINY_TEXT_OFFSET, 
            0, 16, 32, 8);
        canvas.setColor(255, 255, 182);
        canvas.drawText(bmpFontOutlines, this.stats.shownScoreToString(7), 
            canvas.width/2, TINY_TEXT_OFFSET + 5, -8, 0, Align.Center);
        canvas.setColor();

        // Coins
        const coinStr : string = String(this.stats.getCoins());
        const coinX : number = canvas.width - 29 - coinStr.length*8;
        canvas.drawBitmap(bmpHUD, Flip.None, coinX, 2, 32, 16, 16, 16);
        canvas.drawText(bmpFontOutlines, "*", coinX + 13, 2, -8, 0, Align.Left);
        canvas.drawText(bmpFontOutlines, coinStr, 
            coinX + 22, 2, -8, 0, Align.Left);
    }


    private drawReadyGoText(canvas : Canvas) : void {

        const bmp : Bitmap | undefined = canvas.getBitmap("readygo");

        const dx : number = canvas.width/2 - ((bmp?.width ?? 0)/2);
        const dy : number = canvas.height/2 - ((bmp?.height ?? 0)/4) 

        if (this.readyGoPhase == 2) {

            if (this.appearTimer < APPEAR_TIME) {

                const t : number = 1.0 - this.appearTimer/APPEAR_TIME;
                canvas.drawFunnilyAppearingBitmap(bmp, Flip.None, dx, dy, 0, 0, 128, 48, t, 48, 4, 16);
                return;
            }
            canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, (2 - this.readyGoPhase)*48, 128, 48);

            return;
        }

        canvas.drawVerticallyWavingBitmap(bmp, dx, dy, 0, 48, 128, 48, Math.PI*4, 2, this.goTimer/GO_TIME*Math.PI*4);
    }


    private drawPauseScreen(canvas : Canvas) : void {

        canvas.setColor(0, 0, 0, 0.33);
        canvas.fillRect();

        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        canvas.setColor(255, 255, 73);
        canvas.drawText(bmpFontOutlines, "PAUSED", canvas.width/2, canvas.height/2 - 8, -7, 0, Align.Center);
        canvas.setColor();
    }


    private drawSpeedUpText(canvas : Canvas) : void {

        const YOFF_FACTOR : number = 0.25;

        if (this.speedUpTimer > SPEED_UP_WAIT &&
            Math.floor(this.speedUpTimer/4) % 2 != 0) {
            
            return;
        }

        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        const dx : number = canvas.width/2;
        const dy : number = Math.round(canvas.height*YOFF_FACTOR) - 8;

        canvas.setColor(219, 255, 0);
        canvas.drawText(bmpFontOutlines, "SPEED UP!", dx, dy, -8, 0, Align.Center);
        canvas.setColor();
    }

    
    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.stats.reset();

        this.stage = new Stage(this.stats, event);
        this.objects = new ObjectManager(this.stage, this.stats, event);
        this.background = new Background();

        this.globalSpeed = 0.0;

        this.readyGoPhase = 2;
        this.goTimer = 0;
        this.gameTimer = 0;
        this.appearTimer = 0;

        this.speedUpTimer = 0;
        this.speedPhase = 0;

        event.transition.activate(false, TransitionType.Circle, 1.0/30.0, event);
    }


    public update(event : ProgramEvent) : void {
        
        const pauseButton : InputState = event.input.getAction("pause");

        if (this.paused) {

            if (pauseButton == InputState.Pressed) {

                this.paused = false;
            }
            return;
        }

        if (!event.transition.isActive()) {

            if (this.readyGoPhase == 0 && 
                !this.objects.isPlayerDying() &&
                pauseButton == InputState.Pressed) {

                this.paused = true;
                return;
            }
        }

        this.gameTimer += event.tick;

        this.updateReadyGo(event);
        this.updateGlobalTimer(event);

        this.updateComponents(event);

        if (!this.objects.doesPlayerExist() && !event.transition.isActive()) {

            event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
                (event : ProgramEvent) => this.reset(event), new RGBA(0, 0, 0),
                this.objects.getPlayerPosition());
        }
    }


    public redraw(canvas : Canvas) : void {

        canvas.setColor();

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.applyTransform();    
        this.background?.draw(canvas);

        if (!this.paused) {

            this.objects.applyShake(canvas);
        }
        this.stage?.draw(canvas);
        this.objects?.draw(canvas);

        // Reset camera since shake is possibly applied
        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();   

        this.drawHUD(canvas);

        if (this.readyGoPhase > 0) {

            this.drawReadyGoText(canvas);
        }
        else if (this.paused) {

            this.drawPauseScreen(canvas);
        }
        else if (this.speedUpTimer > 0) {

            this.drawSpeedUpText(canvas);
        }
    }


    public dispose() : SceneParameter {
        
        return undefined;
    }
}
