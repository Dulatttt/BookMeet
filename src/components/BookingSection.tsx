import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, format, isValid, startOfMonth } from 'date-fns'; // Добавил isValid
import { useCallback, useEffect, useState } from 'react';
import { BookingForm } from './BookingForm';
import { CalendarView } from './CalendarView';
import { TimeSlotPicker } from './TimeSlotPicker';

export const BookingSection = ({ selectedDate, onDateSelect }: any) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [allMeetings, setAllMeetings] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(false);

  // Вынес загрузку в useCallback, чтобы не дублировать код
  const fetchMonthBookings = useCallback(async () => {
    // Проверка на валидность даты, чтобы format не выдал ошибку
    if (!selectedDate || !isValid(selectedDate)) return;

    setIsLoading(true);
    try {
      const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .neq('status', 'cancelled');

      if (error) throw error;
      
      setAllMeetings(data || []);
    } catch (error) {
      console.error("Ошибка загрузки броней:", error);
      // Не даем приложению упасть, просто оставляем пустой список
      setAllMeetings([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthBookings();
  }, [fetchMonthBookings]);

  // БЕЗОПАСНАЯ фильтрация слотов (добавлена проверка на наличие даты)
  const bookedSlotsForDay = useMemo(() => {
    if (!selectedDate || !isValid(selectedDate) || !allMeetings) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return allMeetings
      .filter(m => m && m.date === dateStr)
      .map(m => m.start_time);
  }, [allMeetings, selectedDate]);

  const allPossibleSlots = [
    "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const slots = allPossibleSlots.map(time => ({
    id: time,
    time: time,
    available: !bookedSlotsForDay.includes(time)
  }));

  const handleBookSuccess = () => {
    setSelectedSlot(null);
    setSelectedTime(null);
    fetchMonthBookings(); // Используем уже созданную функцию обновления
  };

  return (
    <section id="booking" className="py-20">
      <div className="container mx-auto px-4">
        {isLoading && (
          <div className="flex justify-center mb-4">
            <div className="text-sm text-primary animate-pulse flex items-center gap-2">
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
               Обновление календаря...
            </div>
          </div>
        )}
        
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <CalendarView 
            selectedDate={selectedDate} 
            onDateSelect={(date: Date) => {
              onDateSelect(date);
              setSelectedSlot(null);
              setSelectedTime(null);
            }} 
            meetings={allMeetings || []} 
          />

          <TimeSlotPicker
            selectedDate={selectedDate}
            slots={slots}
            selectedSlot={selectedSlot}
            onSlotSelect={(id, time) => {
              setSelectedSlot(id);
              setSelectedTime(time);
            }}
          />

          <BookingForm
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onBook={handleBookSuccess}
            onCancel={() => {
              setSelectedSlot(null);
              setSelectedTime(null);
            }}
          />
        </div>
      </div>
    </section>
  );
};


import { useMemo } from 'react';
