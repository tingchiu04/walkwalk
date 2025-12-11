let currentStage = 0;

// 背景圖對應表
const bgImages = {
    'bg-stream-old': 'https://images.unsplash.com/photo-1518116901802-53d971550993?q=80&w=1974&auto=format&fit=crop',
    'bg-cement': 'https://images.unsplash.com/photo-1565626424177-8c3666d33a75?q=80&w=1974&auto=format&fit=crop',
    'bg-house': 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=2069&auto=format&fit=crop',
    'bg-sunset': 'https://images.unsplash.com/photo-1472120435266-5310704229b5?q=80&w=2069&auto=format&fit=crop',
    'bg-final': 'https://images.unsplash.com/photo-1518098268026-4e1491a43282?q=80&w=1974&auto=format&fit=crop'
};

const feedbacks = {
    'q1-company': {
        'A': '阿給：「哈哈，被誤導了吧！現代確實很多公司，但這名字更老喔。」',
        'B': '阿給：「不是喔！雖然聽起來很像公家單位。」',
        'C': '阿給：「汪！真聰明！你的直覺很準！」'
    },
    'q2-observe': {
        'A': '阿給：「汪……希望你說的是錯的，但遺憾的是，這確實是現在的樣子。」',
        'B': '阿給：「沒錯，閉上眼似乎還能聽到以前行船的聲音呢。」'
    },
    'q3-material': {
        'A': '阿給：「我很希望你是對的...但以前的泥土岸邊已經不見了。」',
        'B': '阿給：「沒錯，冰冷的水泥。像個巨大的灰色浴缸。」',
        'C': '阿給：「紅樹林是在下游喔，這裡已經變成水泥牆了。」'
    },
    'q4-fish': {
        'A': '阿給：「你看到了。那就是這裡現在的霸主。」',
        'B': '阿給：「水很混濁吧？但如果你仔細看，還是能發現那些黑影。」'
    },
    'q5-year': {
        'A': '阿給：「不對唷，它比那場戰爭還要早一點存在。」',
        'B': '阿給：「賓果！這就是它最神秘的地方，確切年份不可考。」',
        'C': '阿給：「太晚囉！它可是見證過清朝歷史的老爺爺。」'
    },
    'q6-wall': {
        'A': '阿給：「觀察敏銳！那是『銃孔』，以前用來射擊防禦的。」',
        'B': '阿給：「那是『穿瓦衫』，也很特別，但我想讓你找的是更兇猛的設計。」',
        'C': '阿給：「那是給我朋友走的『貓洞』啦！不過戰爭時有更重要的設計。」'
    },
    'q7-wish': {
        'A': '阿給：「這是一個很溫柔的願望，螃蟹們會感謝你的。」',
        'B': '阿給：「故事被記得，歷史就活著。謝謝你。」',
        'C': '阿給：「共存是最難也最重要的課題。很好的願望。」'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    // 點擊其他地方關閉下拉選單
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container')) {
            document.getElementById('dropdown-menu').classList.add('hidden');
        }
    });
});

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

function startGame() {
    if (currentStage === 0) currentStage = 1;
    document.getElementById('welcome-card').style.display = 'none';
    loadStage(currentStage);
}

function loadStage(stageNum) {
    const stageData = document.querySelector(`#script-data div[data-stage="${stageNum}"]`);
    if (!stageData) return;

    const bgKey = stageData.getAttribute('data-bg');
    const title = stageData.getAttribute('data-title');
    changeBackground(bgKey);
    document.querySelector('.stage-title').innerText = title;

    currentStage = stageNum;
    localStorage.setItem('tamsuiStage', currentStage);

    const initialElements = Array.from(stageData.children).filter(el => !el.classList.contains('hidden-group'));
    processQueue(initialElements);
}

function changeBackground(bgKey) {
    const bgLayer = document.getElementById('bg-layer');
    const imgUrl = bgImages[bgKey] || '#f4f1ea';
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => { bgLayer.style.backgroundImage = `url('${imgUrl}')`; };
}

async function processQueue(elements) {
    if (elements.length === 0) return;
    const el = elements[0];
    const remaining = elements.slice(1);

    if (el.classList.contains('dialog')) {
        await showBubble(el);
        processQueue(remaining);
    } else if (el.classList.contains('choice-point')) {
        showChoices(el);
    }
}

function showBubble(element) {
    return new Promise(resolve => {
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
            
            // 儲存到相簿
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

        const delay = role === 'image' ? 800 : Math.min(content.length * 50 + 500, 2000);
        setTimeout(resolve, delay);
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
    setTimeout(scrollToBottom, 100);
}

function handleChoiceResult(choiceId, val, nextPartId, action) {
    const chatFlow = document.getElementById('chat-flow');

    if (choiceId && feedbacks[choiceId] && feedbacks[choiceId][val]) {
        const feedbackText = feedbacks[choiceId][val];
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.classList.add('bubble', 'npc');
            bubble.innerHTML = `<span class="npc-name">阿給</span>${parseText(feedbackText)}`;
            chatFlow.appendChild(bubble);
            scrollToBottom();
        }, 500);
    }

    setTimeout(() => {
        if (action === 'nextStage') {
            currentStage++;
            setTimeout(() => {
                 document.getElementById('chat-flow').innerHTML = '';
                 loadStage(currentStage);
            }, 2000);
        } else if (nextPartId) {
            const nextGroup = document.getElementById(nextPartId);
            if (nextGroup) {
                const elements = Array.from(nextGroup.children);
                processQueue(elements);
            }
        }
    }, 2000); 
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

// ================= 選單與功能邏輯 =================

function toggleMenu() {
    const menu = document.getElementById('dropdown-menu');
    menu.classList.toggle('hidden');
}

function clearStorageAndReload() {
    if (confirm('確定要重置所有進度嗎？（相簿也會清空）')) {
        localStorage.removeItem('tamsuiStage');
        localStorage.removeItem('tamsuiAlbum'); // 清除相簿
        window.location.reload();
    }
}

// 相簿收集功能
function saveUnlockedImage(src, desc) {
    let album = JSON.parse(localStorage.getItem('tamsuiAlbum') || '[]');
    // 檢查是否已存在
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
    
    // 隱藏選單
    menu.classList.add('hidden');

    // 讀取相簿
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

// 章節選擇功能
function openChapters() {
    document.getElementById('dropdown-menu').classList.add('hidden');
    document.getElementById('chapter-modal').classList.remove('hidden');
}

function jumpToStage(stageNum) {
    if (confirm(`確定要跳轉到第 ${stageNum} 章嗎？目前的對話將會被清空。`)) {
        closeModal('chapter-modal');
        document.getElementById('welcome-card').style.display = 'none';
        document.getElementById('chat-flow').innerHTML = '';
        loadStage(stageNum);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// 燈箱功能
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