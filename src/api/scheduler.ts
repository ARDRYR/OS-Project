import axios from 'axios';
import type { Process, SchedulingResult } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000' // 백엔드 주소
});

export const getSimulation = async (processes: Process[], algorithm: string) => {
  const response = await api.post<SchedulingResult>('/simulate', { processes, algorithm });
  return response.data;
};