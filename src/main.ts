import './styles/style.css';

document.addEventListener('DOMContentLoaded', () => {
    console.log("시뮬레이터 로직 시작");

    // --- 1. 전역 상태 및 요소 가져오기 ---
    const modal = document.getElementById('process-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    const coreListContainer = document.getElementById('core-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const rrControl = document.getElementById('rr-quantum-control');

    const tRandom = document.getElementById('tab-random');
    const tManual = document.getElementById('tab-manual');
    const cRandom = document.getElementById('content-random');
    const cManual = document.getElementById('content-manual');

    // --- 2. 초기화 설정 (버그 방지) ---
    // 초기 로드 시 RR 설정 숨기기
    if (rrControl) rrControl.classList.add('hidden');
    
    // 모달 초기 상태: 무작위 생성만 보이게 설정
    cRandom?.classList.remove('hidden');
    cManual?.classList.add('hidden');

    // --- 3. 모달 제어 (열기/닫기/탭) ---
    openModalBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
    closeModalBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

    tRandom?.addEventListener('click', () => {
        tRandom.classList.add('active');
        tManual?.classList.remove('active');
        cRandom?.classList.remove('hidden');
        cManual?.classList.add('hidden');
    });

    tManual?.addEventListener('click', () => {
        tManual.classList.add('active');
        tRandom?.classList.remove('active');
        cManual?.classList.remove('hidden');
        cRandom?.classList.add('hidden');
    });

    // --- 4. 알고리즘 탭 전환 (Output 영역) ---
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedAlgo = btn.getAttribute('data-algo');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // RR일 때만 타임 퀀텀 노출
            if (rrControl) {
                if (selectedAlgo === 'RR') rrControl.classList.remove('hidden');
                else rrControl.classList.add('hidden');
            }
            console.log("Selected Algorithm:", selectedAlgo);
        });
    });

    // --- 5. 프로세서(Core) 생성 및 관리 ---
    const createCore = (index: number) => {
        if (!coreListContainer) return;

        const coreDiv = document.createElement('div');
        coreDiv.className = 'core-item';
        coreDiv.innerHTML = `
            <div class="core-header">
                <span class="font-bold text-sm">Core ${index}</span>
                <label class="switch">
                    <input type="checkbox" class="core-toggle" checked>
                    <span class="slider"></span>
                </label>
            </div>
            <select class="w-full text-xs border rounded p-1 core-type-select">
                <option value="P">P-Core (성능)</option>
                <option value="E" selected>E-Core (효율)</option>
            </select>
        `;

        const toggle = coreDiv.querySelector('.core-toggle') as HTMLInputElement;
        const typeSelect = coreDiv.querySelector('.core-type-select') as HTMLSelectElement;

        toggle.addEventListener('change', () => {
            const isActive = toggle.checked;
            coreDiv.style.opacity = isActive ? "1" : "0.5";
            typeSelect.disabled = !isActive;
            console.log(`Core ${index} ${isActive ? '활성화' : '비활성화'}`);
        });

        coreListContainer.appendChild(coreDiv);
    };

    // 초기 설정: 기본 4개 코어 생성
    for (let i = 1; i <= 4; i++) {
        createCore(i);
    }

    // 초기 레디 큐 테스트 데이터
    updateReadyQueue(['P1', 'P2', 'P3']);
});

// --- 6. 레디 큐 시각화 (함수 외부 유지 가능) ---
const updateReadyQueue = (queue: string[]) => {
    const container = document.getElementById('ready-queue-container');
    if (!container) return;

    if (queue.length === 0) {
        container.innerHTML = `<p class="empty-msg" style="color: #94a3b8; font-style: italic; font-size: 13px;">현재 대기 중인 프로세스가 없습니다.</p>`;
        return;
    }

    container.innerHTML = queue.map(pId => `<div class="queue-item">${pId}</div>`).join('');
};