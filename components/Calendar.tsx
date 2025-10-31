import React, { useState, useCallback } from 'react';
import { MONTH_NAMES, DAY_NAMES } from '../constants';

interface CalendarProps {
  initialDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({ initialDate = new Date() }) => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Get the number of days in the current month
  const getDaysInMonth = useCallback((year: number, month: number): Date[] => {
    const days: Date[] = [];
    const numDays = new Date(year, month + 1, 0).getDate(); // Last day of current month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, []);

  // Get the day of the week for the first day of the month (0 for Sunday)
  const getStartDayOfMonth = useCallback((year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  }, []);

  // Get the days from the previous month to fill the beginning of the grid
  const getPrevMonthDays = useCallback((year: number, month: number, startDay: number): Date[] => {
    const prevMonthDays: Date[] = [];
    if (startDay === 0) return []; // If month starts on Sunday, no prev days needed for a Monday start

    const prevMonthLastDay = new Date(year, month, 0).getDate(); // Last day of previous month
    for (let i = startDay - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    return prevMonthDays;
  }, []);

  // Get the days from the next month to fill the end of the grid
  const getNextMonthDays = useCallback((year: number, month: number, totalDays: number): Date[] => {
    const nextMonthDays: Date[] = [];
    const remainingSlots = 42 - totalDays; // 6 rows * 7 days = 42 slots in grid
    for (let i = 1; i <= remainingSlots; i++) {
      nextMonthDays.push(new Date(year, month + 1, i));
    }
    return nextMonthDays;
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfMonth(year, month); // Day of week (0-6) for the 1st of the month
  const prevMonthDays = getPrevMonthDays(year, month, startDay);
  const allDays = [...prevMonthDays, ...daysInMonth];
  const nextMonthDays = getNextMonthDays(year, month, allDays.length);
  const fullCalendarDays = [...allDays, ...nextMonthDays];

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  }, []);

  const today = new Date();
  const isToday = useCallback((date: Date): boolean => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }, [today]);

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-gray-200 text-gray-700 transition duration-200"
          aria-label="Previous month"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-gray-200 text-gray-700 transition duration-200"
          aria-label="Next month"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500 mb-4">
        {DAY_NAMES.map(day => (
          <div key={day} className="py-2 text-xs sm:text-sm">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {fullCalendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isSelectedDay = false; // Add logic for selected day if needed

          return (
            <div
              key={index}
              className={`
                flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs sm:text-sm
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400 opacity-70'}
                ${isToday(date) ? 'bg-indigo-500 text-white font-bold' : ''}
                ${isSelectedDay && !isToday(date) ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''}
                ${isCurrentMonth && !isToday(date) && !isSelectedDay ? 'hover:bg-gray-100 cursor-pointer' : ''}
              `}
              aria-label={`Day ${date.getDate()}`}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;