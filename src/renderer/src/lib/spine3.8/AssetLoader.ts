/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

import { store } from '../../store'
import { RootState } from '../../store'
import './spine-webgl.js'


declare global {
    interface Window {
      spine38: typeof spine;
    }
  }

export class AssetManager implements Disposable {
    private pathPrefix: string;
    private textureLoader: (image: HTMLImageElement) => any;
    private assets: Map<string, any> = new Map();
    private errors: Map<string, string> = new Map();
    private toLoad = 0;
    private loaded = 0;
    private rawDataUris: Map<string, string> = new Map();

    constructor (textureLoader: (image: HTMLImageElement) => any, pathPrefix: string = "") {
        this.textureLoader = textureLoader;
        this.pathPrefix = pathPrefix;
    }

    private downloadText (url: string, success: (data: string) => void, error: (status: number, responseText: string) => void) {
        // 从 Redux 获取资源
        const resource = this.getResourceFromRedux(url);
        
        if (resource && typeof resource === 'string' && resource.startsWith('blob:')) {
            // 处理 blob URL
            fetch(resource)
                .then(response => response.text())
                .then(text => {
                    success(text);
                })
                .catch(e => {
                    error(400, JSON.stringify(e));
                });
        } else if (this.rawDataUris.has(url)) {
            // 使用 rawDataUris
            const data = this.rawDataUris.get(url);
            if (data) success(data);
        } else {
            // 回退到网络请求
            let request = new XMLHttpRequest();
            request.overrideMimeType("text/html");
            request.open("GET", url, true);
            request.onload = () => {
                if (request.status == 200) {
                    success(request.responseText);
                } else {
                    error(request.status, request.responseText);
                }
            }
            request.onerror = () => {
                error(request.status, request.responseText);
            }
            request.send();
        }
    }

