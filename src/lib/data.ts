import { Habit } from './types';

export const defaultHabits: Habit[] = [
  {
    id: 'up-before-enemy',
    name: 'Up before the enemy',
    icon: 'Sunrise',
    description: 'Wake up early (without snooze) at your designated time to accomplish something before the day starts.',
    isCustom: false
  },
  {
    id: 'get-after-it',
    name: 'Get after it',
    icon: 'Dumbbell',
    description: 'Complete some form of physical activity or workout each day.',
    isCustom: false
  },
  {
    id: 'prioritize-execute',
    name: 'Prioritize & execute',
    icon: 'CheckSquare',
    description: 'Write and complete your top 3 daily tasks.',
    isCustom: false
  },
  {
    id: 'hydrate-die',
    name: 'Hydrate or die',
    icon: 'Droplets',
    description: 'Drink your predetermined daily water intake goal.',
    isCustom: false
  },
  {
    id: 'clean-fuel',
    name: 'Clean fuel',
    icon: 'Apple',
    description: 'Stick to your predetermined healthy eating plan.',
    isCustom: false
  },
  {
    id: 'no-sugarcoated-lies',
    name: 'No sugarcoated lies',
    icon: 'X',
    description: 'Avoid junk food and blatant sugar intake.',
    isCustom: false
  },
  {
    id: 'back-to-book',
    name: 'Back to the book',
    icon: 'BookOpen',
    description: 'Spend at least 20 minutes on personal development daily.',
    isCustom: false
  },
  {
    id: 'remember',
    name: 'Remember',
    icon: 'Brain',
    description: 'Take time daily to reflect on gratitude and blessings.',
    isCustom: false
  }
];
