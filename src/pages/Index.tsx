import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { BookingSection } from '@/components/BookingSection';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { useBookings } from '@/hooks/useBookings';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const bookingRef = useRef<HTMLDivElement>(null);
  
  const {
    meetings,
    selectedDate,
    setSelectedDate,
    getTimeSlotsForDate,
    bookMeeting,
    cancelMeeting,
    updateMeeting,
  } = useBookings();

  const handleGetStarted = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConfirm = (id: string) => {
    updateMeeting(id, { status: 'confirmed' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      
      {currentPage === 'home' ? (
        <>
          <HeroSection onGetStarted={handleGetStarted} />
          
          <div ref={bookingRef}>
            <BookingSection
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              meetings={meetings}
              slots={getTimeSlotsForDate(selectedDate)}
              onBook={bookMeeting}
            />
          </div>
          
          <Footer />
        </>
      ) : (
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Мои встречи
              </h1>
              <p className="text-muted-foreground">
                Управляйте своими запланированными встречами
              </p>
            </div>
            
            <Dashboard
              meetings={meetings}
              onCancel={cancelMeeting}
              onConfirm={handleConfirm}
            />
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;