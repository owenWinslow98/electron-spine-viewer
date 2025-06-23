import React from 'react'
import { Button } from './ui/button'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { 
  setLoading, 
  setError, 
  toggleTheme, 
  toggleSidebar 
} from '@/store/globalSlice'

export const ReduxExample: React.FC = () => {
  const dispatch = useAppDispatch()
  
  // 从 store 中获取状态
  const { isLoading, error, theme, sidebarCollapsed } = useAppSelector(
    (state) => state.global
  )

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Redux 使用示例</h2>
      
      {/* 显示当前状态 */}
      <div className="space-y-2">
        <p>加载状态: {isLoading ? '加载中...' : '空闲'}</p>
        <p>主题: {theme}</p>
        <p>侧边栏: {sidebarCollapsed ? '折叠' : '展开'}</p>
        {error && <p className="text-red-500">错误: {error}</p>}
      </div>

      {/* 操作按钮 */}
      <div className="space-x-2">
        <Button 
          onClick={() => dispatch(setLoading(!isLoading))}
          variant="outline"
        >
          {isLoading ? '停止加载' : '开始加载'}
        </Button>
        
        <Button 
          onClick={() => dispatch(toggleTheme())}
          variant="outline"
        >
          切换主题
        </Button>
        
        <Button 
          onClick={() => dispatch(toggleSidebar())}
          variant="outline"
        >
          切换侧边栏
        </Button>
        
        <Button 
          onClick={() => dispatch(setError('这是一个测试错误'))}
          variant="destructive"
        >
          设置错误
        </Button>
        
        <Button 
          onClick={() => dispatch(setError(null))}
          variant="outline"
        >
          清除错误
        </Button>
      </div>
    </div>
  )
} 