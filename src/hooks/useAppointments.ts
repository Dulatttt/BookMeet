import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Получение списка
  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) console.error('Error fetching:', error);
    else setAppointments(data || []);
    setLoading(false);
  };

  // Добавление новой встречи
  const addAppointment = async (appointment) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('appointments')
      .insert([{ ...appointment, user_id: user?.id }]);
    
    if (!error) fetchAppointments();
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return { appointments, loading, addAppointment, refresh: fetchAppointments };
};