import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { WebGLRenderer } from "./gfx/webgl/renderer.js";
import { Game } from "./game/game.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.scenes.addScene("game", new Game(), true);

    event.assets.parseIndexFile("assets/index.json");

    event.input.addAction("jump", ["Space", "KeyZ"], [0]);
    event.input.addAction("attack", ["KeyX", "ControlLeft"], [1, 2, 3]);
    event.input.addAction("pause", ["Enter"], [7, 9]);
    event.input.addAction("back", ["Escape"], [6, 8], false);
    event.input.addAction("select", ["Enter", "Space", "KeyZ"], [0, 7]);

    event.audio.setGlobalVolume(0.60);
    event.audio.toggle(true);
}


const printError = (e : Error) : void => {

    console.log(e.stack);

    document.getElementById("base_div")?.remove();

    const textOut : HTMLElement = document.createElement("b");
    textOut.setAttribute("style", "color: rgb(224,73,73); font-size: 16px");
    textOut.innerText = "Fatal error:\n\n " + e.message;

    document.body.appendChild(textOut);
}


function waitForInitialEvent() : Promise<AudioContext> {

    
    return new Promise<AudioContext> ( (resolve : (ctx : AudioContext | PromiseLike<AudioContext>) => void) : void => {

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            e.preventDefault();
            document.getElementById("div_initialize")?.remove();
    
            const ctx : AudioContext = new AudioContext();
            resolve(ctx);
    
        }, { once: true });
    } );
}


window.onload = () => (async () => {
    
    document.getElementById("init_text")!.innerText = "Press Any Key to Start";

    const ctx : AudioContext = await waitForInitialEvent();

    try {

        (new Program(ctx, WebGLRenderer, 192, 256, false, false)).run(initialEvent, undefined, printError);
    }
    catch (e : any) {

        printError(e);
    }
}) ();
