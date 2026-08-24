import type { Track } from '../types';

/**
 * Reusable quest blueprints. These exist so a repeatable ambition — another
 * house, another country — can be cloned in one tap instead of retyped, which
 * is the whole point when the same playbook runs many times.
 */
export interface QuestTemplate {
  key: string;
  title: string;
  track: Track;
  stat: string;
  blurb: string;
  steps: string[];
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    key: 'house',
    title: 'Build a house',
    track: 'Property',
    stat: 'Wealth',
    blurb: 'Land to handover. Clone one per property.',
    steps: [
      'Set total budget and confirm financing',
      'Shortlist and visit plots',
      'Verify title, zoning and access rights',
      'Buy the land',
      'Commission architect and finalise plans',
      'Submit and obtain building permits',
      'Tender to contractors and pick one',
      'Groundwork and foundation poured',
      'Structure and walls up',
      'Roof on and building watertight',
      'Plumbing, electrics and utilities connected',
      'Interior finishing — floors, walls, fittings',
      'Kitchen and bathrooms installed',
      'Furnish and final snagging list cleared',
      'Final inspection and handover',
    ],
  },
  {
    key: 'country',
    title: 'Launch business in a new country',
    track: 'Empire',
    stat: 'Empire',
    blurb: 'Market entry to hands-off. Clone one per country.',
    steps: [
      'Validate demand — talk to 20 potential customers',
      'Choose legal structure and register the entity',
      'Set up tax registration and compliance calendar',
      'Open a local business bank account',
      'Find a local accountant or advisor',
      'Define the offer and price it for this market',
      'Build the landing page and local presence',
      'Land the first paying customer',
      'Find one acquisition channel that repeats',
      'Reach break-even on monthly costs',
      'Make the first local hire',
      'Document the SOPs so it runs without you',
      'Hit target monthly revenue',
      'Hand day-to-day over to a manager',
    ],
  },
  {
    key: 'brand',
    title: 'Build a personal brand',
    track: 'Reputation',
    stat: 'Reputation',
    blurb: 'From unknown to known in your niche.',
    steps: [
      'Pick the niche and the one thing you want to be known for',
      'Rewrite profiles and bio to say it clearly',
      'Publish 10 pieces of proof-of-work',
      'Reach 1,000 followers on the main platform',
      'Get featured on someone else’s audience',
      'Speak at or attend one industry event',
      'Build a list of 100 real industry contacts',
      'Land the first inbound opportunity',
    ],
  },
  {
    key: 'channel',
    title: 'Launch a content channel',
    track: 'Content',
    stat: 'Content',
    blurb: 'Zero to a channel that compounds.',
    steps: [
      'Define the format, topic and posting cadence',
      'Set up the recording and editing kit',
      'Script and publish the first 5 pieces',
      'Publish consistently for 30 days straight',
      'Hit the first 1,000 subscribers',
      'Find the format that outperforms and double down',
      'Build a repeatable content production system',
      'Earn the first revenue from the channel',
    ],
  },
];
