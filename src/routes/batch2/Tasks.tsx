import React from 'react';
import { TaskList } from '../../components/shared/TaskList';

// Batch 2 had no Tasks page even though teachers can assign tasks to any
// class — the backend has always supported it, the UI simply never existed.
export const Batch2Tasks: React.FC = () => <TaskList accent="indigo" />;
