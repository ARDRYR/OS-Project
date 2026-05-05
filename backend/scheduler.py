import json

# ==========================================
# 1. 프로세스 및 코어 상태 객체 (상태 기억)
# ==========================================
class Process:
    def __init__(self, name, at, bt):
        self.name = name
        self.at = at       # 도착 시간
        self.bt = bt       # 총 작업량
        self.rt = bt       # 남은 작업량
        self.wt = 0        # 대기 시간
        self.tt = 0        # 반환 시간
        self.ntt = 0.0     # 정규화 반환 시간 (TT/BT)
        self.is_done = False # 작업 완료 여부

class Core:
    def __init__(self, core_id, core_type):
        self.core_id = core_id
        self.core_type = core_type
        self.process = None
        self.is_on = False
        self.total_power = 0.0

        self.just_booted = False

        #코어 종류에 따른 하드웨어 스펙 캡슐화
        if core_type == 'P':
            self.performance = 2      # P코어 성능: 2배속
            self.power_usage = 3.0    # P코어 실행 전력: 3W
            self.boot_power = 0.5     # P코어 시동 전력: 0.5W
        else:
            self.performance = 1      # E코어 성능: 1배속
            self.power_usage = 1.0    # E코어 실행 전력: 1W
            self.boot_power = 0.1     # E코어 시동 전력: 0.1W

    def is_idle(self):
        return self.process is None


