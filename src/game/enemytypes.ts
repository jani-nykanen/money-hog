import { Apple } from "./apple.js";
import { Slime } from "./slime.js";
import { Dog } from "./dog.js";
import { Bat } from "./bat.js";


export const enum EnemyType {

    Slime = 0,
    Apple = 1,
    Dog = 2,
    Bat = 3,
}


export const ENEMY_TYPE_COUNT : number = 4;


export const getEnemyConstructor = (t : EnemyType) : Function => ([Slime, Apple, Dog, Bat][t]) ?? Slime;
