import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { format, isBefore, startOfDay } from 'date-fns';
import { CalendarX, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MeetingCard } from './MeetingCard';

// Определяем интерфейс для встречи
interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendee_email: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export const Dashboard = () => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Загрузка данных (вынесена в useCallback для возможности повторного вызова)
  const fetchMeetings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: Meeting[] = data.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          date: m.date,
          startTime: m.start_time,
          endTime: m.end_time,
          attendeeName: m.attendee_name,
          attendee_email: m.attendee_email,
          status: m.status,
        }));
        setMeetings(formattedData);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 2. Real-time подписка (авто-обновление при изменениях в БД)
  useEffect(() => {
    fetchMeetings();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMeetings]);

  // 3. Универсальный обработчик смены статуса
  const updateMeetingStatus = async (id: string, newStatus: Meeting['status']) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус"
      });
    } else {
      toast({
        title: newStatus === 'confirmed' ? "Подтверждено" : "Отменено",
        description: `Статус встречи успешно изменен на ${newStatus}`,
      });
      // fetchMeetings() вызовется автоматически через real-time подписку
    }
  };

  // --- Фильтрация ---
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch = 
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.attendeeName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
      
      let matchesDate = true;
      const today = startOfDay(new Date());
      const meetingDate = startOfDay(new Date(meeting.date));
      
      if (dateFilter === 'upcoming') matchesDate = !isBefore(meetingDate, today);
      else if (dateFilter === 'past') matchesDate = isBefore(meetingDate, today);
      else if (dateFilter === 'today') matchesDate = format(meetingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [meetings, searchQuery, statusFilter, dateFilter]);

  const stats = useMemo(() => ({
    total: meetings.length,
    confirmed: meetings.filter(m => m.status === 'confirmed').length,
    pending: meetings.filter(m => m.status === 'pending').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length,
  }), [meetings]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Загрузка ваших встреч...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Секция статистики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего', value: stats.total, color: 'text-primary' },
          { label: 'Подтверждено', value: stats.confirmed, color: 'text-green-500' },
          { label: 'Ожидает', value: stats.pending, color: 'text-yellow-500' },
          { label: 'Отменено', value: stats.cancelled, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className={cn("text-3xl font-bold mt-1", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Поиск и фильтры */}
      <div className="glass rounded-xl p-4 border border-white/10">
         <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Поиск по названию или имени..." 
                 value={searchQuery} 
                 onChange={(e) => setSearchQuery(e.target.value)} 
                 className="pl-10 bg-background/50 border-none ring-1 ring-white/10 focus-visible:ring-primary"
               />
            </div>
            {/* Здесь можно добавить Select компоненты для statusFilter и dateFilter */}
         </div>
      </div>

      {/* Список встреч */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="glass rounded-xl p-16 text-center border border-dashed border-white/20">
            <CalendarX className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-medium text-muted-foreground">Встреч не найдено</p>
            <p className="text-sm text-muted-foreground/60">Попробуйте изменить параметры фильтрации</p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onCancel={(id) => updateMeetingStatus(id, 'cancelled')}
              onConfirm={(id) => updateMeetingStatus(id, 'confirmed')}
            />
          ))
        )}
      </div>
    </div>
  );
};