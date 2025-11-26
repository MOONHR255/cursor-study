import './style.css'

// 로컬 스토리지에서 데이터 로드
let questions = JSON.parse(localStorage.getItem('questions') || '[]')
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
let filteredUserId = null // 필터링된 사용자 ID
let filteredHashtag = null // 필터링된 해시태그

// 앱 초기화
function initApp() {
  renderApp()
}

// 앱 렌더링
function renderApp() {
  // 로컬 스토리지에서 최신 데이터 다시 로드
  questions = JSON.parse(localStorage.getItem('questions') || '[]')
  
  const app = document.querySelector('#app')
  
  if (!currentUser) {
    app.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <h1>수학 질문 플랫폼</h1>
          <p>이름을 입력하여 시작하세요</p>
          <form id="login-form" class="login-form">
            <input 
              type="text" 
              id="user-name-input" 
              class="name-input" 
              placeholder="이름을 입력하세요" 
              required
              maxlength="20"
            >
            <button type="submit" class="login-submit-btn">시작하기</button>
          </form>
        </div>
      </div>
    `
    setupLoginForm()
  } else {
    app.innerHTML = `
      <header class="header">
        <h1>수학 질문 플랫폼</h1>
        <div class="header-actions">
          <button id="my-questions-btn" class="my-questions-btn ${filteredUserId === currentUser.sub ? 'active' : ''}">내 질문</button>
          <div class="user-info">
            <div class="profile-avatar">${getInitials(currentUser.name)}</div>
            <span>${currentUser.name}</span>
            <button id="logout-btn" class="logout-btn">로그아웃</button>
          </div>
        </div>
      </header>
      <main class="main-content">
        <section class="upload-section">
          <h2>수학 질문 업로드</h2>
          <div class="upload-area">
            <input type="file" id="image-input" accept="image/*" style="display: none;">
            <label for="image-input" class="upload-label">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>사진을 선택하거나 드래그하세요</span>
            </label>
            <div id="image-preview" class="image-preview" style="display: none;">
              <img id="preview-img" src="" alt="미리보기">
              <button id="remove-image" class="remove-btn">×</button>
            </div>
            <div class="description-input-container">
              <label for="question-description" class="description-label">질문 설명 (해시태그는 @태그명 형식으로 입력)</label>
              <textarea 
                id="question-description" 
                class="description-input" 
                placeholder="예: 이 문제는 @경우의수 @확률 문제입니다"
                rows="3"
              ></textarea>
            </div>
            <button id="submit-question" class="submit-btn" disabled>질문 업로드</button>
          </div>
        </section>
        <section class="questions-section">
          <div class="questions-header">
            <h2>${filteredUserId === currentUser.sub ? '내 질문' : filteredHashtag ? `#${filteredHashtag} 질문` : '질문 목록'}</h2>
            <div class="header-filters">
              ${filteredUserId ? `
                <div class="filter-info">
                  <span>${filteredUserId === currentUser.sub ? '내 질문만 보기' : getFilteredUserName() + '님의 질문만 보기'}</span>
                  <button id="clear-filter-btn" class="clear-filter-btn">전체 보기</button>
                </div>
              ` : ''}
              ${filteredHashtag ? `
                <div class="filter-info">
                  <span>#${filteredHashtag} 태그만 보기</span>
                  <button id="clear-hashtag-filter-btn" class="clear-filter-btn">전체 보기</button>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="hashtag-search-section">
            <div class="hashtag-search-container">
              <input 
                type="text" 
                id="hashtag-search-input" 
                class="hashtag-search-input" 
                placeholder="해시태그 검색 (예: 경우의수)"
              >
              <button id="hashtag-search-btn" class="hashtag-search-btn">검색</button>
            </div>
            <div class="popular-hashtags">
              <span class="hashtags-label">인기 해시태그:</span>
              <div id="popular-hashtags-list" class="hashtags-list">
                ${renderPopularHashtags()}
              </div>
            </div>
          </div>
          <div id="questions-list" class="questions-list">
            ${renderQuestions()}
          </div>
        </section>
      </main>
    `
    
    setupEventListeners()
  }
}

// 이름 기반으로 일관된 사용자 ID 생성
function generateUserId(name) {
  // 이름을 기반으로 일관된 ID 생성 (간단한 해시)
  let hash = 0
  const nameLower = name.toLowerCase().trim()
  for (let i = 0; i < nameLower.length; i++) {
    const char = nameLower.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32비트 정수로 변환
  }
  return 'user_' + Math.abs(hash).toString()
}

// 로그인 폼 설정
function setupLoginForm() {
  const form = document.getElementById('login-form')
  const nameInput = document.getElementById('user-name-input')
  
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = nameInput.value.trim()
    
    if (name) {
      // 같은 이름이면 같은 ID를 사용
      const userId = generateUserId(name)
      
      currentUser = {
        name: name,
        sub: userId,
        picture: null
      }
      
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      renderApp()
    }
  })
  
  // 엔터키로도 제출 가능
  nameInput.focus()
}

