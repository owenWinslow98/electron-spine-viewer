import { configureStore } from '@reduxjs/toolkit'
import globalReducer from './globalSlice'
import skelReducer from './skelSlice'
export const store = configureStore({
  reducer: {
    skel: skelReducer,
    global: globalReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 