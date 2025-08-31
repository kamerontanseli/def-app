"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useWorkouts, workoutCountsForDay } from "@/hooks/useWorkouts";

export function Workouts() {
  const { lastCompletedDay, completeToday, undoComplete } = useWorkouts();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const todayDay = lastCompletedDay + 1;
  const daysToShow = useMemo(() => {
    const arr = [todayDay - 2, todayDay - 1, todayDay, todayDay + 1, todayDay + 2];
    return arr.filter((d) => d >= 1);
  }, [todayDay]);

  const chartData = useMemo(() => {
    const maxDay = Math.max(0, lastCompletedDay);
    return Array.from({ length: maxDay }, (_, i) => {
      const day = i + 1;
      const { pushups, crunches, plankSeconds } = workoutCountsForDay(day);
      return {
        x: `D${day}`,
        series: {
          Pushups: pushups,
          Crunches: crunches,
          Plank: plankSeconds,
        },
      };
    });
  }, [lastCompletedDay]);

  return (
    <div className="mt-4 space-y-4">
      <Card className="bg-black">
        <CardHeader>
          <CardTitle>WORKOUTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {lastCompletedDay > 0 ? `Last completed: Day ${lastCompletedDay}` : "No days completed yet"}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowUndoConfirm(true)}
              disabled={lastCompletedDay === 0}
            >
              Undo
            </Button>
          </div>
          <div className="space-y-6 mt-4">
            {daysToShow.map((day) => {
              const { pushups, crunches, plankSeconds } = workoutCountsForDay(day);
              const isPast = day <= lastCompletedDay;
              const isToday = day === todayDay;
              return (
                <div key={day} className="space-y-2">
                  <div
                    className={[
                      "rounded-md p-3 border transition-colors",
                      isToday ? "border-red-500/70" : "border-border",
                      isPast ? "opacity-50" : "opacity-100",
                    ].join(" ")}
                  >
                    <div className={"text-sm font-bold " + (isToday ? "text-red-500" : "text-white")}>DAY {day}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      PUSHUP {pushups}. | CRUNCHES {crunches} | PLANK {plankSeconds}s
                    </div>
                    {isToday && (
                      <div className="mt-3">
                        <Button size="sm" onClick={() => setShowConfirm(true)}>
                          Mark Today Completed
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="border-b border-gray-900 -mx-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
          <div className="relative z-10 w-full max-w-xs rounded-lg border border-border bg-neutral-900 p-4 shadow-xl">
            <div className="text-lg font-semibold mb-2">Complete Day {todayDay}?</div>
            <p className="text-xs text-gray-400 mb-4">You can always undo from the top of this card.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={() => { completeToday(); setShowConfirm(false); }}>Complete</Button>
            </div>
          </div>
        </div>
      )}

      {showUndoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUndoConfirm(false)} />
          <div className="relative z-10 w-full max-w-xs rounded-lg border border-border bg-neutral-900 p-4 shadow-xl">
            <div className="text-lg font-semibold mb-2">Undo Day {lastCompletedDay} completion?</div>
            <p className="text-xs text-gray-400 mb-4">This will set last completed back to Day {Math.max(0, lastCompletedDay - 1)}.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowUndoConfirm(false)}>Cancel</Button>
              <Button onClick={() => { undoComplete(); setShowUndoConfirm(false); }}>Undo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
