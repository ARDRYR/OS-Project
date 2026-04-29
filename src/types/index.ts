export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

export interface SchedulingResult {
  ganttChart: {
    coreId: number;
    time: number;
    processId: string;
  }[];
  stats: {
    [key: string]: {
      waitingTime: number;    // WT [cite: 48]
      turnaroundTime: number; // TT [cite: 49]
      normalizedTT: number;   // NTT [cite: 50]
    }
  };
  totalPower: number; // 소비전력 [cite: 50]
}