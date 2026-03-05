import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, Check } from 'lucide-react';
import { TimeSlot } from '@/types/booking';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  selectedDate: Date;
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slotId: string, time: string) => void;
}

export const TimeSlotPicker = ({ 
  selectedDate, 
  slots, 
  selectedSlot, 
  onSlotSelect 
}: TimeSlotPickerProps) => {
  const availableSlots = slots.filter(s => s.available);
  const bookedSlots = slots.filter(s => !s.available);

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
        </h3>
      </div>

      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Нет доступных слотов на эту дату</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Доступно {availableSlots.length} слотов
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              
              return (
                <button
                  key={slot.id}
                  onClick={() => slot.available && onSlotSelect(slot.id, slot.time)}
                  disabled={!slot.available}
                  className={cn(
                    "relative flex items-center justify-center py-3 px-4 rounded-xl border transition-all duration-200",
                    slot.available 
                      ? "slot-available cursor-pointer hover:scale-105 active:scale-95" 
                      : "slot-booked cursor-not-allowed opacity-60",
                    isSelected && "gradient-primary text-primary-foreground border-transparent shadow-glow"
                  )}
                >
                  <span className="font-medium">{slot.time}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                  {!slot.available && slot.bookedBy && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-background px-1 rounded">
                      Занято
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {bookedSlots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Занятых слотов: {bookedSlots.length}
          </p>
        </div>
      )}
    </div>
  );
};