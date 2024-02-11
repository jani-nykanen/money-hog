


export interface ExistingObject {

    doesExist() : boolean;
    isDying() : boolean;
    forceKill() : void
}


export function next(arr : ExistingObject[], type : Function) : ExistingObject {

    for (let o of arr) {

        if (!o.doesExist()) {

            return o;
        }
    }

    const o : ExistingObject = (new type.prototype.constructor()) as ExistingObject;
    arr.push(o);

    return o;
}
