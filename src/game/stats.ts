import { ProgramEvent } from "../core/event.js";
import { clamp } from "../math/utility.js";


export class Stats {


    private health : number;
    private coins : number = 0;
    private bonus : number = 0;
    private shownPoints : number = 0;
    private pointsAddSpeed : number = 0;
    private score : number = 0;

    private healthUpdateTimer : number = 0.0;
    private bonusUpdateTimer : number = 0.0;

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


    public increaseBonus() : void {

        if (this.bonus == 0) {

            this.bonus = 10;
        }
        else if (this.bonus >= 10 && this.bonus < 20) {

            this.bonus += 5;
        }
        else if (this.bonus >= 20 && this.bonus < 30) {

            this.bonus += 2;
        }
        else {

            this.bonus += 1;
        }

        this.bonusUpdateTimer = 1.0;
    }


    public resetBonus() : void {

        this.bonus = 0;
    }


    public addPoints(base : number) : number {

        const ADDITION_FACTOR : number = 50;

        const v : number =  Math.floor(
            base*(10 + this.coins)*(1 + Math.max(0, (this.bonus - 10)/10.0 ))
        );
        this.score += v;

        this.pointsAddSpeed = Math.ceil((this.score - this.shownPoints) / ADDITION_FACTOR);

        return v;
    }


    public addCoins(count : number) : void {

        this.coins += count;
    }


    public reset() : void {

        this.health = this.maxHealth;
        this.bonus = 0;
        this.score = 0;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        const UPDATE_TIMER_SPEED : number = 1.0/20.0;

        if (this.healthUpdateTimer > 0.0) {

            this.healthUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }

        if (this.bonusUpdateTimer > 0.0) {

            this.bonusUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }

        if (this.shownPoints < this.score) {

            this.shownPoints += this.pointsAddSpeed*event.tick;
            this.shownPoints |= 0;

            if (this.shownPoints >= this.score) {

                this.shownPoints = this.score;
            }
        }
    }


    public getHealth = () : number => this.health;
    public getBonus = () : number => this.bonus;
    public getScore = () : number => this.score;
    public getShownScore = () : number => Math.round(this.shownPoints);
    public getCoins = () : number => this.coins;

    public getHealthUpdateTimer = () : number => Math.max(0.0, this.healthUpdateTimer);
    public getBonusUpdateTimer = () : number => Math.max(0.0, this.bonusUpdateTimer);


    public bonusToString() : string {

        // Converting a float to string never plays nicely

        const base : string = String(this.bonus);
        const len : number = base.length;

        return base.slice(0, len - 1) + "." + base.slice(len - 1, len);
    }


    public scoreToString(maxLength : number) : string {

        const base : string = String(this.score);

        return "0".repeat(maxLength - base.length) + base;
    }


    public shownScoreToString(maxLength : number) : string {

        // TODO: Generic method for this and above?
        const base : string = String(this.shownPoints);

        return "0".repeat(maxLength - base.length) + base;
    }
}
