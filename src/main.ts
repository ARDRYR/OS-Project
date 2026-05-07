import './styles/style.css';
import { IMAGE_MAP, ICON_MAP } from './utils/pokemonMapper';

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
    let inputSort: { column: string, direction: 'asc' | 'desc' } = { column: '', direction: 'asc' };
    let resultSort: { column: string, direction: 'asc' | 'desc' } = { column: '', direction: 'asc' };
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

    const toggleControls = (enabled: boolean) => {
        const openModalBtn = document.getElementById('open-modal-btn') as HTMLButtonElement;
        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        const coreToggles = document.querySelectorAll('.core-toggle');
        const coreTypeSelects = document.querySelectorAll('.core-type-select');
        const deleteBtns = document.querySelectorAll('.delete-btn');
        const expandBtns = document.querySelectorAll('.expand-btn');
        const algoBtns = document.querySelectorAll('.tab-btn');
        const inputs = document.querySelectorAll('input, select');
        
        // 주요 컨테이너들을 통째로 막음
        const controlPanels = document.querySelectorAll('.data-card, .algo-tabs');

        if (openModalBtn) {
            openModalBtn.disabled = !enabled;
            openModalBtn.style.opacity = enabled ? "1" : "0.5";
            openModalBtn.style.cursor = enabled ? "pointer" : "not-allowed";
        }
        
        if (runBtn) {
            runBtn.disabled = !enabled;
            runBtn.style.opacity = enabled ? "1" : "0.5";
            runBtn.style.cursor = enabled ? "pointer" : "not-allowed";
        }

        coreToggles.forEach(el => (el as HTMLInputElement).disabled = !enabled);
        coreTypeSelects.forEach(el => (el as HTMLSelectElement).disabled = !enabled);
        deleteBtns.forEach(el => (el as HTMLButtonElement).disabled = !enabled);
        expandBtns.forEach(el => (el as HTMLButtonElement).disabled = !enabled);
        
        algoBtns.forEach(el => {
            (el as HTMLButtonElement).disabled = !enabled;
            (el as HTMLElement).style.opacity = enabled ? "1" : "0.5";
            (el as HTMLElement).style.cursor = enabled ? "pointer" : "not-allowed";
        });

        inputs.forEach(el => (el as HTMLInputElement).disabled = !enabled);
        
        controlPanels.forEach(el => {
            // 스크롤을 위해 .data-card의 pointerEvents는 차단하지 않음
            if (el.classList.contains('algo-tabs')) {
                (el as HTMLElement).style.pointerEvents = enabled ? "auto" : "none";
            } else {
                (el as HTMLElement).style.pointerEvents = "auto";
            }

            if (!el.classList.contains('battle-side-stage')) { // 배틀필드 제외
                (el as HTMLElement).style.opacity = enabled ? "1" : "0.9";
            }
        });

        // 테이블 헤더(정렬 기능)는 실행 중 클릭할 수 없게 함
        const ths = document.querySelectorAll('.table-wrapper th');
        ths.forEach(th => {
            (th as HTMLElement).style.pointerEvents = enabled ? "auto" : "none";
        });
    };

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
        // 모달이 열려있다면 모달 내용도 갱신
        const fullTableModal = document.getElementById('full-table-modal');
        if (fullTableModal && !fullTableModal.classList.contains('hidden')) {
            const fullTableBody = document.getElementById('full-table-body');
            if (fullTableBody) updateProcessTable(fullTableBody);
        }
    };

    const getSortIcon = (sortState: { column: string, direction: 'asc' | 'desc' }, col: string) => {
        if (sortState.column !== col) return '↕️';
        return sortState.direction === 'asc' ? '🔼' : '🔽';
    };

    const updateProcessTable = (containerOverride?: HTMLElement) => {
        const container = containerOverride || document.getElementById('input-table-view');
        if (!container) return;

        if (finalProcessList.length === 0) {
            container.innerHTML = `<p class="empty-msg">난입 예정인 로켓단 포켓몬이 없습니다.</p>`;
            updateProcessCountUI();
            return;
        }

        const sortedList = [...finalProcessList];
        if (inputSort.column) {
            sortedList.sort((a: any, b: any) => {
                let valA = a[inputSort.column === 'name' ? 'id' : inputSort.column];
                let valB = b[inputSort.column === 'name' ? 'id' : inputSort.column];
                if (typeof valA === 'string') {
                    return inputSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return inputSort.direction === 'asc' ? valA - valB : valB - valA;
                }
            });
        }

        const tableHTML = `
            <table class="w-full text-sm input-sortable-table">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="py-2 px-2 text-center cursor-pointer hover:bg-gray-100" data-col="name">포켓몬 ${getSortIcon(inputSort, 'name')}</th>
                        <th class="py-2 px-2 text-center cursor-pointer hover:bg-gray-100" data-col="arrivalTime">난입 ${getSortIcon(inputSort, 'arrivalTime')}</th>
                        <th class="py-2 px-2 text-center cursor-pointer hover:bg-gray-100" data-col="burstTime">체력(HP) ${getSortIcon(inputSort, 'burstTime')}</th>
                        <th class="py-2 px-2 text-center">제거</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedList.map(p => `
                        <tr class="border-b hover:bg-red-50 transition-colors">
                            <td class="py-2 px-2 text-center font-medium text-red-600">
                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <img src="images/rocket/${IMAGE_MAP[p.id] || p.id}.png" class="rocket-icon" onerror="this.style.display='none'">
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

        container.querySelector('.input-sortable-table thead')?.addEventListener('click', (e) => {
            const th = (e.target as HTMLElement).closest('th');
            if (!th) return;
            const col = th.getAttribute('data-col');
            if (!col) return;
            
            if (inputSort.column === col) {
                inputSort.direction = inputSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                inputSort.column = col;
                inputSort.direction = 'asc';
            }
            
            updateProcessTable();
            // 모달이 열려있다면 모달 내용도 갱신
            const fullTableModal = document.getElementById('full-table-modal');
            if (fullTableModal && !fullTableModal.classList.contains('hidden')) {
                const fullTableBody = document.getElementById('full-table-body');
                if (fullTableBody) updateProcessTable(fullTableBody);
            }
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
                    <img src="images/rocket/${IMAGE_MAP[pId] || pId}.png" class="queue-icon" onerror="this.style.display='none'">
                    <span>${pId}</span>
                </div>
            `).join('');
    };

    const getRandomInt = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const updateResultTable = (results: any[], containerOverride?: HTMLElement) => {
        const container = containerOverride || document.getElementById('result-table-view');
        if (!container) return;

        lastResults = results;

        if (!results || results.length === 0) {
            container.innerHTML = `<p class="empty-msg">배틀 결과가 여기에 표시됩니다.</p>`;
            return;
        }

        const sortedResults = [...results];
        if (resultSort.column) {
            sortedResults.sort((a: any, b: any) => {
                let valA = a[resultSort.column];
                let valB = b[resultSort.column];
                if (typeof valA === 'string') {
                    return resultSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return resultSort.direction === 'asc' ? valA - valB : valB - valA;
                }
            });
        }

        const avgBT = results.length > 0 ? (results.reduce((sum, r) => sum + r.bt, 0) / results.length).toFixed(2) : "0.00";
        const avgWT = results.length > 0 ? (results.reduce((sum, r) => sum + r.wt, 0) / results.length).toFixed(2) : "0.00";
        const avgTT = results.length > 0 ? (results.reduce((sum, r) => sum + r.tt, 0) / results.length).toFixed(2) : "0.00";
        const avgNTT = results.length > 0 ? (results.reduce((sum, r) => sum + r.ntt, 0) / results.length).toFixed(2) : "0.00";

        const tableHTML = `
            <table class="w-full text-sm result-sortable-table">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="name">포켓몬 ${getSortIcon(resultSort, 'name')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="at">AT ${getSortIcon(resultSort, 'at')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="bt">BT ${getSortIcon(resultSort, 'bt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="wt">WT ${getSortIcon(resultSort, 'wt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="tt">TT ${getSortIcon(resultSort, 'tt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="ntt">NTT ${getSortIcon(resultSort, 'ntt')}</th>
                        <th class="py-2 px-1 text-center cursor-pointer hover:bg-gray-100" data-col="end_time">종료 ${getSortIcon(resultSort, 'end_time')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedResults.map(r => `
                        <tr class="border-b hover:bg-green-50 transition-colors">
                            <td class="py-2 px-1 text-center font-medium">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <img src="images/rocket/${IMAGE_MAP[r.name] || r.name}.png" class="rocket-icon" style="width: 24px; height: 24px;" onerror="this.style.display='none'">
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
                <tfoot class="bg-gray-100 font-bold">
                    <tr class="border-t-2 border-gray-300">
                        <td class="py-3 px-1 text-center" colspan="2">📊 전체 평균 (Average)</td>
                        <td class="py-3 px-1 text-center text-gray-600">${avgBT}</td>
                        <td class="py-3 px-1 text-center text-blue-700">${avgWT}</td>
                        <td class="py-3 px-1 text-center text-red-700">${avgTT}</td>
                        <td class="py-3 px-1 text-center text-gray-800">${avgNTT}</td>
                        <td class="py-3 px-1 text-center">-</td>
                    </tr>
                </tfoot>
            </table>
        `;
        container.innerHTML = tableHTML;

        container.querySelector('.result-sortable-table thead')?.addEventListener('click', (e) => {
            const th = (e.target as HTMLElement).closest('th');
            if (!th) return;
            const col = th.getAttribute('data-col');
            if (!col) return;
            
            if (resultSort.column === col) {
                resultSort.direction = resultSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                resultSort.column = col;
                resultSort.direction = 'asc';
            }
            
            // 모든 결과 테이블 동시 갱신
            updateResultTable(lastResults);
            const fullTableModal = document.getElementById('full-table-modal');
            if (fullTableModal && !fullTableModal.classList.contains('hidden')) {
                const fullTableBody = document.getElementById('full-table-body');
                if (fullTableBody) updateResultTable(lastResults, fullTableBody);
            }
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
                <div class="power-item" style="font-size: 11px; display: flex; justify-content: space-between; align-items: center; padding: 1px 0;">
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

        corePowerResults.forEach((core, idx) => {
            const info = activeCoresInfo[idx];
            const type = info ? info.type : (core.core_type || 'P');
            
            total += core.total_power;
            if (type === 'P') pSum += core.total_power;
            else eSum += core.total_power;
        });

        if (totalWEl) totalWEl.innerText = `${total.toFixed(2)} Wh`;
        if (pSumWEl) pSumWEl.innerText = `${pSum.toFixed(2)} Wh`;
        if (eSumWEl) eSumWEl.innerText = `${eSum.toFixed(2)} Wh`;

        if (individualContainer) {
            individualContainer.innerHTML = corePowerResults.map((core, idx) => {
                const info = activeCoresInfo[idx] || { name: `Core ${core.core_id}`, type: core.core_type || 'P' };
                const coreType = info.type || core.core_type || 'P';
                const color = coreType === 'P' ? '#7e22ce' : '#15803d';
                const typeText = coreType === 'P' ? '메가' : '노말';
                const percentage = total > 0 ? ((core.total_power / total) * 100).toFixed(1) : "0.0";
                
                // 실시간 소비전력 표시 (current_power가 있을 경우)
                const currentPowerText = core.current_power !== undefined ? 
                    `<span style="color: #ef4444; font-size: 9px; margin-right: 4px;">(${core.current_power.toFixed(1)}W)</span>` : '';

                return `
                    <div class="power-item" style="font-size: 11px; display: flex; justify-content: space-between; align-items: center; padding: 1px 0;">
                        <span style="color: ${color}; font-weight: 500;">${info.name} (${typeText}):</span>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${currentPowerText}
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
    let selectedRocketId: string | null = null;

    const renderPokemonSelectionGrid = () => {
        const grid = document.getElementById('pokemon-select-grid');
        if (!grid) return;
        
        // 현재 리스트에 있는 포켓몬 이름들 추출
        const existingNames = finalProcessList.map(p => p.id);

        grid.innerHTML = rocketPokemonNames.map(name => {
            const isExisting = existingNames.includes(name);
            return `
                <div class="selectable-pokemon ${isExisting ? 'disabled' : ''}" 
                     data-id="${name}" 
                     style="cursor: ${isExisting ? 'not-allowed' : 'pointer'}; 
                            border: 2px solid transparent; 
                            border-radius: 8px; 
                            padding: 4px; 
                            text-align: center; 
                            transition: all 0.2s;
                            opacity: ${isExisting ? '0.4' : '1'};
                            filter: ${isExisting ? 'grayscale(100%)' : 'none'};
                            pointer-events: ${isExisting ? 'none' : 'auto'};">
                    <img src="images/rocket/${IMAGE_MAP[name] || name}.png" style="width: 32px; height: 32px; object-fit: contain;">
                    <div style="font-size: 10px; margin-top: 2px;">${name}</div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.selectable-pokemon:not(.disabled)').forEach(el => {
            el.addEventListener('click', () => {
                grid.querySelectorAll('.selectable-pokemon').forEach(item => {
                    (item as HTMLElement).style.borderColor = 'transparent';
                    (item as HTMLElement).style.background = 'transparent';
                });
                (el as HTMLElement).style.borderColor = '#ef4444';
                (el as HTMLElement).style.background = '#fef2f2';
                selectedRocketId = (el as HTMLElement).getAttribute('data-id');
            });
        });
    };

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal?.classList.remove('hidden');
            renderPokemonSelectionGrid();
            selectedRocketId = null; // 초기화
        });
    }
    closeModalBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
    
    tRandom?.addEventListener('click', () => {
        tRandom.classList.add('active'); tManual?.classList.remove('active');
        cRandom?.classList.remove('hidden'); cManual?.classList.add('hidden');
    });
    tManual?.addEventListener('click', () => {
        tManual.classList.add('active'); tRandom?.classList.remove('active');
        cManual?.classList.remove('hidden'); cRandom?.classList.add('hidden');
    });

    const showRocketWarning = (title?: string, message?: string) => {
        const overlay = document.getElementById('rocket-warning-overlay');
        const titleEl = overlay?.querySelector('h2');
        const messageEl = overlay?.querySelector('p');
        
        if (title && titleEl) titleEl.innerText = title;
        if (message && messageEl) messageEl.innerText = message;
        
        overlay?.classList.remove('hidden');
    };

    document.getElementById('rocket-warning-close-btn')?.addEventListener('click', () => {
        document.getElementById('rocket-warning-overlay')?.classList.add('hidden');
    });

    addConfirmBtn?.addEventListener('click', () => {
        const isRandomTab = !cRandom?.classList.contains('hidden');
        if (finalProcessList.length >= 15) { 
            showRocketWarning("전장이 꽉 찼다!", "로켓단 유닛은 최대 15개까지만 투입할 수 있어!\n이미 전장은 아수라장이라고!"); 
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
                    showRocketWarning("모든 빈칸을 채워라!", "로켓단의 시간은 금이라고!\n빈틈없이 명령을 입력해!"); 
                    return; 
                }
                
                const count = Number(countInput.value);
                if (finalProcessList.length + count > 15) { 
                    showRocketWarning("너무 많이 보내지 마!", `현재 ${finalProcessList.length}개가 있어. ${count}개를 더하면\n로켓단 최대 수용량(15개)을 초과한다구!`); 
                    return; 
                }
                const atMin = Number(atMinInput.value), atMax = Number(atMaxInput.value), btMin = Number(btMinInput.value), btMax = Number(btMaxInput.value);
                
                if (atMin > atMax || btMin > btMax) { 
                    showRocketWarning("범위가 엉망이잖아!", "최솟값이 최대값보다 크다니,\n제대로 된 작전을 짜란 말이야!"); 
                    return; 
                }

                for (let i = 0; i < count; i++) {
                    finalProcessList.push({ id: getRocketName(), arrivalTime: getRandomInt(atMin, atMax), burstTime: getRandomInt(btMin, btMax) });
                }
            } else {
                const atInput = document.getElementById('manual-at') as HTMLInputElement;
                const btInput = document.getElementById('manual-bt') as HTMLInputElement;
                if (!selectedRocketId) { 
                    showRocketWarning("포켓몬을 선택해!", "어떤 포켓몬을 보낼지 정해야 할 거 아냐!\n리스트에서 하나 골라봐!");
                    return; 
                }
                if (!atInput.value || !btInput.value) { 
                    showRocketWarning("모든 빈칸을 채워라!", "로켓단의 시간은 금이라고!\n빈틈없이 명령을 입력해!"); 
                    return; 
                }
                
                finalProcessList.push({ 
                    id: selectedRocketId, 
                    arrivalTime: Number(atInput.value), 
                    burstTime: Number(btInput.value) 
                });
                
                // 수동 추가한 이름은 랜덤 풀에서 제거 (중복 방지 원할 경우)
                availableNames = availableNames.filter(name => name !== selectedRocketId);
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

        // 모든 프로세스의 초기 상태 설정
        const processTracker = new Map<string, { rt: number, bt: number, at: number, done: boolean }>();
        processResults.forEach(r => {
            processTracker.set(r.name, { rt: r.bt, bt: r.bt, at: r.at, done: false });
        });

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

            if (resultContainer) {
                const prevScrollTop = resultContainer.scrollTop;
                
                // 현재 스텝에서의 프로세스 상태들 계산
                const currentProcessStates = processResults.map(pr => {
                    const name = pr.name;
                    const tracker = processTracker.get(name)!;
                    
                    // 코어에서 실행 중인지 확인하여 RT 동기화
                    const coreState = step.core_states.find((cs: any) => cs.process_name === name);
                    if (coreState) {
                        tracker.rt = coreState.rt;
                    }

                    const isDone = pr.end_time <= step.time;
                    
                    // 종료 상태라면 남은 체력(RT)을 0으로 강제 (진행도 100% 연출용)
                    let displayRt = tracker.rt;
                    if (isDone) {
                        displayRt = 0;
                    }

                    const isWorking = !!coreState;
                    const isWaiting = step.ready_queue.includes(name);
                    const isApproaching = step.time < pr.at;

                    let statusText = "대기 중", statusColor = "#f59e0b", statusIcon = "waiting_icon.png";
                    if (isDone) { statusText = "종료"; statusColor = "#94a3b8"; statusIcon = "finish_icon.png"; }
                    else if (isWorking) { statusText = "전투 중"; statusColor = "#ef4444"; statusIcon = "fighting_icon.png"; }
                    else if (isApproaching) { statusText = "접근 중"; statusColor = "#6366f1"; statusIcon = "coming_icon.png"; }
                    else if (isWaiting) { statusText = "대기 중"; statusColor = "#f59e0b"; statusIcon = "waiting_icon.png"; }

                    return {
                        name,
                        rt: displayRt,
                        bt: tracker.bt,
                        statusText,
                        statusColor,
                        statusIcon
                    };
                });

                resultContainer.innerHTML = `
                    <table class="w-full text-sm">
                        <thead><tr class="border-b bg-gray-50"><th class="py-2 px-1 text-center">포켓몬</th><th class="py-2 px-1 text-center">상태</th><th class="py-2 px-1 text-center">현재체력 (RT)</th><th class="py-2 px-1 text-center">전체체력 (BT)</th><th class="py-2 px-1 text-center">진행도</th></tr></thead>
                        <tbody>${currentProcessStates.map((ps: any) => {
                            const progress = ((ps.bt - ps.rt) / ps.bt * 100).toFixed(1);
                            return `
                                <tr class="border-b">
                                    <td class="py-1 px-1 text-center">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                                            <img src="images/rocket/${IMAGE_MAP[ps.name] || ps.name}.png" style="width: 24px; height: 24px;">
                                            <span style="font-size: 14px;">${ps.name}</span>
                                        </div>
                                    </td>
                                    <td class="py-1 px-1 text-center">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px; color: ${ps.statusColor}; font-weight: bold; font-size: 10px;">
                                            <img src="images/icons/${ICON_MAP[ps.statusIcon] || ps.statusIcon}" style="width: 18px; height: 18px; object-fit: contain;">
                                            <span>${ps.statusText}</span>
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
                resultContainer.scrollTop = prevScrollTop;
            }

            if (scrollContainer) {
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
            }
            await new Promise(resolve => { visualizationTimeout = window.setTimeout(resolve, 350); });
        }

        if (timerEl) timerEl.style.display = 'none';
        updateResultTable(processResults);
        updatePowerDashboard(powerResults, activeCores);
        document.querySelectorAll('.battle-side-poke').forEach(img => img.classList.remove('working', 'warning'));
        isVisualizing = false; visualizationTimeout = null;
        toggleControls(true); // UI 활성화
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
                
                // Warning 상태 처리
                if (state.is_warning) {
                    allyImg.classList.add('warning');
                } else {
                    allyImg.classList.remove('warning');
                }

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
                        node.innerHTML = `<img src="images/rocket/${IMAGE_MAP[currentProcess] || currentProcess}.png" alt="${currentProcess}">`;
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
        if (finalProcessList.length === 0) { 
            showRocketWarning("작전 개시 불가!", "명령을 내릴 로켓단 포켓몬이 없잖아!\n먼저 포켓몬을 난입시키라고!"); 
            return; 
        }
        if (isVisualizing) { if (!confirm("이미 배틀이 진행 중입니다. 새로 시작하시겠습니까?")) return; isVisualizing = false; if (visualizationTimeout) clearTimeout(visualizationTimeout); }
        
        toggleControls(false); // UI 전체 잠금 시작
        modal?.classList.add('hidden'); // 모달이 열려있다면 닫음

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
        if (coreTypes.length === 0) { 
            showRocketWarning("우리 팀이 없어!", "싸울 우리 팀 포켓몬이 하나도 없다니!\n최소 한 명은 엔트리에 넣으라고!");
            toggleControls(true); 
            return; 
        }
        
        try {
            runBtn.innerHTML = "⏳ 분석 중...";
            const response = await fetch('https://pokemon-os-scheduler-simulator.onrender.com/api/simulate', { 
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
        } catch (error) { 
            showRocketWarning("통신 에러!", "백엔드 본부와 연락이 끊겼다!\n서버가 켜져 있는지 확인해봐!"); 
        } finally { 
            runBtn.innerHTML = '<img src="images/start-button.png" alt="배틀 시작" style="height: 32px; object-fit: contain;">'; 
            toggleControls(true); // UI 전체 잠금 해제
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

    // --- 6. 테이블 확장 모달 제어 ---
    const fullTableModal = document.getElementById('full-table-modal');
    const fullTableTitle = document.getElementById('full-table-title');
    const fullTableBody = document.getElementById('full-table-body');
    const fullTableIcon = document.getElementById('expansion-modal-icon') as HTMLImageElement;
    const closeFullTableBtn = document.getElementById('close-full-table-modal');

    const openFullTableModal = (title: string, tableId: string, iconSrc: string, subtitle?: string) => {
        if (!fullTableModal || !fullTableTitle || !fullTableBody || !fullTableIcon) return;
        
        fullTableTitle.innerHTML = `${title} <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 8px;">${subtitle || ''}</span>`;
        fullTableIcon.src = iconSrc;
        fullTableBody.innerHTML = '';
        
        if (tableId === 'input-table-view') {
            updateProcessTable(fullTableBody);
        } else if (tableId === 'result-table-view') {
            updateResultTable(lastResults, fullTableBody);
        }
        
        fullTableModal.classList.remove('hidden');
    };

    document.getElementById('expand-input-table-btn')?.addEventListener('click', () => {
        openFullTableModal('로켓단 포켓몬 정보 상세', 'input-table-view', 'images/rocket/rocket_logo.png', '(AT: 난입 / BT: 체력)');
    });

    document.getElementById('expand-result-table-btn')?.addEventListener('click', () => {
        openFullTableModal('배틀 결과 기록 상세', 'result-table-view', 'images/gym-badge.png');
    });

    closeFullTableBtn?.addEventListener('click', () => {
        fullTableModal?.classList.add('hidden');
    });

    fullTableModal?.addEventListener('click', (e) => {
        if (e.target === fullTableModal) fullTableModal.classList.add('hidden');
    });

    const createCore = (index: number) => {
        if (!coreListContainer) return;
        const allyColumn = document.getElementById('ally-pokes-column');
        const tracksInner = document.getElementById('tracks-inner-content');
        const pokeData = [
            { name: "리자몽", img: "images/charizard.png", megaImg: "images/mega-charizard.png", color: "#fee2e2", accent: "#ef4444", standingImg: "images/standing/charizard_normalform.gif", standingMegaImg: "images/standing/charizard_megaform.gif" },
            { name: "이상해꽃", img: "images/venusaur.png", megaImg: "images/mega-venusaur.png", color: "#f0fdf4", accent: "#22c55e", standingImg: "images/standing/venusaur_normalform.gif", standingMegaImg: "images/standing/venusaur_megaform.gif" },
            { name: "거북왕", img: "images/blastoise.png", megaImg: "images/mega-blastoise.png", color: "#eff6ff", accent: "#3b82f6", standingImg: "images/standing/blastoise_normalform.gif", standingMegaImg: "images/standing/blastoise_megaform.gif" },
            { name: "뮤츠", img: "images/mewtwo.png", megaImg: "images/mega-mewtwo.png", color: "#f5f3ff", accent: "#8b5cf6", standingImg: "images/standing/mewtwo_normalform.gif", standingMegaImg: "images/standing/mewtwo_megaform.gif" }
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
