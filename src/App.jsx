import { useState, useEffect, useRef } from 'react'
import './App.css'

const STORAGE_KEY = 'mandalart-data'
const COLOR_STORAGE_KEY = 'mandalart-colors'
const TITLE_STORAGE_KEY = 'mandalart-title'
const SUBTITLE_STORAGE_KEY = 'mandalart-subtitle'

const DEFAULT_TITLE = '만다라트 플래너'
const DEFAULT_SUBTITLE = '중앙에 핵심 목표를 입력하고, 주변에 세부 목표와 실행 계획을 작성하세요💪'

const DEFAULT_COLORS = {
  mainCenter: '#ff6b6b',
  centerGrid: '#ffd93d',
  subCenter: '#6bcb77',
  background: '#ffffff',
  gridLine: '#333333',
  subGrid0: '#e8f4f8',
  subGrid1: '#fff3e0',
  subGrid2: '#f3e5f5',
  subGrid3: '#e0f2f1',
  subGrid5: '#fce4ec',
  subGrid6: '#e8eaf6',
  subGrid7: '#fff8e1',
  subGrid8: '#e0f7fa',
  title: '#333333',
  subtitle: '#666666'
}

function App() {
  // 9x9 그리드 데이터 초기화 (81개 셀) - localStorage에서 불러오기
  const [cells, setCells] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return Array(81).fill('')
      }
    }
    return Array(81).fill('')
  })

  const [selectedCell, setSelectedCell] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [title, setTitle] = useState(() => {
    return localStorage.getItem(TITLE_STORAGE_KEY) || DEFAULT_TITLE
  })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [subtitle, setSubtitle] = useState(() => {
    return localStorage.getItem(SUBTITLE_STORAGE_KEY) || DEFAULT_SUBTITLE
  })
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false)
  const [colors, setColors] = useState(() => {
    const saved = localStorage.getItem(COLOR_STORAGE_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_COLORS, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_COLORS
      }
    }
    return DEFAULT_COLORS
  })
  const inputRefs = useRef([])
  const isNavigating = useRef(false)

  // 자동 저장 (cells가 변경될 때마다)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
  }, [cells])

  // 색상 변경 시 CSS 변수 업데이트 및 저장
  useEffect(() => {
    document.documentElement.style.setProperty('--color-main-center', colors.mainCenter)
    document.documentElement.style.setProperty('--color-center-grid', colors.centerGrid)
    document.documentElement.style.setProperty('--color-sub-center', colors.subCenter)
    document.documentElement.style.setProperty('--color-background', colors.background)
    document.documentElement.style.setProperty('--color-grid-line', colors.gridLine)
    document.documentElement.style.setProperty('--color-sub-grid-0', colors.subGrid0)
    document.documentElement.style.setProperty('--color-sub-grid-1', colors.subGrid1)
    document.documentElement.style.setProperty('--color-sub-grid-2', colors.subGrid2)
    document.documentElement.style.setProperty('--color-sub-grid-3', colors.subGrid3)
    document.documentElement.style.setProperty('--color-sub-grid-5', colors.subGrid5)
    document.documentElement.style.setProperty('--color-sub-grid-6', colors.subGrid6)
    document.documentElement.style.setProperty('--color-sub-grid-7', colors.subGrid7)
    document.documentElement.style.setProperty('--color-sub-grid-8', colors.subGrid8)
    document.documentElement.style.setProperty('--color-title', colors.title)
    document.documentElement.style.setProperty('--color-subtitle', colors.subtitle)
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors))
  }, [colors])

  // 수동 저장
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
    setSaveStatus('저장됨!')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  // 초기화
  const handleClear = () => {
    if (window.confirm('모든 내용을 삭제하시겠습니까?')) {
      setCells(Array(81).fill(''))
    }
  }

  // 색상 변경
  const handleColorChange = (colorKey, value) => {
    setColors(prev => ({ ...prev, [colorKey]: value }))
  }

  // 색상 초기화
  const handleResetColors = () => {
    setColors(DEFAULT_COLORS)
  }

  // 제목 변경
  const handleTitleChange = (newTitle) => {
    const trimmed = newTitle.trim() || DEFAULT_TITLE
    setTitle(trimmed)
    localStorage.setItem(TITLE_STORAGE_KEY, trimmed)
    setIsEditingTitle(false)
  }

  // 부제목 변경
  const handleSubtitleChange = (newSubtitle) => {
    const trimmed = newSubtitle.trim() || DEFAULT_SUBTITLE
    setSubtitle(trimmed)
    localStorage.setItem(SUBTITLE_STORAGE_KEY, trimmed)
    setIsEditingSubtitle(false)
  }

  // 셀 값 변경 핸들러 (blur 시 저장)
  const handleCellBlur = (index, value) => {
    const newCells = [...cells]
    newCells[index] = value

    // 중앙 그리드의 주변 셀이 변경되면 해당 서브그리드의 중앙에도 반영
    const centerGridCells = [30, 31, 32, 39, 40, 41, 48, 49, 50]
    const subGridCenters = [10, 13, 16, 37, 43, 64, 67, 70]

    const centerIndex = centerGridCells.indexOf(index)
    if (centerIndex !== -1 && centerIndex !== 4) {
      const mapping = [0, 1, 2, 3, -1, 4, 5, 6, 7]
      const subGridCenterIndex = subGridCenters[mapping[centerIndex]]
      if (subGridCenterIndex !== undefined) {
        newCells[subGridCenterIndex] = value
        // 해당 input도 업데이트
        if (inputRefs.current[subGridCenterIndex]) {
          inputRefs.current[subGridCenterIndex].value = value
        }
      }
    }

    setCells(newCells)
  }

  // 방향키 이동 핸들러
  const handleKeyDown = (e, index) => {
    // 한글 조합 중일 때는 방향키 이동 안함 (중복 입력 방지)
    if (e.nativeEvent.isComposing) return

    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter']
    if (!navigationKeys.includes(e.key)) return

    const row = Math.floor(index / 9)
    const col = index % 9
    let newIndex = index

    switch (e.key) {
      case 'ArrowUp':
        if (row > 0) newIndex = index - 9
        break
      case 'ArrowDown':
        if (row < 8) newIndex = index + 9
        break
      case 'ArrowLeft':
        if (col > 0) newIndex = index - 1
        break
      case 'ArrowRight':
        if (col < 8) newIndex = index + 1
        break
      case 'Enter':
        if (row < 8) newIndex = index + 9
        break
      default:
        return
    }

    if (newIndex !== index && inputRefs.current[newIndex]) {
      e.preventDefault()
      e.stopPropagation()

      // 현재 셀 값 먼저 저장
      const currentValue = e.target.value
      handleCellBlur(index, currentValue)

      // blur에서 중복 저장 방지
      isNavigating.current = true

      // 다음 셀로 이동
      inputRefs.current[newIndex].focus()

      // 플래그 리셋
      setTimeout(() => {
        isNavigating.current = false
      }, 0)
    }
  }

  // 9x9 그리드에서 3x3 서브그리드와 셀 위치 계산
  const getSubGridInfo = (index) => {
    const row = Math.floor(index / 9)
    const col = index % 9
    const subGridRow = Math.floor(row / 3)
    const subGridCol = Math.floor(col / 3)
    const innerRow = row % 3
    const innerCol = col % 3
    const isCenter = innerRow === 1 && innerCol === 1
    const isCenterGrid = subGridRow === 1 && subGridCol === 1
    const isMainCenter = isCenterGrid && isCenter

    return { subGridRow, subGridCol, innerRow, innerCol, isCenter, isCenterGrid, isMainCenter }
  }

  // 셀 색상 결정
  const getCellColor = (index) => {
    const { subGridRow, subGridCol, isCenter, isCenterGrid, isMainCenter } = getSubGridInfo(index)

    if (isMainCenter) return 'cell-main-center'
    if (isCenterGrid) return 'cell-center-grid'
    if (isCenter) return 'cell-sub-center'

    // 서브그리드별 색상
    const gridIndex = subGridRow * 3 + subGridCol
    const colors = [
      'cell-grid-0', 'cell-grid-1', 'cell-grid-2',
      'cell-grid-3', 'cell-grid-4', 'cell-grid-5',
      'cell-grid-6', 'cell-grid-7', 'cell-grid-8'
    ]
    return colors[gridIndex]
  }

  return (
    <div className="mandalart-container">
      <button
        className="settings-toggle"
        onClick={() => setShowColorSettings(!showColorSettings)}
        title="색상 설정"
      >
        🎨
      </button>

      {showColorSettings && (
        <div className="color-settings-panel">
          <h3>색상 설정</h3>
          <div className="color-option">
            <label>핵심 목표</label>
            <input
              type="color"
              value={colors.mainCenter}
              onChange={(e) => handleColorChange('mainCenter', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>중앙 그리드</label>
            <input
              type="color"
              value={colors.centerGrid}
              onChange={(e) => handleColorChange('centerGrid', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>세부 목표</label>
            <input
              type="color"
              value={colors.subCenter}
              onChange={(e) => handleColorChange('subCenter', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>바탕색</label>
            <input
              type="color"
              value={colors.background}
              onChange={(e) => handleColorChange('background', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>제목</label>
            <input
              type="color"
              value={colors.title}
              onChange={(e) => handleColorChange('title', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>부제목</label>
            <input
              type="color"
              value={colors.subtitle}
              onChange={(e) => handleColorChange('subtitle', e.target.value)}
            />
          </div>
          <div className="color-option">
            <label>선 색상</label>
            <input
              type="color"
              value={colors.gridLine}
              onChange={(e) => handleColorChange('gridLine', e.target.value)}
            />
          </div>
          <div className="color-section-title">실행 계획 칸 (8개 영역)</div>
          <div className="sub-grid-colors">
            <input type="color" value={colors.subGrid0} onChange={(e) => handleColorChange('subGrid0', e.target.value)} title="좌상단" />
            <input type="color" value={colors.subGrid1} onChange={(e) => handleColorChange('subGrid1', e.target.value)} title="상단" />
            <input type="color" value={colors.subGrid2} onChange={(e) => handleColorChange('subGrid2', e.target.value)} title="우상단" />
            <input type="color" value={colors.subGrid3} onChange={(e) => handleColorChange('subGrid3', e.target.value)} title="좌측" />
            <div className="sub-grid-center-placeholder"></div>
            <input type="color" value={colors.subGrid5} onChange={(e) => handleColorChange('subGrid5', e.target.value)} title="우측" />
            <input type="color" value={colors.subGrid6} onChange={(e) => handleColorChange('subGrid6', e.target.value)} title="좌하단" />
            <input type="color" value={colors.subGrid7} onChange={(e) => handleColorChange('subGrid7', e.target.value)} title="하단" />
            <input type="color" value={colors.subGrid8} onChange={(e) => handleColorChange('subGrid8', e.target.value)} title="우하단" />
          </div>
          <button className="reset-colors-btn" onClick={handleResetColors}>
            기본 색상으로 초기화
          </button>
        </div>
      )}

      {isEditingTitle ? (
        <input
          type="text"
          className="title-input"
          defaultValue={title}
          autoFocus
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTitleChange(e.target.value)
            } else if (e.key === 'Escape') {
              setIsEditingTitle(false)
            }
          }}
        />
      ) : (
        <h1 onClick={() => setIsEditingTitle(true)} className="editable-title">{title}</h1>
      )}
      {isEditingSubtitle ? (
        <input
          type="text"
          className="subtitle-input"
          defaultValue={subtitle}
          autoFocus
          onBlur={(e) => handleSubtitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubtitleChange(e.target.value)
            } else if (e.key === 'Escape') {
              setIsEditingSubtitle(false)
            }
          }}
        />
      ) : (
        <p className="subtitle editable-subtitle" onClick={() => setIsEditingSubtitle(true)}>{subtitle}</p>
      )}

      <div className="mandalart-grid">
        {cells.map((cell, index) => {
          const { isMainCenter, isCenter } = getSubGridInfo(index)
          return (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              className={`cell ${getCellColor(index)} ${selectedCell === index ? 'selected' : ''}`}
              value={cell}
              onChange={(e) => {
                const newCells = [...cells]
                newCells[index] = e.target.value
                setCells(newCells)
              }}
              onBlur={(e) => {
                if (!isNavigating.current) {
                  handleCellBlur(index, e.target.value)
                }
                setSelectedCell(null)
              }}
              onFocus={() => setSelectedCell(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder={isMainCenter ? '핵심 목표' : isCenter ? '목표' : ''}
            />
          )
        })}
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color main-center"></span>
          <span>핵심 목표</span>
        </div>
        <div className="legend-item">
          <span className="legend-color center-grid"></span>
          <span>중앙 그리드</span>
        </div>
        <div className="legend-item">
          <span className="legend-color sub-center"></span>
          <span>세부 목표</span>
        </div>
      </div>

      <div className="button-group">
        <button className="save-btn" onClick={handleSave}>
          저장
        </button>
        <button className="clear-btn" onClick={handleClear}>
          초기화
        </button>
      </div>
      {saveStatus && <span className="save-status">{saveStatus}</span>}
    </div>
  )
}

export default App
