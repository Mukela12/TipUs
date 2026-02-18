export interface TutorialStep {
  id: string
  title: string
  description: string
  /** CSS selector for the target element, null for centered modal */
  target: string | null
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

/** Steps shown to venue owners on their first login */
export const venueOwnerSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TipUs!',
    description:
      'Your venue is set up and ready to go. Let\u2019s take a quick tour so you know where everything is.',
    target: null,
    position: 'center',
  },
  {
    id: 'nav-employees',
    title: 'Manage Your Team',
    description:
      'Invite employees and manage your team here. Each employee will receive their own login and can track their tips.',
    target: '[data-tutorial="nav-employees"]',
    position: 'right',
  },
  {
    id: 'nav-tips',
    title: 'Track Tips',
    description:
      'See all incoming tips in real time. Filter by date, status, or employee to get the full picture.',
    target: '[data-tutorial="nav-tips"]',
    position: 'right',
  },
  {
    id: 'nav-payouts',
    title: 'Payout History',
    description:
      'TipUs handles payouts for you. Check here to see payout history and verify each employee\u2019s distribution status.',
    target: '[data-tutorial="nav-payouts"]',
    position: 'right',
  },
  {
    id: 'nav-settings',
    title: 'Venue Settings',
    description:
      'Update your venue details and set your payout frequency here. You\u2019re all set \u2014 happy tipping!',
    target: '[data-tutorial="nav-settings"]',
    position: 'right',
  },
]

/** Steps shown to employees on their first login */
export const employeeSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TipUs!',
    description:
      'You\u2019re all set up and ready to receive tips. Let\u2019s quickly show you around.',
    target: null,
    position: 'center',
  },
  {
    id: 'nav-tips',
    title: 'Your Tips',
    description:
      'See all tips received at your venue. You can filter and review your tip history here.',
    target: '[data-tutorial="nav-tips"]',
    position: 'right',
  },
  {
    id: 'nav-payouts',
    title: 'Payouts',
    description:
      'Track when and how much you\u2019ve been paid out. Payouts are sent directly to your bank account.',
    target: '[data-tutorial="nav-payouts"]',
    position: 'right',
  },
  {
    id: 'nav-profile',
    title: 'Your Profile',
    description:
      'Keep your bank details up to date here so your payouts arrive without any issues. That\u2019s it \u2014 you\u2019re good to go!',
    target: '[data-tutorial="nav-profile"]',
    position: 'right',
  },
]

