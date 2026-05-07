import axios from 'axios';
import type { SchedulingResult } from '../types';

const api = axios.create({
  baseURL: 'https://pokemon-os-scheduler-simulator.onrender.com/api'
});

export const getSimulation = async (
  processes: any[], 
  algorithm: string, 
  core_types: string[] = ['P'], 
  time_quantum: number = 2,
  k_threshold: number = 3
) => {
  const response = await api.post<SchedulingResult>('/simulate', { 
    processes, 
    algorithm, 
    core_types, 
    time_quantum,
    k_threshold
  });
  return response.data;
};