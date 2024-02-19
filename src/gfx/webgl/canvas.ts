import { Align, Bitmap, Canvas, Effect, Flip, Grid, Transform2D } from "../interface.js";
import { WebGLBitmap } from "./bitmap.js";
import { Mesh } from "./mesh.js";
import { ShaderType, StencilCondition, StencilOperation, WebGLRenderer } from "./renderer.js";
import { WebGLGrid } from "./grid.js";


const createCircleOutMesh = (gl : WebGLRenderingContext, quality : number) : Mesh => {

    const step : number = Math.PI*2/quality;

    const vertices : number[] = new Array<number> ();
    const indices : number[] = new Array<number> ();

    let index : number = 0;

    for (let i = 0; i < quality; ++ i) {

        const angle1 : number = step*i;
        const angle2 : number = step*(i + 1);

        const c1 : number = Math.cos(angle1);
        const c2 : number = Math.cos(angle2);

        const s1 : number = Math.sin(angle1);
        const s2 : number = Math.sin(angle2);

        vertices.push(
            c1, s1, 
            c2, s2,
            c2*2, s2*2,

            c2*2, s2*2,
            c1*2, s1*2,
            c1, s1);

        for (let j = 0; j < 6; ++ j) {

            indices.push(index ++);
        }
    }

    return new Mesh(gl, new Float32Array(vertices), new Uint16Array(indices));
}


const getShaderTypeFromEffect = (eff : Effect) : ShaderType => 
    [ShaderType.Textured, 
     ShaderType.FixedColorTextured, 
     ShaderType.InvertTextured][eff] ?? ShaderType.Textured;


export class WebGLCanvas implements Canvas {


    private framebuffer : WebGLBitmap | undefined;
    private cloneTexture : WebGLBitmap | undefined;

    private meshCircleOut : Mesh;

    private activeEffect : Effect = Effect.None;

    private readonly renderer : WebGLRenderer;


    public readonly transform: Transform2D;


    get width() : number {

        return this.framebuffer?.width ?? this.renderer.width;
    }


    get height() : number {

        return this.framebuffer?.height ?? this.renderer.height;
    }


    constructor(renderer : WebGLRenderer, 
        transform : Transform2D, gl : WebGLRenderingContext,
        width? : number, height? : number) {

        if (width === undefined || height === undefined) {

            this.framebuffer = undefined;
            this.cloneTexture = undefined;
        }
        else {

            this.framebuffer = new WebGLBitmap(gl, undefined, false, false, false, true, width, height);
            this.cloneTexture = new WebGLBitmap(gl, undefined, false, false, false, true, width, height);
        }

        this.renderer = renderer;
        this.transform = transform;

        this.meshCircleOut = createCircleOutMesh(gl, 64);
    }


    public clear(r : number = 255, g : number = 255, b : number = 255) : void {

        this.renderer.clear(r/255.0, g/255.0, b/255.0);
    }


    public fillRect(dx = 0, dy = 0, dw = this.width, dh = this.height) : void {

        this.renderer.changeShader(ShaderType.NoTexture);
        this.renderer.setVertexTransform(dx, dy, dw, dh);

        this.renderer.drawMesh();
    }


    public drawBitmap(bmp : Bitmap | undefined, flip : Flip = Flip.None, 
        dx : number = 0.0, dy : number = 0.0, 
        sx : number = 0.0, sy : number = 0.0, 
        sw : number = bmp?.width ?? 0, sh : number = bmp?.height ?? 0, 
        dw : number = sw, dh : number = sh) : void {
        
        if (bmp === undefined)
            return;

        if ((flip & Flip.Horizontal) == Flip.Horizontal) {

            dx += dw;
            dw *= -1;
        }

        if ((flip & Flip.Vertical) == Flip.Vertical) {

            dy += dh;
            dh *= -1;
        }

        sx /= bmp.width;
        sy /= bmp.height;
        sw /= bmp.width;
        sh /= bmp.height;

        this.renderer.changeShader(getShaderTypeFromEffect(this.activeEffect));
        this.renderer.setVertexTransform(dx, dy, dw, dh);
        this.renderer.setFragmenTransform(sx, sy, sw, sh);

        this.renderer.bindTexture(bmp as WebGLBitmap);
        this.renderer.drawMesh();
    }


