import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AlertCircle, Check, Clock, Mail, User, X } from 'lucide-react';

// Обновим интерфейс прямо здесь, чтобы он соответствовал данным из Supabase
interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    description?: string;
    date: string;
    startTime: string; // из start_time
    endTime: string;   // из end_time
    attendeeName: string;
    attendee_email?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
  onCancel: (id: string) => void;
  onConfirm?: (id: string) => void;
}

export const MeetingCard = ({ meeting, onCancel, onConfirm }: MeetingCardProps) => {
  const statusConfig = {
    pending: {
      label: 'Ожидает',
      className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      icon: AlertCircle,
    },
    confirmed: {
      label: 'Подтверждено',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
      icon: Check,
    },
    cancelled: {
      label: 'Отменено',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
      icon: X,
    },
  };

  const status = statusConfig[meeting.status];
  const StatusIcon = status.icon;

  return (
    <div 
      className={cn(
        "glass rounded-xl p-5 transition-all duration-200 hover:shadow-lg animate-fade-in border border-white/5",
        meeting.status === 'cancelled' && "opacity-60 bg-black/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="font-bold text-lg text-foreground truncate">
              {meeting.title || 'Без темы'}
            </h4>
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border",
              status.className
            )}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{meeting.startTime} — {meeting.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>{meeting.attendeeName}</span>
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <Mail className="w-4 h-4 text-primary" />
              <span className="italic">{meeting.attendee_email}</span>
            </div>
          </div>

          {meeting.description && (
            <p className="text-sm text-muted-foreground bg-white/5 p-2 rounded-md mb-3 italic">
              "{meeting.description}"
            </p>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-primary">
             <CalendarDays className="w-3 h-3" />
             {format(new Date(meeting.date), 'd MMMM yyyy', { locale: ru })}
          </div>
        </div>

        {/* Кнопки действий */}
        {meeting.status !== 'cancelled' && (
          <div className="flex flex-col gap-2">
            {meeting.status === 'pending' && onConfirm && (
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                onClick={() => onConfirm(meeting.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCancel(meeting.id)}
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Вспомогательная иконка, если её нет в импортах lucide-react
import { CalendarDays } from 'lucide-react';
