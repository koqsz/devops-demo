export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppInfo {
  version: string;
  hostname: string;
  environment: string;
  timestamp: string;
}
