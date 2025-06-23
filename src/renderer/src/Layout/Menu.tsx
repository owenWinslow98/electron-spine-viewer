import React, { useEffect } from "react"
import { setFileList } from "@/store/globalSlice"
import { useDispatch } from "react-redux"
import { isNull } from "lodash"

interface MenuProps {
    className?: string
}

interface FileList {
    skel: { file: Uint8Array | null; path: string | null, name: string }
    json: { file: Uint8Array | null; path: string | null, name: string }
    atlas: { file: Uint8Array | null; path: string | null, name: string }
    skins: { file: Uint8Array | null; path: string | null, name: string }[]
}

export const Menu: React.FC<MenuProps> = () => {
    const dispatch = useDispatch()
    const { ipc } = window
    const { ipcRenderer } = ipc
    useEffect(() => {
        const handleFilesSelected = (fileList: any) => {
          // 更新你的状态或 Redux store
          handleOpenFile(fileList)
        }
        ipcRenderer.answerMain('open-file', handleFilesSelected)
      }, [])
    const handleOpenFile = async (fileList: FileList) => {
        try {
            // 使用 Electron 的文件对话框获取文件路径
            // const fileLsit = await window.api.selectFile()
            const { skel, json, atlas, skins } = fileList

            const transformSkel = isNull(skel.file) ? null : URL.createObjectURL(new Blob([skel.file], { type: 'application/octet-stream' }))
            const transformJson = isNull(json.file) ? null : URL.createObjectURL(new Blob([json.file], { type: 'application/json' }))
            const transformAtlas = isNull(atlas.file) ? null : URL.createObjectURL(new Blob([atlas.file], { type: 'text/plain' }))
            const transformSkins = skins.map((skin) => {
                const transformSkin = URL.createObjectURL(new Blob([skin.file as Uint8Array], { type: 'image/png' }))
                return {
                    ...skin,
                    file: transformSkin,
                }
            })
            const result = {
                skel: {
                    ...skel,
                    file: transformSkel,
                },
                json: {
                    ...json,
                    file: transformJson,
                },
                atlas: {
                    ...atlas,
                    file: transformAtlas,
                },
                skins: transformSkins,
            }
            dispatch(setFileList(result))
        } catch (error) {
            console.error('选择文件时出错:', error)
        }
    }

    return (
        <></>
    )
}