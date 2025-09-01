"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import { format, addDays } from "date-fns";
import { useHabits } from "@/hooks/useHabits";
import { leadershipAttributes } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { D3BarChart } from "@/components/D3BarChart";
import { D3LineChart } from "@/components/D3LineChart";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Workouts } from "@/components/Workouts";
import {
  Sunrise,
  Dumbbell,
  CheckSquare,
  Droplets,
  Apple,
  X,
  BookOpen,
  Brain,
  Star,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Chat from "@/components/Chat";
import {
  OPENROUTER_KEY,
  OPENROUTER_URL,
  SYSTEM_PROMPT,
  tools,
  processToolCallsAndFollowUp,
} from "@/lib/ai";

type TaskItem = { id: string; text: string; done: boolean };

function TaskRow({
  task,
  onToggle,
  onRemove,
}: {
  task: TaskItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-3 py-1 cursor-pointer rounded-md transition-colors",
        isDragging ? "opacity-70 ring-1 ring-ring" : "hover:bg-muted/50",
      ].join(" ")}
      onClick={() => onToggle(task.id)}
    >
      <span
        className="text-muted-foreground/70 hover:text-muted-foreground rounded p-0 -ml-1 cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <Checkbox
        checked={task.done}
        onCheckedChange={() => onToggle(task.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <span
        className={`flex-1 text-sm ${
          task.done ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Remove task"
        className="p-0 text-right flex justify-end"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(task.id);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

const iconMap = {
  Sunrise,
  Dumbbell,
  CheckSquare,
  Droplets,
  Apple,
  X,
  BookOpen,
  Brain,
  Star,
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};
type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string; tool_calls?: ToolCall[] } }>;
};

export default function Home() {
  const {
    habits,
    toggleCompletion,
    setScore,
    getCompletion,
    getScore,
    getToday,
  } = useHabits();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous week, etc.
  const [activeTab, setActiveTab] = useState("assessment");
  const [aiMessage, setAiMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const debouncedTimerRef = useRef<NodeJS.Timeout | null>(null);
  type TaskItem = { id: string; text: string; done: boolean };
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState("");
  const TASKS_KEY_PREFIX = "def-tasks-";
  const saveTasks = useCallback(
    (list: TaskItem[]) => {
      setTasks(list);
      try {
        localStorage.setItem(
          TASKS_KEY_PREFIX + selectedDate,
          JSON.stringify(list)
        );
      } catch {}
    },
    [selectedDate]
  );

  const viewTasks = useMemo(() => {
    const active = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);
    return [...active, ...done];
  }, [tasks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeList = tasks.filter((t) => !t.done);
    const doneList = tasks.filter((t) => t.done);
    const srcA = activeList.findIndex((t) => t.id === activeId);
    const dstA = activeList.findIndex((t) => t.id === overId);
    if (srcA !== -1 && dstA !== -1) {
      const nextA = arrayMove(activeList, srcA, dstA);
      saveTasks([...nextA, ...doneList]);
      return;
    }
    const srcD = doneList.findIndex((t) => t.id === activeId);
    const dstD = doneList.findIndex((t) => t.id === overId);
    if (srcD !== -1 && dstD !== -1) {
      const nextD = arrayMove(doneList, srcD, dstD);
      saveTasks([...activeList, ...nextD]);
    }
  };

  const baseDate = useMemo(
    () => addDays(new Date(), weekOffset * 7),
    [weekOffset]
  ); // Base date for the current week view
  const dates = useMemo(
    () => [
      format(addDays(baseDate, -6), "yyyy-MM-dd"), // 6 days ago from base date
      format(addDays(baseDate, -5), "yyyy-MM-dd"), // 5 days ago from base date
      format(addDays(baseDate, -4), "yyyy-MM-dd"), // 4 days ago from base date
      format(addDays(baseDate, -3), "yyyy-MM-dd"), // 3 days ago from base date
      format(addDays(baseDate, -2), "yyyy-MM-dd"), // 2 days ago from base date
      format(addDays(baseDate, -1), "yyyy-MM-dd"), // 1 day ago from base date
      format(baseDate, "yyyy-MM-dd"), // base date (current day for this week view)
    ],
    [baseDate]
  );

  const getLevel = (score: number) => {
    if (score <= 2) return 0;
    if (score <= 5) return 1;
    if (score <= 8) return 2;
    return 3;
  };

  const getTrafficLightColor = (score: number) => {
    if (score <= 2) return "bg-red-500";
    if (score <= 5) return "bg-orange-500";
    if (score <= 7) return "bg-yellow-500";
    return "bg-green-500";
  };

  const systemPrompt = SYSTEM_PROMPT;

  const fetchAiMessageNow = useCallback(async () => {
    try {
      setAiError(null);
      setIsLoadingMessage(true);
      const apiKey = localStorage.getItem(OPENROUTER_KEY) || "";
      if (!apiKey) {
        throw new Error("Missing OpenRouter API key. Set it in the Chat tab.");
      }
      const referer =
        typeof window !== "undefined" ? window.location.origin : "";

      const userMsg =
        "Send me a short text as Jocko: direct, disciplined, motivating. Use my current habits and leadership scores; call tools if helpful to fetch the last 7 days. Keep it punchy: 1–3 short sentences, no preamble.";

      const payload = {
        model: "x-ai/grok-code-fast-1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.3,
      };

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(referer
            ? { "HTTP-Referer": referer, "X-Title": "DEF Habits - Jocko Daily" }
            : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: ChatCompletionResponse = await res.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;

      let finalContent = msg?.content ?? "";
      if (msg?.tool_calls?.length) {
        const { finalContent: fc } = await processToolCallsAndFollowUp({
          initialAssistant: {
            content: msg.content || "",
            tool_calls: msg.tool_calls,
          },
          systemPrompt,
          userMsg,
          apiKey,
          referer,
          xTitle: "DEF Habits - Jocko Daily",
          model: "x-ai/grok-code-fast-1",
          history: [],
        });
        finalContent = fc;
      }

      setAiMessage(finalContent);
      // Persist last message and timestamp (24h gating for initial run)
      try {
        localStorage.setItem("jocko_daily_message", finalContent || "");
        localStorage.setItem("jocko_daily_last", String(Date.now()));
      } catch (err) {
        console.error(err);
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setAiError(msg || "Failed to fetch Jocko message");
    } finally {
      setIsLoadingMessage(false);
    }
  }, [systemPrompt]);

  const scheduleAiRefresh = useCallback(() => {
    if (debouncedTimerRef.current) {
      clearTimeout(debouncedTimerRef.current);
    }
    debouncedTimerRef.current = setTimeout(() => {
      fetchAiMessageNow();
    }, 5000);
  }, [fetchAiMessageNow]);

  // Load tasks for the selected date
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY_PREFIX + selectedDate);
      if (raw) {
        const parsed = JSON.parse(raw) as TaskItem[];
        setTasks(Array.isArray(parsed) ? parsed : []);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    }
  }, [selectedDate]);

  const addTask = () => {
    const text = newTask.trim();
    if (!text || tasks.length >= 5) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const active = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);
    const next = [...active, { id, text, done: false }, ...done];
    saveTasks(next);
    setNewTask("");
    fetchAiMessageNow();
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    const active = updated.filter((t) => !t.done);
    const done = updated.filter((t) => t.done);
    saveTasks([...active, ...done]);
    fetchAiMessageNow();
  };

  const removeTask = (id: string) => {
    const next = tasks.filter((t) => t.id !== id);
    saveTasks(next);
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    toggleCompletion(habitId, date);
    scheduleAiRefresh();
  };

  const handleSetScore = (attribute: string, date: string, value: number) => {
    setScore(attribute, date, value);
    // Debounce with a shared timer so rapid changes collapse to one call
    scheduleAiRefresh();
  };

  const habitCompletionData = dates.map((date) => ({
    date: format(new Date(date), "MMM dd"),
    completed: habits.filter((h) => getCompletion(h.id, date)).length,
  }));

  const leadershipData = useMemo(
    () =>
      dates.map((date) => ({
        date: format(new Date(date), "MMM dd"),
        average:
          leadershipAttributes.reduce(
            (sum, attr) => sum + getScore(attr.key, date),
            0
          ) / leadershipAttributes.length,
      })),
    [dates, getScore]
  );

  useEffect(() => {
    // Load last stored message immediately
    try {
      const saved = localStorage.getItem("jocko_daily_message");
      if (saved) setAiMessage(saved);
    } catch {}

    // Trigger initial message at most once per 24 hours
    try {
      const lastStr = localStorage.getItem("jocko_daily_last");
      const last = lastStr ? parseInt(lastStr, 10) : 0;
      const now = Date.now();
      if (!last || now - last >= 24 * 60 * 60 * 1000) {
        fetchAiMessageNow();
      }
    } catch (err) {
      console.error(err);
      fetchAiMessageNow();
    }

    return () => {
      if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current);
    };
  }, [fetchAiMessageNow]);

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ backgroundColor: "#1e1e1e" }}
    >
      {/* Main Content */}
      <div
        className={`max-w-6xl mx-auto p-4 bg-black ${
          activeTab === "chat" ? "h-[calc(100vh-62px)]" : ""
        } ${activeTab !== "chat" ? "pb-40" : ""}`}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="assessment">
            <div className="grid grid-cols-7 gap-2 mb-8">
              {dates.map((date) => {
                const isFuture = false; // All dates are now in the past or today
                return (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "ghost"}
                    onClick={() => !isFuture && setSelectedDate(date)}
                    disabled={isFuture}
                    className="text-xs flex-shrink-0 flex flex-col h-auto py-2 px-3 w-full"
                  >
                    <span className="font-bold text-sm">
                      {format(new Date(date), "dd")}
                    </span>
                    <span className="text-xs">
                      {format(new Date(date), "MMM")}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 mb-8">
              <h1 className="text-left text-5xl font-bold text-white uppercase mb-2">
                {format(new Date(selectedDate), "EEEE")}
              </h1>
              <p className="text-left text-red-500">
                {format(new Date(selectedDate), "MMMM dd")}
              </p>
            </div>

            <Card className="mt-4 bg-black">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Image
                    src="/jocko-no-bg.png"
                    alt="Jocko"
                    width={40}
                    height={40}
                    className="rounded-xs h-10"
                  />
                  JOCKO&apos;S MESSAGE
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("chat")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </CardHeader>
              <CardContent className="h-[140px] overflow-auto">
                {isLoadingMessage ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Generating message...
                    </p>
                  </div>
                ) : (
                  <div>
                    {aiError ? (
                      <p className="text-red-400 text-xs">{aiError}</p>
                    ) : (
                      <p className="text-white leading-relaxed text-xs whitespace-pre-wrap">
                        {aiMessage}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks Today */}
            <Card className="mt-4 bg-black">
              <CardHeader>
                <CardTitle>TASKS TODAY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {viewTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No tasks yet.
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={viewTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {viewTasks.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            onToggle={toggleTask}
                            onRemove={removeTask}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Input
                    placeholder={
                      tasks.length >= 5 ? "Max 5 tasks reached" : "Add a task"
                    }
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask();
                    }}
                    disabled={tasks.length >= 5}
                    className="text-base"
                  />
                  <Button
                    onClick={addTask}
                    disabled={!newTask.trim() || tasks.length >= 5}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 bg-black">
              <CardHeader>
                <CardTitle>DAILY HABITS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {habits.map((habit) => {
                    const Icon =
                      iconMap[habit.icon as keyof typeof iconMap] || Star;
                    const isCompleted = getCompletion(habit.id, selectedDate);
                    return (
                      <div key={habit.id} className="space-y-2">
                        <div
                          className="flex items-center space-x-4 py-2 rounded-lg cursor-pointer transition-all duration-300"
                          onClick={() =>
                            handleToggleCompletion(habit.id, selectedDate)
                          }
                        >
                          <Icon
                            className={`w-6 h-6 text-primary transition-all duration-300 ${
                              isCompleted
                                ? "opacity-60 scale-110"
                                : "opacity-100 scale-100"
                            }`}
                          />
                          <span
                            className={`flex-1 font-medium transition-all duration-300 ${
                              isCompleted
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {habit.name}
                          </span>
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() =>
                              handleToggleCompletion(habit.id, selectedDate)
                            }
                            onClick={(e) => e.stopPropagation()} // Prevent double triggering
                            className="transition-all duration-300"
                          />
                        </div>
                        <p
                          className={`text-xs text-muted-foreground transition-all duration-300 ${
                            isCompleted ? "line-through opacity-60" : ""
                          } cursor-pointer`}
                          onClick={() =>
                            handleToggleCompletion(habit.id, selectedDate)
                          }
                        >
                          {habit.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 bg-black">
              <CardHeader>
                <CardTitle>LEADERSHIP ASSESSMENT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leadershipAttributes.map((attr, index) => {
                    const score = getScore(attr.key, selectedDate);
                    const level = getLevel(score);
                    return (
                      <div key={attr.key} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm font-semibold">
                            {attr.name}
                          </Label>
                          <div className="flex-1 border-b border-gray-700"></div>
                          <div
                            className={`w-3 h-3 rounded-full ${getTrafficLightColor(
                              score
                            )}`}
                          ></div>
                        </div>
                        <Slider
                          value={[score]}
                          onValueChange={([value]) =>
                            handleSetScore(attr.key, selectedDate, value)
                          }
                          max={10}
                          min={1}
                          step={1}
                          className="w-full mt-4 mb-4 h-6"
                        />
                        <p className="text-xs">
                          {attr.levels[level as keyof typeof attr.levels]}
                        </p>
                        {index < leadershipAttributes.length - 1 && (
                          <div className="border-b border-gray-900 -mx-4 mt-4"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="flex items-center justify-between mt-4 mb-8">
              <Button
                variant="outline"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">
                  {weekOffset === 0
                    ? "This Week"
                    : weekOffset === -1
                    ? "Last Week"
                    : weekOffset < -1
                    ? `${Math.abs(weekOffset)} Weeks Ago`
                    : `${weekOffset} Weeks Ahead`}
                </h2>
                <p className="text-sm text-gray-400">
                  {format(addDays(baseDate, -6), "MMM dd")} -{" "}
                  {format(baseDate, "MMM dd, yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                disabled={weekOffset >= 0} // Don't allow going to future weeks
                className="flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Card className="bg-black">
              <CardHeader>
                <CardTitle>HABIT COMPLETION PROGRESS</CardTitle>
              </CardHeader>
              <CardContent>
                <D3BarChart
                  data={habitCompletionData}
                  todayDate={
                    weekOffset === 0 ? format(new Date(), "MMM dd") : undefined
                  }
                  maxHabits={habits.length}
                />
              </CardContent>
            </Card>

            <Card className="mt-4 bg-black">
              <CardHeader>
                <CardTitle>LEADERSHIP SCORE AVERAGE</CardTitle>
              </CardHeader>
              <CardContent>
                <D3LineChart data={leadershipData} />
              </CardContent>
            </Card>

            <Card className="mt-4 bg-black">
              <CardHeader>
                <CardTitle>KNOWLEDGE BASE</CardTitle>
              </CardHeader>
              <CardContent>
                <KnowledgeBase />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Chat />
          </TabsContent>
          <TabsContent value="workouts">
            <Workouts />
          </TabsContent>

          {/* Fixed Bottom Navigation */}
          <TabsList
            className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-4 h-16 border-t border-border z-10"
            style={{ backgroundColor: "#1e1e1e" }}
          >
            <TabsTrigger
              value="assessment"
              className="flex flex-col items-center justify-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Target className="w-5 h-5" />
              <span>ASSESSMENT</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="flex flex-col items-center justify-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <TrendingUp className="w-5 h-5" />
              <span>INSIGHTS</span>
            </TabsTrigger>
            <TabsTrigger
              value="workouts"
              className="flex flex-col items-center justify-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Dumbbell className="w-5 h-5" />
              <span>WORKOUTS</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex flex-col items-center justify-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <MessageSquare className="w-5 h-5" />
              <span>CHAT</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
