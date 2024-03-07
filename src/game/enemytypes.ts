import { Apple } from "./apple.js";
import { Slime } from "./slime.js";
import { Dog } from "./dog.js";


export const enum EnemyType {

    Slime = 0,
    Apple = 1,
    Dog = 2,
}


export const ENEMY_TYPE_COUNT : number = 3;


export const getEnemyConstructor = (t : EnemyType) : Function => ([Slime, Apple, Dog][t]) ?? Slime;
