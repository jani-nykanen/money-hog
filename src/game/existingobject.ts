


export interface ExistingObject {

    doesExist() : boolean;
    isDying() : boolean;
    forceKill() : void
}


export function next<T extends ExistingObject> (arr : T[], type : Function) : T {

    for (let o of arr) {

        if (!o.doesExist()) {

            return o;
        }
    }

    const o : T = (new type.prototype.constructor()) as T;
    arr.push(o);

    return o as T;
}
