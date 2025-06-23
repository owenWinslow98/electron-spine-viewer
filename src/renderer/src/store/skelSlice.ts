import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SkeletonState {
  skinName: string[]
  animationName: string[]
  scale: number
  x: number
  y: number
  isLoaded: boolean
}

const initialState: SkeletonState = {
  skinName: [],  // 默认皮肤
  animationName: [],  // 默认动画
  scale: 1,  // 默认缩放
  x: 0,  // 默认X位置
  y: 0,  // 默认Y位置
  isLoaded: false  // 是否已加载
}

export const skeletonSlice = createSlice({
  name: 'skeleton',
  initialState,
  reducers: {
    setSkin: (state, action: PayloadAction<string[]>) => {
      state.skinName = action.payload
    },
    setAnimation: (state, action: PayloadAction<string[]>) => {
      state.animationName = action.payload
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = action.payload
    },
    setPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.x = action.payload.x
      state.y = action.payload.y
    },
    setLoaded: (state, action: PayloadAction<boolean>) => {
      state.isLoaded = action.payload
    },
    resetSkeleton: (state) => {
      state.skinName = []
      state.animationName = []
      state.scale = 1
      state.x = 0
      state.y = 0
      state.isLoaded = false
    }
  }
})

export const { 
  setSkin, 
  setAnimation, 
  setScale, 
  setPosition, 
  setLoaded, 
  resetSkeleton 
} = skeletonSlice.actions

export default skeletonSlice.reducer