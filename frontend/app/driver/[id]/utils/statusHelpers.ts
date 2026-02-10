export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#4CAF50';
    case 'in_progress': return '#2196F3';
    case 'pending': return '#FFC107';
    case 'skipped': return '#9E9E9E';
    case 'problem': return '#F44336';
    default: return '#666';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Завершено';
    case 'in_progress': return 'В процессе';
    case 'pending': return 'Ожидает';
    case 'skipped': return 'Пропущено';
    case 'problem': return 'Проблема';
    default: return status;
  }
};
