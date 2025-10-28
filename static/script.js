// --- CONFIGURAÇÃO INICIAL ---
const assistantContainer = document.getElementById('assistant-container');
const assistantBubble = document.getElementById('assistant-bubble');
const nameInput = document.getElementById('name-input');
const submitNameBtn = document.getElementById('submit-name-btn');

const videoTitle = document.getElementById('videoTitle');
const status = document.getElementById('status');
const chatLogContainer = document.querySelector('.chat-log-container');
const chatLog = document.getElementById('chatLog');
const finalSection = document.getElementById('finalSection');
const proofLink = document.getElementById('proofLink');
const learningTrail = document.getElementById('learning-trail');
const trailList = document.getElementById('trail-list');

// --- DADOS DO PROJETO ---
const playlist = [
    { title: "Fundação Tiradentes", id: "nRuJN6wwfvs" },
    { title: "Departamento Pessoal", id: "WSfTir1w5v0" },
    { title: "Tecnologia da Informação e Informação", id: "7Bq-mzVo3XY" }
];
const GOOGLE_DRIVE_LINK = "https://forms.office.com/Pages/ResponsePage.aspx?id=SpXsTHm1dEujPhiC3aNsD84rYKMX_bBAuqpbw2JvlBNURjJSWDc2UDJOQUNGWUNSMDhXMVJTNFFUQS4u";

const DEFAULT_PASSWORD = "Tiradentes@10";


let currentVideoIndex = -1;
let player;
let userName = "";
let conversationHistory = [];
const MAX_HISTORY_LENGTH = 6;
let progressInterval = null;

// --- LÓGICA DE VOZ DO NAVEGADORA ---
let celineVoice = null;

function loadVoices() {
    const allVoices = window.speechSynthesis.getVoices();
    const ptBrVoices = allVoices.filter(voice => voice.lang === 'pt-BR');

    // Tenta encontrar a voz "Google português do Brasil"
    celineVoice = ptBrVoices.find(voice => voice.name === 'Google português do Brasil');

    // Se não encontrar, tenta encontrar qualquer outra voz feminina de alta qualidade
    if (!celineVoice) {
        celineVoice = ptBrVoices.find(voice => voice.name.includes('Female') || voice.name.includes('Feminino'));
    }

    // Se ainda assim não encontrar, usa a primeira voz pt-BR disponível
    if (!celineVoice && ptBrVoices.length > 0) {
        celineVoice = ptBrVoices[0];
    }
}
// Tenta carregar as vozes repetidamente até que estejam disponíveis
const voiceInterval = setInterval(() => {
    loadVoices();
    if (celineVoice) {
        clearInterval(voiceInterval);
    }
}, 100);

if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text, onEndCallback) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Usa a voz da Celine se encontrada, senão usa a configuração padrão do navegador
    if (celineVoice) {
        utterance.voice = celineVoice;
    }

    utterance.lang = 'pt-BR';
    utterance.rate = 1.1; // Aumenta a velocidade da fala em 10%
    utterance.onend = () => { if (onEndCallback) onEndCallback(); };
    window.speechSynthesis.speak(utterance);
}

// --- FUNÇÕES DE LÓGICA E UTILIDADES ---
function generateUsername(fullName) {
    if (!fullName) return "";
    const prepositions = new Set(['de', 'da', 'do', 'das', 'dos']);
    const normalized = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const parts = normalized.split(' ').filter(part => part && !prepositions.has(part));
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    return `${parts[0]}.${parts[parts.length - 1]}`;
}

