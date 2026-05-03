import './styles/style.css';

interface Process {
    id: string;
    arrivalTime: number;
    burstTime: number;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 [System] 시뮬레이터 로직 시작");

    // --- 1. 전역 상태 및 요소 가져오기 ---
    let finalProcessList: Process[] = [];
    let processIdCounter = 1;

    const modal = document.getElementById('process-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addConfirmBtn = document.getElementById('add-process-confirm-btn'); 
    
    const coreListContainer = document.getElementById('core-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const rrControl = document.getElementById('rr-quantum-control');

    const tRandom = document.getElementById('tab-random');
    const tManual = document.getElementById('tab-manual');
    const cRandom = document.getElementById('content-random');
    const cManual = document.getElementById('content-manual');

    // --- 2. 내부 유틸리티 함수 ---

    // [추가] 왼쪽 Control 영역의 프로세스 숫자를 업데이트하는 함수
    const updateProcessCountUI = () => {
        const countDisplay = document.getElementById('process-count-display');
        if (countDisplay) {
            countDisplay.innerText = `${finalProcessList.length} / 15`;
        }
    };

    // [추가] 특정 프로세스를 삭제하는 함수
    const removeProcess = (id: string) => {
        finalProcessList = finalProcessList.filter(p => p.id !== id);
        console.log(`🗑️ [Delete] ${id} 프로세스 제거 완료`);
        updateProcessTable();
    };

    // [수정] 테이블 갱신 및 삭제 버튼 이벤트 연결
    const updateProcessTable = () => {
        const container = document.getElementById('input-table-view');
        if (!container) return;

        if (finalProcessList.length === 0) {
            container.innerHTML = `<p class="empty-msg">프로세스를 추가해주세요.</p>`;
            updateProcessCountUI(); // 0/15 업데이트
            return;
        }

        const tableHTML = `
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <!-- text-center 클래스 추가 -->
                        <th class="py-2 px-2 text-center">ID</th>
                        <th class="py-2 px-2 text-center">AT</th>
                        <th class="py-2 px-2 text-center">BT</th>
                        <th class="py-2 px-2 text-center">삭제</th>
                    </tr>
                </thead>
                <tbody>
                    ${finalProcessList.map(p => `
                        <tr class="border-b hover:bg-blue-50 transition-colors">
                            <!-- text-center 클래스 추가 -->
                            <td class="py-2 px-2 text-center font-medium">${p.id}</td>
                            <td class="py-2 px-2 text-center">${p.arrivalTime}</td>
                            <td class="py-2 px-2 text-center">${p.burstTime}</td>
                            <td class="py-2 px-2 text-center">
                                <button class="delete-btn text-red-500 hover:font-bold" data-id="${p.id}">❌</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHTML;

        // 생성된 삭제 버튼들에 이벤트 연결
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                if (id) removeProcess(id);
            });
        });

        updateProcessCountUI(); // 숫자 업데이트
    };

    const updateReadyQueue = (queue: string[]) => {
        const container = document.getElementById('ready-queue-container');
        if (!container) return;
        container.innerHTML = queue.length === 0 
            ? `<p class="empty-msg" style="color: #94a3b8; font-style: italic; font-size: 13px;">현재 대기 중인 프로세스가 없습니다.</p>`
            : queue.map(pId => `<div class="queue-item">${pId}</div>`).join('');
    };

    const getRandomInt = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // --- 3. 초기화 설정 ---
    if (rrControl) rrControl.classList.add('hidden');
    cRandom?.classList.remove('hidden');
    cManual?.classList.add('hidden');
    updateProcessCountUI(); // 초기 0 / 15 표시

    // --- 4. 모달 및 탭 제어 ---
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => modal?.classList.remove('hidden'));
    }
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

    // --- 5. 프로세스 추가 로직 ---
    addConfirmBtn?.addEventListener('click', () => {
        const isRandomTab = !cRandom?.classList.contains('hidden');

        // [추가] 15개 제한 체크
        if (finalProcessList.length >= 15) {
            alert("최대 15개까지만 추가 가능합니다.");
            return;
        }

        try {
            if (isRandomTab) {
                const countInput = document.getElementById('random-count') as HTMLInputElement;
                const atMinInput = document.getElementById('at-min') as HTMLInputElement;
                const atMaxInput = document.getElementById('at-max') as HTMLInputElement;
                const btMinInput = document.getElementById('bt-min') as HTMLInputElement;
                const btMaxInput = document.getElementById('bt-max') as HTMLInputElement;

                if (!countInput.value || !atMinInput.value || !atMaxInput.value || !btMinInput.value || !btMaxInput.value) {
                    alert("모든 빈칸을 채워주세요.");
                    return;
                }

                const count = Number(countInput.value);
                
                // [추가] 무작위 생성 시 15개 초과 여부 체크
                if (finalProcessList.length + count > 15) {
                    alert(`현재 ${finalProcessList.length}개가 있습니다. ${count}개를 더하면 15개를 초과합니다.`);
                    return;
                }

                const atMin = Number(atMinInput.value);
                const atMax = Number(atMaxInput.value);
                const btMin = Number(btMinInput.value);
                const btMax = Number(btMaxInput.value);

                if (atMin > atMax || btMin > btMax) {
                    alert("최소값이 최대값보다 클 수 없습니다.");
                    return;
                }

                for (let i = 0; i < count; i++) {
                    finalProcessList.push({
                        id: `P${processIdCounter++}`,
                        arrivalTime: getRandomInt(atMin, atMax),
                        burstTime: getRandomInt(btMin, btMax)
                    });
                }
            } else {
                const atInput = document.getElementById('manual-at') as HTMLInputElement;
                const btInput = document.getElementById('manual-bt') as HTMLInputElement;

                if (!atInput.value || !btInput.value) {
                    alert("모든 값을 입력해주세요.");
                    return;
                }

                finalProcessList.push({
                    id: `P${processIdCounter++}`,
                    arrivalTime: Number(atInput.value),
                    burstTime: Number(btInput.value)
                });
            }

            updateProcessTable();
            modal?.classList.add('hidden');

        } catch (err) {
            console.error("❌ 데이터 추가 중 오류:", err);
        }
    });

    // --- 5.5 실행 버튼 로직 ---
    const runBtn = document.getElementById('run-btn');
    runBtn?.addEventListener('click', () => {
        if (finalProcessList.length === 0) {
            alert("실행할 프로세스가 없습니다.");
            return;
        }
        const sortedQueue = [...finalProcessList].sort((a, b) => a.arrivalTime - b.arrivalTime);
        updateReadyQueue(sortedQueue.map(p => p.id));
    });

    // --- 6. 알고리즘 전환 및 코어 생성 ---
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedAlgo = btn.getAttribute('data-algo');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (rrControl) {
                selectedAlgo === 'RR' ? rrControl.classList.remove('hidden') : rrControl.classList.add('hidden');
            }
        });
    });

    const createCore = (index: number) => {
        if (!coreListContainer) return;
        const coreDiv = document.createElement('div');
        coreDiv.className = 'core-item';
        coreDiv.innerHTML = `
            <div class="core-header">
                <span class="font-bold text-sm">Core ${index}</span>
                <label class="switch"><input type="checkbox" class="core-toggle" checked><span class="slider"></span></label>
            </div>
            <select class="w-full text-xs border rounded p-1 core-type-select">
                <option value="P">P-Core (성능)</option>
                <option value="E" selected>E-Core (효율)</option>
            </select>
        `;
        const toggle = coreDiv.querySelector('.core-toggle') as HTMLInputElement;
        const typeSelect = coreDiv.querySelector('.core-type-select') as HTMLSelectElement;
        toggle.addEventListener('change', () => {
            coreDiv.style.opacity = toggle.checked ? "1" : "0.5";
            typeSelect.disabled = !toggle.checked;
        });
        coreListContainer.appendChild(coreDiv);
    };

    for (let i = 1; i <= 4; i++) { createCore(i); }
});