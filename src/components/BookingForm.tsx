import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { addHours, format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarCheck, FileText, Mail, User } from 'lucide-react';
import { useState } from 'react';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string | null;
  onBook: () => void;
  onCancel: () => void;
}

export const BookingForm = ({ 
  selectedDate, 
  selectedTime, 
  onBook, 
  onCancel 
}: BookingFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedTime) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="text-center py-8">
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Выберите время для бронирования</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startTime = selectedTime;
      const parsedStart = parse(selectedTime, 'HH:mm', new Date());
      const endTime = format(addHours(parsedStart, 1), 'HH:mm');

      // 1. Сохраняем в Supabase
      const { error } = await supabase
        .from('bookings')
        .insert([{
          title: formData.title || 'Встреча',
          description: formData.description,
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          attendee_name: formData.name,
          attendee_email: formData.email,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Успешно!",
        description: "Ваша встреча забронирована.",
      });

      onBook(); // Очистка стейта в родительском компоненте
      setFormData({ name: '', email: '', title: '', description: '' });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось забронировать",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 animate-scale-in">
      <h3 className="text-lg font-semibold text-foreground mb-2">Забронировать встречу</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {format(selectedDate, 'd MMMM', { locale: ru })} в {selectedTime}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поля формы оставляем без изменений */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2"><User className="w-4 h-4" />Имя</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2"><FileText className="w-4 h-4" />Тема</Label>
          <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Отмена</Button>
          <Button type="submit" variant="default" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Бронирование...' : 'Забронировать'}
          </Button>
        </div>
      </form>
    </div>
  );
};