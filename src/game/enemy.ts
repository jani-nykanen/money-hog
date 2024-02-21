import { Spawnable } from "./spawnable.js";


export const enum EnemyType {

    Unknown = 0,
    Slime = 1,
}


export class Enemy extends Spawnable<EnemyType> {

}