function copyCredentials(username, buttonElement) {
    const textToCopy = `Usuário: ${username}\nSenha: ${DEFAULT_PASSWORD}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        buttonElement.innerHTML = '✔'; // Ícone de "check"
        buttonElement.classList.add('clicked');
        buttonElement.disabled = true;

        setTimeout(() => {
            buttonElement.innerHTML = '📋'; // Ícone de prancheta
            buttonElement.classList.remove('clicked');
            buttonElement.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Falha ao copiar credenciais: ', err);
        alert("Não foi possível copiar as credenciais.");
    });
}

// NOVO: Função para criar a lista da trilha dinamicamente
function populateLearningTrail() {
    trailList.innerHTML = ''; // Limpa a lista antes de preencher
    playlist.forEach((video, index) => {
        const item = document.createElement('li');
        item.className = 'trail-item';
        item.id = `trail-item-${index}`; // ID para facilitar a seleção
        item.textContent = video.title;
        trailList.appendChild(item);
    });
}

// NOVO: Função para atualizar o estado visual da trilha
function updateTrailState(activeIndex) {
    const items = document.querySelectorAll('.trail-item');
    items.forEach((item, index) => {
        item.classList.remove('active', 'completed'); // Reseta as classes

        if (index < activeIndex) {
            item.classList.add('completed');
        } else if (index === activeIndex) {
            item.classList.add('active');
        }
    });
}

// --- FLUXO PRINCIPAL DA APLICAÇÃO ---
window.onload = () => {
    populateLearningTrail(); // Preenche a trilha assim que a página carrega
    speak("Olá! Sou Celine a Assistente Virtual que vai acompanhar sua integração hoje. Para começarmos, qual o seu nome completo?");
};

submitNameBtn.addEventListener('click', () => {
    userName = nameInput.value.trim();
    if (userName === "") { alert("Por favor, digite seu nome."); return; }

    const generatedUser = generateUsername(userName);
    const credentialsMessage = `Ótimo, ${userName.split(' ')[0]}! Suas credenciais de primeiro acesso estão abaixo.`;

    assistantBubble.innerHTML = `
        <p>${credentialsMessage}</p>
        <div class="credentials-box" style="opacity: 0; transform: translateY(10px); transition: all 0.5s ease-out;">
            <div class="credential-item">
                <span>Usuário</span>
                <code>${generatedUser}</code>
            </div>
            <div class="credential-item">
                <span>Senha Padrão</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <code>${DEFAULT_PASSWORD}</code>
                    <button class="copy-btn" id="copy-credentials-btn" title="Copiar usuário e senha">📋</button>
                </div>
            </div>
        </div>
        <button id="ack-credentials-btn">Entendi, anotei minhas credenciais</button>
    `;

    // Adiciona um pequeno atraso para a animação de fade-in
    setTimeout(() => {
        const box = assistantBubble.querySelector('.credentials-box');
        if (box) {
            box.style.opacity = '1';
            box.style.transform = 'translateY(0)';
        }
    }, 100);
    speak(credentialsMessage);

    document.getElementById('copy-credentials-btn').addEventListener('click', function() {
        copyCredentials(generatedUser, this);
    });
    document.getElementById('ack-credentials-btn').addEventListener('click', () => {
        const welcomeMessage = `Perfeito! Quando estiver pronto(a), vamos começar.`;
        updateAssistantBubble(welcomeMessage, "start");
        speak(welcomeMessage);
    });
});

function startJourney() {
    window.speechSynthesis.cancel();
    assistantBubble.classList.add('hidden');
    assistantContainer.classList.remove('assistant-centered');
    assistantContainer.classList.add('assistant-corner');

    // Mostra o layout principal de duas colunas
    document.getElementById('app-wrapper').classList.remove('hidden');

    playNextVideo();
}

// --- FUNÇÕES DA API DO YOUTUBE PLAYER ---
function onYouTubeIframeAPIReady() {}

function loadVideoByIndex(index) {
    if (index < playlist.length) {
        updateTrailState(index);
        const videoData = playlist[index];
        videoTitle.textContent = videoData.title;
        if (!player) {
            player = new YT.Player('youtubePlayer', {
                videoId: videoData.id,
                playerVars: { 
                    'autoplay': 1, 'controls': 1, 'modestbranding': 1,
                    'origin': window.location.origin 
                },
                events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
            });
        } else {
            player.loadVideoById(videoData.id);
            player.playVideo();
        }
    }
}

function onPlayerReady(event) {
    document.getElementById('status-display').classList.remove('hidden');
    forceIframeSize();
    event.target.playVideo();
}

function forceIframeSize() {
    const iframe = document.getElementById('youtubePlayer'); // O ID do seu player
    if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING && !progressInterval) {
        progressInterval = setInterval(updateProgressBar, 1000);
    } else if (event.data !== YT.PlayerState.PLAYING && progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    if (event.data === YT.PlayerState.ENDED) {
        const isLastVideo = currentVideoIndex === playlist.length - 1;
        if (isLastVideo) {
            updateAssistantBubble("Ficou com alguma dúvida durante a Integração?", "prompt");
            if (window.setAssistantAnimationState) window.setAssistantAnimationState('interactive');
        } else {
            updateAssistantBubble("Tudo certo? Clique abaixo para ir ao próximo tópico da integração.", "confirm_continue");
            if (window.setAssistantAnimationState) window.setAssistantAnimationState('idle');
        }
        assistantBubble.classList.remove('hidden');
    }
}

// --- FUNÇÕES DE CONTROLE DE FLUXO E UI ---
function finishOnboarding() {
    // Esconde os elementos da UI de vídeo/assistente de forma robusta
    const videoPlayerContainer = document.getElementById('video-player-container');
    const videoTitle = document.getElementById('videoTitle');
    const learningTrail = document.getElementById('learning-trail');
    const status = document.getElementById('status');
    const assistantContainer = document.getElementById('assistant-container');
    const leftSidebar = document.getElementById('left-sidebar');

    if (videoPlayerContainer) videoPlayerContainer.style.display = 'none';
    if (videoTitle) videoTitle.style.display = 'none';
    if (learningTrail) learningTrail.style.display = 'none';
    if (leftSidebar) leftSidebar.style.display = 'none';
    if (status) status.style.display = 'none';
    if (assistantContainer) assistantContainer.style.display = 'none';

    // Garante que a seção final seja exibida corretamente com seu estilo flex
    finalSection.classList.remove('hidden');
    finalSection.style.display = 'flex'; // O CSS define 'display: flex' para o layout
    proofLink.href = GOOGLE_DRIVE_LINK;

    // Dispara o efeito de confete
    const end = Date.now() + (3 * 1000);
    const colors = ['#00BFFF', '#1E90FF', '#0000CD'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateProgressBar() {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('timer').textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
}

function playNextVideo() {
    if (window.setAssistantAnimationState) window.setAssistantAnimationState('idle');
    assistantBubble.classList.add('hidden');
    // Não esconder o chat log aqui para que ele persista
    // chatLogContainer.classList.add('hidden');
    // chatLog.innerHTML = '';
    // conversationHistory = [];
    currentVideoIndex++;
    if (currentVideoIndex < playlist.length) {
        loadVideoByIndex(currentVideoIndex);
    } else {
        // Se a playlist acabou, chama a função de finalização
        finishOnboarding();
    }
}


function updateAssistantBubble(text, mode) {
    let content = `<p>${text}</p>`;
    
    if (mode === "start") {
        content += `<button id="start-journey-btn">Vamos Começar!</button>`;
    } else if (mode === "prompt") {
        content += `<div><button id="post-video-yes">Sim, tenho uma dúvida</button><button id="post-video-no">Não, tudo certo!</button></div>`;
    } else if (mode === "confirm_continue") {
        content += `<button id="confirm-continue-btn">Próximo Tópico &rarr;</button>`;
    } else if (mode === "final_prompt") {
        // Não adiciona botões, apenas mostra a mensagem e o chat continua visível.
    }

    assistantBubble.innerHTML = content;
    addBubbleEventListeners(mode);
}

function openChatInterface() {
    // Move a assistente para o canto se ela não estiver lá
    if (!assistantContainer.classList.contains('assistant-corner')) {
        assistantContainer.classList.remove('assistant-centered');
        assistantContainer.classList.add('assistant-corner');
    }

    const qaContent = `
        <div id="qaSection">
            <form id="questionForm" class="question-form">
                <input type="text" id="questionInput" placeholder="Digite sua dúvida aqui..." autocomplete="off">
                <button type="submit" id="sendButton">Enviar</button>
            </form>
            <button id="continueButton">Finalizar Integração &rarr;</button>
        </div>`;
    assistantBubble.innerHTML = qaContent;
    addBubbleEventListeners("qa_inner"); // Re-adiciona os listeners para os novos botões
    chatLogContainer.classList.remove('hidden');
    document.getElementById('questionInput').focus();
}

function addBubbleEventListeners(mode) {
    if (mode === "start") {
        document.getElementById('start-journey-btn').addEventListener('click', startJourney);
    } else if (mode === "prompt") {
        document.getElementById('post-video-yes').addEventListener('click', openChatInterface);
        document.getElementById('post-video-no').addEventListener('click', () => {
            if (player && typeof player.stopVideo === 'function') player.stopVideo();
            playNextVideo();
        });
    } else if (mode === "qa_inner") {
        const form = document.getElementById('questionForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const questionInput = document.getElementById('questionInput');
                const userQuestion = questionInput.value;
                if (!userQuestion) return;
                getAnswerFromAI(userQuestion);
                questionInput.value = '';
            });
        }
        const continueBtn = document.getElementById('continueButton');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                if (player && typeof player.stopVideo === 'function') player.stopVideo();
                playNextVideo();
            });
        }
    } else if (mode === "confirm_continue") {
        document.getElementById('confirm-continue-btn').addEventListener('click', () => {
            if (player && typeof player.stopVideo === 'function') player.stopVideo();
            playNextVideo();
        });
    }
}

// --- EFEITO MÁQUINA DE ESCREVER ---
function typewriterEffect(element, text, callback) {
    let i = 0;
    element.innerHTML = ""; // Limpa o conteúdo antes de começar
    const typing = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typing);
            if (callback) callback();
        }
    }, 30); // Velocidade da digitação (em milissegundos)
}

// --- LÓGICA DA IA (COM MEMÓRIA) ---
function addToChatLog(sender, message, callback) {
    const role = sender === 'user' ? 'user' : 'model';
    conversationHistory.push({ role: role, parts: [{ text: message }] });
    if (conversationHistory.length > MAX_HISTORY_LENGTH) {
        conversationHistory.splice(0, 2);
    }
    const messageElement = document.createElement('p');
    const senderPrefix = sender === 'user' ? 'Você' : 'Assistente';
    messageElement.className = sender === 'user' ? 'user-message' : 'bot-message';

    const contentElement = document.createElement('span');
    messageElement.innerHTML = `<strong>${senderPrefix}:</strong> `;
    messageElement.appendChild(contentElement);

    chatLog.appendChild(messageElement);

    if (sender === 'bot') {
        typewriterEffect(contentElement, message, callback);
    } else {
        contentElement.innerHTML = message;
        if (callback) callback();
    }

    chatLog.parentElement.scrollTop = chatLog.parentElement.scrollHeight;
}

function getAnswerFromAI(question) {
    const sendButton = document.getElementById('sendButton');
    const continueButton = document.getElementById('continueButton');
    if (sendButton) sendButton.disabled = true;
    if (continueButton) continueButton.disabled = true;
    status.textContent = "Pensando...";
    if (window.setAssistantAnimationState) window.setAssistantAnimationState('thinking');
    addToChatLog('user', question);

    fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify({
            question: question,
            history: conversationHistory.slice(0, -1),
            userName: userName 
        })
    })
    .then(response => response.json())
    .then(data => {
        const answerText = data.answer;
        
        addToChatLog('bot', answerText, () => {
            speak(answerText, () => {
                if (sendButton) sendButton.disabled = false;
                if (continueButton) continueButton.disabled = false;
                status.textContent = "Status: Faça outra pergunta ou clique em continuar.";
                if (window.setAssistantAnimationState) window.setAssistantAnimationState('interactive');
                if(document.getElementById('questionInput')) {
                    document.getElementById('questionInput').focus();
                }
            });
        });
    })
    .catch(error => {
        console.error('Erro ao se comunicar com a IA:', error);
        const errorMessage = "Desculpe, estou com problemas de conexão...";
        addToChatLog('bot', errorMessage, () => {
            if (sendButton) sendButton.disabled = false;
            if (continueButton) continueButton.disabled = false;
            status.textContent = "Status: Erro de comunicação.";
            if (window.setAssistantAnimationState) window.setAssistantAnimationState('interactive'); // Reseta o estado em caso de erro
        });
    });
}


(function() {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return; // Sair se o canvas não existir
    const ctx = canvas.getContext('2d');

    // O tamanho do canvas é definido via CSS (150px)
    const canvasSize = 150;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let sphereRadius = canvas.width / 2.2;

    // Constantes da animação
    const PARTICLE_COUNT = 60;
    const MAX_LINK_DISTANCE = 40;
    const MAX_LINK_DISTANCE_SQ = MAX_LINK_DISTANCE * MAX_LINK_DISTANCE;
    const PARTICLE_BASE_SPEED = 0.4;
    const PARTICLE_RADIUS = 1.3;
    const BASE_HUE = 170;

    let particles = [];
    let animationState = 'idle'; // Estados: 'idle', 'thinking', 'interactive'
    let particleSpeedMultiplier = 1;

    // Função global para controlar o estado da animação
    window.setAssistantAnimationState = (newState) => {
        if (!['idle', 'thinking', 'interactive'].includes(newState)) {
            newState = 'idle'; // Estado padrão de segurança
        }
        animationState = newState;

        switch (newState) {
            case 'thinking':
                particleSpeedMultiplier = 4; // Partículas mais rápidas
                canvas.style.cursor = 'default';
                break;
            case 'interactive':
                particleSpeedMultiplier = 1; // Velocidade normal
                canvas.style.cursor = 'pointer';
                break;
            case 'idle':
            default:
                particleSpeedMultiplier = 1; // Velocidade normal
                canvas.style.cursor = 'default';
                break;
        }
    };

    class Particle {
        constructor() {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * sphereRadius;
            this.x = centerX + Math.cos(angle) * distance;
            this.y = centerY + Math.sin(angle) * distance;

            const speed = Math.random() * PARTICLE_BASE_SPEED + 0.1;
            const directionAngle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(directionAngle) * speed;
            this.vy = Math.sin(directionAngle) * speed;

            this.radius = PARTICLE_RADIUS * (Math.random() * 0.5 + 0.75);
            const lightness = Math.random() * 20 + 70;
            this.color = `hsla(${BASE_HUE + (Math.random() * 20 - 10)}, 100%, ${lightness}%, 0.9)`;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Aplica o multiplicador de velocidade baseado no estado
            this.x += this.vx * particleSpeedMultiplier;
            this.y += this.vy * particleSpeedMultiplier;

            // Lógica de colisão com a borda da esfera
            const dist = Math.sqrt(Math.pow(this.x - centerX, 2) + Math.pow(this.y - centerY, 2));
            if (dist + this.radius > sphereRadius) {
                const normX = (this.x - centerX) / dist;
                const normY = (this.y - centerY) / dist;
                const dot = this.vx * normX + this.vy * normY;

                this.vx -= 2 * dot * normX;
                this.vy -= 2 * dot * normY;

                this.x = centerX + normX * (sphereRadius - this.radius);
                this.y = centerY + normY * (sphereRadius - this.radius);
            }
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${BASE_HUE}, 100%, 60%, 0.6)`;

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const distanceSq = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

                if (distanceSq < MAX_LINK_DISTANCE_SQ) {
                    const distance = Math.sqrt(distanceSq);
                    const opacity = 1 - (distance / MAX_LINK_DISTANCE);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `hsla(${BASE_HUE}, 100%, 70%, ${opacity * 0.6})`;
                    ctx.lineWidth = 1.0;
                    ctx.stroke();
                }
            }
        }

        ctx.shadowBlur = 0;

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    // Adiciona o listener de clique para interatividade
    canvas.addEventListener('click', () => {
        if (animationState === 'interactive') {
            openChatInterface(); // Chama a função global
        }
    });

    // Inicia a animação
    init();
    animate();
    // Define o estado inicial para garantir consistência
    window.setAssistantAnimationState('idle');
})();
