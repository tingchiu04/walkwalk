/**
 * 全局變數控制
 */
let currentStage = 0;
let sessionID = 0;   // 核心控制：用於標記「現在是哪一次遊戲」，防止舊的對話干擾新的
let activeTimers = []; // 儲存所有計時器，用於強制停止

// 背景圖設定
const bgImages = {
    'bg-stream-old': 'https://images.unsplash.com/photo-1518116901802-53d971550993?q=80&w=1974&auto=format&fit=crop',
    'bg-cement': 'https://images.unsplash.com/photo-1565626424177-8c3666d33a75?q=80&w=1974&auto=format&fit=crop',
    'bg-house': 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=2069&auto=format&fit=crop',
    'bg-sunset': 'https://images.unsplash.com/photo-1472120435266-5310704229b5?q=80&w=2069&auto=format&fit=crop',
    'bg-final': 'https://images.unsplash.com/photo-1518098268026-4e1491a43282?q=80&w=1974&auto=format&fit=crop'
};

// 回饋文字庫 (已修正 Stage 1 重複問題)
const feedbacks = {
    'q1-company': {
        'A': '阿給：「哈哈，你跟大部分的人類一樣，都被現代的名詞誤導了！」',
        'B': '阿給：「哈哈，你跟大部分的人類一樣，都被現代的名詞誤導了！」',
        'C': '阿給：「汪！真聰明！你的直覺很準喔！」'
    },
    'q2-observe': {
        'A': '', // 留空：直接接續劇本下一段，避免重複
        'B': ''  // 留空：直接接續劇本下一段，避免重複
    },
    'q3-material': {
        'A': '阿給：「汪……我很希望你說的是對的，那確實是它三百年前的樣子，以前這裡的岸邊是軟軟的泥土，大石頭上長滿了會呼吸的青苔，螃蟹最喜歡在下面鑽洞了， 但很遺憾，現在是水泥牆了。」',
        'B': '阿給：「沒錯，就是冷冰冰的水泥。 而且你不覺得這裡看起來很像……一個巨大的灰色浴缸，或者是大型排水溝嗎？」',
        'C': '阿給：「汪……我很希望你說的是對的，但紅樹林是在下游喔，這裡已經變成水泥牆了。」'
    },
    'q4-fish': {
        'A': '阿給：「你看到了。那就是這裡現在的霸主。」',
        'B': '阿給：「水很混濁吧？但如果你仔細看，還是能發現那些黑影。」'
    },
    'q5-year': {
        'A': '阿給：「不對唷!其實這個地方神秘的點就在於其實不確定他精準的建造時間。」',
        'B': '阿給：「賓果！你也找不到答案對吧？這就是它最神秘的地方。」',
        'C': '阿給：「不對唷!其實這個地方神秘的點就在於其實不確定他精準的建造時間。」'
    },
    'q6-wall': {
        'A': '阿給：「你的觀察力真敏銳！沒錯，那個就是**『銃孔』**（槍眼）。以前這裡除了要打仗，平時還要防備盜匪。這個洞設計成『外面小、裡面大』，這樣裡面的人可以拿槍往各個角度射擊，但外面的子彈卻很難打進來。這可是早期的居家保全系統呢！」',
        'B': '阿給：「汪！那個也很特別！因為淡水太常下雨了，泥土做的牆壁容易壞，所以人們幫房子穿上了一件『瓦片雨衣』。不過，我想讓你找的是更兇猛一點的東西……再仔細看看牆上的小洞？」',
        'C': '阿給：「汪！那是給我朋友走的啦！那是讓貓咪進去抓老鼠的通道。不過在戰爭時期，這裡還有更重要的防禦設計喔……」'
    },
    'q7-wish': { 'A': '', 'B': '', 'C': '' }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    // 點擊畫面任意處關閉右上選單
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container')) {
            document.getElementById('dropdown-menu').classList.add('hidden');
        }
    });
});

// 讀取進度
function loadGame() {
    const savedStage = localStorage.getItem('tamsuiStage');
    const resumeInfo = document.getElementById('resume-info');
    if (savedStage && parseInt(savedStage) > 0) {
        currentStage = parseInt(savedStage);
        resumeInfo.innerText = `📄 偵測到上次進度：Stage ${currentStage}`;
    } else {
        resumeInfo.innerText = "";
    }
}

// 開始遊戲按鈕
function startGame() {
    if (currentStage === 0) currentStage = 1;
    document.getElementById('welcome-card').style.display = 'none';
    loadStage(currentStage);
}

