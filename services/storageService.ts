import { User, AttendanceRecord } from '../types';

const USERS_KEY = 'smartlook_users';
const LOGS_KEY = 'smartlook_logs';

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAttendance = (record: AttendanceRecord): void => {
  const logs = getAttendanceLogs();
  // Prevent duplicate check-ins within 1 minute
  const recentCheckIn = logs.find(
    (l) => l.userId === record.userId && Date.now() - l.timestamp < 60000
  );
  
  if (!recentCheckIn) {
    logs.unshift(record); // Add to top
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
};

export const getAttendanceLogs = (): AttendanceRecord[] => {
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearLogs = (): void => {
  localStorage.removeItem(LOGS_KEY);
};

export const clearUsers = (): void => {
  localStorage.removeItem(USERS_KEY);
}