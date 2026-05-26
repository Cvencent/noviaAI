import { useState, useCallback, useRef, useEffect } from 'react'
import { X, GripVertical, ChevronLeft, ChevronRight, Pin, PinOff } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Tab {
  id: string
  path: string
  label: string
  icon?: React.ReactNode
  pinned?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onCloseAll: () => void
  onCloseRight: (tabId: string) => void
  onReorderTab: (startIndex: number, endIndex: number) => void
  onTogglePin: (tabId: string) => void
  onTabChange?: (path: string) => void
}

export const TabBar = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onCloseAll,
  onCloseRight,
  onReorderTab,
  onTogglePin,
  onTabChange,
}: TabBarProps) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const doubleClickTimer = useRef<number | null>(null)

  useEffect(() => {
    const container = tabsContainerRef.current
    if (!container) return

    const checkScroll = () => {
      setShowScrollLeft(container.scrollLeft > 0)
      setShowScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth)
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    return () => container.removeEventListener('scroll', checkScroll)
  }, [tabs])

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current
    if (!container) return
    const scrollAmount = 150
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }

  const handleCloseAll = () => {
    onCloseAll()
    setContextMenu(null)
  }

  const handleCloseRight = () => {
    if (contextMenu) {
      onCloseRight(contextMenu.tabId)
      setContextMenu(null)
    }
  }

  const handleClickOutside = () => {
    setContextMenu(null)
  }

  const handleTabDoubleClick = (tabId: string) => {
      if (doubleClickTimer.current) {
        clearTimeout(doubleClickTimer.current)
        onTabClose(tabId)
        doubleClickTimer.current = null
      } else {
        doubleClickTimer.current = window.setTimeout(() => {
          doubleClickTimer.current = null
        }, 300)
      }
    }

    const handleTabClickWithNavigate = (tabId: string) => {
      onTabClick(tabId)
      const tab = tabs.find(t => t.id === tabId)
      if (tab && onTabChange) {
        onTabChange(tab.path)
      }
    }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderTab(draggedIndex, index)
    }
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Tab') {
          e.preventDefault()
          const currentIndex = tabs.findIndex(t => t.id === activeTabId)
          const direction = e.shiftKey ? -1 : 1
          const nextIndex = (currentIndex + direction + tabs.length) % tabs.length
          if (tabs[nextIndex]) {
            onTabClick(tabs[nextIndex].id)
          }
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault()
          if (activeTabId) {
            onTabClose(activeTabId)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, onTabClick, onTabClose])

  const pinnedTabs = tabs.filter(t => t.pinned)
  const unpinnedTabs = tabs.filter(t => !t.pinned)

  return (
    <>
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleClickOutside}
          />
          <div 
            className="fixed z-50 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                onTogglePin(contextMenu.tabId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-xs text-left text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
            >
              {tabs.find(t => t.id === contextMenu.tabId)?.pinned ? (
                <><PinOff className="w-3 h-3" /> 取消固定</>
              ) : (
                <><Pin className="w-3 h-3" /> 固定标签页</>
              )}
            </button>
            <div className="border-t border-[var(--border-color)] my-1" />
            <button
              onClick={handleCloseRight}
              className="w-full px-4 py-2 text-xs text-left text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              关闭右侧标签页
            </button>
            <button
              onClick={handleCloseAll}
              className="w-full px-4 py-2 text-xs text-left text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              关闭所有标签页
            </button>
          </div>
        </>
      )}
      
      <div className="h-8 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] flex items-center">
        {showScrollLeft && (
          <button
            onClick={() => scrollTabs('left')}
            className="h-full w-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-r border-[var(--border-color)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        
        <div 
          ref={tabsContainerRef}
          className="flex-1 flex items-center h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          <div className="flex items-center h-full">
            {pinnedTabs.map((tab) => (
              <div
                key={tab.id}
                draggable={false}
                className={cn(
                  "group flex items-center gap-1 px-3 h-full border-r border-[var(--border-color)] cursor-pointer transition-colors min-w-[100px] max-w-[200px] bg-gradient-to-b from-[var(--bg-hover)] to-[var(--bg-tertiary)]",
                  activeTabId === tab.id
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent-color)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
                onClick={() => handleTabClickWithNavigate(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                onDoubleClick={() => handleTabDoubleClick(tab.id)}
              >
                <Pin className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span className="flex-1 text-xs truncate">{tab.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
              <div className="w-1 h-4 bg-[var(--border-color)] mx-1" />
            )}
            
            {unpinnedTabs.map((tab, index) => (
              <div
                key={tab.id}
                draggable
                onDragStart={() => handleDragStart(pinnedTabs.length + index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(pinnedTabs.length + index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group flex items-center gap-1.5 px-3 h-full border-r border-[var(--border-color)] cursor-pointer transition-colors min-w-[100px] max-w-[200px]",
                  activeTabId === tab.id
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent-color)]"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                  draggedIndex === pinnedTabs.length + index ? 'opacity-50 scale-95' : ''
                )}
                onClick={() => handleTabClickWithNavigate(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                onDoubleClick={() => handleTabDoubleClick(tab.id)}
              >
                <GripVertical className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-grab" />
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span className="flex-1 text-xs truncate">{tab.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {showScrollRight && (
          <button
            onClick={() => scrollTabs('right')}
            className="h-full w-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-l border-[var(--border-color)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {tabs.length >= 10 && (
          <div className="px-2 text-xs text-[var(--text-muted)] flex-shrink-0 border-l border-[var(--border-color)]">
            {tabs.length}/20
          </div>
        )}
      </div>
    </>
  )
}

export const useTabManager = (maxTabs: number = 20) => {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const openTab = useCallback((path: string, label: string, icon?: React.ReactNode) => {
    const existingTab = tabs.find(tab => tab.path === path)
    
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    let newTabs = [...tabs]
    let tabIdToActivate: string
    
    if (newTabs.length >= maxTabs) {
      const closedTabId = newTabs.filter(t => !t.pinned)[0]?.id || newTabs[0].id
      newTabs = newTabs.filter(t => t.id !== closedTabId)
    }

    const newTab: Tab = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path,
      label,
      icon,
      pinned: false,
    }
    
    tabIdToActivate = newTab.id
    newTabs = [...newTabs, newTab]
    
    setTabs(newTabs)
    setActiveTabId(tabIdToActivate)
  }, [tabs, maxTabs])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      
      if (activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId)
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
        setActiveTabId(newTabs[newActiveIndex]?.id || null)
      }
      
      return newTabs
    })
  }, [activeTabId])

  const closeAllTabs = useCallback(() => {
    setTabs([])
    setActiveTabId(null)
  }, [])

  const closeTabsToRight = useCallback((tabId: string) => {
    setTabs(prev => {
      const tabIndex = prev.findIndex(t => t.id === tabId)
      const newTabs = prev.slice(0, tabIndex + 1)
      
      if (activeTabId && !newTabs.find(t => t.id === activeTabId)) {
        setActiveTabId(newTabs[newTabs.length - 1]?.id || null)
      }
      
      return newTabs
    })
  }, [activeTabId])

  const reorderTabs = useCallback((startIndex: number, endIndex: number) => {
    setTabs(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  const togglePinTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, pinned: !t.pinned } : t
    ))
  }, [])

  const getActiveTab = useCallback(() => {
    return tabs.find(t => t.id === activeTabId)
  }, [tabs, activeTabId])

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    closeAllTabs,
    closeTabsToRight,
    reorderTabs,
    togglePinTab,
    getActiveTab,
  }
}
