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
    let isVisualizing = false; // 시각화 진행 중 플래그
    let visualizationTimeout: number | null = null;
    
    // 간트 차트 블록 통합을 위한 상태 관리
    let lastBattleState: { 
        [coreId: number]: { 
            processName: string, 
            duration: number, 
            node: HTMLElement | null 
        } 
    } = {};
    
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
        if (rocketPokemonNames.includes(id) && !availableNames.includes(id)) {
            availableNames.push(id);
        }
        finalProcessList = finalProcessList.filter(p => p.id !== id);
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

        lastResults = results;

        if (!results || results.length === 0) {
            container.innerHTML = `<p class="empty-msg">배틀 결과가 여기에 표시됩니다.</p>`;
            return;
        }

        const sortedResults = [...results];
        if (currentSort.column) {
            sortedResults.sort((a, b) => {
                let valA = a[currentSort.column];
                let valB = b[currentSort.column];
                if (typeof valA === 'string') {
                    return currentSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return currentSort.direction === 'asc' ? valA - valB : valB - valA;
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
                                    <img src="/images/로켓단/${r.name}.png" class="rocket-icon" style="width: 24px; height: 24px;" onerror="this.style.display='none'">
                                    <span>${r.name}</span>
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

    const updatePowerDashboardUI = () => {
        const individualContainer = document.getElementById('individual-core-power');
        if (!individualContainer) return;

        const activeCoresInfo: { name: string, type: string }[] = [];
        const coreItems = document.querySelectorAll('.core-item');
        
        coreItems.forEach((item, idx) => {
            const toggle = item.querySelector('.core-toggle') as HTMLInputElement;
            const typeSelect = item.querySelector('.core-type-select') as HTMLSelectElement;
            const nameEl = item.querySelector(`#poke-name-${idx + 1}`) as HTMLElement;
            const pokemonName = nameEl ? nameEl.innerText.split(' ')[0] : `Core ${idx + 1}`;

            if (toggle && toggle.checked) {
                activeCoresInfo.push({ name: pokemonName, type: typeSelect.value });
            }
        });

        activeCoresInfo.sort((a, b) => {
            if (a.type === 'P' && b.type === 'E') return -1;
            if (a.type === 'E' && b.type === 'P') return 1;
            return 0;
        });

        individualContainer.innerHTML = activeCoresInfo.map((info) => {
            const color = info.type === 'P' ? '#7e22ce' : '#15803d';
            const typeText = info.type === 'P' ? '메가' : '노말';
            return `
                <div class="power-item" style="font-size: 11px; display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
                    <span style="color: ${color}; font-weight: 500;">${info.name} (${typeText}):</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: #64748b; font-size: 10px;">(0.0%)</span>
                        <span style="font-family: monospace; font-weight: 600;">0.00 Wh</span>
                    </div>
                </div>
            `;
        }).join('');
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
    if (openModalBtn) openModalBtn.addEventListener('click', () => modal?.classList.remove('hidden'));
    closeModalBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
    tRandom?.addEventListener('click', () => {
        tRandom.classList.add('active'); tManual?.classList.remove('active');
        cRandom?.classList.remove('hidden'); cManual?.classList.add('hidden');
    });
    tManual?.addEventListener('click', () => {
        tManual.classList.add('active'); tRandom?.classList.remove('active');
        cManual?.classList.remove('hidden'); cRandom?.classList.add('hidden');
    });

    addConfirmBtn?.addEventListener('click', () => {
        const isRandomTab = !cRandom?.classList.contains('hidden');
        if (finalProcessList.length >= 15) { alert("최대 15개까지만 추가 가능합니다."); return; }
        try {
            if (isRandomTab) {
                const countInput = document.getElementById('random-count') as HTMLInputElement;
                const atMinInput = document.getElementById('at-min') as HTMLInputElement;
                const atMaxInput = document.getElementById('at-max') as HTMLInputElement;
                const btMinInput = document.getElementById('bt-min') as HTMLInputElement;
                const btMaxInput = document.getElementById('bt-max') as HTMLInputElement;
                if (!countInput.value || !atMinInput.value || !atMaxInput.value || !btMinInput.value || !btMaxInput.value) { alert("모든 빈칸을 채워주세요."); return; }
                const count = Number(countInput.value);
                if (finalProcessList.length + count > 15) { alert(`현재 ${finalProcessList.length}개가 있습니다. ${count}개를 더하면 15개를 초과합니다.`); return; }
                const atMin = Number(atMinInput.value), atMax = Number(atMaxInput.value), btMin = Number(btMinInput.value), btMax = Number(btMaxInput.value);
                if (atMin > atMax || btMin > btMax) { alert("최소값이 최대값보다 클 수 없습니다."); return; }
                for (let i = 0; i < count; i++) {
                    finalProcessList.push({ id: getRocketName(), arrivalTime: getRandomInt(atMin, atMax), burstTime: getRandomInt(btMin, btMax) });
                }
            } else {
                const atInput = document.getElementById('manual-at') as HTMLInputElement;
                const btInput = document.getElementById('manual-bt') as HTMLInputElement;
                if (!atInput.value || !btInput.value) { alert("모든 값을 입력해주세요."); return; }
                finalProcessList.push({ id: getRocketName(), arrivalTime: Number(atInput.value), burstTime: Number(btInput.value) });
            }
            updateProcessTable();
            modal?.classList.add('hidden');
        } catch (err) { console.error("❌ 데이터 추가 중 오류:", err); }
    });

    const visualizeBattle = async (history: any[], processResults: any[], powerResults: any[], activeCores: any[]) => {
        if (isVisualizing) { if (visualizationTimeout) clearTimeout(visualizationTimeout); }
        isVisualizing = true;

        const resultContainer = document.getElementById('result-table-view');
        const timerEl = document.getElementById('battle-timer');
        const scrollContainer = document.getElementById('unified-tracks-container');
        const timeline = document.getElementById('gantt-timeline');
        
        lastBattleState = {};
        document.querySelectorAll('.gantt-track').forEach(track => track.innerHTML = '');
        if (timeline) timeline.innerHTML = '';

        if (timerEl) { timerEl.style.display = 'inline-block'; }
        if (scrollContainer) scrollContainer.scrollLeft = 0;

        for (let i = 0; i < history.length; i++) {
            if (!isVisualizing) break;
            const step = history[i];
            
            // 타임라인 눈금 추가
            if (timeline) {
                const tick = document.createElement('div');
                tick.className = 'timeline-tick';
                tick.style.width = '65px';
                tick.style.flexShrink = '0';
                tick.style.textAlign = 'center';
                tick.style.fontSize = '10px';
                tick.style.color = 'white';
                tick.style.fontWeight = 'bold';
                tick.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
                tick.innerText = `${step.time + 1}s`;
                timeline.appendChild(tick);
            }

            updateReadyQueue(step.ready_queue);
            updateBattlefieldState(step.core_states, activeCores);
            updatePowerDashboard(step.core_states, activeCores);

            if (resultContainer && step.process_states) {
                resultContainer.innerHTML = `
                    <table class="w-full text-sm">
                        <thead><tr class="border-b bg-gray-50"><th class="py-2 px-1 text-center">포켓몬</th><th class="py-2 px-1 text-center">상태</th><th class="py-2 px-1 text-center">현재체력 (RT)</th><th class="py-2 px-1 text-center">전체체력 (BT)</th><th class="py-2 px-1 text-center">진행도</th></tr></thead>
                        <tbody>${step.process_states.map((ps: any) => {
                            const progress = ((ps.bt - ps.rt) / ps.bt * 100).toFixed(1);
                            const isWorking = step.core_states.some((cs: any) => cs.process_name === ps.name);
                            const isWaiting = step.ready_queue.includes(ps.name);
                            const isApproaching = step.time < ps.at;
                            let statusText = "대기 중", statusColor = "#f59e0b", statusIcon = "대기중아이콘.png";
                            if (ps.is_done) { statusText = "종료"; statusColor = "#94a3b8"; statusIcon = "종료아이콘.png"; }
                            else if (isWorking) { statusText = "전투 중"; statusColor = "#ef4444"; statusIcon = "전투중아이콘.png"; }
                            else if (isApproaching) { statusText = "접근 중"; statusColor = "#6366f1"; statusIcon = "접근중아이콘.png"; }
                            else if (isWaiting) { statusText = "대기 중"; statusColor = "#f59e0b"; statusIcon = "대기중아이콘.png"; }

                            return `
                                <tr class="border-b">
                                    <td class="py-1 px-1 text-center">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                                            <img src="/images/로켓단/${ps.name}.png" style="width: 24px; height: 24px;">
                                            <span style="font-size: 14px;">${ps.name}</span>
                                        </div>
                                    </td>
                                    <td class="py-1 px-1 text-center">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px; color: ${statusColor}; font-weight: bold; font-size: 10px;">
                                            <img src="/images/아이콘/${statusIcon}" style="width: 18px; height: 18px; object-fit: contain;">
                                            <span>${statusText}</span>
                                        </div>
                                    </td>
                                    <td class="py-1 px-1 text-center font-bold text-red-600">${ps.rt}</td>
                                    <td class="py-1 px-1 text-center">${ps.bt}</td>
                                    <td class="py-1 px-1 text-center">
                                        <div style="width: 100%; background: #eee; height: 4px; border-radius: 2px; overflow: hidden;">
                                            <div style="width: ${progress}%; background: #22c55e; height: 100%;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}</tbody>
                    </table>
                `;
            }

            if (scrollContainer) {
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
            }
            await new Promise(resolve => { visualizationTimeout = window.setTimeout(resolve, 350); });
        }

        if (timerEl) timerEl.style.display = 'none';
        updateResultTable(processResults);
        updatePowerDashboard(powerResults, activeCores);
        document.querySelectorAll('.battle-side-poke').forEach(img => img.classList.remove('working'));
        isVisualizing = false; visualizationTimeout = null;
    };

    const updateBattlefieldState = (coreStates: any[], activeCores: any[]) => {
        coreStates.forEach((state: any) => {
            const mapping = activeCores[state.core_id];
            const realCoreId = mapping ? mapping.originalIndex : state.core_id + 1;
            const allyImg = document.getElementById(`battle-poke-${realCoreId}`);
            const track = document.getElementById(`gantt-track-${realCoreId}`);
            if (allyImg && track) {
                const currentProcess = state.process_name;
                const lastState = lastBattleState[realCoreId];
                if (lastState && lastState.processName === currentProcess && lastState.node) {
                    lastState.duration += 1;
                    // 가로 길이 확장 (65px 기준)
                    lastState.node.style.width = `${(65 * lastState.duration) + (4 * (lastState.duration - 1))}px`;
                    let badge = lastState.node.querySelector('.duration-badge');
                    if (!badge) { badge = document.createElement('div'); badge.className = 'duration-badge'; lastState.node.appendChild(badge); }
                    badge.textContent = `${lastState.duration}s`;
                } else {
                    const node = document.createElement('div');
                    node.className = 'gantt-node';
                    if (currentProcess !== "Idle") {
                        allyImg.classList.add('working'); node.classList.add('active');
                        node.innerHTML = `<img src="/images/로켓단/${currentProcess}.png" alt="${currentProcess}">`;
                    } else {
                        allyImg.classList.remove('working'); node.classList.add('idle');
                        node.innerHTML = `<span style="font-size: 10px; color: #94a3b8;">Zzz</span>`;
                    }
                    track.appendChild(node);
                    lastBattleState[realCoreId] = { processName: currentProcess, duration: 1, node: node };
                }
            }
        });
    };

    const runBtn = document.getElementById('run-btn');
    runBtn?.addEventListener('click', async () => {
        if (finalProcessList.length === 0) { alert("실행할 프로세스가 없습니다."); return; }
        if (isVisualizing) { if (!confirm("이미 배틀이 진행 중입니다. 새로 시작하시겠습니까?")) return; isVisualizing = false; if (visualizationTimeout) clearTimeout(visualizationTimeout); }
        const resultContainer = document.getElementById('result-table-view');
        if (resultContainer) resultContainer.innerHTML = `<p class="empty-msg" style="color: #6366f1; font-weight: 500;">📡 백엔드에서 전략을 분석 중...</p>`;
        const individualContainer = document.getElementById('individual-core-power');
        if (individualContainer) individualContainer.innerHTML = '';
        const activeAlgoBtn = document.querySelector('.tab-btn.active');
        let selectedAlgo = activeAlgoBtn?.getAttribute('data-algo') || 'FCFS';
        if (selectedAlgo === 'OWN') selectedAlgo = 'E-Value';
        const quantumInput = document.getElementById('realtime-tq') as HTMLInputElement;
        const timeQuantum = quantumInput ? Number(quantumInput.value) : 2;
        
        const kThresholdInput = document.getElementById('realtime-k') as HTMLInputElement;
        const kThreshold = kThresholdInput ? Number(kThresholdInput.value) : 3;

        const coreTypes: string[] = [];
        const activeCoresInfo: { name: string, type: string, originalIndex: number }[] = [];
        document.querySelectorAll('.core-item').forEach((item, idx) => {
            const toggle = item.querySelector('.core-toggle') as HTMLInputElement;
            const typeSelect = item.querySelector('.core-type-select') as HTMLSelectElement;
            const nameEl = item.querySelector(`#poke-name-${idx + 1}`) as HTMLElement;
            const pokemonName = nameEl ? nameEl.innerText.split(' ')[0] : `Core ${idx + 1}`;
            if (toggle && toggle.checked) {
                const type = typeSelect.value; 
                coreTypes.push(type);
                activeCoresInfo.push({ name: pokemonName, type: type, originalIndex: idx + 1 });
            }
        });
        if (coreTypes.length === 0) { alert("최소 하나 이상의 코어를 활성화해주세요."); return; }
        try {
            runBtn.innerHTML = "⏳ 분석 중..."; (runBtn as HTMLButtonElement).disabled = true;
            const response = await fetch('http://localhost:5000/api/simulate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    processes: finalProcessList.map(p => ({ name: p.id, at: p.arrivalTime, bt: p.burstTime })), 
                    core_types: coreTypes, 
                    algorithm: selectedAlgo, 
                    time_quantum: timeQuantum,
                    k_threshold: kThreshold
                }) 
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            await visualizeBattle(result.history, result.process_results, result.core_power_results, activeCoresInfo);
        } catch (error) { alert("백엔드 서버 연결에 실패했습니다."); } finally { 
            runBtn.innerHTML = '<img src="/images/실행버튼.png" alt="배틀 시작" style="height: 32px; object-fit: contain;">'; 
            (runBtn as HTMLButtonElement).disabled = false; 
        }
    });

    // --- 5. 알고리즘 탭 전환 제어 ---
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedAlgo = btn.getAttribute('data-algo');
            
            // 시각적 활성화 상태 변경
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 전용 설정창 제어
            const rrControl = document.getElementById('rr-quantum-control');
            const tvpControl = document.getElementById('tvp-k-control');

            if (rrControl) selectedAlgo === 'RR' ? rrControl.classList.remove('hidden') : rrControl.classList.add('hidden');
            if (tvpControl) selectedAlgo === 'OWN' ? tvpControl.classList.remove('hidden') : tvpControl.classList.add('hidden');
            
            console.log(`🎯 알고리즘 변경됨: ${selectedAlgo}`);
        });
    });

    const createCore = (index: number) => {
        if (!coreListContainer) return;
        const allyColumn = document.getElementById('ally-pokes-column');
        const tracksInner = document.getElementById('tracks-inner-content');
        const pokeData = [
            { name: "리자몽", img: "/images/리자몽기본.png", megaImg: "/images/메가리자몽.png", color: "#fee2e2", accent: "#ef4444", standingImg: "/images/스탠딩/리자몽노말폼.gif", standingMegaImg: "/images/스탠딩/리자몽메가진화폼.gif" },
            { name: "이상해꽃", img: "/images/이상해꽃.png", megaImg: "/images/메가이상해꽃.png", color: "#f0fdf4", accent: "#22c55e", standingImg: "/images/스탠딩/이상해꽃노말폼.gif", standingMegaImg: "/images/스탠딩/이상해꽃메가진화폼.gif" },
            { name: "거북왕", img: "/images/거북왕.png", megaImg: "/images/메가거북왕.png", color: "#eff6ff", accent: "#3b82f6", standingImg: "/images/스탠딩/거북왕노말폼.gif", standingMegaImg: "/images/스탠딩/거북왕메가진화폼.gif" },
            { name: "뮤츠", img: "/images/뮤츠.png", megaImg: "/images/메가뮤츠.png", color: "#f5f3ff", accent: "#8b5cf6", standingImg: "/images/스탠딩/뮤츠노말폼.gif", standingMegaImg: "/images/스탠딩/뮤츠메가진화폼.gif" }
        ];
        const data = pokeData[index - 1];
        const battlePokeImg = document.createElement('img');
        battlePokeImg.className = 'battle-side-poke ally-poke'; battlePokeImg.id = `battle-poke-${index}`;
        battlePokeImg.src = data.standingImg; allyColumn?.appendChild(battlePokeImg);
        const ganttTrack = document.createElement('div');
        ganttTrack.className = 'gantt-track'; ganttTrack.id = `gantt-track-${index}`;
        tracksInner?.appendChild(ganttTrack);
        const coreDiv = document.createElement('div');
        coreDiv.className = 'core-item'; coreDiv.style.background = data.color; coreDiv.style.borderColor = data.accent + "44";
        coreDiv.innerHTML = `<div class="core-header"><div class="poke-info"><img src="${data.img}" class="poke-img" id="poke-img-${index}"><span class="font-bold text-sm" id="poke-name-${index}">${data.name} (노말)</span></div><label class="switch"><input type="checkbox" class="core-toggle" checked><span class="slider"></span></label></div><select class="w-full text-xs border rounded p-1 core-type-select" id="core-type-${index}"><option value="P">메가진화 (P-Core)</option><option value="E" selected>노말 모드 (E-Core)</option></select>`;
        const toggle = coreDiv.querySelector('.core-toggle') as HTMLInputElement, typeSelect = coreDiv.querySelector('.core-type-select') as HTMLSelectElement, imgEl = coreDiv.querySelector(`#poke-img-${index}`) as HTMLImageElement, nameEl = coreDiv.querySelector(`#poke-name-${index}`) as HTMLElement;
        const updateBattlefieldVisibility = () => { if (toggle.checked) { battlePokeImg.classList.remove('hidden'); ganttTrack.classList.remove('hidden'); } else { battlePokeImg.classList.add('hidden'); ganttTrack.classList.add('hidden'); } };
        const updateForm = () => { const isMega = typeSelect.value === 'P'; imgEl.src = isMega ? data.megaImg : data.img; battlePokeImg.src = isMega ? data.standingMegaImg : data.standingImg; nameEl.innerText = isMega ? `${data.name} (메가)` : `${data.name} (노말)`; coreDiv.style.background = data.color; if (isMega) { coreDiv.style.borderColor = data.accent; coreDiv.style.boxShadow = `0 0 10px ${data.accent}44`; } else { coreDiv.style.borderColor = data.accent + "44"; coreDiv.style.boxShadow = "none"; } updatePowerDashboardUI(); };
        typeSelect.addEventListener('change', updateForm);
        toggle.addEventListener('change', () => { coreDiv.style.opacity = toggle.checked ? "1" : "0.5"; typeSelect.disabled = !toggle.checked; updateBattlefieldVisibility(); updatePowerDashboardUI(); });
        updateBattlefieldVisibility(); coreListContainer.appendChild(coreDiv); updatePowerDashboardUI();
    };

    for (let i = 1; i <= 4; i++) { createCore(i); }
    updatePowerDashboardUI();
});
