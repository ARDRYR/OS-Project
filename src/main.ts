// 1. 필요한 HTML 요소들을 안전하게 가져오기
const processList = document.getElementById('process-list') as HTMLTableSectionElement;
const addProcessBtn = document.getElementById('add-process-btn') as HTMLButtonElement;
const algoSelect = document.getElementById('algo-select') as HTMLSelectElement;
const rrQuantumDiv = document.getElementById('rr-quantum-input') as HTMLDivElement;

const coreListContainer = document.getElementById('core-list-container') as HTMLDivElement;
const addCoreBtn = document.getElementById('add-core-btn') as HTMLButtonElement;
const runBtn = document.getElementById('run-btn') as HTMLButtonElement;

let coreCount = 0; 
let processCount = 0;

// --- 시스템 설정: 코어 추가/삭제 로직 ---

function updateCoreLabels() {
    const cores = coreListContainer.querySelectorAll('.core-input-item');
    cores.forEach((core, index) => {
        const label = core.querySelector('.core-label');
        if (label) (label as HTMLElement).innerText = `Core ${index + 1}`;
    });
}

addCoreBtn.addEventListener('click', () => {
    // 과제 요구사항: 최대 4개 프로세서 [cite: 27]
    if (coreCount >= 4) {
        alert("코어는 최대 4개까지만 설정할 수 있습니다.");
        return;
    }

    coreCount++;
    const coreDiv = document.createElement('div');
    coreDiv.className = 'core-input-item';
    coreDiv.style.cssText = 'border: 1px solid #ccc; padding: 10px; border-radius: 5px; min-width: 120px;';

    coreDiv.innerHTML = `
        <div class="core-label" style="font-weight: bold; margin-bottom: 5px;">Core ${coreCount}</div>
        <select class="core-type-select">
            <option value="P">P-Core (성능)</option>
            <option value="E" selected>E-Core (효율)</option>
        </select>
        <button class="core-delete-btn" style="display: block; margin-top: 5px; font-size: 0.7rem; cursor: pointer;">삭제</button>
    `;

    // 코어 삭제 버튼 기능
    coreDiv.querySelector('.core-delete-btn')?.addEventListener('click', () => {
        coreDiv.remove();
        coreCount--;
        updateCoreLabels();
    });

    coreListContainer.appendChild(coreDiv);
});

// 초기 세팅: 페이지 로드 시 기본 코어 1개 생성
addCoreBtn.click();


// --- 프로세스 설정: 추가/삭제 로직 ---

addProcessBtn.addEventListener('click', () => {
    // 과제 요구사항: 최대 15개 프로세스 [cite: 25]
    if (processCount >= 15) {
        alert("프로세스는 최대 15개까지만 추가할 수 있습니다.");
        return;
    }

    processCount++;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" value="P${processCount}" readonly style="width: 50px; text-align: center;"></td>
        <td><input type="number" class="at-input" value="0" min="0" style="width: 60px;"></td>
        <td><input type="number" class="bt-input" value="1" min="1" style="width: 60px;"></td>
        <td><button class="delete-btn" style="color: red; cursor: pointer;">X</button></td>
    `;

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
        row.remove();
        processCount--;
    });

    processList.appendChild(row);
});


// --- 알고리즘 및 시뮬레이션 제어 ---

algoSelect.addEventListener('change', () => {
    // RR일 때만 Time Quantum 입력창 표시 [cite: 31, 32]
    if (algoSelect.value === 'RR') {
        rrQuantumDiv.style.display = 'block';
    } else {
        rrQuantumDiv.style.display = 'none';
    }
});

runBtn.addEventListener('click', () => {
    console.log("시뮬레이션을 시작합니다. 데이터를 수집하고 백엔드 API를 호출하세요.");
    // 여기에 나중에 데이터 수집 로직을 추가할 예정입니다.
});