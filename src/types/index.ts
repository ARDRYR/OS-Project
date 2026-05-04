export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

export interface CoreState {
  core_id: number;
  process_name: string; // P1, P2, ..., or "Idle"
  power: number;
  rt: number;
  bt: number;
  is_warning: boolean;
}

export interface SimulationStep {
  time: number;
  ready_queue: string[]; // List of process IDs (P1, P2, ...)
  core_states: CoreState[];
}

export interface SchedulingResult {
  steps: SimulationStep[];
  stats: {
    [key: string]: {
      waitingTime: number;
      turnaroundTime: number;
      normalizedTT: number;
    };
  };
  totalPower: number;
}
