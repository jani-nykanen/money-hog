import { ProgramEvent } from "../core/event.js";
import { clamp } from "../math/utility.js";


export class Stats {


    private health : number;
    private bonus : number = 0;
    private score : number = 0;

    private healthUpdateTimer : number = 0.0;
    private bonusUpdateTimer : number = 0.0;

    private scoreTimer : number = 0;

    public readonly maxHealth : number;


    constructor(maxHealth : number = 3) {

        this.health = maxHealth;
        this.maxHealth = maxHealth;
    }


    public changeLives(change : number) : void {

        this.health = clamp(this.health + change, 0, this.maxHealth);

        if (change < 0) {

            this.healthUpdateTimer = 1.0;
        }
    }


    public increaseBonus(count : number = 1) : void {

        this.bonus += count;

        this.bonusUpdateTimer = 1.0;
    }


    public addPoints(amount : number) : void {

        this.score += Math.floor(amount*(1.0 + this.bonus/10.0));
    }


    public reset() : void {

        this.health = this.maxHealth;
        this.bonus = 0;
        this.score = 0;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        const SCORE_TIME : number = 10;
        const BASE_SCORE : number = 10;
        
        const UPDATE_TIMER_SPEED : number = 1.0/20.0;

        this.scoreTimer += globalSpeedFactor*event.tick;
        if (this.scoreTimer >= SCORE_TIME) {

            this.scoreTimer %= SCORE_TIME;
            this.addPoints(BASE_SCORE);
        }

        if (this.healthUpdateTimer > 0.0) {

            this.healthUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }

        if (this.bonusUpdateTimer > 0.0) {

            this.bonusUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }
    }


    public getHealth = () : number => this.health;
    public getBonus = () : number => this.bonus;
    public getScore = () : number => this.score;

    public getHealthUpdateTimer = () : number => Math.max(0.0, this.healthUpdateTimer);
    public getBonusUpdateTimer = () : number => Math.max(0.0, this.bonusUpdateTimer);


    public bonusToString() : string {

        // Converting a float to string never plays nicely

        const base : string = String(this.bonus + 10);
        const len : number = base.length;

        return base.slice(0, len - 1) + "." + base.slice(len - 1, len);
    }


    public scoreToString(maxLength : number) : string {

        const base : string = String(this.score);

        return "0".repeat(maxLength - base.length) + base;
    }
}
