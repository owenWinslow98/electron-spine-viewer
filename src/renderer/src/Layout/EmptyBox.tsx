import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setFileList } from '@/store/globalSlice'
import { isNull } from 'lodash'
import { toast } from 'sonner'
interface EmptyBoxProps {
  className?: string
}

export const EmptyBox: React.FC<EmptyBoxProps> = ({ className }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const dispatch = useDispatch()
  const handleFileSelect = async () => {
    try {
      const fileList = await window.api.selectFile()
      setSpineResource(fileList)
    } catch (error) {
      console.error('选择文件时出错:', error)
    }
  }
  const setSpineResource = async (fileList: SpineFileList) => {
    const { skel, json, atlas, skins, skelVersion } = fileList

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
      skelVersion: skelVersion
    }
    dispatch(setFileList(result))
  }
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    try {
      const files = event.dataTransfer.files
      const { electron } = window

      const paths = Array.from(files).map((file) => electron.webUtils.getPathForFile(file))
      if (paths.length < 2) {
        toast.error('both .skel(.json) and .atlas files are required.')
        return
      }
      const result = await window.api.resolveFilesWithPaths(paths)
      setSpineResource(result)
    } catch (error) {
      toast.error('unknown error.')
    }
    setIsDragOver(false)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div
      className={`flex h-[300px] w-[688px] items-center justify-center rounded-md border border-dashed text-sm transition-all duration-200 ${isDragOver
        ? 'border-primary bg-primary/5 scale-105'
        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${className || ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-2">
        <Upload className={`w-6 h-6 transition-colors duration-200 ${isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />

        <Button
          variant="outline"
          size="sm"
          onClick={handleFileSelect}
        >
          Open File
        </Button>

        <p className={`text-xs transition-colors duration-200 ${isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`}>
          Drag and drop files here, both <span className="font-bold">.skel(.json)</span> and <span className="font-bold">.atlas</span> files are required.
        </p>
      </div>
    </div>
  )
}