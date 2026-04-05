import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { format, isBefore, startOfDay } from 'date-fns';
import {
  CalendarX,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Search
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MeetingCard } from './MeetingCard';

// Библиотеки для экспорта
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Интерфейс данных
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

  // 1. Загрузка данных из Supabase
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

  // 2. Real-time подписка и первичная загрузка
  useEffect(() => {
    fetchMeetings();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMeetings]);

  // 3. Функции экспорта
  const exportToExcel = () => {
    const dataToExport = filteredMeetings.map(m => ({
      'Тема': m.title,
      'Дата': m.date,
      'Время': `${m.startTime} - ${m.endTime}`,
      'Клиент': m.attendeeName,
      'Email': m.attendee_email,
      'Статус': m.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meetings");
    XLSX.writeFile(workbook, `Bookings_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Выгрузка записей", 14, 15);
    
    const tableRows = filteredMeetings.map(m => [
      m.title,
      m.date,
      m.startTime,
      m.attendeeName,
      m.status
    ]);

    autoTable(doc, {
      head: [['Title', 'Date', 'Time', 'Client', 'Status']],
      body: tableRows,
      startY: 20,
    });

    doc.save(`Report_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  // 4. Обработка статусов
  const updateStatus = async (id: string, newStatus: Meeting['status']) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось обновить" });
    } else {
      toast({ title: "Обновлено", description: `Статус: ${newStatus}` });
    }
  };

  // 5. Фильтрация данных
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
  }), [meetings]);

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center flex-col gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Загрузка данных...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Секция статистики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl border border-white/10">
          <p className="text-sm text-muted-foreground">Всего заявок</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-green-500/20">
          <p className="text-sm text-green-500">Подтверждено</p>
          <p className="text-2xl font-bold text-green-500">{stats.confirmed}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-yellow-500/20">
          <p className="text-sm text-yellow-500">В ожидании</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
      </div>

      {/* Панель инструментов */}
      <div className="glass p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Поиск..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-black/20"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-black/20">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="confirmed">Одобрено</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="cancelled">Отмена</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} className="border-green-500/50">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="border-blue-500/50">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Список */}
      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl opacity-50">
            <CalendarX className="mx-auto w-12 h-12 mb-2" />
            <p>Ничего не найдено</p>
          </div>
        ) : (
          filteredMeetings.map(meeting => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting} 
              onConfirm={(id) => updateStatus(id, 'confirmed')}
              onCancel={(id) => updateStatus(id, 'cancelled')}
            />
          ))
        )}
      </div>
    </div>
  );
};