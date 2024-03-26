## Money Hog

...is an action arcade platformer thing for web. It is completely written in TypeScript, using only standard web technologies like WebGL and WebAudio, no additional frameworks or libraries were used.

[The game can be played on Itch.io](https://jani-nykanen.itch.io/money-hog)


-----


## Cooking the spaghetti (or: how to build the game)

1. Make sure you have [`git-lfs`](https://git-lfs.com/) installed. If not, then you cannot access the asset files using `git clone` (download the repo as a zip should still work, though)
2. Clone the repo: `git clone https://github.com/jani-nykanen/money-hog`.
3. Open terminal and `cd` to the root: `cd money-hog`.
4. Run `tsc` to compile the TypeScript to Javascript (or `tsc -w` if you want to compile the code in a watch mode, recommended if you are going to make changes).
5. You can test the game by running `make server` and typing `localhost:8000` to your browser's address bar.
6. If you want to compile the game using [Closure compiler](https://developers.google.com/closure/compiler), you can run  `CLOSURE_PATH=<path-to-closure> make closure`, where you replace `<path-to-closure>` with a path to the closure (i.e `CLOSURE_PATH=./closure.jar make closure`). Note that you need to run `tsc` first.
7. If you want to make a distributable zip archive of the compiled code, you can run `CLOSURE_PATH=<path-to-closure> make dist`, which does the following: compiles the TypeScript, runs the compiled code through Closure and finally packs all the required files to a zip file. 


-----


## License:

The game uses the following licenses:
1. [MIT license](https://opensource.org/license/mit) for all the source code files, which contain all `.html`, `.css`, `.json` and `.ts` files.
2. [CC BY-NC 4.0 DEED](https://creativecommons.org/licenses/by-nc/4.0/deed.en) for all asset files in the `asset` folder (**excluding** `.ogg` files, see below), and should be attributed to Jani Nykänen.
3. [CC BY-NC 4.0 DEED](https://creativecommons.org/licenses/by-nc/4.0/deed.en) for all `.ogg` files, and should be attributed to H0dari.

In short: do whatever you want with the code, but if you want to use the asset files, commercial use is forbidden, and for non-commercial use you must give a proper credit to the authors. So if you want to modify my game and sell it for money (not recommend), you can do it **only if** you replace *all* the asset files with your own assets. I don't see why would anyone use my terrible spaghetti code for anything commercial, but you never know!


-----

(c) 2024 Jani Nykänen
