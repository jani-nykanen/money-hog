import { ProgramEvent } from "../core/event.js";
import { clamp, negMod } from "../math/utility.js";



const updateIncreasingNumberThing = (v : number, target : number, speed : number) : number => {

    if (v < target) {

        v = (v + speed) | 0;
        if (v >= target) {

            v = target;
        }
    }
    return v;
}


export class Stats {


    private health : number;
    private coins : number = 0;
    private coinBonus : number = 0; // TODO: Redundant, can be computed from coins easily
    private bonus : number = 0;
    private shownPoints : number = 0;
    private shownCoinBonus : number = 0;
    private pointsAddSpeed : number = 0;
    private coinBonusAddSpeed : number = 0;
    private score : number = 0;

    private healthUpdateTimer : number = 0.0;
    private bonusUpdateTimer : number = 0.0;

    public readonly maxHealth : number;


    constructor(maxHealth : number = 3) {

        this.health = maxHealth;
        this.maxHealth = maxHealth;
    }


    // TODO: Rename to "addLives" ?
    public changeLives(amount : number) : void {

        this.health = clamp(this.health + amount, 0, this.maxHealth);
        if (amount < 0) {

            this.healthUpdateTimer = 1.0;
        }
    }


    public increaseBonus() : void {

        if (this.bonus == 0) {

            this.bonus = 10;
        }
        else if (this.bonus >= 10 && this.bonus < 30) {

            this.bonus += 5;
        }
        else if (this.bonus >= 30 && this.bonus < 50) {

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

        this.pointsAddSpeed = Math.ceil((this.score - this.shownPoints)/ADDITION_FACTOR);

        return v;
    }


    public addCoins(count : number) : void {

        const ADDITION_FACTOR : number = 10;

        this.coins += count;

        this.coinBonus = this.coins*10;
        this.coinBonusAddSpeed = Math.ceil((this.coinBonus - this.shownCoinBonus)/ADDITION_FACTOR);
    }


    public reset() : void {

        this.health = this.maxHealth;
        this.bonus = 0;
        this.score = 0;
        this.coins = 0;

        this.shownPoints = 0;
        this.pointsAddSpeed = 0;
        this.healthUpdateTimer = 0.0;
        this.bonusUpdateTimer = 0.0;
        this.coinBonus = 0;
        this.coinBonusAddSpeed = 0;
        this.shownCoinBonus = 0;
    }


    public update(globalSpeedFactor : number, event : ProgramEvent) : void {

        const UPDATE_TIMER_SPEED : number = 1.0/20.0;

        if (this.healthUpdateTimer > 0.0) {

            this.healthUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }

        if (this.bonusUpdateTimer > 0.0) {

            this.bonusUpdateTimer -= UPDATE_TIMER_SPEED*event.tick;
        }
/*
        if (this.shownPoints < this.score) {

            this.shownPoints += this.pointsAddSpeed*event.tick;
            this.shownPoints |= 0;

            if (this.shownPoints >= this.score) {

                this.shownPoints = this.score;
            }
        }
*/
        this.shownPoints = updateIncreasingNumberThing(
                this.shownPoints, this.score, 
                this.pointsAddSpeed*event.tick);
        this.shownCoinBonus = updateIncreasingNumberThing(
                this.shownCoinBonus, this.coinBonus, 
                this.coinBonusAddSpeed*event.tick);
    }


    public getHealth = () : number => this.health;
    public getBonus = () : number => this.bonus;
    public getScore = () : number => this.score;
    public getShownScore = () : number => Math.round(this.shownPoints);
    public getShownCoinBonus = () : number => Math.round(this.shownCoinBonus);
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
        if (base.length >= maxLength)   
            return base;

        return "0".repeat(maxLength - base.length) + base;
    }


    public shownScoreToString(maxLength : number) : string {

        const base : string = String(this.shownPoints);
        const undotted : string = "0".repeat(maxLength - base.length) + base;;
/*
        let target : string = "";
        for (let i = 0; i < undotted.length; ++ i) {

            const c : string = undotted.charAt(i);

            target += c;
            if (i != undotted.length - 1 && negMod(i - 1, 3) == 2)
                target += ".";
        }

        return "$" + target;
        */
       return "$" + undotted;
    }


    public stopScoreFlow() : void {

        this.score = this.shownPoints;
    }


    public cap(amount : number) : boolean {

        if (this.shownPoints >= amount) {

            this.shownPoints = amount;
            return true;
        }
        return false;
    }
}
