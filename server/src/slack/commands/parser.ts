export type CommandAction =
  | 'help'
  | 'my_tasks'
  | 'status'
  | 'blockers'
  | 'open'
  | 'unknown';

export type ParsedCommand = {
  action: CommandAction;
  args: string[];
  raw: string;
};

/**
 * Parses the text after `/launchpad` into an action + args.
 *
 *   ""                -> help
 *   "help"            -> help
 *   "my tasks"        -> my_tasks        ("tasks" works as an alias)
 *   "status marissa"  -> status ["marissa"]
 *   "blockers"        -> blockers []
 *   "blockers priya"  -> blockers ["priya"]
 *   "open marissa"    -> open ["marissa"]
 *   anything else     -> unknown (handler replies with help + hint)
 */
export function parseLaunchPadCommand(text: string): ParsedCommand {
  const raw = (text ?? '').trim();
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { action: 'help', args: [], raw };

  const first = tokens[0]!.toLowerCase();
  const rest = tokens.slice(1);

  if (first === 'help') return { action: 'help', args: [], raw };
  if (first === 'tasks') return { action: 'my_tasks', args: [], raw };
  if (first === 'my' && rest[0]?.toLowerCase() === 'tasks') {
    return { action: 'my_tasks', args: rest.slice(1), raw };
  }
  if (first === 'status') return { action: 'status', args: rest, raw };
  if (first === 'blockers') return { action: 'blockers', args: rest, raw };
  if (first === 'open') return { action: 'open', args: rest, raw };

  return { action: 'unknown', args: tokens, raw };
}
