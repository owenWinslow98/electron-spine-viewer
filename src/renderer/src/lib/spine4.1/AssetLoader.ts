import { store } from '../../store'
import { RootState } from '../../store'
import { Disposable, Texture, Downloader, TextureAtlas, GLTexture, ManagedWebGLRenderingContext } from 'spine-webgl41'
import { noop } from 'lodash'
interface StringMap<T> {
    [key: string]: T
}

export class LocalAssetManagerBase implements Disposable {
    private pathPrefix: string = '';
    private textureLoader: (image: HTMLImageElement | ImageBitmap) => Texture;
    private downloader: Downloader;
    private assets: StringMap<any> = {};
    private errors: StringMap<string> = {};
    private toLoad = 0;
    private loaded = 0;

    constructor(textureLoader: (image: HTMLImageElement | ImageBitmap) => Texture, pathPrefix: string = "", downloader: Downloader = new Downloader()) {
        this.textureLoader = textureLoader;
        this.pathPrefix = pathPrefix;
        this.downloader = downloader || new Downloader();
    }

    private start(path: string): string {
        this.toLoad++;
        return this.pathPrefix + path;
    }

    private success(callback: (path: string, data: any) => void, path: string, asset: any) {
        this.toLoad--;
        this.loaded++;
        this.assets[path] = asset;
        if (callback) callback(path, asset);
    }

    private error(callback: (path: string, message: string) => void, path: string, message: string) {
        this.toLoad--;
        this.loaded++;
        this.errors[path] = message;
        if (callback) callback(path, message);
    }

    loadAll() {
        let promise = new Promise((resolve: (assetManager: LocalAssetManagerBase) => void, reject: (errors: StringMap<string>) => void) => {
            let check = () => {
                if (this.isLoadingComplete()) {
                    if (this.hasErrors()) reject(this.errors);
                    else resolve(this);
                    return;
                }
                requestAnimationFrame(check);
            }
            requestAnimationFrame(check);
        });
        return promise;
    }

    setRawDataURI(path: string, data: string) {
        this.downloader.rawDataUris[this.pathPrefix + path] = data;
    }

    loadBinary(path: string,
        success: (path: string, binary: Uint8Array) => void = noop,
        error: (path: string, message: string) => void = noop) {
        path = this.start(path);

        this.downloader.downloadBinary(path, (data: Uint8Array): void => {
            this.success(success, path, data);
        }, (status: number, responseText: string): void => {
            this.error(error, path, `Couldn't load binary ${path}: status ${status}, ${responseText}`);
        });
    }

    loadText(path: string,
        success: (path: string, text: string) => void = noop,
        error: (path: string, message: string) => void = noop) {
        path = this.start(path);

        this.downloader.downloadText(path, (data: string): void => {
            this.success(success, path, data);
        }, (status: number, responseText: string): void => {
            this.error(error, path, `Couldn't load text ${path}: status ${status}, ${responseText}`);
        });
    }

    loadJson(path: string,
        success: (path: string, object: object) => void = noop,
        error: (path: string, message: string) => void = noop) {
        path = this.start(path);

        this.downloader.downloadJson(path, (data: object): void => {
            this.success(success, path, data);
        }, (status: number, responseText: string): void => {
            this.error(error, path, `Couldn't load JSON ${path}: status ${status}, ${responseText}`);
        });
    }

    loadTexture(path: string,
        success: (path: string, texture: Texture) => void = noop,
        error: (path: string, message: string) => void = noop) {
        path = this.start(path);

        let isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document);
        let isWebWorker = !isBrowser; // && typeof importScripts !== 'undefined';
        if (isWebWorker) {
            fetch(path, { mode: <RequestMode>"cors" }).then((response) => {
                if (response.ok) return response.blob();
                this.error(error, path, `Couldn't load image: ${path}`);
                return null;
            }).then((blob) => {
                return blob ? createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" }) : null;
            }).then((bitmap) => {
                if (bitmap) this.success(success, path, this.textureLoader(bitmap));
            });
        } else {
            let image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                this.success(success, path, this.textureLoader(image));
            };
            image.onerror = () => {
                this.error(error, path, `Couldn't load image: ${path}`);
            };

            // 从 Redux 获取 skin 资源
            const state = store.getState() as RootState;
            const { fileList } = state.global;
            const { skins } = fileList;

            // 根据文件名查找对应的 skin
            const filename = path;
            const skinResource = skins.find(skin => skin.name === filename);