/**
 * 核心工具：自定義計時器
 * 目的：把所有 setTimeout 存起來，切換章節時可以一次全部清除
 */
function setGameTimeout(callback, delay) {
    const id = setTimeout(() => {
        callback();
        // 執行完畢後從陣列移除
        activeTimers = activeTimers.filter(t => t !== id);
    }, delay);
    activeTimers.push(id);
    return id;
}

/**
 * 核心工具：清除所有計時器
 */
function clearAllTimers() {
    activeTimers.forEach(id => clearTimeout(id));
    activeTimers = [];
}

/**
 * 核心功能：載入章節
 */
function loadStage(stageNum) {
    // 1. 重要：更換 Session ID，這會讓舊的 processQueue 立刻失效停止
    sessionID++; 
    
    // 2. 清除所有正在倒數的對話
    clearAllTimers();

    // 3. 取得新章節資料
    const stageData = document.querySelector(`#script-data div[data-stage="${stageNum}"]`);
    if (!stageData) {
        console.error("找不到章節數據: " + stageNum);
        return;
    }

    // 4. 更新 UI
    const bgKey = stageData.getAttribute('data-bg');
    const title = stageData.getAttribute('data-title');
    changeBackground(bgKey);
    document.querySelector('.stage-title').innerText = title;

    // 5. 儲存與重置狀態
    currentStage = stageNum;
    localStorage.setItem('tamsuiStage', currentStage);

    // 6. 開始處理對話隊列 (傳入當下的 sessionID)
    const initialElements = Array.from(stageData.children).filter(el => !el.classList.contains('hidden-group'));
    processQueue(initialElements, sessionID);
}

function changeBackground(bgKey) {
    const bgLayer = document.getElementById('bg-layer');
    const imgUrl = bgImages[bgKey] || '#f4f1ea';
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => { bgLayer.style.backgroundImage = `url('${imgUrl}')`; };
}

/**
 * 遞迴處理對話隊列
 */
async function processQueue(elements, mySessionID) {
    // 安全檢查：如果 sessionID 變了（代表使用者切換了章節），就立刻停止
    if (mySessionID !== sessionID) return;
    if (elements.length === 0) return;

    const el = elements[0];
    const remaining = elements.slice(1);

    if (el.classList.contains('dialog')) {
        await showBubble(el, mySessionID);
        // 對話顯示完後，再次檢查 sessionID
        if (mySessionID === sessionID) {
            processQueue(remaining, mySessionID);
        }
    } else if (el.classList.contains('choice-point')) {
        showChoices(el);
    }
}

/**
 * 顯示對話氣泡
 */
function showBubble(element, mySessionID) {
    return new Promise(resolve => {
        // 安全檢查
        if (mySessionID !== sessionID) return;

        const role = element.getAttribute('data-role');
        const content = element.getAttribute('data-content');
        const chatFlow = document.getElementById('chat-flow');
        const bubble = document.createElement('div');
        bubble.classList.add('bubble', role);

        if (role === 'npc') {
            bubble.innerHTML = `<span class="npc-name">阿給</span>${parseText(content)}`;
        } else if (role === 'image') {
            const src = element.getAttribute('data-src');
            const desc = element.getAttribute('data-desc');
            
            saveUnlockedImage(src, desc);

            bubble.classList.add('image-msg');
            bubble.setAttribute('onclick', `openLightbox('${src}', '${desc}')`);
            bubble.innerHTML = `
                <img class="chat-img" src="${src}" alt="${desc}">
                <span class="img-desc">🔍 點擊放大 | ${desc}</span>`;
        } else {
            bubble.innerHTML = parseText(content);
        }

        chatFlow.appendChild(bubble);
        scrollToBottom();

        // 使用可被中斷的計時器
        const delay = role === 'image' ? 800 : Math.min(content.length * 50 + 500, 2000);
        setGameTimeout(resolve, delay);
    });
}

function showChoices(element) {
    const controlsArea = document.getElementById('controls-area');
    const choicesContainer = document.getElementById('choices-container');
    const buttons = element.querySelectorAll('button');
    const choiceId = element.getAttribute('data-id');

    choicesContainer.innerHTML = ''; 

    buttons.forEach(btn => {
        const newBtn = document.createElement('button');
        newBtn.className = 'choice-btn';
        newBtn.innerText = btn.innerText;
        newBtn.onclick = () => {
            controlsArea.classList.add('hidden');
            addPlayerBubble(btn.innerText);
            
            const nextPartId = btn.getAttribute('data-next');
            const val = btn.getAttribute('data-val');
            const action = btn.getAttribute('data-action');
            
            handleChoiceResult(choiceId, val, nextPartId, action);
        };
        choicesContainer.appendChild(newBtn);
    });

    controlsArea.classList.remove('hidden');
    setGameTimeout(scrollToBottom, 100);
}

