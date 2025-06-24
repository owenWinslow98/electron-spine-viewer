import { LocalAssetManager } from '../lib/spine3.8/AssetLoader'
import { RootState } from '@/store'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isNull, isUndefined } from 'lodash'
import { SkelForm } from './SkelForm'

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
    gl: WebGLRenderingContext | null;
    shader: any;
    batcher: any;
    mvp: any;
    skeletonRenderer: any;
    assetManager: any;
    skeleton: any;
    state: any;
    bounds: any;
    swirlEffect: any;
    jitterEffect: any;
    lastFrameTime: number;
  }>({
    gl: null,
    shader: null,
    batcher: null,
    mvp: null,
    skeletonRenderer: null,
    assetManager: null,
    skeleton: null,
    state: null,
    bounds: null,
    swirlEffect: null,
    jitterEffect: null,
    lastFrameTime: 0,
  });
  const fileList = useSelector((state: RootState) => state.global.fileList)
  const skinName = useSelector((state: RootState) => state.skel.skinName)
  const animationName = useSelector((state: RootState) => state.skel.animationName)

  const [skinsList, setSkinsList] = useState<string[]>([])
  const [animationList, setAnimationList] = useState<string[]>([])

  const isSkelFile = !isNull(fileList.skel.file)

  const { spine38 } = window
  const spine = spine38 as typeof spine38

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
    let loadId: number
    let checkLoadingId: number
    let renderId: number

    const init = () => {
      const canvas = canvasRef.current!;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const gl = canvas.getContext('webgl', { alpha: false }) || canvas.getContext('experimental-webgl', { alpha: false });
      if (!gl) return;

      const { Shader, PolygonBatcher, Matrix4, SkeletonRenderer } = spine.webgl
      const glContext = gl as any
      const shader = Shader.newTwoColoredTextured(glContext);

      const batcher = new PolygonBatcher(glContext)
      const mvp = new Matrix4()
      mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);

      const skeletonRenderer = new SkeletonRenderer(glContext)
      const assetManager = new LocalAssetManager(glContext as any)
      // vertex effect
      const swirlEffect = new spine.SwirlEffect(0);
      const jitterEffect = new spine.JitterEffect(20, 20);

      sceneRef.current = {
        gl: gl as WebGLRenderingContext, shader, batcher, mvp, skeletonRenderer, assetManager,
        skeleton: null, state: null, bounds: null,
        swirlEffect, jitterEffect, lastFrameTime: Date.now() / 1000,
      };

      loadResources()
    };

    const loadResources = async () => {

      const { assetManager } = sceneRef.current
      if (!assetManager) return
      const { skel, atlas, json } = fileList
      assetManager.loadTextureAtlas(atlas.name);
      if (isSkelFile) assetManager.loadBinary(skel.name);
      if (!isSkelFile) assetManager.loadText(json.name);
      // 检查加载状态
      const checkLoading = () => {
        if (assetManager.isLoadingComplete()) {
          load()
          startRender()
        } else {
          checkLoadingId = requestAnimationFrame(checkLoading)
        }
      }
      checkLoading()
    }

    function load() {
      const { assetManager } = sceneRef.current;
      if (assetManager.isLoadingComplete()) {
        // 加载 skeleton
        const { skel, atlas, json } = fileList
        const atlasResource = assetManager.get(atlas.name)
        const atlasLoader = new spine.AtlasAttachmentLoader(atlasResource)
        const skeletonLoader = isSkelFile ? new spine.SkeletonBinary(atlasLoader) : new spine.SkeletonJson(atlasLoader)
        skeletonLoader.scale = 1

        const skeletonData = skeletonLoader.readSkeletonData(assetManager.get(isSkelFile ? skel.name : json.name))

        const skeleton = new spine.Skeleton(skeletonData);
        sceneRef.current.skeleton = skeleton
        const skinsList = skeleton.data.skins.map((skin: spine.Skin) => skin.name)

        setSkinsList(skinsList)
        let initSkin = skinsList.find((skin: string) => skin !== 'default')
        if (isUndefined(initSkin)) initSkin = 'default'
        SkelSetSkin(initSkin)
        skeleton.setSkinByName(initSkin);
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform();

        // const bounds = calculateSetupPoseBounds(skeleton);

        // 动画
        const animationStateData = new spine.AnimationStateData(skeleton.data);
        const animationState = new spine.AnimationState(animationStateData);
        sceneRef.current.state = animationState
        const animationsList = skeleton.data.animations.map((animation: spine.Animation) => animation.name)
        setAnimationList(animationsList)
        form.setValue('skeletonVersion', skeleton.data.version)
      } else {
        loadId = requestAnimationFrame(load);
      }
    }

    const startRender = () => {
      function render() {
        const now = Date.now() / 1000;
        const delta = now - sceneRef.current.lastFrameTime;
        sceneRef.current.lastFrameTime = now;

        const { gl, shader, batcher, mvp, skeletonRenderer, skeleton, state } = sceneRef.current;
        if (!gl || !shader || !batcher || !mvp || !skeletonRenderer || !skeleton || !state) {
          renderId = requestAnimationFrame(render);
          return;
        }

        // 更新动画
        state.update(delta);
        state.apply(skeleton);
        skeleton.updateWorldTransform();

        // 清屏
        gl.clearColor(0.3, 0.3, 0.3, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 绑定 shader
        shader.bind();
        shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
        shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

        // 批处理
        batcher.begin(shader);
        skeletonRenderer.premultipliedAlpha = true;
        skeletonRenderer.draw(batcher, skeleton);
        batcher.end();
        shader.unbind();

        renderId = requestAnimationFrame(render);
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
      if (loadId) cancelAnimationFrame(loadId)
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
          id={'spine38'}
          key={'spine38'}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}