

const KEY : string = "jn__piggame_record";


export const fetchRecordScore = () : number => {

    try {

        // Funny way to call localStorage since at least some years ago Closure
        // compiler did not play nicely with localStorage without these
        const v : string | null = window["localStorage"]["getItem"](KEY);
        if (v !== null) {

            return Number(v);
        }
        return 0;
    }
    catch (e : any) {

        console.log("Warning: could not access the local storage.");
    }

    return 0;
}



export const setRecordScore = (newValue : number) : void => {

    try {

        const v : string | null = window["localStorage"]["getItem"](KEY) ?? "0";
        const num : number = Number(v);

        if (newValue > num) {

            window["localStorage"]["setItem"](KEY, String(newValue));
        }
    }
    catch (e : any) {

        console.log("Warning: could not access the local storage.");
    }
}
