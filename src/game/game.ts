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
import { fetchRecordScore, setRecordScore } from "./record.js";
import { THEME_VOLUME } from "./volume.js";
import { Pause } from "./pause.js";
import { Difficulty } from "./difficulty.js";


const APPEAR_TIME : number = 40;
const GO_TIME : number = 60;
const ENDING_TIME : number = 90;
const GAMEOVER_APPEAR_TIME : number = 30;

const SPEED_UP_WAIT : number = 90;
const SPEED_UP_INITIAL : number = 30;

const MAX_WEIGHT_TIME : number[] = [60*60*7, 60*60*6];

const SPEED_UP_TIMES : number[][] = [

    [45, 120, 240, 360, 540],
    [30, 90,  210, 360, 540]
];



export class Game implements Scene {


    private difficulty : Difficulty = Difficulty.Normal;

    private globalSpeed : number = 0.0;

    private goTimer : number = 0.0;
    private appearTimer : number = 0.0;
    private endingTimer : number = 0;
    private readyGoPhase : number = 0;

    private gameTimer : number = 0.0;

    private speedPhase : number = 0;
    private speedUpTimer : number = 0.0;

    private objects : ObjectManager | undefined = undefined;
    private stage : Stage | undefined = undefined;

    private background : Background | undefined = undefined;

    private stats : Stats;

    private pause : Pause | undefined = undefined;

    private gameoverPhase : number = 0;
    private gameoverAppearTimer : number = 0.0;
    private gameoverWave : number = 0.0;

    private recordScore : number = 0;
    private targetScore : number = 0;


    constructor() {

        this.stats = new Stats(3);

        this.recordScore = fetchRecordScore();
    }


    private computeGlobalSpeedTarget(event : ProgramEvent) : number {

        const BASE_SPEED : number = 0.5;
        const SPEED_ADD : number = 0.25;

        for (let i = 0; i < SPEED_UP_TIMES.length; ++ i) {

            if (this.speedPhase < i + 1 &&
                this.gameTimer >= SPEED_UP_TIMES[this.difficulty][i]*60) {

                this.speedPhase = i + 1;
                this.speedUpTimer = SPEED_UP_INITIAL + SPEED_UP_WAIT;

                event.audio.playSample(event.assets.getSample("speedup"), 0.50);

                break
            }
        }

        return BASE_SPEED + SPEED_ADD*this.speedPhase ;
    }   


    private updateGlobalTimer(event : ProgramEvent) : void {

        const TIMER_SPEED_UP : number = 1.0/120.0;
        const TIMER_SPEED_DEATH : number = 1.0/30.0;
        // const INITIAL_SPEED : number = 1.0;

        if (this.readyGoPhase != 0)
            return;

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

        if (event.transition.isActive())
            return;

        // Needed in the beginning
        if (this.readyGoPhase == 3) {

            this.readyGoPhase = 2;
        }

        if (this.readyGoPhase == 2) {

            if (this.appearTimer < APPEAR_TIME) {

                this.appearTimer += event.tick;
                if (this.appearTimer >= APPEAR_TIME) {

                    this.appearTimer = APPEAR_TIME;
                    event.audio.playSample(event.assets.getSample("ready"), 0.50); 
                }
            }

            if (this.objects?.canControlPlayer()) {

                this.readyGoPhase = 1;
                this.goTimer = GO_TIME;

                event.audio.playSample(event.assets.getSample("go"), 0.50); 
            }
        }
        else if (this.readyGoPhase == 1) {

            this.goTimer -= event.tick;
            if (this.goTimer <= 0.0) {

                this.readyGoPhase = 0;

                event.audio.fadeInMusic(event.assets.getSample("theme"), THEME_VOLUME, 1000);
            }
        }
    }


    private reset(event : ProgramEvent) : void {

        this.stats.reset();
        this.stage?.reset(this.stats, event);
        this.objects?.reset(this.difficulty, this.stats, event);

        this.goTimer = 0.0;
        this.readyGoPhase = 3;
        this.appearTimer = 0.0;
        this.gameTimer = 0.0;

        this.speedUpTimer = 0;
        this.speedPhase = 0;

        this.gameoverPhase = 0;
        this.gameoverWave = 0;

        event.transition.setCenter(new Vector(event.screenWidth/2, event.screenHeight/2));
    }


