import moment from 'moment';

export const formatDate = (dateString) => {
  return moment(dateString).format('DD MMM YYYY');
};

export const formatDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return '';
  return moment(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm').format(
    'DD MMM YYYY HH:mm'
  );
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  // Handle both HH:mm:ss and HH:mm formats
  let formatted = moment(timeString, 'HH:mm:ss');
  if (!formatted.isValid()) {
    formatted = moment(timeString, 'HH:mm');
  }
  return formatted.isValid() ? formatted.format('hh:mm A') : '';
};

export const formatDateForDisplay = (dateString) => {
  const date = moment(dateString);
  const today = moment().startOf('day');
  const tomorrow = moment().add(1, 'day').startOf('day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  } else if (date.isSame(tomorrow, 'day')) {
    return 'Tomorrow';
  }
  return date.format('DD MMM');
};

export const getWeekDates = (offset = 0) => {
  const start = moment().add(offset, 'weeks').startOf('week');
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(start.clone().add(i, 'days').format('YYYY-MM-DD'));
  }
  return dates;
};

export const getMonthDates = (year, month) => {
  const date = moment(`${year}-${month}`, 'YYYY-M');
  const daysInMonth = date.daysInMonth();
  const dates = [];

  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(date.clone().date(i).format('YYYY-MM-DD'));
  }

  return dates;
};

export const isTodayOrFuture = (dateString) => {
  const date = moment(dateString).startOf('day');
  const today = moment().startOf('day');
  return date.isSameOrAfter(today);
};

export const isPast = (dateString) => {
  const date = moment(dateString).startOf('day');
  const today = moment().startOf('day');
  return date.isBefore(today);
};

export const getDayName = (dateString) => {
  return moment(dateString).format('dddd');
};

export const getMonthName = (month) => {
  return moment().month(month - 1).format('MMMM');
};
