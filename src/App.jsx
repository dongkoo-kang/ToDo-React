import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:5000/api'

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [newPriority, setNewPriority] = useState('low')
  const [newDueDate, setNewDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingPriority, setEditingPriority] = useState('low')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterCompleted, setFilterCompleted] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  // 할일 목록 조회
  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterCompleted !== '') {
        params.append('completed', filterCompleted)
      }
      if (filterPriority !== '') {
        params.append('priority', filterPriority)
      }

      const queryString = params.toString()
      const url = `${API_BASE_URL}/todos${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버가 JSON 형식의 응답을 반환하지 않았습니다.')
      }
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setTodos(result.data || [])
        setError(null)
      } else {
        const errorMessage = result.message || '할일 목록을 불러오는데 실패했습니다.'
        setError(errorMessage)
        console.error('할일 목록 조회 실패:', errorMessage)
      }
    } catch (error) {
      const errorMessage = error.message || '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
      setError(errorMessage)
      console.error('할일 목록 조회 실패:', error)
      setTodos([]) // 에러 발생 시 빈 배열로 설정
    } finally {
      setLoading(false)
    }
  }

  // 할일 추가
  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const todoData = {
        title: newTodo.trim(),
        priority: newPriority,
      }

      if (newDueDate) {
        todoData.dueDate = newDueDate
      }

      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setTodos([result.data, ...todos])
        setNewTodo('')
        setNewPriority('low')
        setNewDueDate('')
      } else {
        console.error('할일 추가 실패:', result.message || '알 수 없는 오류')
        alert(result.message || '할일 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('할일 추가 실패:', error)
      alert('할일 추가 중 오류가 발생했습니다.')
    }
  }

  // 할일 삭제
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTodos(todos.filter((todo) => todo._id !== id))
        }
      }
    } catch (error) {
      console.error('할일 삭제 실패:', error)
    }
  }

  // 할일 완료 상태 토글
  const toggleTodo = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}/toggle`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTodos(
            todos.map((todo) => (todo._id === id ? result.data : todo))
          )
        }
      }
    } catch (error) {
      console.error('할일 상태 변경 실패:', error)
    }
  }

  // 할일 수정 시작
  const startEdit = (todo) => {
    setEditingId(todo._id)
    setEditingTitle(todo.title)
    setEditingPriority(todo.priority || 'low')
    setEditingDueDate(
      todo.dueDate
        ? new Date(todo.dueDate).toISOString().split('T')[0]
        : ''
    )
  }

  // 할일 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
    setEditingPriority('low')
    setEditingDueDate('')
  }

  // 할일 수정 완료
  const saveEdit = async (id) => {
    if (!editingTitle.trim()) {
      cancelEdit()
      return
    }

    try {
      const updateData = {
        title: editingTitle.trim(),
        priority: editingPriority,
      }

      if (editingDueDate) {
        updateData.dueDate = editingDueDate
      } else {
        updateData.dueDate = null
      }

      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTodos(
            todos.map((todo) => (todo._id === id ? result.data : todo))
          )
          cancelEdit()
        }
      }
    } catch (error) {
      console.error('할일 수정 실패:', error)
    }
  }

  // Enter 키로 할일 추가
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  // Enter 키로 수정 저장
  const handleEditKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#dc3545'
      case 'medium':
        return '#ffc107'
      case 'low':
        return '#28a745'
      default:
        return '#6c757d'
    }
  }

  // 우선순위 텍스트
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return priority
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [filterCompleted, filterPriority])

  if (loading) {
    return <div className="loading">로딩 중...</div>
  }

  return (
    <div className="app">
      <div className="container">
        <h1>할일 목록</h1>
        
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="error-message" style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            <strong>오류:</strong> {error}
            <button 
              onClick={() => fetchTodos()} 
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                backgroundColor: '#c33',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 필터 영역 */}
        <div className="filter-container">
          <select
            className="filter-select"
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value)}
          >
            <option value="">전체 상태</option>
            <option value="false">미완료</option>
            <option value="true">완료</option>
          </select>
          <select
            className="filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">전체 우선순위</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* 할일 추가 */}
        <div className="todo-input-container">
          <input
            type="text"
            className="todo-input"
            placeholder="할일을 입력하세요..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <select
            className="priority-select"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
          >
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
          </select>
          <input
            type="date"
            className="date-input"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button className="add-button" onClick={addTodo}>
            추가
          </button>
        </div>

        {/* 할일 목록 */}
        <ul className="todo-list">
          {todos.length === 0 ? (
            <li className="empty-message">할일이 없습니다.</li>
          ) : (
            todos.map((todo) => (
              <li
                key={todo._id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                {editingId === todo._id ? (
                  // 수정 모드
                  <div className="edit-container">
                    <input
                      type="text"
                      className="edit-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => handleEditKeyPress(e, todo._id)}
                      autoFocus
                    />
                    <div className="edit-controls">
                      <select
                        className="edit-priority-select"
                        value={editingPriority}
                        onChange={(e) => setEditingPriority(e.target.value)}
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                      </select>
                      <input
                        type="date"
                        className="edit-date-input"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                      />
                    </div>
                    <div className="edit-buttons">
                      <button
                        className="save-button"
                        onClick={() => saveEdit(todo._id)}
                      >
                        저장
                      </button>
                      <button className="cancel-button" onClick={cancelEdit}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <div className="todo-content">
                    <div className="todo-info">
                      <div className="todo-header">
                        <input
                          type="checkbox"
                          className="todo-checkbox"
                          checked={todo.completed || false}
                          onChange={() => toggleTodo(todo._id)}
                        />
                        <span
                          className={`todo-title ${todo.completed ? 'completed' : ''}`}
                        >
                          {todo.title}
                        </span>
                        <span
                          className="priority-badge"
                          style={{
                            backgroundColor: getPriorityColor(todo.priority),
                          }}
                        >
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      {todo.dueDate && (
                        <div className="todo-due-date">
                          마감일: {formatDate(todo.dueDate)}
                        </div>
                      )}
                    </div>
                    <div className="todo-actions">
                      <button
                        className="edit-button"
                        onClick={() => startEdit(todo)}
                      >
                        수정
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteTodo(todo._id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default App