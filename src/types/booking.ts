export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookedBy?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
}

export type ViewMode = 'day' | 'week' | 'month';