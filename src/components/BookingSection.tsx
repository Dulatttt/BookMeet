import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useEffect, useState } from 'react';
import { BookingForm } from './BookingForm';
import { CalendarView } from './CalendarView';
import { TimeSlotPicker } from './TimeSlotPicker';

export const BookingSection = ({ selectedDate, onDateSelect }: any) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [allMeetings, setAllMeetings] = useState<any[]>([]); // Для точек в календаре
  const [isLoading, setIsLoading] = useState(false);

  // 1. Загружаем записи на весь текущий месяц (чтобы календарь ожил)
  useEffect(() => {
    const fetchMonthBookings = async () => {
      setIsLoading(true);
      const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .neq('status', 'cancelled');

      if (!error && data) {
        setAllMeetings(data);
      }
      setIsLoading(false);
    };

    fetchMonthBookings();
  }, [selectedDate]); // Сработает при смене месяца в календаре

  // 2. Вычисляем занятые слоты именно для ВЫБРАННОГО дня
  const bookedSlotsForDay = allMeetings
    .filter(m => m.date === format(selectedDate, 'yyyy-MM-dd'))
    .map(m => m.start_time);

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
    // Просто перезапрашиваем данные из базы, чтобы обновить слоты и календарь
    // Это лучше, чем вручную обновлять локальный стейт
    const fetchUpdate = async () => {
        const { data } = await supabase.from('bookings').select('*').neq('status', 'cancelled');
        if (data) setAllMeetings(data);
    };
    fetchUpdate();
  };

  return (
    <section id="booking" className="py-20">
      <div className="container mx-auto px-4">
        {isLoading && <div className="text-center text-sm text-muted-foreground animate-pulse">Обновление данных...</div>}
        
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <CalendarView 
            selectedDate={selectedDate} 
            onDateSelect={(date: Date) => {
              onDateSelect(date);
              setSelectedSlot(null);
              setSelectedTime(null);
            }} 
            meetings={allMeetings} // Теперь календарь видит все записи месяца!
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