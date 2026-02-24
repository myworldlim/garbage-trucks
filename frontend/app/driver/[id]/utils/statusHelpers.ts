// frontend/app/driver/[id]/utils/statusHelpers.ts
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#4CAF50';      // зелёный — завершено
    case 'pending':
      return '#9E9E9E';      // серый — ожидание (по умолчанию)
    case 'problem':
      return '#F44336';      // красный — проблема
    default:
      return '#d6d6d6';      // fallback на серый
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Завершено';
    case 'pending':
      return 'Ожидание';
    case 'problem':
      return 'Проблема';
    default:
      return 'Ожидание';
  }
};