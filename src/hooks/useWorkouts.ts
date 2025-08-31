"use client";

import { useEffect, useState } from "react";

const LAST_DAY_KEY = "def-workouts-last-completed-day";

export function useWorkouts() {
  const [lastCompletedDay, setLastCompletedDay] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_DAY_KEY);
      if (raw) setLastCompletedDay(Math.max(0, parseInt(raw, 10) || 0));
    } catch {}
  }, []);

  const save = (val: number) => {
    setLastCompletedDay(val);
    try {
      localStorage.setItem(LAST_DAY_KEY, String(val));
    } catch {}
  };

  const completeToday = () => {
    const next = lastCompletedDay + 1;
    save(next);
  };

  const undoComplete = () => {
    const prev = Math.max(0, lastCompletedDay - 1);
    save(prev);
  };

  return { lastCompletedDay, completeToday, undoComplete };
}

export const workoutCountsForDay = (day: number) => {
  // Matches example: Day 2 -> 10/20/30, Day 3 -> 11/21/31
  const pushups = 8 + day;
  const crunches = 18 + day;
  const plankSeconds = 28 + day;
  return { pushups, crunches, plankSeconds };
};