function handleChoiceResult(choiceId, val, nextPartId, action) {
    const chatFlow = document.getElementById('chat-flow');

    // 只有當回饋不為空時，才顯示 NPC 對話
    if (choiceId && feedbacks[choiceId] && feedbacks[choiceId][val] && feedbacks[choiceId][val] !== '') {
        setGameTimeout(() => {
            if (sessionID !== sessionID) return; // 再次檢查
            const bubble = document.createElement('div');
            bubble.classList.add('bubble', 'npc');
            bubble.innerHTML = `<span class="npc-name">阿給</span>${parseText(feedbacks[choiceId][val])}`;
            chatFlow.appendChild(bubble);
            scrollToBottom();
        }, 500);
    }

    // 處理後續
    setGameTimeout(() => {
        if (action === 'nextStage') {
            // 直接清空畫面並載入下一章
            document.getElementById('chat-flow').innerHTML = '';
            loadStage(currentStage + 1);
        } else if (nextPartId) {
            const nextGroup = document.getElementById(nextPartId);
            if (nextGroup) {
                const elements = Array.from(nextGroup.children);
                processQueue(elements, sessionID);
            }
        }
    }, 1500); 
}

function addPlayerBubble(text) {
    const chatFlow = document.getElementById('chat-flow');
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', 'player');
    bubble.innerText = text; 
    chatFlow.appendChild(bubble);
    scrollToBottom();
}

function parseText(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function scrollToBottom() {
    const chatFlow = document.getElementById('chat-flow');
    chatFlow.scrollTop = chatFlow.scrollHeight;
}

// ================= 選單與功能 =================

function toggleMenu() {
    const menu = document.getElementById('dropdown-menu');
    menu.classList.toggle('hidden');
}

function clearStorageAndReload() {
    if (confirm('確定要重置所有進度嗎？（相簿也會清空）')) {
        localStorage.removeItem('tamsuiStage');
        localStorage.removeItem('tamsuiAlbum'); 
        window.location.reload();
    }
}

function saveUnlockedImage(src, desc) {
    let album = JSON.parse(localStorage.getItem('tamsuiAlbum') || '[]');
    if (!album.some(img => img.src === src)) {
        album.push({ src, desc });
        localStorage.setItem('tamsuiAlbum', JSON.stringify(album));
    }
}

function openAlbum() {
    const modal = document.getElementById('album-modal');
    const grid = document.getElementById('album-grid');
    const emptyHint = document.getElementById('album-empty-hint');
    const menu = document.getElementById('dropdown-menu');
    menu.classList.add('hidden'); // 關閉下拉選單

    let album = JSON.parse(localStorage.getItem('tamsuiAlbum') || '[]');
    grid.innerHTML = '';

    if (album.length === 0) {
        emptyHint.style.display = 'block';
    } else {
        emptyHint.style.display = 'none';
        album.forEach(img => {
            const div = document.createElement('div');
            div.className = 'album-item';
            div.onclick = () => openLightbox(img.src, img.desc);
            div.innerHTML = `
                <img src="${img.src}" loading="lazy">
                <div class="album-caption">${img.desc}</div>
            `;
            grid.appendChild(div);
        });
    }
    modal.classList.remove('hidden');
}

function openChapters() {
    document.getElementById('dropdown-menu').classList.add('hidden');
    document.getElementById('chapter-modal').classList.remove('hidden');
}

/**
 * 跳轉章節 (已移除 confirm，避免卡住)
 */
function jumpToStage(stageNum) {
    // 1. 關閉選擇視窗
    closeModal('chapter-modal');
    
    // 2. 隱藏歡迎卡片
    document.getElementById('welcome-card').style.display = 'none';
    
    // 3. 強制清空聊天介面 (這很重要，視覺上立即清空)
    document.getElementById('chat-flow').innerHTML = '';
    
    // 4. 隱藏選項區 (防止舊選項殘留)
    document.getElementById('controls-area').classList.add('hidden');
    
    // 5. 載入新章節 (loadStage 內部會處理 sessionID 和 timer 清除)
    loadStage(stageNum);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function openLightbox(src, desc) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    img.src = src;
    caption.innerText = desc;
    lightbox.classList.remove('hidden');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
}
