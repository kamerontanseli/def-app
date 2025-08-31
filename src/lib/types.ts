export interface Habit {
  id: string;
  name: string;
  icon: string;
  description: string;
  isCustom: boolean;
}

export interface HabitCompletion {
  date: string;
  habitId: string;
  completed: boolean;
}

export interface LeadershipScore {
  date: string;
  attribute: string;
  score: number;
}

export const leadershipAttributes = [
  {
    key: 'extreme-ownership',
    name: 'EXTREME OWNERSHIP',
    description: 'Taking full responsibility for team outcomes, including failures, without blaming others or external factors.',
    levels: {
      0: 'Takes no responsibility for outcomes. Blames team, circumstances, or others entirely. Avoids accountability.',
      1: 'Rarely takes ownership. Often shifts blame to external factors or team members. Minimal effort to address issues.',
      2: 'Takes partial responsibility in some situations. Working on reducing blame but inconsistent. Identifies some solutions.',
      3: 'Fully owns all outcomes, good or bad. Leads by example in accountability and drives solutions without excuses.'
    }
  },
  {
    key: 'discipline-equals-freedom',
    name: 'DISCIPLINE EQUALS FREEDOM',
    description: 'Maintaining consistent discipline in planning, execution, and self-control to create flexibility and opportunities.',
    levels: {
      0: 'No discipline in routines or actions. Chaotic approach leads to constant crises and missed opportunities.',
      1: 'Sporadic discipline. Follows routines occasionally but easily distracted or inconsistent. Limited freedom gained.',
      2: 'Builds discipline in key areas. Consistent in some routines, seeing moderate flexibility. Room for improvement.',
      3: 'Exemplifies total discipline across all aspects. Creates maximum freedom through structured habits and adaptability.'
    }
  },
  {
    key: 'lead-up-and-down-the-chain',
    name: 'LEAD UP AND DOWN THE CHAIN',
    description: 'Building trust and communicating effectively with both subordinates and superiors to align goals.',
    levels: {
      0: 'Ignores chain of command. No effort to build trust or communicate, leading to isolation and misalignment.',
      1: 'Minimal communication. Builds superficial trust but struggles with influence up or down the chain.',
      2: 'Communicates adequately in most cases. Builds solid trust with some levels, improving alignment.',
      3: 'Masterfully leads in all directions. Fosters deep trust and clear communication for seamless goal alignment.'
    }
  },
  {
    key: 'decentralized-command',
    name: 'DECENTRALIZED COMMAND',
    description: 'Empowering team members to make decisions by clearly defining the mission and intent, without micromanaging.',
    levels: {
      0: 'Micromanages everything. No empowerment, leading to dependency and stalled progress.',
      1: 'Rarely delegates. Provides vague intent, causing confusion and limited team autonomy.',
      2: 'Delegates in select areas. Clearer intent allows moderate empowerment, with some oversight.',
      3: 'Fully decentralizes command. Empowers team with crystal-clear intent, trusting them to execute independently.'
    }
  },
  {
    key: 'prioritize-and-execute',
    name: 'PRIORITIZE AND EXECUTE',
    description: 'Focusing on the most critical task first, assessing, deciding, and acting decisively under pressure.',
    levels: {
      0: 'No prioritization. Overwhelmed by tasks, leading to paralysis and poor execution.',
      1: 'Basic prioritization but often reactive. Delays decisions, missing key opportunities.',
      2: 'Prioritizes effectively in routine situations. Executes well on main tasks but can falter under high pressure.',
      3: 'Expertly prioritizes and executes. Handles chaos by focusing on one critical task at a time with decisive action.'
    }
  },
  {
    key: 'dichotomy-of-leadership',
    name: 'DICHOTOMY OF LEADERSHIP',
    description: 'Balancing competing demands, such as confidence vs. humility, or aggression vs. restraint.',
    levels: {
      0: 'No balance. Extremes in behavior (e.g., overly arrogant or passive) disrupt leadership effectiveness.',
      1: 'Struggles with balance. Leans toward one extreme, causing occasional team issues.',
      2: 'Achieves balance in many scenarios. Navigates dichotomies adequately but with some inconsistencies.',
      3: 'Perfectly balances all leadership dichotomies. Thoughtfully adapts to situations for optimal outcomes.'
    }
  },
  {
    key: 'build-relationships-and-trust',
    name: 'BUILD RELATIONSHIPS AND TRUST',
    description: 'Fostering mutual trust and respect through listening, valuing input, and promoting accountability.',
    levels: {
      0: 'No effort to build relationships. Lacks trust, leading to fractured teams and low morale.',
      1: 'Superficial relationships. Listens sporadically, building minimal trust with limited accountability.',
      2: 'Builds solid relationships in key areas. Actively listens and fosters trust, with growing accountability.',
      3: 'Cultivates deep, trusting relationships. Listens intently, values all input, and ensures full team accountability.'
    }
  },
  {
    key: 'simplify-and-clarify',
    name: 'SIMPLIFY AND CLARIFY',
    description: 'Breaking down strategies into clear, concise directives to ensure understanding and alignment.',
    levels: {
      0: 'Overcomplicates everything. Vague communication leads to confusion and misalignment.',
      1: 'Simplifies occasionally. Communication is somewhat clear but often leaves room for misunderstanding.',
      2: 'Simplifies most plans effectively. Clear directives in routine matters, improving team alignment.',
      3: 'Masters simplification. Delivers crystal-clear, concise plans that ensure total understanding and execution.'
    }
  },
  {
    key: 'ego-management',
    name: 'EGO MANAGEMENT',
    description: 'Checking personal and team egos to prioritize the mission and teamwork over individual pride.',
    levels: {
      0: 'Ego dominates. Allows personal pride to cloud judgment, disrupting team dynamics.',
      1: 'Occasionally checks ego. Struggles with pride in high-stakes situations, affecting decisions.',
      2: 'Manages ego in many cases. Prioritizes mission over pride but with some lapses.',
      3: 'Completely manages ego. Always puts mission and team first, fostering a humble, collaborative environment.'
    }
  },
  {
    key: 'adapt-and-overcome',
    name: 'ADAPT AND OVERCOME',
    description: 'Adjusting plans dynamically when circumstances change, staying calm and pivoting decisively.',
    levels: {
      0: 'Rigid and unadaptable. Panics under change, leading to failure in dynamic situations.',
      1: 'Adapts slowly. Handles minor changes but struggles with major shifts, causing delays.',
      2: 'Adapts effectively in most scenarios. Stays relatively calm and pivots with moderate success.',
      3: 'Excels at adaptation. Remains calm, anticipates changes, and overcomes obstacles with decisive pivots.'
    }
  }
];
