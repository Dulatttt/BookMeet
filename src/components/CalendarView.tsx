import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Meeting } from '@/types/booking';

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  meetings: Meeting[];
}

export const CalendarView = ({ selectedDate, onDateSelect, meetings }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getMeetingsCount = (date: Date) => {
    return meetings.filter(m => 
      isSameDay(new Date(m.date), date) && m.status !== 'cancelled'
    ).length;
  };

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h2>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(dayName => (
          <div 
            key={dayName} 
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const meetingsCount = getMeetingsCount(date);
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 text-sm font-medium",
                isCurrentMonth 
                  ? "text-foreground hover:bg-secondary" 
                  : "text-muted-foreground/50",
                isSelected && "gradient-primary text-primary-foreground shadow-glow",
                isTodayDate && !isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                "hover:scale-105 active:scale-95"
              )}
            >
              {format(date, 'd')}
              {meetingsCount > 0 && (
                <div 
                  className={cn(
                    "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-accent"
                  )} 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 flex justify-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setCurrentMonth(new Date());
            onDateSelect(new Date());
          }}
        >
          Сегодня
        </Button>
      </div>
    </div>
  );
};