import { Grid } from "../interface.js";
import { Mesh } from "./mesh.js";


const createLayerMesh = (gl : WebGLRenderingContext, layers : number[][], width : number, height : number) : Mesh => {

    const vertices : number[] = new Array<number> ();
    const uvs : number[] = new Array<number> ();
    const indices : number[] = new Array<number> ();

    const stepx : number = 1.0/width;
    const stepy : number = 1.0/height;

    const stepu : number = 1.0/16.0;
    const stepv : number = 1.0/16.0;

    for (let layer of layers) {

        for (let y = 0; y < height; ++ y) {

            for (let x = 0; x < width; ++ x) {

                const v : number = (layer[y*width + x] - 1) ?? -1;
                if (v == -1)
                    continue;
                
                vertices.push(

                    x*stepx, y*stepy, 
                    (x + 1)*stepx, y*stepy, 
                    (x + 1)*stepx, (y + 1)*stepy,

                    (x + 1)*stepx, (y + 1)*stepy,
                    x*stepx, (y + 1)*stepy,
                    x*stepx, y*stepy
                );
                
                const sx : number = v % 16;
                const sy : number = (v / 16) | 0;

                uvs.push(

                    sx*stepu, sy*stepv, 
                    (sx + 1)*stepu, sy*stepv, 
                    (sx + 1)*stepu, (sy + 1)*stepv,

                    (sx + 1)*stepu, (sy + 1)*stepv,
                    sx*stepu, (sy + 1)*stepv,
                    sx*stepu, sy*stepv
                );

                const startIndex : number = indices.length;
                for (let i = 0; i < 6; ++ i) {

                    indices.push(startIndex + i);
                }
            }
        }
    }

    return new Mesh(gl, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(uvs));
}



export class WebGLGrid implements Grid {


    private layers : Mesh[];

    // private readonly gl : WebGLRenderingContext;

    public readonly width : number;
    public readonly height : number;


    constructor(gl : WebGLRenderingContext, layers : number[][], width : number, height : number, flatten = false) {

        const len : number = flatten ? 1 : layers.length;

        this.layers = new Array<Mesh> (len);

        if (!flatten) {

            for (let i = 0; i < len; ++ i) {

                this.layers[i] = createLayerMesh(gl, [layers[i]], width, height);
            }
        }
        else {

            this.layers[0] = createLayerMesh(gl, layers, width, height);
        }

        this.width = width;
        this.height = height;

        // this.gl = gl;
    }


    public getMesh(index : number = 0) : Mesh | undefined {

        if (index < 0 || index >= this.layers.length)
            return undefined;

        return this.layers[index];
    }


    public dispose() : void {

        for (let o of this.layers) {

            o.dispose();
        }
    }


    public getLayerCount = () : number => this.layers.length;
}