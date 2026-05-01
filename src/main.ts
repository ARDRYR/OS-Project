import './styles/style.css';

document.addEventListener('DOMContentLoaded', () => {
    console.log("시뮬레이터 로직 시작");

    // --- 1. 전역 상태 관리 ---
    let coreCount = 0;
    let processCount = 0;

    // --- 2. HTML 요소 안전하게 가져오기 ---
    const modal = document.getElementById('process-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    const coreListContainer = document.getElementById('core-container'); // ID 수정됨
    const addCoreBtn = document.getElementById('add-core-btn'); // HTML에 이 ID가 있는지 확인 필요

    // --- 3. 모달 열기/닫기 로직 ---
    if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => {
            console.log("모달 열기");
            modal.classList.remove('hidden');
        });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            console.log("모달 닫기");
            modal.classList.add('hidden');
        });
    }

    // --- 4. 알고리즘 탭 전환 로직 ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const rrControl = document.getElementById('rr-quantum-control');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedAlgo = btn.getAttribute('data-algo');
            console.log("Selected Algorithm:", selectedAlgo);

            // 모든 탭 비활성화 후 클릭한 것만 활성화
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // RR 전용 컨트롤 보이기/숨기기
            if (rrControl) {
                if (selectedAlgo === 'RR') rrControl.classList.remove('hidden');
                else rrControl.classList.add('hidden');
            }
        });
    });

    // --- 5. 모달 내부 탭 전환 ---
    const tRandom = document.getElementById('tab-random');
    const tManual = document.getElementById('tab-manual');
    const cRandom = document.getElementById('content-random');
    const cManual = document.getElementById('content-manual');

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

    // --- 6. 코어 추가 로직 (동적 생성) ---
    // 만약 버튼이 HTML에 없다면 이 함수는 실행되지 않도록 보호
    const renderCore = () => {
        if (!coreListContainer || coreCount >= 4) return;
        
        coreCount++;
        const coreDiv = document.createElement('div');
        coreDiv.className = 'core-item'; // CSS에서 스타일링 필요
        coreDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span class="font-bold text-sm">Core ${coreCount}</span>
                <button class="core-del-btn" style="color:red; font-size:10px;">삭제</button>
            </div>
            <select class="w-full text-xs border rounded p-1">
                <option value="P">P-Core</option>
                <option value="E">E-Core</option>
            </select>
        `;

        coreDiv.querySelector('.core-del-btn')?.addEventListener('click', () => {
            coreDiv.remove();
            coreCount--;
            // 번호 재정렬 로직이 필요할 수 있음
        });

        coreListContainer.appendChild(coreDiv);
    };

    // 초기 코어 세팅 (예: 기본 1개)
    if (coreCount === 0) renderCore();
});