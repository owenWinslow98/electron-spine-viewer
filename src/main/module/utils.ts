import fs from 'fs'
import { isNull } from 'lodash'
import { BrowserWindow } from 'electron'
import { ipcMain } from 'electron-better-ipc'
import path from 'path'
import { getJsonVersion, getSkelVersion } from './getResource'
interface Resource {
    name: string
    path: string
    file: Uint8Array | null
}

export const getResources = async (filePathList: string[], mainWindow: BrowserWindow) => {


    const skelPath = filePathList.find(path => path.endsWith('.skel'))! || null
    const jsonPath = filePathList.find(path => path.endsWith('.json'))! || null
    const atlasPath = filePathList.find(path => path.endsWith('.atlas'))! || null

    if (!((!isNull(skelPath)) || (!isNull(jsonPath))) && !isNull(atlasPath)) {
        ipcMain.callRenderer(mainWindow, 'toast-message', `both skel(.skel, .json) and teture(.atlas) are required.`)
        throw new Error('both skel(.skel, .json) and teture(.atlas) are required.')
        

    }
    let skelfile
    let jsonfile
    let atlasfile
    let skelVersion 
    try {
        skelfile = isNull(skelPath) ? null : fs.readFileSync(skelPath)
        jsonfile = isNull(jsonPath) ? null : fs.readFileSync(jsonPath)
        skelVersion = isNull(skelPath) ? getJsonVersion(jsonfile) :  getSkelVersion(skelfile)
        atlasfile = fs.readFileSync(atlasPath as string)
    } catch (error) {
        ipcMain.callRenderer(mainWindow, 'toast-message', `${error}`)
        throw new Error('read file error.')
    }

    let skelResource: Resource = {
        name: '',
        path: '',
        file: null
    }
    if (!isNull(skelPath)) {
        skelResource.name = path.basename(skelPath)
        skelResource.path = skelPath
        skelResource.file = skelfile
    }

    let jsonResource: Resource = {
        name: '',
        path: '',
        file: null
    }
    if (!isNull(jsonPath)) {
        jsonResource.name = path.basename(jsonPath)
        jsonResource.path = jsonPath
        jsonResource.file = jsonfile
    }

    // atlas
    let atlasResource: Resource = {
        name: '',
        path: '',
        file: null
    }
    if (!isNull(atlasPath)) {
        atlasResource.name = path.basename(atlasPath)
        atlasResource.path = atlasPath
        atlasResource.file = atlasfile
    }

    // atlas png list
    const atlasText = new TextDecoder('utf-8').decode(atlasfile)
    let pngList = await ipcMain.callRenderer(mainWindow, 'get-atlas-png-list', { atlasText }) as string[]
    if(pngList.length === 0) throw Error(`.atlas has not skin.`)
    const skinList = pngList.map((pathUri) => {
        const abPath = path.join(path.dirname(atlasPath as string), pathUri)
        try {
            const fsRaw = fs.readFileSync(abPath)
            return {
                name: pathUri,
                path: abPath,
                file: fsRaw
            }
        } catch (error) {
            ipcMain.callRenderer(mainWindow, 'toast-message', `${error}`)
            throw new Error(`${abPath} file not found or broken.`)
        }
    })

    const result = {
        skel: skelResource,
        json: jsonResource,
        atlas: atlasResource,
        skins: skinList,
        skelVersion: skelVersion
    }
    return result
}