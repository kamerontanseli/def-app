import { leadershipAttributes, Habit, HabitCompletion, LeadershipScore } from '@/lib/types';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY = 'openrouter_api_key';

export const SYSTEM_PROMPT = [
  'You are Jocko Willink.',
  'Speak in first person as Jocko texting the user directly.',
  'Format replies as a short text message: 1–3 tight sentences, no preamble, no bullet points.',
  'Be terse, direct, disciplined, and motivating; use imperative voice.',
  "Use the user's habit data, leadership scores, and tasks when helpful; call tools if needed to fetch the latest local progress.",
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

type TaskItem = { id: string; text: string; done: boolean };

export function getTasksTool() {
  const today = new Date();
  const todayStr = formatDateISO(today);
  const tasks = readLocal<TaskItem[]>('def-tasks-' + todayStr, []);

  const active = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  let markdown = `# Tasks Today\n\n`;
  markdown += `**Date:** ${todayStr}\n\n`;
  markdown += `**Total Tasks:** ${tasks.length}\n\n`;

  if (active.length > 0) {
    markdown += `## Active Tasks\n`;
    active.forEach(t => {
      markdown += `- ${t.text}\n`;
    });
    markdown += `\n`;
  }

  if (done.length > 0) {
    markdown += `## Completed Tasks\n`;
    done.forEach(t => {
      markdown += `- ${t.text}\n`;
    });
    markdown += `\n`;
  }

  if (tasks.length === 0) {
    markdown += `No tasks found for today.\n\n`;
  }

  markdown += `*Tasks are separated into active (not done) and completed.*`;

  console.log('task_tool', markdown);

  return markdown;
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

  let markdown = `# Habit Progress (Last 7 Days)\n\n`;
  markdown += `**Period:** ${dates[0]} to ${dates[dates.length - 1]}\n\n`;
  markdown += `**Overall Completion Rate:** ${(overallRate * 100).toFixed(1)}%\n\n`;

  perDay.forEach(day => {
    markdown += `## ${day.date}\n`;
    markdown += `**Completed:** ${day.completed}/${day.totalHabits} (${(day.completionRate * 100).toFixed(1)}%)\n\n`;
    if (day.completedHabits.length > 0) {
      markdown += `### Completed Habits\n`;
      day.completedHabits.forEach(h => {
        if (h) markdown += `- ${h.name}: ${h.description}\n`;
      });
      markdown += `\n`;
    }
    if (day.uncompletedHabits.length > 0) {
      markdown += `### Uncompleted Habits\n`;
      day.uncompletedHabits.forEach(h => {
        markdown += `- ${h.name}: ${h.description}\n`;
      });
      markdown += `\n`;
    }
  });

  markdown += `*Completion rate is completed habits divided by total habits for each day.*`;

  console.log('habit_tool', markdown);

  return markdown;
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

  let markdown = `# Leadership Scores (Last 7 Days)\n\n`;
  markdown += `**Period:** ${dates[0]} to ${dates[dates.length - 1]}\n\n`;
  markdown += `**Overall Average:** ${overallAverage ? overallAverage.toFixed(1) : 'N/A'}\n\n`;

  perDay.forEach(day => {
    markdown += `## ${day.date}\n`;
    markdown += `**Day Average:** ${day.dayAverage ? day.dayAverage.toFixed(1) : 'N/A'}\n\n`;
    markdown += `### Attribute Scores\n`;
    leadershipAttributes.forEach(attr => {
      const score = day.averages[attr.key];
      markdown += `- ${attr.name}: ${score !== null ? score : 'Not set'}\n`;
    });
    markdown += `\n`;
  });

  markdown += `*Scores are 1-10 per attribute; day average is mean across available attributes.*`;

  console.log('leadership_tool', markdown);

  return markdown;
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
  {
    type: 'function',
    function: {
      name: 'get_tasks_today',
      description: 'Return the user\'s tasks for today based on localStorage key def-tasks-{date}.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// Types shared with callers for tool-call processing
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type APIMsg =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string; tool_calls?: ToolCall[] } }>;
};

export type ToolResult = { tool_call_id: string; name: string; content: string };

type ProcessToolCallsArgs = {
  initialAssistant?: { content?: string; tool_calls?: ToolCall[] } | null;
  systemPrompt: string;
  userMsg: string;
  apiKey: string;
  referer?: string;
  xTitle?: string;
  model?: string;
  history?: APIMsg[];
};

type ProcessToolCallsResult = {
  finalContent: string;
  toolApiMsgs: APIMsg[];
  toolResults: ToolResult[];
};

export async function processToolCallsAndFollowUp(
  args: ProcessToolCallsArgs
): Promise<ProcessToolCallsResult> {
  const {
    initialAssistant,
    systemPrompt,
    userMsg,
    apiKey,
    referer,
    xTitle,
    model = 'x-ai/grok-code-fast-1',
    history = [],
  } = args;

  const assistantContent = initialAssistant?.content ?? '';
  const calls = initialAssistant?.tool_calls ?? [];
  if (!calls.length) {
    return { finalContent: assistantContent, toolApiMsgs: [], toolResults: [] };
  }

  const toolResults: ToolResult[] = [];
  const toolApiMsgs: APIMsg[] = [];

  for (const tc of calls) {
    const name = tc.function?.name;
    let result: unknown = null;
    try {
      if (name === 'get_habit_progress') {
        result = getHabitProgressTool();
      } else if (name === 'get_leadership_scores') {
        result = getLeadershipScoresTool();
      } else if (name === 'get_tasks_today') {
        result = getTasksTool();
      } else {
        result = { error: 'unknown tool' };
      }
    } catch (e) {
      result = { error: 'tool execution failed', detail: e instanceof Error ? e.message : String(e) };
    }
    const contentStr = JSON.stringify(result ?? { error: 'empty result' });
    toolResults.push({ tool_call_id: tc.id, name, content: contentStr });
    toolApiMsgs.push({ role: 'tool', content: contentStr, tool_call_id: tc.id });
  }

  // Follow-up request including tool outputs
  const followPayload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantContent, tool_calls: calls },
      ...toolApiMsgs,
    ],
    temperature: 0.3,
  };

  const res2 = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(referer ? { 'HTTP-Referer': referer } : {}),
      ...(xTitle ? { 'X-Title': xTitle } : {}),
    },
    body: JSON.stringify(followPayload),
  });
  if (!res2.ok) {
    const txt = await res2.text();
    throw new Error(txt || `HTTP ${res2.status}`);
  }
  const data2: ChatCompletionResponse = await res2.json();
  const finalContent = data2.choices?.[0]?.message?.content ?? '';

  return { finalContent, toolApiMsgs, toolResults };
}
