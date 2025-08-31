import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Habit, HabitCompletion, LeadershipScore } from '@/lib/types';
import { defaultHabits } from '@/lib/data';

const HABITS_KEY = 'def-habits';
const COMPLETIONS_KEY = 'def-completions';
const SCORES_KEY = 'def-scores';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [scores, setScores] = useState<LeadershipScore[]>([]);

  useEffect(() => {
    // Load from localStorage
    const storedHabits = localStorage.getItem(HABITS_KEY);
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    } else {
      setHabits(defaultHabits);
      localStorage.setItem(HABITS_KEY, JSON.stringify(defaultHabits));
    }

    const storedCompletions = localStorage.getItem(COMPLETIONS_KEY);
    if (storedCompletions) {
      setCompletions(JSON.parse(storedCompletions));
    }

    const storedScores = localStorage.getItem(SCORES_KEY);
    if (storedScores) {
      setScores(JSON.parse(storedScores));
    }
  }, []);

  // If habit editing is added later, reintroduce saveHabits.

  const saveCompletions = (newCompletions: HabitCompletion[]) => {
    setCompletions(newCompletions);
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(newCompletions));
  };

  const saveScores = (newScores: LeadershipScore[]) => {
    setScores(newScores);
    localStorage.setItem(SCORES_KEY, JSON.stringify(newScores));
  };

  const toggleCompletion = (habitId: string, date: string) => {
    const existing = completions.find(c => c.habitId === habitId && c.date === date);
    let newCompletions;
    if (existing) {
      newCompletions = completions.map(c =>
        c.habitId === habitId && c.date === date ? { ...c, completed: !c.completed } : c
      );
    } else {
      newCompletions = [...completions, { habitId, date, completed: true }];
    }
    saveCompletions(newCompletions);
  };

  const setScore = (attribute: string, date: string, score: number) => {
    const existing = scores.find(s => s.attribute === attribute && s.date === date);
    let newScores;
    if (existing) {
      newScores = scores.map(s =>
        s.attribute === attribute && s.date === date ? { ...s, score } : s
      );
    } else {
      newScores = [...scores, { attribute, date, score }];
    }
    saveScores(newScores);
  };

  // Custom habit logic removed.

  const getCompletion = (habitId: string, date: string) => {
    return completions.find(c => c.habitId === habitId && c.date === date)?.completed || false;
  };

  const getScore = (attribute: string, date: string) => {
    return scores.find(s => s.attribute === attribute && s.date === date)?.score || 1;
  };

  const getToday = () => format(new Date(), 'yyyy-MM-dd');

  return {
    habits,
    completions,
    scores,
    toggleCompletion,
    setScore,
    getCompletion,
    getScore,
    getToday
  };
}
