export interface User {
  id: string;
  name: string;
  role: string;
  descriptor: number[]; // Float32Array serialized as array
  registeredAt: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  status: 'Present' | 'Late' | 'On Time';
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  ATTENDANCE = 'ATTENDANCE',
  REGISTER = 'REGISTER',
}

// FaceAPI types (augmenting window)
declare global {
  interface Window {
    faceapi: any;
  }
}