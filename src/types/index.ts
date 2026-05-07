export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

export interface CoreState {
  core_id: number;
  process_name: string; // P1, P2, ..., or "Idle"
  current_power: number;
  total_power: number;
  rt: number;
  bt: number;
  is_warning: boolean;
}

export interface SimulationStep {
  time: number;
  ready_queue: string[]; // List of process names
  core_states: CoreState[];
}

export interface ProcessResult {
  name: string;
  at: number;
  bt: number;
  wt: number;
  tt: number;
  ntt: number;
  end_time: number;
}

export interface CorePowerResult {
  core_id: number;
  core_type: string;
  total_power: number;
}

export interface SchedulingResult {
  history: SimulationStep[];
  process_results: ProcessResult[];
  core_power_results: CorePowerResult[];
}
