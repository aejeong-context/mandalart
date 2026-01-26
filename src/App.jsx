import { useState, useEffect, useRef } from 'react'
import './App.css'

const STORAGE_KEY = 'mandalart-data'

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
  const inputRefs = useRef([])
  const isNavigating = useRef(false)

  // 자동 저장 (cells가 변경될 때마다)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
  }, [cells])

  // 수동 저장
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
    setSaveStatus('저장됨!')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  // 초기화
  const handleClear = () => {
    if (window.confirm('모든 내용을 삭제하시겠습니까?')) {
      const emptyCells = Array(81).fill('')
      setCells(emptyCells)
      localStorage.removeItem(STORAGE_KEY)
      // input 요소들도 초기화
      inputRefs.current.forEach(input => {
        if (input) input.value = ''
      })
    }
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
      <h1>만다라트 플래너</h1>
      <p className="subtitle">중앙에 핵심 목표를 입력하고, 주변에 세부 목표와 실행 계획을 작성하세요</p>

      <div className="mandalart-grid">
        {cells.map((cell, index) => {
          const { isMainCenter, isCenter } = getSubGridInfo(index)
          return (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              className={`cell ${getCellColor(index)} ${selectedCell === index ? 'selected' : ''}`}
              defaultValue={cell}
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