    private downloadBinary (url: string, success: (data: Uint8Array) => void, error: (status: number, responseText: string) => void) {
        // 从 Redux 获取资源
        const resource = this.getResourceFromRedux(url);
        
        if (resource && typeof resource === 'string' && resource.startsWith('blob:')) {
            // 处理 blob URL
            fetch(resource)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    success(new Uint8Array(buffer));
                })
                .catch(e => {
                    error(400, JSON.stringify(e));
                });
        } else {
            // 回退到网络请求
            let request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";
            request.onload = () => {
                if (request.status == 200) {
                    success(new Uint8Array(request.response as ArrayBuffer));
                } else {
                    error(request.status, request.responseText);
                }
            }
            request.onerror = () => {
                error(request.status, request.responseText);
            }
            request.send();
        }
    }

    private getResourceFromRedux(url: string): any {
        const state = store.getState() as RootState;
        const { fileList } = state.global;
        const { skel, json, atlas, skins } = fileList;

        // 根据文件名匹配资源
        const filename = url.split('/').pop() || url;

        if (filename === skel.name && skel.file) {
            return skel.file;
        }
        if (filename === json.name && json.file) {
            return json.file;
        }
        if (filename === atlas.name && atlas.file) {
            return atlas.file;
        }

        // 匹配 skins
        const skinResource = skins.find(skin => skin.name === filename);
        if (skinResource && skinResource.file) {
            return skinResource.file;
        }

        return null;
    }

    setRawDataURI(path: string, data: string) {
        this.rawDataUris.set(this.pathPrefix + path, data);
    }

    loadBinary(path: string,
        success?: (path: string, binary: Uint8Array) => void,
        error?: (path: string, error: string) => void) {
        path = this.pathPrefix + path;
        this.toLoad++;

        this.downloadBinary(path, (data: Uint8Array): void => {
            this.assets.set(path, data);
            if (success) success(path, data);
            this.toLoad--;
            this.loaded++;
        }, (state: number, responseText: string): void => {
            this.errors.set(path, `Couldn't load binary ${path}: status ${state}, ${responseText}`);
            if (error) error(path, `Couldn't load binary ${path}: status ${state}, ${responseText}`);
            this.toLoad--;
            this.loaded++;
        });
    }

    
    loadText(path: string,
        success?: (path: string, text: string) => void,
        error?: (path: string, error: string) => void) {
        path = this.pathPrefix + path;
        this.toLoad++;

        this.downloadText(path, (data: string): void => {
            this.assets.set(path, data);
            if (success) success(path, data);
            this.toLoad--;
            this.loaded++;
        }, (state: number, responseText: string): void => {
            this.errors.set(path, `Couldn't load text ${path}: status ${state}, ${responseText}`);
            if (error) error(path, `Couldn't load text ${path}: status ${state}, ${responseText}`);
            this.toLoad--;
            this.loaded++;
        });
    }

    loadTexture (path: string,
        success?: (path: string, image: HTMLImageElement) => void,
        error?: (path: string, error: string) => void) {
        path = this.pathPrefix + path;
        let storagePath = path;
        this.toLoad++;
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = (ev) => {
            let texture = this.textureLoader(img);
            this.assets.set(storagePath, texture);
            this.toLoad--;
            this.loaded++;
            if (success) success(path, img);
        }
        img.onerror = (ev) => {
            this.errors.set(path, `Couldn't load image ${path}`);
            this.toLoad--;
            this.loaded++;
            if (error) error(path, `Couldn't load image ${path}`);
        }

        // 从 Redux 获取 skin 资源
        const resource = this.getResourceFromRedux(path);
        if (resource && typeof resource === 'string' && resource.startsWith('blob:')) {
            img.src = resource;
        } else if (this.rawDataUris.has(path)) {
            const data = this.rawDataUris.get(path);
            if (data) img.src = data;
        } else {
            img.src = path;
        }
    }

    loadTextureAtlas (path: string,
        success?: (path: string, atlas: any) => void,
        error?: (path: string, error: string) => void
    ) {
        let parent = path.lastIndexOf("/") >= 0 ? path.substring(0, path.lastIndexOf("/")) : "";
        path = this.pathPrefix + path;
        this.toLoad++;

        this.downloadText(path, (atlasData: string): void => {
            let pagesLoaded: any = { count: 0 };
            let atlasPages = new Array<string>();
            try {
                // 使用全局 spine 对象
                const { TextureAtlas, FakeTexture } = (window as any).spine38;
                let atlas = new TextureAtlas(atlasData, (path: string) => {
                    atlasPages.push(parent == "" ? path : parent + "/" + path);
                    let image = document.createElement("img") as HTMLImageElement;
                    image.width = 16;
                    image.height = 16;
                    return new FakeTexture(image);
                });
            } catch (e) {
                let ex = e as Error;
                this.errors.set(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
                if (error) error(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
                this.toLoad--;
                this.loaded++;
                return;
            }

            for (let atlasPage of atlasPages) {
                let pageLoadError = false;
                this.loadTexture(atlasPage, (imagePath: string, image: HTMLImageElement) => {
                    pagesLoaded.count++;

                    if (pagesLoaded.count == atlasPages.length) {
                        if (!pageLoadError) {
                            try {
                                const { TextureAtlas } = (window as any).spine38;
                                let atlas = new TextureAtlas(atlasData, (path: string) => {
                                    return this.get(parent == "" ? path : parent + "/" + path);
                                });
                                this.assets.set(path, atlas);
                                if (success) success(path, atlas);
                                this.toLoad--;
                                this.loaded++;
                            } catch (e) {
                                let ex = e as Error;
                                this.errors.set(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
                                if (error) error(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
                                this.toLoad--;
                                this.loaded++;
                            }
                        } else {
                            this.errors.set(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
                            if (error) error(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
                            this.toLoad--;
                            this.loaded++;
                        }
                    }
                }, (imagePath: string, errorMessage: string) => {
                    pageLoadError = true;
                    pagesLoaded.count++;

                    if (pagesLoaded.count == atlasPages.length) {
                        this.errors.set(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
                        if (error) error(path, `Couldn't load texture atlas page ${imagePath} of atlas ${path}`);
                        this.toLoad--;
                        this.loaded++;
                    }
                });
            }
        }, (state: number, responseText: string): void => {
            this.errors.set(path, `Couldn't load texture atlas ${path}: status ${state}, ${responseText}`);
            if (error) error(path, `Couldn't load texture atlas ${path}: status ${state}, ${responseText}`);
            this.toLoad--;
            this.loaded++;
        });
    }

    get (path: string) {
        path = this.pathPrefix + path;
        return this.assets.get(path);
    }

    remove (path: string) {
        path = this.pathPrefix + path;
        let asset = this.assets.get(path);
        if ((<any>asset).dispose) (<any>asset).dispose();
        this.assets.set(path, null);
    }

    removeAll() {
        this.assets.forEach((asset, key) => {
            if ((<any>asset).dispose) (<any>asset).dispose();
        });
        this.assets = new Map();
    }

    isLoadingComplete (): boolean {
        return this.toLoad == 0;
    }

    getToLoad (): number {
        return this.toLoad;
    }

    getLoaded (): number {
        return this.loaded;
    }

    dispose () {
        this.removeAll();
    }

    hasErrors() {
        return this.errors.size > 0;
    }

    getErrors() {
        return this.errors;
    }
}

interface Disposable {
    dispose (): void;
}
interface Restorable {
    restore(): void;
}
interface ManagedWebGLRenderingContext {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    gl: WebGLRenderingContext;
    constructor(canvasOrContext: HTMLCanvasElement | WebGLRenderingContext | EventTarget | WebGL2RenderingContext, contextConfig?: any);
    addRestorable(restorable: Restorable): void;
    removeRestorable(restorable: Restorable): void;
}

export class LocalAssetManager extends AssetManager {
    constructor (context: ManagedWebGLRenderingContext | WebGLRenderingContext, pathPrefix: string = "") {
        super((image: HTMLImageElement | ImageBitmap) => {
            return new (window as any).spine38.webgl.GLTexture(context, image);
        }, pathPrefix);
    }
}