# ==========================================
# 2. 메인 스케줄러 
# ==========================================
class Scheduler:
    def __init__(self, process_list, core_list, algorithm_name, time_quantum=1, k_threshold=3):
        self.processes = process_list
        self.cores = core_list
        self.algorithm_name = algorithm_name 
        self.time = 0
        self.ready_queue = []
        self.history = []
        
        #RR -> 코어별 타이머
        self.tq = time_quantum
        self.core_timers = {c.core_id: 0 for c in self.cores}
        
        #E-Value 알고리즘 임계값 k
        self.k = k_threshold 

    def fetch_arrived_processes(self):
        """[1] 현재 시간에 도착한 프로세스를 레디 큐에 삽입"""
        for process in self.processes:
            if process.at == self.time:
                self.ready_queue.append(process)

    def handle_preemption(self):
        """[2] 프로세스 선점 -  RR, SRTN, 우리 조 알고리즘"""
        if not self.ready_queue:
            return

        working_cores = [c for c in self.cores if not c.is_idle()]
        if not working_cores:
            return

        if self.algorithm_name == 'RR':
            # 타임 퀀텀 만료 시 쫓아내기
            for core in working_cores:
                if self.core_timers[core.core_id] >= self.tq:

                    #빈 코어의 개수 파악
                    idle_cores = len([c for c in self.cores if c.is_idle()])

                    #뒤에 대기하는 프로세스가 있을 때만 선점 처리
                    if len(self.ready_queue) > idle_cores:
                        self.ready_queue.append(core.process)
                        core.process = None
                        self.core_timers[core.core_id] = 0
                    else:
                        #대기가 없으면 타이머 리셋 -> 선점 처리 안함
                        self.core_timers[core.core_id] = 0

        elif self.algorithm_name == 'SRTN':

            while self.ready_queue:
                working_cores = [c for c in self.cores if not c.is_idle()]
                if not working_cores:
                    break
                
                max_rt_core = max(working_cores, key=lambda c: c.process.rt)
                self.ready_queue.sort(key=lambda x: x.rt) #내부 정렬
                if self.ready_queue[0].rt < max_rt_core.process.rt:
                    self.ready_queue.append(max_rt_core.process)
                    max_rt_core.process = None
                    self.core_timers[max_rt_core.core_id] = 0
                else: 
                    break

        elif self.algorithm_name == 'E-Value':

            while self.ready_queue:
                working_cores = [c for c in self.cores if not c.is_idle()]
                if not working_cores:
                    break
                #[우리 조 독창성] E-Value: k-임계값을 뚫었을 때만 선점 허용
                worst_core = max(working_cores, key=lambda c: (c.process.rt - c.process.wt))
                running_val = worst_core.process.rt - worst_core.process.wt
                
                self.ready_queue.sort(key=lambda x: (x.rt - x.wt))
                incoming_val = self.ready_queue[0].rt - self.ready_queue[0].wt
                
                if incoming_val < (running_val - self.k):
                    self.ready_queue.append(worst_core.process)
                    worst_core.process = None
                    self.core_timers[worst_core.core_id] = 0
                else:
                    break

    def sort_ready_queue(self):
        """[3] 코어 할당 전 레디 큐 우선순위 정렬"""
        if not self.ready_queue:
            return

        #FCFS, RR: AT기준 -> 정렬 필요 없음
        if self.algorithm_name == 'FCFS' or self.algorithm_name == 'RR':
            pass

        #SPN, HRRN, SRTN, 우리 조 알고리즘 -> 정렬 필요 
        elif self.algorithm_name == 'SPN':
            self.ready_queue.sort(key=lambda p: p.bt)
        elif self.algorithm_name == 'HRRN':
            self.ready_queue.sort(key=lambda p: ((self.time - p.at) + p.bt) / p.bt, reverse=True)
        elif self.algorithm_name == 'SRTN':
            self.ready_queue.sort(key=lambda p: p.rt)
        elif self.algorithm_name == 'E-Value':
            # 🚀 [우리 조 독창성] E-Value 우선순위 공식 (Value = RT - WT 낮을수록 우선)
            self.ready_queue.sort(key=lambda p: (p.rt - p.wt))

    def dispatch_to_cores(self):
        """[4] 빈 코어에 대기열 프로세스 할당 및 시동 관리"""
        for core in self.cores:
            if core.is_idle() and self.ready_queue:
                # 코어가 꺼져있었다면 켬 (시동 전력 부과)
                if not core.is_on:
                    core.is_on = True
                    core.total_power += core.boot_power 
                    core.just_booted = True

                core.process = self.ready_queue.pop(0)
                self.core_timers[core.core_id] = 0
            
            # 할당 단계를 거쳤는데도 비어있다면 완벽히 끄기 (Race to Sleep)
            if core.is_idle():
                core.is_on = False

    def execute_tick(self):
        """[5] 1초(Tick) 흐름에 따른 실행 및 대기 처리"""
        # 레디 큐 대기 시간 증가
        for p in self.ready_queue:
            p.wt += 1

        # 코어 작업 실행
        for core in self.cores:
            if core.is_idle():
                continue
            
            p = core.process
            # 코어 성능만큼 작업량 차감 & 전력 누적
            p.rt -= core.performance
            core.total_power += core.power_usage
            self.core_timers[core.core_id] += 1
            
            # 작업 완료 처리
            if p.rt <= 0:
                p.rt = 0
                p.is_done = True
                p.tt = (self.time + 1) - p.at
                p.ntt = p.tt / p.bt
                core.process = None

    def record_history(self):
        """[6] 1초 단위 상태 기록"""
        current_state = {
            "time": self.time,
            "ready_queue": [p.name for p in self.ready_queue],
            "process_states": [
                {"name": p.name, "at": p.at, "rt": p.rt, "bt": p.bt, "is_done": p.is_done}
                for p in self.processes
            ],
            "core_states": []
        }
        for core in self.cores:

            #실시간 전력(누적 x) 계산 부분 추가
            current_power = 0.0
            if not core.is_idle():
                current_power = core.power_usage
            if core.just_booted:
                current_power += core.boot_power
                core.just_booted = False # 기록 후 초기화

            if core.is_idle():
                p_name = "Idle"
                current_rt = 0
                max_bt = 0
                is_warning = False
            else:
                p_name = core.process.name
                current_rt = core.process.rt  # 몬스터 현재 체력 (HP)
                max_bt = core.process.bt      # 몬스터 최대 체력 (Max HP)
                
                #RR 알고리즘 + 대기자가 있을 때만 2초 전 경고 발동
                is_warning = False
                if self.algorithm_name == 'RR' and len(self.ready_queue) > 0:
                    remaining_tq = self.tq - self.core_timers[core.core_id]
                    if remaining_tq <= 2:
                        is_warning = True

            current_state["core_states"].append({
                "core_id": core.core_id,
                "process_name": p_name,
                "current_power": round(current_power, 2), #[수정] 실시간 전력 추가
                "total_power": round(core.total_power, 2), #[수정] power -> total_power로 이름 변경
                "rt": current_rt,       
                "bt": max_bt,           
                "is_warning": is_warning #경고 연출용 (True/False)
            })
        self.history.append(current_state)

    def all_processes_done(self):
        return all(p.is_done for p in self.processes)

    #메인 루프 - 1초 단위 작업
    def run(self):
        while not self.all_processes_done():
            self.fetch_arrived_processes() #도착한 프로세스 레디 큐에 넣기
            self.handle_preemption() #선점처리 - 작업 중인 프로세스 중 우선순위에서 밀려난 프로세스 결정 + 코어 비우기
            self.sort_ready_queue() #레디 큐 정렬
            self.dispatch_to_cores() #빈 코어에 프로세스 할당 + 시동 관리
            
            self.record_history() #기록 저장
            self.execute_tick() #1초 단위 코어 작업
            
            self.time += 1


# ==========================================
# 3. 프론트엔드 연동용 API 함수 (완벽 유지)
# ==========================================
def run_scheduler(process_input_list, p_core_count, e_core_count, algorithm_name, time_quantum=1, k_threshold=3):
    processes = [Process(p["name"], p["at"], p["bt"]) for p in process_input_list]
    
    cores = []
    c_id = 0
    for _ in range(p_core_count):
        cores.append(Core(c_id, 'P'))
        c_id += 1
    for _ in range(e_core_count):
        cores.append(Core(c_id, 'E'))
        c_id += 1

    scheduler = Scheduler(processes, cores, algorithm_name, time_quantum, k_threshold)
    scheduler.run()
    
    return {
        "history": scheduler.history,
        "process_results": [
            {"name": p.name, 
             "at": p.at, 
             "bt": p.bt, 
             "wt": p.wt, 
             "tt": p.tt, 
             "ntt": p.ntt, 
             "end_time": p.at+p.tt} 
            for p in processes
        ],
        "core_power_results": [
            {"core_id": c.core_id, 
             "core_type": c.core_type, 
             "total_power": round(c.total_power, 2)} 
            for c in cores
        ]
    }