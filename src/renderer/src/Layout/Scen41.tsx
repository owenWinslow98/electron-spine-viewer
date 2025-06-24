import { LocalReduxDownloader, LocalAssetLoader as AssetManager } from '@/lib/spine4.1/AssetLoader'
import { RootState } from '@/store'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import * as spine from 'spine-webgl41'
import { ManagedWebGLRenderingContext } from 'spine-webgl41'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { isNull, isUndefined } from 'lodash'
import { SkelForm } from './SkelForm'
import { toast } from 'sonner'

interface SceneProps {
  className?: string
}
const FormSchema = z.object({
  skins: z
    .string({}),
  animations: z
    .string({}),
  skeletonVersion: z.string({}),
})

export const Scene: React.FC<SceneProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    gl: WebGLRenderingContext | null
    shader: any
    batcher: any
    mvp: any
    skeletonRenderer: any
    assetManager: any
    lastFrameTime: number
    skeleton: any
    state: any
  }>({
    gl: null,
    shader: null,
    batcher: null,
    mvp: null,
    skeletonRenderer: null,
    assetManager: null,
    lastFrameTime: 0,
    skeleton: null,
    state: null
  })
  const fileList = useSelector((state: RootState) => state.global.fileList)
  const skinName = useSelector((state: RootState) => state.skel.skinName)
  const animationName = useSelector((state: RootState) => state.skel.animationName)

  const [skinsList, setSkinsList] = useState<string[]>([])
  const [animationList, setAnimationList] = useState<string[]>([])

  const isSkelFile = !isNull(fileList.skel.file)


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      skins: '',
      animations: '',
      skeletonVersion: '',
    },
    shouldUnregister: false
  })

  const SkelSetSkin = useCallback((value: string) => {
    const { skeleton } = sceneRef.current
    if (!skeleton) return
    if (!value) return
    skeleton.setSkinByName(value)
  }, [skinName])

  const SkelSetAnimation = useCallback((value: string) => {
    const { skeleton, state } = sceneRef.current
    if (!skeleton || !state) return
    if (!value) return
    state.setAnimation(0, value, true)
  }, [animationName])
  const resizeSkel = useCallback(() => {

    const { skeleton, mvp, gl } = sceneRef.current
    const canvas = canvasRef.current
    if (!skeleton || !mvp || !gl || !canvas) return
    mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1)
    gl.viewport(0, 0, canvas.width - 1, canvas.height - 1)
    const offset = new spine.Vector2()
    const size = new spine.Vector2()
    skeleton.getBounds(offset, size)

    const scaleX = canvas.width / size.x
    const scaleY = canvas.height / size.y
    const scale = Math.min(scaleX, scaleY) * 0.9

    skeleton.scaleX *= scale
    skeleton.scaleY *= scale
    skeleton.updateWorldTransform()
    skeleton.x = canvas.width / 2
    skeleton.y = canvas.height * skeleton.scaleY * 0.1 / 2
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let checkLoadingId: number
    let renderId: number
    const init = () => {
      // 设置画布尺寸
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      // 获取 WebGL 上下文
      const config = { alpha: false }
      const gl = canvas.getContext('webgl', config) || canvas.getContext('experimental-webgl', config)
      if (!gl) {
        console.error('WebGL is unavailable.')
        return
      }
      const glContext = new ManagedWebGLRenderingContext(canvas, gl)
      // 创建基础组件
      const shader = spine.Shader.newTwoColoredTextured(glContext)
      const batcher = new spine.PolygonBatcher(glContext)
      const mvp = new spine.Matrix4()
      const skeletonRenderer = new spine.SkeletonRenderer(glContext)
      const assetManager = new AssetManager(glContext, '', new LocalReduxDownloader() as unknown as spine.Downloader)
      // 设置 MVP 矩阵
      mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1)

      // 保存到 ref
      sceneRef.current = {
        gl: gl as WebGLRenderingContext,
        shader,
        batcher,
        mvp,
        skeletonRenderer,
        assetManager,
        lastFrameTime: Date.now() / 1000,
        skeleton: null,
        state: null
      }

      // 加载资源
      loadResources()
    }

    const loadResources = async () => {

      const { assetManager } = sceneRef.current
      if (!assetManager) return
      const { skel, atlas, json } = fileList
      assetManager.loadTextureAtlas(atlas.name);
      if (isSkelFile) assetManager.loadBinary(skel.name);
      if (!isSkelFile) assetManager.loadJson(json.name);
      await assetManager.loadAll();
      // 检查加载状态
      const checkLoading = () => {
        if (assetManager.isLoadingComplete()) {
          loadSkeleton()
          startRender()
        } else {
          checkLoadingId = requestAnimationFrame(checkLoading)
        }
      }
      checkLoading()
    }

    const loadSkeleton = () => {
      const { assetManager, gl } = sceneRef.current
      if (!assetManager || !gl) return

      try {
        // 加载纹理图集
        const { skel, atlas, json } = fileList
        const atlasResource = assetManager.require(atlas.name)
        const atlasLoader = new spine.AtlasAttachmentLoader(atlasResource)

        // 创建骨架加载器

        const skeletonLoader = isSkelFile ? new spine.SkeletonBinary(atlasLoader) : new spine.SkeletonJson(atlasLoader)

        // 加载骨架数据
        const skeletonData = skeletonLoader.readSkeletonData(assetManager.require(isSkelFile ? skel.name : json.name))
        const skeleton = new spine.Skeleton(skeletonData)
        sceneRef.current.skeleton = skeleton
        const skinsList = skeleton.data.skins.map((skin: spine.Skin) => skin.name)

        setSkinsList(skinsList)
        let initSkin = skinsList.find((skin: string) => skin !== 'default')
        if (isUndefined(initSkin)) initSkin = 'default'
        SkelSetSkin(initSkin)
        // 创建动画状态
        const animationStateData = new spine.AnimationStateData(skeleton.data)
        const animationState = new spine.AnimationState(animationStateData)
        sceneRef.current.state = animationState
        const animationsList = skeleton.data.animations.map((animation: spine.Animation) => animation.name)
        setAnimationList(animationsList)
        form.setValue('skeletonVersion', skeleton.data.version || '')
        // 保存骨架和状态
      } catch (error) {
        // console.error('Failed to load skeleton:', error)
        toast.error(`Failed to load skeleton: ${error}`)
      }
    }

    const startRender = () => {
      const render = () => {
        const now = Date.now() / 1000
        const delta = now - sceneRef.current.lastFrameTime
        sceneRef.current.lastFrameTime = now

        const { gl, shader, batcher, mvp, skeletonRenderer, skeleton, state } = sceneRef.current
        if (!gl || !shader?.program || !batcher || !mvp || !skeletonRenderer || !skeleton || !state) {
          renderId = requestAnimationFrame(render)
          return
        }
        // 清除画布
        gl.clearColor(0.3, 0.3, 0.3, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // 更新动画
        state.update(delta)
        state.apply(skeleton)
        skeleton.updateWorldTransform()

        // 绑定着色器
        shader.bind()
        shader.setUniformi(spine.Shader.SAMPLER, 0)
        shader.setUniform4x4f(spine.Shader.MVP_MATRIX, mvp.values)

        // 开始批处理
        batcher.begin(shader)

        // 渲染骨架
        skeletonRenderer.premultipliedAlpha = true
        skeletonRenderer.draw(batcher, skeleton)
        batcher.end()

        shader.unbind()

        renderId = requestAnimationFrame(render)
      }
      render()
      resizeSkel()
    }

    // 初始化
    init()

    // 清理函数
    return () => {
      // 清理 WebGL 资源
      const { gl, shader, batcher } = sceneRef.current
      if (gl) {
        if (shader?.program) gl?.deleteProgram(shader.program);
        if (shader) shader.dispose()
        if (batcher) batcher.dispose()
      }
      if (checkLoadingId) cancelAnimationFrame(checkLoadingId)
      if (renderId) cancelAnimationFrame(renderId)
    }
  }, [fileList])
  useEffect(() => {
    const rb = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const canvas = canvasRef.current as HTMLCanvasElement;
        canvas.width = width;
        canvas.height = height;
        resizeSkel()
      }
    })
    rb.observe(containerRef.current as HTMLDivElement)
    return () => {
      rb.disconnect()
    }
  }, [])

  useEffect(() => {
    let initSkin = skinsList.find((skin: string) => skin !== 'default')
    if (isUndefined(initSkin)) initSkin = 'default'
    form.setValue('skins', initSkin)
  }, [skinsList])


  useEffect(() => {
    SkelSetAnimation(animationList[0])
    form.setValue('animations', animationList[0])
  }, [animationList])

  return (
    <div className='flex w-[100vw] h-full'>
      <SkelForm
        onSkinChange={SkelSetSkin}
        onAnimationChange={SkelSetAnimation}
        form={form}
        skinsList={skinsList}
        animationList={animationList}
      />
      <div className='flex-1 h-full' ref={containerRef}>
        <canvas
          ref={canvasRef}
          id='spine40'
          key='spine40'
          className="w-full h-full"
        />
      </div>
    </div>
  )
}