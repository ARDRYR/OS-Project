import axios from 'axios';
import type { SchedulingResult } from '../types';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
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