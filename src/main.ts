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
    let lastResults: any[] = []; // 마지막 배틀 결과 저장용
    let currentSort: { column: string, direction: 'asc' | 'desc' } = { column: '', direction: 'asc' };
    
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

    const updateResultTable = (results: any[]) => {
        const container = document.getElementById('result-table-view');
        if (!container) return;

        lastResults = results; // 마지막 데이터 업데이트

        if (!results || results.length === 0) {
            container.innerHTML = `<p class="empty-msg">배틀 결과가 여기에 표시됩니다.</p>`;
            return;
        }

        // 현재 정렬 상태에 따라 데이터 정렬
        const sortedResults = [...results];
        if (currentSort.column) {
            sortedResults.sort((a, b) => {
                let valA = a[currentSort.column];
                let valB = b[currentSort.column];
                
                if (typeof valA === 'string') {
                    return currentSort.direction === 'asc' 
                        ? valA.localeCompare(valB) 
                        : valB.localeCompare(valA);
                } else {
                    return currentSort.direction === 'asc' 
                        ? valA - valB 
                        : valB - valA;
                }
            });
        }

        const getSortIcon = (col: string) => {
            if (currentSort.column !== col) return '↕️';
            return currentSort.direction === 'asc' ? '🔼' : '🔽';
        };

        const tableHTML = `
            <table class="w-full text-sm result-sortable-table">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="name">포켓몬 ${getSortIcon('name')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="at">AT ${getSortIcon('at')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="bt">BT ${getSortIcon('bt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="wt">WT ${getSortIcon('wt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="tt">TT ${getSortIcon('tt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="ntt">NTT ${getSortIcon('ntt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="end_time">종료 ${getSortIcon('end_time')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedResults.map(r => `
                        <tr class="border-b hover:bg-green-50 transition-colors">
                            <td class="py-2 px-1 text-center font-medium">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <img src="/images/로켓단/${r.name}.png" class="rocket-icon" style="width: 20px; height: 20px;" onerror="this.style.display='none'">
                                    <span style="font-size: 11px;">${r.name}</span>
                                </div>
                            </td>
                            <td class="py-2 px-1 text-center">${r.at}</td>
                            <td class="py-2 px-1 text-center">${r.bt}</td>
                            <td class="py-2 px-1 text-center text-blue-600 font-bold">${r.wt}</td>
                            <td class="py-2 px-1 text-center text-red-600 font-bold">${r.tt}</td>
                            <td class="py-2 px-1 text-center">${r.ntt.toFixed(2)}</td>
                            <td class="py-2 px-1 text-center text-gray-500">${r.end_time}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHTML;

        // 헤더 클릭 이벤트 리스너 추가 (이벤트 위임)
        const table = container.querySelector('.result-sortable-table');
        table?.querySelector('thead')?.addEventListener('click', (e) => {
            const th = (e.target as HTMLElement).closest('th');
            if (!th) return;
            
            const col = th.getAttribute('data-col');
            if (!col) return;

            if (currentSort.column === col) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = col;
                currentSort.direction = 'asc';
            }

            updateResultTable(lastResults);
        });
    };

    const updatePowerDashboard = (corePowerResults: any[], activeCoresInfo: { name: string, type: string }[]) => {
        const totalWEl = document.getElementById('total-w');
        const pSumWEl = document.getElementById('p-sum-w');
        const eSumWEl = document.getElementById('e-sum-w');
        const individualContainer = document.getElementById('individual-core-power');

        let total = 0;
        let pSum = 0;
        let eSum = 0;

        corePowerResults.forEach(core => {
            total += core.total_power;
            if (core.core_type === 'P') pSum += core.total_power;
            else eSum += core.total_power;
        });

        if (totalWEl) totalWEl.innerText = `${total.toFixed(2)} Wh`;
        if (pSumWEl) pSumWEl.innerText = `${pSum.toFixed(2)} Wh`;
        if (eSumWEl) eSumWEl.innerText = `${eSum.toFixed(2)} Wh`;

        if (individualContainer) {
            individualContainer.innerHTML = corePowerResults.map((core, idx) => {
                const info = activeCoresInfo[idx] || { name: `Core ${core.core_id}`, type: core.core_type };
                const color = core.core_type === 'P' ? '#7e22ce' : '#15803d';
                const typeText = core.core_type === 'P' ? '메가' : '노말';
                
                // 전체 에너지 대비 백분율 계산 (0으로 나누기 방지)
                const percentage = total > 0 ? ((core.total_power / total) * 100).toFixed(1) : "0.0";
                
                return `
                    <div class="power-item" style="font-size: 11px; display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
                        <span style="color: ${color}; font-weight: 500;">${info.name} (${typeText}):</span>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #64748b; font-size: 10px;">(${percentage}%)</span>
                            <span style="font-family: monospace; font-weight: 600;">${core.total_power.toFixed(2)} Wh</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
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
    runBtn?.addEventListener('click', async () => {
        if (finalProcessList.length === 0) {
            alert("실행할 프로세스가 없습니다.");
            return;
        }

        // --- UI 초기화 및 즉각적인 피드백 ---
        
        // 1. 기존 결과 테이블 및 대시보드 비우기 (다시 시작하는 느낌 부여)
        const resultContainer = document.getElementById('result-table-view');
        if (resultContainer) resultContainer.innerHTML = `<p class="empty-msg" style="color: #6366f1; font-weight: 500;">⏳ 새로운 배틀 계산 중...</p>`;
        
        const individualContainer = document.getElementById('individual-core-power');
        if (individualContainer) individualContainer.innerHTML = '';
        
        // 2. 레디 큐에 현재 포켓몬들 즉시 표시 (AT 순서로 예시 정렬)
        const initialQueue = [...finalProcessList].sort((a, b) => a.arrivalTime - b.arrivalTime);
        updateReadyQueue(initialQueue.map(p => p.id));

        // --- 백엔드 전송 데이터 준비 ---
        
        // 1. 알고리즘 및 옵션 가져오기
        const activeAlgoBtn = document.querySelector('.tab-btn.active');
        let selectedAlgo = activeAlgoBtn?.getAttribute('data-algo') || 'FCFS';
        
        // 'OWN' 알고리즘은 백엔드의 'E-Value'에 매칭
        if (selectedAlgo === 'OWN') selectedAlgo = 'E-Value';

        const quantumInput = document.getElementById('realtime-tq') as HTMLInputElement;
        const timeQuantum = quantumInput ? Number(quantumInput.value) : 2;

        // 2. 코어 설정 가져오기 (P-Core, E-Core 개수 계산 및 이름 수집)
        let pCount = 0;
        let eCount = 0;
        const activeCoresInfo: { name: string, type: string }[] = [];
        
        const coreItems = document.querySelectorAll('.core-item');
        coreItems.forEach((item, idx) => {
            const toggle = item.querySelector('.core-toggle') as HTMLInputElement;
            const typeSelect = item.querySelector('.core-type-select') as HTMLSelectElement;
            const nameEl = item.querySelector(`#poke-name-${idx + 1}`) as HTMLElement;
            
            const pokemonName = nameEl ? nameEl.innerText.split(' ')[0] : `Core ${idx + 1}`;

            if (toggle && toggle.checked) {
                if (typeSelect.value === 'P') pCount++;
                else eCount++;

                activeCoresInfo.push({
                    name: pokemonName,
                    type: typeSelect.value
                });
            }
        });

        // 백엔드는 P코어를 먼저 생성하므로, 프론트에서도 P코어를 우선하도록 정렬하여 매칭
        activeCoresInfo.sort((a, b) => {
            if (a.type === 'P' && b.type === 'E') return -1;
            if (a.type === 'E' && b.type === 'P') return 1;
            return 0;
        });

        if (pCount === 0 && eCount === 0) {
            alert("최소 하나 이상의 코어를 활성화해주세요.");
            return;
        }

        // 3. 프로세스 목록 변환
        const requestData = {
            processes: finalProcessList.map(p => ({
                name: p.id,
                at: p.arrivalTime,
                bt: p.burstTime
            })),
            p_core_count: pCount,
            e_core_count: eCount,
            algorithm: selectedAlgo,
            time_quantum: timeQuantum
        };

        try {
            console.log("📡 백엔드에 시뮬레이터 데이터 요청 중...", requestData);
            runBtn.innerText = "⏳ 계산 중...";
            (runBtn as HTMLButtonElement).disabled = true;

            const response = await fetch('http://localhost:5000/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("✅ 백엔드 응답 수신:", result);
            
            // UI 업데이트 실행
            updateResultTable(result.process_results);
            updatePowerDashboard(result.core_power_results, activeCoresInfo);
            
            // TODO: 간트 차트(전체 히스토리) 애니메이션 구현
            console.log("📊 전체 히스토리 데이터:", result.history);

        } catch (error) {
            console.error("❌ 백엔드 통신 실패:", error);
            alert("백엔드 서버 연결에 실패했습니다. (localhost:5000)");
        } finally {
            runBtn.innerText = "⚔️ 배틀 시작!";
            (runBtn as HTMLButtonElement).disabled = false;
        }
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
        // ... (생략된 부분은 그대로 유지됨을 replace 툴이 보장함)
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