    public drawText(font : Bitmap | undefined, text : string, 
        dx : number, dy : number, xoff : number = 0, yoff : number = 0, 
        align : Align = Align.Left, scalex : number = 1.0, scaley : number = 1.0) : void {

        if (font === undefined)
            return;

        const cw : number = (font.width / 16) | 0;
        const ch : number = cw;

        let x : number = dx;
        let y : number = dy;

        if (align == Align.Center) {

            dx -= (text.length + 1)*(cw + xoff)*scalex/2.0;
            x = dx;
        }
        else if (align == Align.Right) {
            
            dx -= ((text.length + 1)*(cw + xoff))*scalex;
            x = dx;
        }

        for (let i = 0; i < text.length; ++ i) {

            const chr : number = text.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }

            this.drawBitmap(font, Flip.None, 
                x, y, (chr % 16)*cw, ((chr/16) | 0)*ch, 
                cw, ch, cw*scalex, ch*scaley);

            x += (cw + xoff) * scalex;
        }
    }


    public fillCircleOutside(centerx : number, centery : number, radius : number) : void {

        this.renderer.changeShader(ShaderType.NoTexture);

        // Center
        this.renderer.setVertexTransform(centerx, centery, radius, radius);
        this.renderer.drawMesh(this.meshCircleOut);

        // Borders
        const top : number = Math.max(0, centery - radius) | 0;
        const bottom : number = Math.min(this.height, centery + radius) | 0;
        const left : number = Math.max(centerx - radius, 0) | 0;
        const right : number = Math.min(centerx + radius, this.width) | 0;

        if (top > 0)
            this.fillRect(0, 0, this.width, top);
        if (bottom < this.height)
            this.fillRect(0, bottom, this.width, this.height - bottom);
        if (left > 0)
            this.fillRect(0, 0, left, this.width);
        if (right < this.width)
            this.fillRect(right, 0, this.width - right, this.height);
    }
    

    public drawHorizontallyWavingBitmap(bitmap : Bitmap | undefined, 
        amplitude : number, period : number, shift : number,
        dx : number = 0, dy : number = 0, flip : Flip = Flip.None) : void {

        if (bitmap === undefined)
            return;

        // Note: For better performance one should obviously do this in
        // a shader, but I'm lazy

        const phaseStep : number = Math.PI*2 / period;

        for (let y = 0; y < bitmap.height; ++ y) {

            const phase : number = shift + phaseStep*y;
            const x : number = dx + Math.round(Math.sin(phase)*amplitude);
            const sy : number = (flip & Flip.Vertical) != 0 ? (bitmap.height - 1) - y : y;

            this.drawBitmap(bitmap, Flip.Horizontal & flip, x, dy + y, 0, sy, bitmap.width, 1);
        }
    }


    public drawVerticallyWavingBitmap(bmp : Bitmap,
        dx : number, dy : number, period : number, amplitude : number,
        shift : number) : void {

        // TODO: Same here

        for (let x = 0; x < bmp.width; ++ x) {

            const t : number = shift + (x / bmp.width)*period;
            const y : number = Math.round(Math.sin(t)*amplitude);

            this.drawBitmap(bmp, Flip.None, dx + x, dy + y, x, 0, 1, bmp.height);
        }
    }


    public drawGrid(grid : Grid, bmp : Bitmap | undefined, flip? : Flip, dx? : number, dy? : number, dw? : number, dh? : number) : void {

        if (bmp === undefined)
            return;

        const g : WebGLGrid = grid as WebGLGrid;

        // TODO: Implement flipping

        this.renderer.changeShader(getShaderTypeFromEffect(this.activeEffect));

        for (let i = 0; i < g.getLayerCount(); ++ i) {

            this.renderer.setVertexTransform(dx, dy, dw, dh);
            this.renderer.setFragmenTransform(0, 0, 1, 1);

            this.renderer.bindTexture(bmp as WebGLBitmap);
            this.renderer.drawMesh(g.getMesh(i));
        }
    }


    public setColor(r : number = 255, g : number = r, b : number = g, a : number = 1.0) : void {

        this.renderer.setColor(r/255.0, g/255.0, b/255.0, a);
    }


    public applyEffect(eff : Effect = Effect.None) : void {

        this.activeEffect = eff;
    }


    public toggleSilhouetteRendering(state : boolean = false) : void {

        this.renderer.toggleStencilTest(state);
        if (state) {

            this.renderer.clearStencilBuffer();
            this.renderer.setStencilOperation(StencilOperation.Keep);
            this.renderer.setStencilCondition(StencilCondition.NotEqual);
        }
    }

    
    public clearSilhouetteBuffer() : void {

        this.renderer.clearStencilBuffer();
    }
    

    public setRenderTarget() : void {

        this.framebuffer.setRenderTarget();
    }


    public bind() : void {

        this.framebuffer.bind();
    }


    public getBitmap = (name : string) : Bitmap | undefined => this.renderer.getBitmap(name);
    public getCloneBufferBitmap = () : Bitmap => this.cloneTexture;


    public applyTransform() : void {

        this.renderer.applyTransform();
    }


    public cloneToBufferBitmap() : void {

        if (this.framebuffer === undefined || this.cloneTexture === undefined)
            return;

        this.renderer.nullActiveBitmap();
        this.framebuffer.cloneToBitmap(this.cloneTexture);
    }


    public recreate(gl : WebGLRenderingContext, newWidth : number, newHeight : number) : void {

        this.framebuffer.dispose();
        this.cloneTexture.dispose();

        this.framebuffer = new WebGLBitmap(gl, undefined, false, true, false, false, newWidth, newHeight);
        this.cloneTexture = new WebGLBitmap(gl, undefined, false, false, false, false, newWidth, newHeight);
    }
}
