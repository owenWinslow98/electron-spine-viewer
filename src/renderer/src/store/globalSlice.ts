import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export interface SpineFile {
  file: string | null,
  path: string | null,
  name: string,
}

export interface GlobalState {
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  fileList: {
    skel: SpineFile,
    json: SpineFile,
    atlas: SpineFile,
    skins: SpineFile[],
  }
}

const initialState: GlobalState = {
  isLoading: false,
  error: null,
  theme: 'light',
  sidebarCollapsed: false,
  fileList: {
    skel: {
      file: null,
      path: null,
      name: ''
    },
    json: {
      file: null,
      path: null,
      name: ''
    },
    atlas: {
      file: null,
      path: null,
      name: ''
    },
    skins: [],
  }
}

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setFileList: (state, action: PayloadAction<{
      skel: SpineFile | null,
      json: SpineFile | null,
      atlas: SpineFile | null,
      skins: SpineFile[],
    }>) => {
      if (action.payload.skel) state.fileList.skel = action.payload.skel
      if (action.payload.json) state.fileList.json = action.payload.json
      if (action.payload.atlas) state.fileList.atlas = action.payload.atlas
      if (action.payload.skins) state.fileList.skins = action.payload.skins
    },
  },
})

export const {
  setLoading,
  setError,
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setFileList,
} = globalSlice.actions

export default globalSlice.reducer
