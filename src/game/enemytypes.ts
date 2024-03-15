import { Slime } from "./slime.js";
import { Apple } from "./apple.js";
import { Dog } from "./dog.js";
import { Bat } from "./bat.js";
import { SpikeSlime } from "./spikeslime.js";
import { Bird } from "./bird.js";
import { Rabbit } from "./rabbit.js";
import { Mushroom } from "./mushroom.js";


export const enum EnemyType {

    Slime = 0,
    Apple = 1,
    Dog = 2,
    Bat = 3,
    SpikeSlime = 4,
    Bird = 5,
    Rabbit = 6,
    Mushroom = 7,
}


export const ENEMY_TYPE_COUNT : number = 8;


export const ENEMY_WEIGHTS_INITIAL : number[] = [

    0.25,
    0.25,
    0.20,
    0.20,
    0.0,
    0.0,
    0.0,
    0.1
];


export const ENEMY_WEIGHTS_FINAL : number[] = [

    0.125,
    0.125,
    0.125,
    0.125,
    0.125,
    0.125,
    0.125,
    0.125
];


export const getEnemyConstructor = (t : EnemyType) : Function => ([Slime, Apple, Dog, Bat, SpikeSlime, Bird, Rabbit, Mushroom][t]) ?? Slime;
