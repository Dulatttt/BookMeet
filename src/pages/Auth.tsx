import { supabase } from '@/integrations/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Если пользователь уже залогинен, перекидываем на дашборд
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-20">
      <div className="w-full max-w-[450px] glass p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Добро пожаловать</h1>
          <p className="text-muted-foreground mt-2">Зарегистрируйтесь, чтобы управлять встречами</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#6366f1', // Твой основной цвет
                  brandAccent: '#4f46e5',
                }
              }
            }
          }}
          providers={[]} // Пока без Google/GitHub, только Email
          localization={{
            variables: {
              sign_up: {
                email_label: 'Email адрес',
                password_label: 'Придумайте пароль',
                button_label: 'Создать аккаунт',
                link_text: 'Нет аккаунта? Зарегистрируйтесь',
                confirmation_sent_label: 'Проверьте почту для подтверждения!'
              },
              sign_in: {
                email_label: 'Email',
                password_label: 'Пароль',
                button_label: 'Войти',
                link_text: 'Уже есть аккаунт? Войдите',
              },
              forgotten_password: {
                link_text: 'Забыли пароль?',
                button_label: 'Сбросить пароль',
              }
            }
          }}
          theme="dark"
        />
      </div>
    </div>
  );
};