import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { Menu } from './Layout/Menu'
import { EmptyBox } from './Layout/EmptyBox'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import { isNull } from 'lodash'
import { Scene } from './Layout/Scen'
import { getAtlasPngList } from './lib/utils'
import { Toaster } from "@/components/ui/sonner"
// 创建一个内部组件来使用 useSelector
const AppContent: React.FC = () => {
  const fileList = useSelector((state: RootState) => state.global.fileList)
  const { skel, json, atlas } = fileList
  const spineResourceReady = (!isNull(skel.file) || !isNull(json.file)) && !isNull(atlas.file)
  useEffect(() => {
    const { ipc } = window
    ipc.ipcRenderer.answerMain('get-atlas-png-list', (data) => {
      const list = getAtlasPngList(data.atlasText)
      return list
    })
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <Menu />
      <div className="flex-1 flex items-center justify-center h-full">
        {!spineResourceReady && <EmptyBox />}
        {spineResourceReady && <Scene />}
      </div>
      <Toaster />
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App