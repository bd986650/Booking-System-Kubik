import { Zap, Settings2, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

export interface Feature {
  icon: ReactNode; 
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: <Zap size={24} aria-hidden={true} />,
    title: "Быстро и удобно",
    description: "Забронируйте рабочее место за секунды через простую систему."
  },
  {
    icon: <Settings2 size={24} aria-hidden={true} />,
    title: "Гибкость",
    description: "Меняйте время и место по вашему желанию без ограничений."
  },
  {
    icon: <Sparkles size={24} aria-hidden={true} />,
    title: "Безопасность",
    description: "Все бронирования защищены и надежно сохраняются в системе."
  }
];
