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
    
    const rocketPokemonNames = [
        '나옹', '아보크', '마자용', '셀러', '내루미', 
        '또가스', '우츠동', '선인왕', '데스마스', '흉내내', 
        '모르페코', '세비퍼', '따라큐', '개무소', '메가자리'
    ];

    let availableNames = [...rocketPokemonNames];

    const getRocketName = () => {
        if (availableNames.length === 0) return "Unknown";
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        return availableNames.splice(randomIndex, 1)[0];
    };

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

    const updateProcessCountUI = () => {
        const countDisplay = document.getElementById('process-count-display');
        if (countDisplay) {
            countDisplay.innerText = `${finalProcessList.length} / 15`;
        }
    };

    const removeProcess = (id: string) => {
        // 이름을 다시 풀(Pool)로 반환
        if (rocketPokemonNames.includes(id) && !availableNames.includes(id)) {
            availableNames.push(id);
        }
        finalProcessList = finalProcessList.filter(p => p.id !== id);
        console.log(`🗑️ [Delete] ${id} 프로세스 제거 완료`);
        updateProcessTable();
    };

    const updateProcessTable = () => {
        const container = document.getElementById('input-table-view');
        if (!container) return;

        if (finalProcessList.length === 0) {
            container.innerHTML = `<p class="empty-msg">난입 예정인 로켓단 포켓몬이 없습니다.</p>`;
            updateProcessCountUI();
            return;
        }

        const tableHTML = `
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="py-2 px-2 text-center">포켓몬</th>
                        <th class="py-2 px-2 text-center">난입</th>
                        <th class="py-2 px-2 text-center">체력(HP)</th>
                        <th class="py-2 px-2 text-center">제거</th>
                    </tr>
                </thead>
                <tbody>
                    ${finalProcessList.map(p => `
                        <tr class="border-b hover:bg-red-50 transition-colors">
                            <td class="py-2 px-2 text-center font-medium text-red-600">
                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <img src="/images/로켓단/${p.id}.png" class="rocket-icon" onerror="this.style.display='none'">
                                    <span>${p.id}</span>
                                </div>
                            </td>
                            <td class="py-2 px-2 text-center">${p.arrivalTime}</td>
                            <td class="py-2 px-2 text-center font-bold">${p.burstTime}</td>
                            <td class="py-2 px-2 text-center">
                                <button class="delete-btn text-gray-400 hover:text-red-500 transition-colors" data-id="${p.id}">❌</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHTML;

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                if (id) removeProcess(id);
            });
        });

        updateProcessCountUI();
    };

    const updateReadyQueue = (queue: string[]) => {
        const container = document.getElementById('ready-queue-container');
        if (!container) return;
        container.innerHTML = queue.length === 0 
            ? `<p class="empty-msg" style="color: #94a3b8; font-style: italic; font-size: 13px;">현재 대기 중인 로켓단 포켓몬이 없습니다.</p>`
            : queue.map(pId => `
                <div class="queue-item">
                    <img src="/images/로켓단/${pId}.png" class="queue-icon" onerror="this.style.display='none'">
                    <span>${pId}</span>
                </div>
            `).join('');
    };

    const getRandomInt = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // --- 3. 초기화 설정 ---
    if (rrControl) rrControl.classList.add('hidden');
    cRandom?.classList.remove('hidden');
    cManual?.classList.add('hidden');
    updateProcessCountUI();

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
                        id: getRocketName(),
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
                    id: getRocketName(),
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

    const runBtn = document.getElementById('run-btn');
    runBtn?.addEventListener('click', () => {
        if (finalProcessList.length === 0) {
            alert("실행할 프로세스가 없습니다.");
            return;
        }
        const sortedQueue = [...finalProcessList].sort((a, b) => a.arrivalTime - b.arrivalTime);
        updateReadyQueue(sortedQueue.map(p => p.id));
    });

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
        
        const battleContainer = document.getElementById('battle-pokemon-container');

        const pokeData = [
            { 
                name: "리자몽", 
                img: "/images/리자몽기본.png",
                megaImg: "/images/메가리자몽.png",
                color: "#fee2e2",
                accent: "#ef4444",
                standingImg: "/images/스탠딩/리자몽노말폼.gif",
                standingMegaImg: "/images/스탠딩/리자몽메가진화폼.gif"
            },
            { 
                name: "이상해꽃", 
                img: "/images/이상해꽃.png",
                megaImg: "/images/메가이상해꽃.png",
                color: "#f0fdf4",
                accent: "#22c55e",
                standingImg: "/images/스탠딩/이상해꽃노말폼.gif",
                standingMegaImg: "/images/스탠딩/이상해꽃메가진화폼.gif"
            },
            { 
                name: "거북왕", 
                img: "/images/거북왕.png",
                megaImg: "/images/메가거북왕.png",
                color: "#eff6ff",
                accent: "#3b82f6",
                standingImg: "/images/스탠딩/거북왕노말폼.gif",
                standingMegaImg: "/images/스탠딩/거북왕메가진화폼.gif"
            },
            { 
                name: "뮤츠", 
                img: "/images/뮤츠.png",
                megaImg: "/images/메가뮤츠.png",
                color: "#f5f3ff",
                accent: "#8b5cf6",
                standingImg: "/images/스탠딩/뮤츠노말폼.gif",
                standingMegaImg: "/images/스탠딩/뮤츠메가진화폼.gif"
            }
        ];
        const data = pokeData[index - 1] || { name: `Core ${index}`, img: "", megaImg: "", color: "#f8fafc", accent: "#cbd5e1", standingImg: "", standingMegaImg: "" };

        const battlePokeImg = document.createElement('img');
        battlePokeImg.className = 'battle-side-poke';
        battlePokeImg.id = `battle-poke-${index}`;
        battlePokeImg.src = data.standingImg;
        battlePokeImg.alt = data.name;
        battleContainer?.appendChild(battlePokeImg);

        const coreDiv = document.createElement('div');
        coreDiv.className = 'core-item';
        coreDiv.style.background = data.color;
        coreDiv.style.borderColor = data.accent + "44";

        coreDiv.innerHTML = `
            <div class="core-header">
                <div class="poke-info">
                    <img src="${data.img}" alt="${data.name}" class="poke-img" id="poke-img-${index}">
                    <span class="font-bold text-sm" id="poke-name-${index}">${data.name} (노말)</span>
                </div>
                <label class="switch"><input type="checkbox" class="core-toggle" checked><span class="slider"></span></label>
            </div>
            <select class="w-full text-xs border rounded p-1 core-type-select" id="core-type-${index}">
                <option value="P">메가진화 (P-Core)</option>
                <option value="E" selected>노말 모드 (E-Core)</option>
            </select>
        `;

        const toggle = coreDiv.querySelector('.core-toggle') as HTMLInputElement;
        const typeSelect = coreDiv.querySelector('.core-type-select') as HTMLSelectElement;
        const imgEl = coreDiv.querySelector(`#poke-img-${index}`) as HTMLImageElement;
        const nameEl = coreDiv.querySelector(`#poke-name-${index}`) as HTMLElement;

        const updateBattlefieldVisibility = () => {
            if (toggle.checked) {
                battlePokeImg.classList.remove('hidden');
            } else {
                battlePokeImg.classList.add('hidden');
            }
        };

        const updateForm = () => {
            const isMega = typeSelect.value === 'P';
            imgEl.src = isMega ? data.megaImg : data.img;
            battlePokeImg.src = isMega ? data.standingMegaImg : data.standingImg;
            nameEl.innerText = isMega ? `${data.name} (메가)` : `${data.name} (노말)`;
            
            if (isMega) {
                coreDiv.style.background = data.color; 
                coreDiv.style.borderColor = data.accent; 
                coreDiv.style.boxShadow = `0 0 10px ${data.accent}44`;
            } else {
                coreDiv.style.background = data.color;
                coreDiv.style.borderColor = data.accent + "44";
                coreDiv.style.boxShadow = "none";
            }
        };

        typeSelect.addEventListener('change', updateForm);
        toggle.addEventListener('change', () => {
            coreDiv.style.opacity = toggle.checked ? "1" : "0.5";
            typeSelect.disabled = !toggle.checked;
            updateBattlefieldVisibility();
        });

        updateBattlefieldVisibility();
        coreListContainer.appendChild(coreDiv);
    };

    for (let i = 1; i <= 4; i++) { createCore(i); }
});
