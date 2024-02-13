


export function sampleWeightedUniform(weights : number[]) : number {

    const p : number = Math.random();

    let sum : number = 0.0;
    let i : number = 0;
    for (; i < weights.length; ++ i) {

        sum += weights[i];
        if (p <= sum) {

            return i;
        }
    }
    return i;
}
