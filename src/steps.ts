/**
 * The four stops of the build path, in order. Both the desktop header and the
 * mobile bottom bar read from this so the sequence is defined in one place.
 */
export const STEPS = [
  {
    id: 'describe',
    label: 'Describe',
    short: 'Describe',
    blurb: 'Say what you want the robot to do, in plain English.',
  },
  {
    id: 'tune',
    label: 'Tune',
    short: 'Tune',
    blurb: 'Adjust the rules it picked and your risk settings.',
  },
  {
    id: 'test',
    label: 'Test',
    short: 'Test',
    blurb: 'See what it would have made or lost on past prices.',
  },
  {
    id: 'download',
    label: 'Get your bot',
    short: 'Get it',
    blurb: 'Download the file and install it in MetaTrader 5.',
  },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export const stepIndex = (id: string): number => STEPS.findIndex((s) => s.id === id);
