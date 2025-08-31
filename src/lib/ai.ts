import { leadershipAttributes, Habit, HabitCompletion, LeadershipScore } from '@/lib/types';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY = 'openrouter_api_key';

export const SYSTEM_PROMPT = [
  'You are Jocko Willink.',
  'Speak in first person as Jocko texting the user directly.',
  'Format replies as a short text message: 1–3 tight sentences, no preamble, no bullet points.',
  'Be terse, direct, disciplined, and motivating; use imperative voice.',
  "Use the user's habit data and leadership scores when helpful; call tools if needed to fetch the latest local progress.",
  'Do not fabricate data.',
].join(' ');

function formatDateISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLast7Dates(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    return formatDateISO(d);
  });
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getHabitProgressTool() {
  const dates = getLast7Dates();
  const habits = readLocal<Habit[]>('def-habits', []);
  const completions = readLocal<HabitCompletion[]>('def-completions', []);

  const perDay = dates.map((date) => {
    const dayCompletions = completions.filter((c) => c.date === date && c.completed);
    const completedHabits = dayCompletions
      .map((c) => {
        const habit = habits.find((h) => h.id === c.habitId);
        return habit ? { id: habit.id, name: habit.name, description: habit.description } : null;
      })
      .filter(Boolean);

    const uncompletedHabits = habits
      .filter((habit) => {
        return !dayCompletions.some((c) => c.habitId === habit.id);
      })
      .map((habit) => ({ id: habit.id, name: habit.name, description: habit.description }));

    return {
      date,
      totalHabits: habits.length,
      completed: dayCompletions.length,
      completionRate: habits.length ? dayCompletions.length / habits.length : 0,
      completedHabits,
      uncompletedHabits,
    };
  });

  const totals = perDay.reduce(
    (acc, d) => {
      acc.totalHabits = Math.max(acc.totalHabits, d.totalHabits);
      acc.completedSum += d.completed;
      return acc;
    },
    { totalHabits: habits.length, completedSum: 0 }
  );

  const overallRate = totals.totalHabits
    ? totals.completedSum / (totals.totalHabits * dates.length)
    : 0;

  return {
    habits: habits.map((h) => ({ id: h.id, name: h.name, description: h.description })),
    window: { start: dates[0], end: dates[dates.length - 1] },
    perDay,
    overallCompletionRate: overallRate,
    notes:
      'Completion rate is completed habits divided by total habits for each day. Includes detailed habit information and completion status.',
  };
}

export function getLeadershipScoresTool() {
  const dates = getLast7Dates();
  const scores = readLocal<LeadershipScore[]>('def-scores', []);

  const attributeKeys = leadershipAttributes.map((a) => a.key);
  const perDay = dates.map((date) => {
    const forDay = scores.filter((s) => s.date === date);
    const averages: Record<string, number> = {};
    attributeKeys.forEach((key) => {
      const found = forDay.find((s) => s.attribute === key);
      averages[key] = (found?.score as number) ?? null;
    });
    const present = Object.values(averages).filter((v) => typeof v === 'number') as number[];
    const dayAverage = present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
    return { date, averages, dayAverage };
  });

  const overallAverage = (() => {
    const vals = perDay.map((d) => d.dayAverage).filter((v): v is number => typeof v === 'number');
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  return {
    window: { start: dates[0], end: dates[dates.length - 1] },
    perDay,
    overallAverage,
    attributes: leadershipAttributes.map((a) => ({ key: a.key, name: a.name })),
    notes: 'Scores are 1-10 per attribute; day average is mean across available attributes.',
  };
}

export const tools = [
  {
    type: 'function',
    function: {
      name: 'get_habit_progress',
      description:
        'Return habit completion stats for the last 7 days (including today) based on localStorage keys def-habits and def-completions.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_leadership_scores',
      description: 'Return leadership scores for the last 7 days based on localStorage key def-scores.',
      parameters: { type: 'object', properties: {} },
    },
  },
];