            if (skinResource && skinResource.file) {
                // 使用 Redux 中的 blob URL
                image.src = skinResource.file;
            } else if (this.downloader.rawDataUris[path]) {
                // 回退到原有的 rawDataUris
                image.src = this.downloader.rawDataUris[path];
            } else {
                // 回退到原始路径
                image.src = path;
            }
        }
    }

    loadTextureAtlas(path: string,
        success: (path: string, atlas: TextureAtlas) => void = noop,
        error: (path: string, message: string) => void = noop,
        fileAlias: { [keyword: string]: string } | null = null
    ) {
        let index = path.lastIndexOf("/");
        let parent = index >= 0 ? path.substring(0, index + 1) : "";
        path = this.start(path);

        this.downloader.downloadText(path, (atlasText: string): void => {
            try {
                let atlas = new TextureAtlas(atlasText);
                let toLoad = atlas.pages.length, abort = false;
                for (let page of atlas.pages) {
                    this.loadTexture(fileAlias == null ? parent + page.name : fileAlias[page.name],
                        (_, texture: Texture) => {
                            if (!abort) {
                                page.setTexture(texture);
                                if (--toLoad == 0) this.success(success, path, atlas);
                            }
                        },
                        (imagePath: string) => {
                            if (!abort) this.error(error, path, `Couldn't load texture atlas ${path} page image: ${imagePath}`);
                            abort = true;
                        }
                    );
                }
            } catch (e) {
                this.error(error, path, `Couldn't parse texture atlas ${path}: ${e}`);
            }
        }, (status: number, responseText: string): void => {
            this.error(error, path, `Couldn't load texture atlas ${path}: status ${status}, ${responseText}`);
        });
    }

    get(path: string) {
        return this.assets[this.pathPrefix + path];
    }

    require(path: string) {
        path = this.pathPrefix + path;
        let asset = this.assets[path];
        if (asset) return asset;
        let error = this.errors[path];
        throw Error("Asset not found: " + path + (error ? "\n" + error : ""));
    }

    remove(path: string) {
        path = this.pathPrefix + path;
        let asset = this.assets[path];
        if ((<any>asset).dispose) (<any>asset).dispose();
        delete this.assets[path];
        return asset;
    }

    removeAll() {
        for (let key in this.assets) {
            let asset = this.assets[key];
            if ((<any>asset).dispose) (<any>asset).dispose();
        }
        this.assets = {};
    }

    isLoadingComplete(): boolean {
        return this.toLoad == 0;
    }

    getToLoad(): number {
        return this.toLoad;
    }

    getLoaded(): number {
        return this.loaded;
    }

    dispose() {
        this.removeAll();
    }

    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    getErrors() {
        return this.errors;
    }
}


export class LocalAssetLoader extends LocalAssetManagerBase {
    constructor(context: ManagedWebGLRenderingContext | WebGLRenderingContext, pathPrefix: string = "", downloader: Downloader = new Downloader()) {
        super((image: HTMLImageElement | ImageBitmap) => {
            return new GLTexture(context, image);
        }, pathPrefix, downloader);
    }
}


export class LocalReduxDownloader {
    private callbacks: StringMap<Array<Function>> = {}
    rawDataUris: StringMap<string> = {}

    // Add this method to match Spine's Downloader interface
    downloadText(url: string, success: (data: string) => void, error: (status: number, responseText: string) => void) {
        if (this.start(url, success, error)) return

        // From Redux
        const resource = this.getResourceFromRedux(url)

        if (resource) {
            // Handle blob URL
            if (typeof resource === 'string' && resource.startsWith('blob:')) {
                fetch(resource)
                    .then(response => response.text())
                    .then(text => {
                        this.finish(url, 200, text)
                    })
                    .catch(e => {
                        this.finish(url, 400, JSON.stringify(e))
                    })
                return
            }
        }

        // Fallback to network
        let request = new XMLHttpRequest()
        request.overrideMimeType("text/html")
        request.open("GET", url, true)
        let done = () => {
            this.finish(url, request.status, request.responseText)
        }
        request.onload = done
        request.onerror = done
        request.send()
    }
	downloadJson (url: string, success: (data: object) => void, error: (status: number, responseText: string) => void) {
		this.downloadText(url, (data: string): void => {
			success(JSON.parse(data));
		}, error);
	}

    downloadBinary(url: string, success: (data: Uint8Array) => void, error: (status: number, responseText: string) => void) {
        if (this.start(url, success, error)) return

        // From Redux
        const resource = this.getResourceFromRedux(url)
        if (resource) {
            // Handle blob URL
            if (typeof resource === 'string' && resource.startsWith('blob:')) {
                fetch(resource)
                    .then(response => response.arrayBuffer())
                    .then(buffer => {
                        this.finish(url, 200, new Uint8Array(buffer))
                    })
                    .catch(e => {
                        this.finish(url, 400, JSON.stringify(e))
                    })
                return
            }
        }

        // Fallback to network
        let request = new XMLHttpRequest()
        request.open("GET", url, true)
        request.responseType = "arraybuffer"
        let onerror = () => {
            this.finish(url, request.status, request.response)
        }
        request.onload = () => {
            if (request.status == 200 || request.status == 0)
                this.finish(url, 200, new Uint8Array(request.response as ArrayBuffer))
            else
                onerror()
        }
        request.onerror = onerror
        request.send()
    }

    private getResourceFromRedux(url: string): any {
        const state = store.getState() as RootState
        const { fileList } = state.global
        const { skel, json, atlas } = fileList

        // Match by filename
        const filename = url.split('/').pop() || url

        if (filename === skel.name && skel.file) {
            return skel.file
        }
        if (filename === json.name && json.file) {
            return json.file
        }
        if (filename === atlas.name && atlas.file) {
            return atlas.file
        }

        return null
    }
    // Helper methods
    private start(url: string, success: any, error: any): boolean | void {
        let callbacks = this.callbacks[url]
        try {
            if (callbacks) return true
            this.callbacks[url] = callbacks = []
        } finally {
            callbacks.push(success, error)
        }
    }

    private finish(url: string, status: number, data: any) {
        let callbacks = this.callbacks[url]
        delete this.callbacks[url]
        let args = status == 200 || status == 0 ? [data] : [status, data]
        for (let i = args.length - 1, n = callbacks.length; i < n; i += 2)
            callbacks[i].apply(null, args)
    }
}