    private updateComponents(event : ProgramEvent) : void {

        const weight : number = Math.min(1.0, this.gameTimer/MAX_WEIGHT_TIME[this.difficulty]);

        this.background?.update(event);
        this.stage?.update(this.difficulty, weight, this.globalSpeed, this.stats, event);
        if (this.stage !== undefined) {

            this.objects?.update(this.difficulty, weight, this.globalSpeed, this.stage, event);
        }
        this.stats.update(this.globalSpeed, event);
    }


    private updateGameover(event : ProgramEvent) : void {

        const WAVE_SPEED : number = Math.PI*2/90.0;
        const TEXT_APPEAR_SPEED : number = 1.0/60.0;

        if (event.transition.isActive())
            return;

        if (this.gameoverPhase == 0 && 
            !this.objects.doesPlayerExist()) {

            this.gameoverPhase = 1;
            this.gameoverWave = 0.0;
            this.appearTimer = 0.0;
            this.gameoverAppearTimer = GAMEOVER_APPEAR_TIME;

            const points : number = this.stats.getShownScore();
            if (points > this.recordScore) {

                this.recordScore = points;
                setRecordScore(points);
            }
        }

        if (this.gameoverPhase == 0)
            return;

        if (this.gameoverAppearTimer > 0) {

            this.gameoverAppearTimer -= event.tick;
        }
        else {

            // Reusing this for "press any key" text, since, well, it is also "appearing"!
            this.appearTimer = (this.appearTimer + TEXT_APPEAR_SPEED*event.tick) % 1.0;
        }
        this.gameoverWave = (this.gameoverWave + WAVE_SPEED*event.tick) % (Math.PI*2);
        
        if (this.gameoverAppearTimer <= 0 &&
            event.input.isAnyPressed()) {

            event.audio.playSample(event.assets.getSample("select"), 0.50);

            this.appearTimer = 1.0;

            event.transition.activate(true, TransitionType.Circle, 1.0/30.0, event,
                (event : ProgramEvent) => this.reset(event), new RGBA(0, 0, 0));
                //this.objects.getPlayerPosition());
        }
    }


    // Note: not really ending, but the sequence that takes you
    // to the ending
    private updateEnding(event : ProgramEvent) : boolean {

        if (this.endingTimer > 0) {

            this.endingTimer -= event.tick;
            if (this.endingTimer <= 0.0) {

                event.transition.activate(true, TransitionType.Waves, 1.0/120.0, event,
                    (event : ProgramEvent) => {

                        event.transition.activate(false, TransitionType.Fade, 1.0/20.0, event, 
                            () => {}, new RGBA(255, 255, 255));
                        event.scenes.changeScene("story", event);
                    }, new RGBA(255, 255, 255));
            }
            return true;
        }

        if (this.stats.cap(this.targetScore)) {

            this.endingTimer = ENDING_TIME;

            event.audio.stopMusic();
            event.audio.playSample(event.assets.getSample("finish"), 0.50);

            return true;
        }

        return false;
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
        const MONEY_OFFSET_X : number = -8;
        const BONUS_TEXT_OFFSET_X : number = -44;

        const bmpHUD : Bitmap | undefined = canvas.getBitmap("hud");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");
        // const bmpFontTiny : Bitmap | undefined = canvas.getBitmap("font_tiny");

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

        // Money
        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width/2 - 16 + MONEY_OFFSET_X, TINY_TEXT_OFFSET, 
            0, 16, 32, 8);

        if (this.endingTimer <= 0 || Math.floor(this.endingTimer/4) % 2 == 0) {

            canvas.setColor(255, 255, 182);
            canvas.drawText(bmpFontOutlines, this.stats.shownScoreToString(7), 
                canvas.width/2 + MONEY_OFFSET_X, TINY_TEXT_OFFSET + 5, -8, 0, Align.Center);
            canvas.setColor();
        }

