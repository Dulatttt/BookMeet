import { useState, useCallback } from 'react';
import { Meeting, TimeSlot } from '@/types/booking';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

// Generate time slots for a day (9 AM to 6 PM)
const generateTimeSlots = (date: Date, bookedSlots: Meeting[]): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour < 18; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const isBooked = bookedSlots.some(
      meeting => 
        isSameDay(new Date(meeting.date), date) && 
        meeting.startTime === time &&
        meeting.status !== 'cancelled'
    );
    slots.push({
      id: `${format(date, 'yyyy-MM-dd')}-${time}`,
      time,
      available: !isBooked,
      bookedBy: isBooked ? bookedSlots.find(
        m => isSameDay(new Date(m.date), date) && m.startTime === time
      )?.attendeeName : undefined,
    });
  }
  return slots;
};

// Sample meetings for demo
const sampleMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Консультация',
    description: 'Первичная консультация по проекту',
    date: new Date(),
    startTime: '10:00',
    endTime: '11:00',
    attendeeName: 'Иван Петров',
    attendeeEmail: 'ivan@example.com',
    status: 'confirmed',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Обсуждение дизайна',
    date: addDays(new Date(), 1),
    startTime: '14:00',
    endTime: '15:00',
    attendeeName: 'Мария Сидорова',
    attendeeEmail: 'maria@example.com',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Финальная встреча',
    date: addDays(new Date(), 2),
    startTime: '11:00',
    endTime: '12:00',
    attendeeName: 'Алексей Козлов',
    attendeeEmail: 'alexey@example.com',
    status: 'confirmed',
    createdAt: new Date(),
  },
];

export const useBookings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(sampleMeetings);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getTimeSlotsForDate = useCallback((date: Date) => {
    return generateTimeSlots(date, meetings);
  }, [meetings]);

  const getWeekSchedule = useCallback((startDate: Date) => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        slots: generateTimeSlots(date, meetings),
      };
    });
  }, [meetings]);

  const getMeetingsForDate = useCallback((date: Date) => {
    return meetings.filter(m => isSameDay(new Date(m.date), date));
  }, [meetings]);

  const bookMeeting = useCallback((meeting: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setMeetings(prev => [...prev, newMeeting]);
    return newMeeting;
  }, []);

  const cancelMeeting = useCallback((meetingId: string) => {
    setMeetings(prev => 
      prev.map(m => 
        m.id === meetingId ? { ...m, status: 'cancelled' as const } : m
      )
    );
  }, []);

  const updateMeeting = useCallback((meetingId: string, updates: Partial<Meeting>) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId ? { ...m, ...updates } : m
      )
    );
  }, []);

  return {
    meetings,
    selectedDate,
    setSelectedDate,
    getTimeSlotsForDate,
    getWeekSchedule,
    getMeetingsForDate,
    bookMeeting,
    cancelMeeting,
    updateMeeting,
  };
};