// 이름의 이니셜 가져오기
function getInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 내 질문 보기 버튼
  document.getElementById('my-questions-btn').addEventListener('click', () => {
    if (filteredUserId === currentUser.sub) {
      // 이미 내 질문을 보고 있으면 필터 해제
      filteredUserId = null
    } else {
      // 내 질문만 보기
      filteredUserId = currentUser.sub
      filteredHashtag = null // 내 질문 필터 시 해시태그 필터 해제
    }
    renderApp()
  })
  
  // 로그아웃
  document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null
    filteredUserId = null
    localStorage.removeItem('currentUser')
    renderApp()
  })
  
  // 이미지 업로드
  const imageInput = document.getElementById('image-input')
  const uploadLabel = document.querySelector('.upload-label')
  const imagePreview = document.getElementById('image-preview')
  const previewImg = document.getElementById('preview-img')
  const removeImageBtn = document.getElementById('remove-image')
  const submitBtn = document.getElementById('submit-question')
  
  let selectedImage = null
  
  imageInput.addEventListener('change', (e) => {
    handleImageSelect(e.target.files[0])
  })
  
  // 드래그 앤 드롭
  uploadLabel.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadLabel.classList.add('drag-over')
  })
  
  uploadLabel.addEventListener('dragleave', () => {
    uploadLabel.classList.remove('drag-over')
  })
  
  uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadLabel.classList.remove('drag-over')
    if (e.dataTransfer.files.length > 0) {
      handleImageSelect(e.dataTransfer.files[0])
    }
  })
  
  function handleImageSelect(file) {
    if (file && file.type.startsWith('image/')) {
      selectedImage = file
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImg.src = e.target.result
        imagePreview.style.display = 'block'
        submitBtn.disabled = false
      }
      reader.readAsDataURL(file)
    }
  }
  
  removeImageBtn.addEventListener('click', () => {
    selectedImage = null
    imagePreview.style.display = 'none'
    imageInput.value = ''
    submitBtn.disabled = true
  })
  
  // 필터 초기화 버튼
  const clearFilterBtn = document.getElementById('clear-filter-btn')
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', () => {
      filteredUserId = null
      filteredHashtag = null
      renderApp()
    })
  }
  
  // 해시태그 필터 초기화 버튼
  const clearHashtagFilterBtn = document.getElementById('clear-hashtag-filter-btn')
  if (clearHashtagFilterBtn) {
    clearHashtagFilterBtn.addEventListener('click', () => {
      filteredHashtag = null
      renderApp()
    })
  }
  
  // 해시태그 검색
  const hashtagSearchInput = document.getElementById('hashtag-search-input')
  const hashtagSearchBtn = document.getElementById('hashtag-search-btn')
  
  if (hashtagSearchBtn) {
    hashtagSearchBtn.addEventListener('click', () => {
      const searchValue = hashtagSearchInput ? hashtagSearchInput.value.trim() : ''
      if (searchValue) {
        // @ 제거하고 검색
        const hashtag = searchValue.replace(/^@/, '').trim()
        if (hashtag) {
          filteredHashtag = hashtag
          filteredUserId = null // 해시태그 필터 시 사용자 필터 해제
          renderApp()
        }
      }
    })
  }
  
  if (hashtagSearchInput) {
    hashtagSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchValue = hashtagSearchInput.value.trim()
        if (searchValue) {
          // @ 제거하고 검색
          const hashtag = searchValue.replace(/^@/, '').trim()
          if (hashtag) {
            filteredHashtag = hashtag
            filteredUserId = null
            renderApp()
          }
        }
      }
    })
  }
  
  // 인기 해시태그 클릭 이벤트 (이벤트 위임)
  const popularHashtagsList = document.getElementById('popular-hashtags-list')
  if (popularHashtagsList) {
    popularHashtagsList.addEventListener('click', (e) => {
      if (e.target.classList.contains('hashtag-tag') || e.target.classList.contains('hashtag-inline')) {
        const hashtag = e.target.dataset.hashtag
        if (hashtag) {
          filteredHashtag = hashtag
          filteredUserId = null
          if (hashtagSearchInput) hashtagSearchInput.value = hashtag
          renderApp()
        }
      }
    })
  }
  
  // 질문 카드의 해시태그 및 사용자 이름 클릭 이벤트 (이벤트 위임)
  const questionsList = document.getElementById('questions-list')
  if (questionsList) {
    questionsList.addEventListener('click', (e) => {
      // 해시태그 클릭 처리
      const hashtagElement = e.target.closest('.hashtag-tag, .hashtag-inline')
      if (hashtagElement) {
        const hashtag = hashtagElement.dataset.hashtag
        if (hashtag) {
          e.stopPropagation() // 이벤트 전파 방지
          filteredHashtag = hashtag
          filteredUserId = null
          if (hashtagSearchInput) hashtagSearchInput.value = hashtag
          renderApp()
          return
        }
      }
      
      // 사용자 이름 클릭 처리 (해시태그가 아닐 때만)
      if (e.target.classList.contains('question-user-name') || 
          e.target.closest('.question-user-name')) {
        const userNameElement = e.target.classList.contains('question-user-name') 
          ? e.target 
          : e.target.closest('.question-user-name')
        const questionCard = userNameElement.closest('.question-card')
        const questionId = questionCard ? questionCard.dataset.questionId : null
        
        if (questionId) {
          const question = questions.find(q => q.id === questionId)
          if (question) {
            filteredUserId = question.userId
            filteredHashtag = null // 사용자 필터 시 해시태그 필터 해제
            renderApp()
          }
        }
      }
    })
  }
  
  submitBtn.addEventListener('click', () => {
    if (selectedImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const descriptionInput = document.getElementById('question-description')
        const description = descriptionInput ? descriptionInput.value.trim() : ''
        const hashtags = extractHashtags(description)
        
        const question = {
          id: Date.now().toString(),
          userId: currentUser.sub,
          userName: currentUser.name,
          image: e.target.result,
          description: description,
          hashtags: hashtags,
          timestamp: new Date().toISOString(),
          comments: []
        }
        
        questions.unshift(question)
        localStorage.setItem('questions', JSON.stringify(questions))
        
        // 폼 리셋
        selectedImage = null
        imagePreview.style.display = 'none'
        imageInput.value = ''
        if (descriptionInput) descriptionInput.value = ''
        submitBtn.disabled = true
        
        renderApp()
      }
      reader.readAsDataURL(selectedImage)
    }
  })
}

