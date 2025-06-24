import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { Menu } from './Layout/Menu'
import { EmptyBox } from './Layout/EmptyBox'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import { isNull } from 'lodash'
import { Scene as Scene40 } from './Layout/Scen40'
import { getAtlasPngList } from './lib/utils'
import { Toaster } from "@/components/ui/sonner"
import { Scene as Scene38 } from './Layout/Scen38'
import { toast } from 'sonner'
// 创建一个内部组件来使用 useSelector
const AppContent: React.FC = () => {
  const fileList = useSelector((state: RootState) => state.global.fileList)
  const { skel, json, atlas, skelVersion } = fileList
  const spineResourceReady = (!isNull(skel.file) || !isNull(json.file)) && !isNull(atlas.file)
  if(spineResourceReady &&skelVersion === null) toast.info('Skeleton version is not supported.')
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
        {spineResourceReady && skelVersion?.startsWith('3.8') && <Scene38 />}
        {spineResourceReady && skelVersion?.startsWith('4.0') && <Scene40 />}
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