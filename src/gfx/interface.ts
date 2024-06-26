

export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
}


export const enum Align {

    Left = 0,
    Right = 1,
    Center = 2
}


export const enum TransformTarget {

    Model = 0,
    Camera = 1
}


export interface Bitmap {

    get width() : number;
    get height() : number;
}


export interface Grid {

    get width() : number;
    get height() : number;

    dispose() : void;
}


export const enum Effect {

    None = 0,
    FixedColor = 1,
    InvertColors = 2,
}


export interface Transform2D {

    setTarget(target : TransformTarget) : void;

    loadIdentity() : void;
    translate(x : number, y : number) : void;
    scale(x : number, y : number) : void;
    rotate(angle : number) : void;

    view(width : number, height : number) : void;
    fitDimension(dimension : number, width : number, height : number) : void;

    push() : void;
    pop() : void;
}


export interface Canvas {

    get width() : number;
    get height() : number;

    readonly transform : Transform2D; // TODO: This vs. get

    clear(r? : number, g? : number, b? : number) : void;
    fillRect(dx? : number, dy? : number, dw? : number, dh? : number) : void;
    drawBitmap(bmp : Bitmap | undefined, flip? : Flip, 
        dx? : number, dy? : number, 
        sx? : number, sy? : number,
        sw? : number, sh? : number,
        dw? : number, dh? : number) : void;
    drawText(font : Bitmap | undefined, text : string, 
        dx : number, dy : number, xoff? : number, yoff? : number, 
        align? : Align, scalex? : number, scaley? : number) : void;
    fillCircleOutside(centerx : number, centery : number, radius : number) : void;

    drawHorizontallyWavingBitmap(bitmap : Bitmap | undefined, 
        amplitude : number, period : number, shift : number,
        dx? : number, dy? : number, flip? : Flip) : void;
    drawVerticallyWavingBitmap(bmp : Bitmap,
        dx : number, dy : number,
        sx : number, sy : number, sw : number, sh : number,
        period : number, amplitude : number,
        shift : number) : void;
    drawFunnilyAppearingBitmap(bmp : Bitmap, flip : Flip,
        dx : number, dy : number, sx : number, sy : number, sw : number, sh : number,
        t : number, amplitude : number, latitude : number, maxOffset : number) : void

    drawGrid(grid : Grid, bmp : Bitmap | undefined, flip? : Flip, dx? : number, dy? : number, dw? : number, dh? : number) : void;

    setColor(r? : number, g? : number, b? : number, a? : number) : void;
    applyEffect(eff? : Effect) : void;

    toggleSilhouetteRendering(state? : boolean) : void;
    clearSilhouetteBuffer() : void;

    getBitmap(name : string) : Bitmap | undefined;
    getCloneBufferBitmap() : Bitmap;

    applyTransform() : void;
}   


export interface Renderer {
    
    get width() : number;
    get height() : number;

    get canvasWidth() : number;
    get canvasHeight() : number;

    resize(width : number, height : number) : void;

    drawToCanvas(cb : (canvas : Canvas) => void) : void;
    refresh() : void;

    // TODO: Bitmask for repeatx & repeaty
    createBitmap(img : HTMLImageElement, linearFilter? : boolean, repeatx? : boolean, repeaty? : boolean) : Bitmap;

    setFetchBitmapCallback(cb : (name : string) => Bitmap | undefined) : void;

    // This is here so there is not access to this function
    // in the redraw event since this messes up with 
    // active framebuffers
    cloneCanvasToBufferBitmap() : void;

    createBitmapFromPixelData(pixels : Uint8Array, width : number, height : number) : Bitmap;
    createGrid(layers : number[][], width : number, height : number, flatten? : boolean) : Grid;
}       