// 해시태그 추출 함수 (@로 시작하는 태그 추출)
function extractHashtags(text) {
  if (!text) return []
  const hashtagRegex = /@(\w+)/g
  const matches = text.match(hashtagRegex)
  if (!matches) return []
  // @ 제거하고 중복 제거
  return [...new Set(matches.map(tag => tag.substring(1)))]
}

// 필터링된 사용자 이름 가져오기
function getFilteredUserName() {
  if (!filteredUserId) return ''
  const question = questions.find(q => q.userId === filteredUserId)
  return question ? question.userName : ''
}

// 인기 해시태그 렌더링
function renderPopularHashtags() {
  // 모든 질문에서 해시태그 수집
  const hashtagCount = {}
  questions.forEach(question => {
    if (question.hashtags && question.hashtags.length > 0) {
      question.hashtags.forEach(tag => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1
      })
    }
  })
  
  // 빈도순으로 정렬 (최대 10개)
  const popularTags = Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)
  
  if (popularTags.length === 0) {
    return '<span class="no-hashtags">아직 해시태그가 없습니다.</span>'
  }
  
  return popularTags.map(tag => `
    <span class="hashtag-tag clickable" data-hashtag="${tag}">#${tag}</span>
  `).join('')
}

// 질문 목록 렌더링
function renderQuestions() {
  // 필터링 적용
  let filteredQuestions = questions
  if (filteredUserId) {
    filteredQuestions = filteredQuestions.filter(q => q.userId === filteredUserId)
  }
  if (filteredHashtag) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.hashtags && q.hashtags.includes(filteredHashtag)
    )
  }
  
  if (filteredQuestions.length === 0) {
    if (filteredUserId) {
      if (filteredUserId === currentUser.sub) {
        return '<p class="empty-message">아직 올린 질문이 없습니다. 첫 번째 질문을 업로드해보세요!</p>'
      }
      return '<p class="empty-message">이 사용자의 질문이 없습니다.</p>'
    }
    return '<p class="empty-message">아직 질문이 없습니다. 첫 번째 질문을 업로드해보세요!</p>'
  }
  
  return filteredQuestions.map(question => `
    <div class="question-card" data-question-id="${question.id}">
      <div class="question-header">
        <div class="question-user-img">${getInitials(question.userName)}</div>
        <div>
          <div class="question-user-name clickable">${question.userName}</div>
          <div class="question-time">${formatTime(question.timestamp)}</div>
        </div>
      </div>
      ${question.description ? `
        <div class="question-description">
          <p>${renderDescriptionWithHashtags(question.description, question.hashtags || [])}</p>
        </div>
      ` : ''}
      ${question.hashtags && question.hashtags.length > 0 ? `
        <div class="question-hashtags">
          ${question.hashtags.map(tag => `
            <span class="hashtag-tag clickable" data-hashtag="${tag}">#${tag}</span>
          `).join('')}
        </div>
      ` : ''}
      <div class="question-image-container">
        <img src="${question.image}" alt="수학 질문" class="question-image">
      </div>
      <div class="comments-section">
        <h3>설명</h3>
        <div class="comments-list" id="comments-${question.id}">
          ${renderComments(question.comments)}
        </div>
        <div class="comment-form">
          <textarea 
            id="comment-input-${question.id}" 
            class="comment-input" 
            placeholder="설명을 입력하세요..."
            rows="3"
          ></textarea>
          <button 
            class="comment-submit-btn" 
            onclick="addComment('${question.id}')"
          >댓글 작성</button>
        </div>
      </div>
    </div>
  `).join('')
}

