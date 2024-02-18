import { clamp } from "../math/utility.js";


export class GameState {


    private health : number;
    private bonus : number = 0;
    private score : number = 0;

    public readonly maxHealth : number;


    constructor(maxHealth : number = 3) {

        this.health = maxHealth;
        this.maxHealth = maxHealth;
    }


    public changeLives(change : number) : void {

        this.health = clamp(this.health + change, 0, this.maxHealth);
    }


    public increaseBonus(count : number = 1) : void {

        this.bonus += count;
    }


    public addPoints(amount : number) : void {

        this.score += Math.floor(amount*(1.0 + this.bonus));
    }


    public reset() : void {

        this.health = this.maxHealth;
        this.bonus = 0;
        this.score = 0;
    }


    public getHealth = () : number => this.health;
    public getBonus = () : number => this.bonus;
    public getScore = () : number => this.score;


    public bonusToNumber() : string {

        // Converting to float to string never plays nicely

        const base : string = String(this.bonus + 10);
        const len : number = base.length;

        return base.slice(0, len - 1) + "." + base.slice(len - 1, len);
    }
}
