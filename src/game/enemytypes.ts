import { Apple } from "./apple.js";
import { Slime } from "./slime.js";
import { Dog } from "./dog.js";
import { Bat } from "./bat.js";
import { SpikeSlime } from "./spikeslime.js";


export const enum EnemyType {

    Slime = 0,
    Apple = 1,
    Dog = 2,
    Bat = 3,
    SpikeSlime = 4,
}


export const ENEMY_TYPE_COUNT : number = 5;


export const getEnemyConstructor = (t : EnemyType) : Function => ([Slime, Apple, Dog, Bat, SpikeSlime][t]) ?? Slime;
