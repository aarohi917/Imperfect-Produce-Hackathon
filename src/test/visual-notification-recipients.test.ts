import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Inspect the last migration defining the delivery trigger, not a duplicated
// client-side recipient list. Notification delivery is database-owned.
const directory = `${process.cwd()}/drizzle/migrations`;
const definitions = readdirSync(directory).filter(file => file.endsWith('.sql')).sort()
  .map(file => readFileSync(`${directory}/${file}`, 'utf8'))
  .filter(sql => /CREATE OR REPLACE FUNCTION public\.notify_harvest\(\)/i.test(sql));
const latest = (definitions.at(-1) ?? '').split('CREATE OR REPLACE FUNCTION public.notify_harvest()')[1] ?? '';
const visualBranch = latest.split("IF NEW.report_type='visual_intelligence' THEN")[1]?.split('END IF; RETURN NEW;')[0] ?? '';
const recipientClause = visualBranch.match(/FROM public\.user_roles WHERE role IN \(([^)]+)\)/i)?.[1] ?? '';
const roles = [...recipientClause.matchAll(/'([^']+)'/g)].map(match => match[1]);

describe('Visual report notification recipients', () => {
  it('delivers to Checkers', () => expect(roles).toContain('hq'));
  it('delivers to CEOs', () => expect(roles).toContain('ceo'));
  it('does not send automatic report alerts to farmers', () => {
    expect(roles.sort()).toEqual(['ceo', 'hq']);
  });
});