// 댓글 렌더링
function renderComments(comments) {
  if (comments.length === 0) {
    return '<p class="no-comments">아직 설명이 없습니다.</p>'
  }
  
  return comments.map(comment => `
    <div class="comment-item">
      <div class="comment-user-img">${getInitials(comment.userName)}</div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-user-name">${comment.userName}</span>
          <span class="comment-time">${formatTime(comment.timestamp)}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
      </div>
    </div>
  `).join('')
}

// 댓글 추가 (전역 함수로 등록)
window.addComment = function(questionId) {
  const input = document.getElementById(`comment-input-${questionId}`)
  const text = input.value.trim()
  
  if (!text || !currentUser) return
  
  const question = questions.find(q => q.id === questionId)
  if (!question) return
  
  const comment = {
    id: Date.now().toString(),
    userId: currentUser.sub,
    userName: currentUser.name,
    text: text,
    timestamp: new Date().toISOString()
  }
  
  question.comments.push(comment)
  localStorage.setItem('questions', JSON.stringify(questions))
  
  input.value = ''
  renderApp()
}

// 시간 포맷팅
function formatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  
  return date.toLocaleDateString('ko-KR')
}

// 설명에 해시태그 링크 렌더링
function renderDescriptionWithHashtags(description, hashtags) {
  if (!description) return ''
  let html = escapeHtml(description)
  // @태그를 클릭 가능한 링크로 변환
  hashtags.forEach(tag => {
    const regex = new RegExp(`@${tag}`, 'g')
    html = html.replace(regex, `<span class="hashtag-inline clickable" data-hashtag="${tag}">@${tag}</span>`)
  })
  return html
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 앱 시작
initApp()