        // Coins
        /*
        const coinStr : string = String(this.stats.getCoins());
        const coinX : number = canvas.width + COIN_OFFSET_X - coinStr.length*8;
        canvas.drawBitmap(bmpHUD, Flip.None, coinX, 2, 32, 16, 16, 16);
        canvas.drawText(bmpFontOutlines, "*", coinX + 13, COIN_TEXT_Y, -8, 0, Align.Left);
        canvas.drawText(bmpFontOutlines, coinStr, 
            coinX + 22, COIN_TEXT_Y, -8, 0, Align.Left);
        */

        // Coin bonus
        // const bonusStr : string = "+" + String(this.stats.getCoins()*10) + "%";
        // canvas.drawText(bmpFontTiny, bonusStr, canvas.width - 2, 12, -2, 0, Align.Right);

        canvas.drawBitmap(bmpHUD, Flip.None, 
            canvas.width  + BONUS_TEXT_OFFSET_X, TINY_TEXT_OFFSET, 
            0, 24, 32, 8);

        canvas.drawBitmap(bmpHUD, Flip.None, canvas.width + BONUS_TEXT_OFFSET_X - 16, 2, 32, 16, 16, 16);

        const bonusStr : string = "+" + String(this.stats.getShownCoinBonus()) + "%";
        canvas.setColor(182, 255, 0);
        canvas.drawText(bmpFontOutlines, bonusStr, 
                canvas.width + BONUS_TEXT_OFFSET_X + 16, TINY_TEXT_OFFSET + 5, 
                -8, 0, Align.Center);    
        canvas.setColor();
    }


    private drawReadyGoText(canvas : Canvas) : void {

        const bmp : Bitmap | undefined = canvas.getBitmap("readygo");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        const dx : number = canvas.width/2 - ((bmp?.width ?? 0)/2);
        const dy : number = canvas.height/2 - ((bmp?.height ?? 0)/4); 

        if (this.readyGoPhase != 1 || 
            this.goTimer >= GO_TIME/2 || 
            Math.floor(this.goTimer/4) % 2 == 0) {

            canvas.setColor(182, 255, 0);
            canvas.drawText(bmpFontOutlines, "GOAL: $" + String(this.targetScore), canvas.width/2, 24, -8, 0, Align.Center);
            canvas.setColor();
        }

        if (this.readyGoPhase == 2) {

            if (this.appearTimer < APPEAR_TIME) {

                const t : number = 1.0 - this.appearTimer/APPEAR_TIME;
                canvas.drawFunnilyAppearingBitmap(bmp, Flip.None, dx, dy, 0, 0, 128, 48, t, 48, 4, 8);
                return;
            }
            canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, (2 - this.readyGoPhase)*48, 128, 48);

            return;
        }

        canvas.drawVerticallyWavingBitmap(bmp, dx, dy, 0, 48, 128, 48, Math.PI*4, 2, this.goTimer/GO_TIME*Math.PI*4);
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


    private drawGameOver(canvas : Canvas) : void {

        const TOP_OFFSET : number = 48;
        const DARKEN_ALPHA : number = 0.67;

        if (this.gameoverPhase == 0)
            return;

        const bmp : Bitmap | undefined = canvas.getBitmap("gameover");
        const bmpFontOutlines : Bitmap | undefined = canvas.getBitmap("font_outlines");

        const dx : number = canvas.width/2 - ((bmp?.width ?? 0)/2);
        const dy : number = TOP_OFFSET;

        const t : number = this.gameoverAppearTimer/GAMEOVER_APPEAR_TIME;

        canvas.setColor(0, 0, 0, (1.0 - t)*DARKEN_ALPHA);
        canvas.fillRect();

        canvas.setColor();
        canvas.drawVerticallyWavingBitmap(bmp, 
            dx, dy - Math.round(128*t), 
            0, 0, 144, 32, 
            Math.PI*4, 3, this.gameoverWave);

        const moneyPos : number = 112;
        const recordPos : number = 160;

        const textShift : number = Math.round(t*canvas.width);

        // Headers
        canvas.setColor(255, 255, 146);
        canvas.drawText(bmpFontOutlines, "MONEY:", canvas.width/2 - textShift, moneyPos, -8, 0, Align.Center);
        canvas.drawText(bmpFontOutlines, "RECORD:", canvas.width/2 + textShift, recordPos, -8, 0, Align.Center);

        // Numbers
        canvas.setColor();
        canvas.drawText(bmpFontOutlines,
             "$" + String(this.stats.getShownScore()) + "/" + String(this.targetScore) ,
              canvas.width/2 - textShift, moneyPos + 12, -8, 0, Align.Center);
        canvas.drawText(bmpFontOutlines, 
            "(" + String(Math.floor(100*this.stats.getShownScore()/this.targetScore)) + "%" + ")",
            canvas.width/2 - textShift, moneyPos + 24, -8, 0, Align.Center);

        canvas.drawText(bmpFontOutlines, "$" + String(this.recordScore), 
            canvas.width/2 + textShift, recordPos + 12, -8, 0, Align.Center);

        if (this.appearTimer < 0.5 && 
            this.gameoverAppearTimer <= 0) {

            canvas.setColor(182, 255, 0);
            canvas.drawText(bmpFontOutlines, "Press Any Key to Retry", canvas.width/2, 208, -9, 0, Align.Center);
            canvas.setColor();
        }
        
    }

    
    public init(param : SceneParameter, event : ProgramEvent) : void {

        this.stats.reset();

        this.stage = new Stage(this.stats, event);
        this.objects = new ObjectManager(this.difficulty, this.stage, this.stats, event);
        this.background = new Background();

        this.pause = new Pause((event : ProgramEvent) => this.objects.killPlayer(event), event);

        this.globalSpeed = 0.0;

        this.readyGoPhase = 3;
        this.goTimer = 0;
        this.gameTimer = 0;
        this.appearTimer = 0;
        this.endingTimer = 0;

        this.speedUpTimer = 0;
        this.speedPhase = 0;

        // event.transition.activate(false, TransitionType.Circle, 1.0/30.0, event);

        this.difficulty = (param ?? 0) as Difficulty;
        this.targetScore = (param === 1) ? 9999999 : 1000000;
    }


    public update(event : ProgramEvent) : void {
        
        if (event.transition.isActive() && event.transition.isFadingOut())
            return;

        if (this.updateEnding(event)) {

            return;
        }

        if (this.gameoverPhase == 1) {

            this.updateGameover(event);
            return;
        }

        if (!event.transition.isActive() && 
            this.readyGoPhase == 0 &&
            !this.objects?.isPlayerDying() &&
            this.pause?.update(this.objects, event)) {

            return;
        }

        this.gameTimer += event.tick;

        this.updateReadyGo(event);
        this.updateGlobalTimer(event);
        this.updateComponents(event);
        this.updateGameover(event);
    }


    public redraw(canvas : Canvas) : void {

        canvas.setColor();

        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();

        canvas.transform.setTarget(TransformTarget.Camera);
        canvas.transform.view(canvas.width, canvas.height);

        canvas.applyTransform();    
        this.background?.draw(canvas);

        if (!this.pause.isActive()) {

            this.objects.applyShake(canvas);
        }
        this.stage?.draw(canvas);
        this.objects?.draw(canvas);

        // Reset camera since shake is possibly applied
        canvas.transform.setTarget(TransformTarget.Model);
        canvas.transform.loadIdentity();
        canvas.applyTransform();   

        if (this.gameoverPhase != 1) {

            this.drawHUD(canvas);
        }

        if (this.readyGoPhase > 0 && this.readyGoPhase < 3) {

            this.drawReadyGoText(canvas);
        }
        else if (this.pause.isActive()) {

            this.pause.draw(canvas);
        }
        else if (this.speedUpTimer > 0) {

            this.drawSpeedUpText(canvas);
        }

        this.drawGameOver(canvas);
    }


    public dispose() : SceneParameter {
        
        return 2 + this.difficulty;
    }
}
