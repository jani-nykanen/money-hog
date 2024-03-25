

export class Tilemap {

    // TODO: Check the first tile index from a tilemap, then substitute?

    private tileLayers : Map<string, number[]>;
    private properties : Map<string, string>;

    public readonly width : number;
    public readonly height : number;


    constructor(xmlString : string) {

        const doc : Document = (new DOMParser()).parseFromString(xmlString, "text/xml");
        const root : HTMLMapElement = doc.getElementsByTagName("map")[0];

        this.width = Number(root.getAttribute("width"));
        this.height = Number(root.getAttribute("height"));

        this.tileLayers = new Map<string, number[]> ();
        this.properties = new Map<string, string> ();

        this.parseLayerData(root);
        this.parseProperties(root);
    }


    private parseLayerData(root : HTMLMapElement) : void {

        const data : HTMLCollectionOf<Element> = root.getElementsByTagName("layer");
        if (data === null) {

            return;
        }

        for (let i = 0; i < data.length; ++ i) {

            // I guess this beats typecasting to any...
            const content : Array<string> | undefined = data[i].getElementsByTagName("data")[0]?.
                childNodes[0]?.
                nodeValue?.
                replace(/(\r\n|\n|\r)/gm, "")?.
                split(",");
            if (content === undefined)
                continue;

            this.tileLayers.set(data[i].getAttribute("name"), content.map((v : string) => Number(v)));
        }
    }   


    private parseProperties(root : HTMLMapElement) : void {

        const prop : Element = root.getElementsByTagName("properties")[0];
        if (prop !== undefined) {

            const elements : HTMLCollectionOf<Element> = prop.getElementsByTagName("property");
            for (let i = 0; i < elements.length; ++ i) {

                const p : Element = elements[i];
                if (p.getAttribute("name") != undefined) {

                    this.properties.set(
                        p.getAttribute("name") ?? "null", 
                        p.getAttribute("value") ?? "null");
                }
            }
        } 
    }


    public getTile(layerName : string, x : number, y : number, def = -1) : number {

        const layer : Array<number> = this.tileLayers.get(layerName);
        if (layer === undefined || 
            x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return layer[y * this.width + x];
    }


    public getIndexedTile(layerName : string, i : number, def = -1) : number {
        
        const layer : Array<number> = this.tileLayers.get(layerName);
        if (layer === undefined || i < 0 || i >= this.width*this.height)
            return def;

        return layer[i];
    }


    public cloneLayer(layerName : string) : Array<number> | undefined {

        const layer : Array<number> = this.tileLayers.get(layerName);
        if (layer === undefined)
            return null;

        return Array.from(layer);
    }


    public getProperty(name : string) : string | undefined {

        for (let [key, value] of this.properties) {

            if (key == name)
                return value;
        }
        return undefined;
    }
    
}
