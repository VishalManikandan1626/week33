export type Priority = 'High' | 'Medium' | 'Low';
export type Category = 'Study' | 'Personal' | 'Work' | 'Other';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  dueDate: string;
  createdAt: string; // ISO date string or formatted date
  completed: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error' | 'warning';
}
