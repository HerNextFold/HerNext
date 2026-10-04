/**
 * Curated learning resources, keyed by normalised skill name.
 *
 * Why names and not skill ids: `skills.id` is a random UUID assigned by
 * Postgres (`seed.ts` inserts skills by name with `ON CONFLICT ("name")`), so
 * the same catalogue name has a different id in every environment. Keying on
 * the name keeps this file portable across local, CI and production databases.
 *
 * Keying rules:
 * - Keys are lowercased `skills.name` values from the approved catalogue
 *   (see `backend/db/seed.ts`). They are NOT career titles.
 * - Custom participant skills are deliberately absent. A roadmap task can
 *   never point at a custom skill anyway, because the roadmap resolver builds
 *   its name->id map from catalogue skills only (`isCustom = false`).
 * - Every URL was checked to resolve, and every YouTube id was checked via the
 *   oEmbed endpoint, before being added here.
 *
 * `video` resources are played inside HerNext with the YouTube player, so the
 * participant does not have to leave the learning page. `article` and `course`
 * entries are supporting material: HerNext renders its own lesson text for the
 * skill (see `skillLessons.ts`) and uses these as further reading.
 *
 * These are static, human-curated links. HerNext does not generate, rank or
 * personalise them; a skill simply either has entries or does not.
 */

export type LearningResourceProvider = 'YouTube' | 'Article' | 'Course';

/**
 * How the resource is consumed inside HerNext.
 *
 * - `video`   - played in the HerNext page via the YouTube player.
 * - `article` - HerNext renders its own lesson for the skill; this entry is
 *               supporting "further reading" only, never iframed or copied.
 * - `course`  - shown as structured course information inside HerNext with the
 *               provider link as a secondary action.
 */
export type LearningResourceType = 'video' | 'article' | 'course';

export interface LearningResource {
  title: string;
  provider: LearningResourceProvider;
  type: LearningResourceType;
  /** Canonical watch URL, kept for attribution and the "open on provider" link. */
  url: string;
  /** YouTube 11-character id. Present only on `video` resources. */
  videoId?: string;
  durationMinutes?: number;
  summary: string;
}

/** YouTube watch URL -> embeddable player id. */
function toVideoId(url: string): string {
  return new URL(url).searchParams.get('v') ?? '';
}

export const learningResources: Record<string, LearningResource[]> = {
  'customer service': [
    {
      title: 'The secret to great customer service',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=aKmp4CDdAVg',
      videoId: 'aKmp4CDdAVg',
      durationMinutes: 10,
      summary:
        'A customer service leader breaks down the "happy to help" framework: patience, understanding and respect as the three things that turn a difficult call around.',
    },
    {
      title: 'Customer service skills and techniques',
      provider: 'Article',
      type: 'article',
      url: 'https://www.zendesk.com/blog/customer-service-skills/',
      summary:
        'An overview of the core customer service skills, how to practise them, and how to measure whether they are working.',
    },
    {
      title: 'Customer Service: Adapting to Your Customers’ Cues',
      provider: 'Course',
      type: 'course',
      url: 'https://www.codecademy.com/learn/ext-courses/customer-service-adapting-to-your-customers-cues',
      summary:
        'Learn to read a customer’s mood and communication style, then adjust your support approach to the individual in front of you.',
    },
  ],

  'transaction processing': [
    {
      title: 'The General Ledger',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/general-ledger/',
      summary:
        'What a general ledger is, how transactions get posted into it, and why it is the record every other report is built from.',
    },
    {
      title: 'Understanding bank financial statements',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-statements-for-banks/',
      summary:
        'A guided read of a bank’s financial statements and the accounts behind them — useful for making sense of transaction activity on an account.',
    },
    {
      title: 'What is a deposit slip and how is it used?',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/wealth-management/deposit-slip/',
      summary:
        'How paper and digital deposit slips record payments into an account, and the part they play in proving a transaction happened.',
    },
  ],

  'cash management': [
    {
      title: 'Understanding Cash Flow vs Profit',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=y-sihv9YZqQ',
      videoId: 'y-sihv9YZqQ',
      durationMinutes: 10,
      summary:
        'A CPA walks through why a profitable business can still run short of cash, and what to track week to week so it does not happen to you.',
    },
    {
      title: 'Cash management: overview and importance',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/cash-management/',
      summary:
        'What cash management covers, why holding and deploying cash well matters, and the processes that support it.',
    },
    {
      title: 'Cash flow guide: EBITDA, FCF and FCFF',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/valuation/cash-flow-guide-ebitda-cf-fcf-fcff/',
      summary:
        'A practical walk-through of the main cash flow measures and how to read them when you are tracking money moving through a business.',
    },
  ],

  'financial record keeping': [
    {
      title: 'ACCOUNTING BASICS: a Guide to (Almost) Everything',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=yYX4bvQSqbo',
      videoId: 'yYX4bvQSqbo',
      durationMinutes: 10,
      summary:
        'Walks the whole accounting cycle: identifying a transaction, writing a journal entry, posting it to the general ledger, adjusting, and producing the financial statements.',
    },
    {
      title: 'What is bookkeeping?',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bookkeeping/',
      summary:
        'The day-to-day work of recording financial transactions, and how it differs from accounting.',
    },
    {
      title: 'Apply Bookkeeping & Accounting for Financial Reporting',
      provider: 'Course',
      type: 'course',
      url: 'https://www.coursera.org/learn/bookkeeping',
      summary:
        'A structured course on recording transactions and turning those records into financial reports.',
    },
  ],

  'reconciliation': [
    {
      title: 'Easy Bank Reconciliation for Beginners Explained!',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=nM5kJB97O1c',
      videoId: 'nM5kJB97O1c',
      durationMinutes: 10,
      summary:
        'A full worked reconciliation in Excel — deposits in transit, outstanding cheques, bank charges and a recording error — then the journal entries that follow.',
    },
    {
      title: 'Bank reconciliation: definition and example',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bank-reconciliation/',
      summary:
        'The step-by-step procedure for comparing your records to a bank statement, plus a downloadable statement template.',
    },
    {
      title: 'Define the purpose of a bank reconciliation and prepare one',
      provider: 'Article',
      type: 'article',
      url: 'https://openstax.org/books/principles-financial-accounting/pages/8-6-define-the-purpose-of-a-bank-reconciliation-and-prepare-a-bank-reconciliation-and-its-associated-journal-entries',
      summary:
        'An academic treatment of why reconciliations exist as an internal control, the timing differences they absorb, and the resulting journal entries.',
    },
  ],

  'fraud awareness': [
    {
      title: 'Fraud Risk Management with Expert Trainer Mohamad Kaissi',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dO6HwQXbPNk',
      videoId: 'dO6HwQXbPNk',
      summary:
        'An ACFE trainer on how organisations build anti-fraud controls, and why general fraud awareness training is not enough on its own.',
    },
    {
      title: 'Fraud’s hidden cost',
      provider: 'Article',
      type: 'article',
      url: 'https://www.acfe.com/fraud-resources/frauds-hidden-cost',
      summary:
        'A fraud awareness training package from the Association of Certified Fraud Examiners, covering common occupational fraud types and the warning signs to watch for.',
    },
    {
      title: 'Employee Fraud Awareness Training',
      provider: 'Course',
      type: 'course',
      url: 'https://www.acfe.com/training-events-and-products/employee-fraud-awareness-training',
      summary:
        'ACFE’s structured programme for teaching staff to recognise and report fraud. Notes ACFE research that untrained organisations lose roughly twice as much.',
    },
  ],

  'excel': [
    {
      title: 'Microsoft Excel Tutorial for Beginners — Full Course',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
      videoId: 'Vl0H-qTclOg',
      summary:
        'A full freeCodeCamp course that builds six real projects while covering data entry, formulas, navigation and saving.',
    },
    {
      title: 'Excel help and learning',
      provider: 'Article',
      type: 'article',
      url: 'https://support.microsoft.com/en-us/excel',
      summary:
        'Microsoft’s own Excel help centre: official documentation, tutorials and video training for every part of the product.',
    },
    {
      title: 'Basic Excel formulas for beginners',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/excel/basic-excel-formulas-beginners/',
      summary:
        'The handful of formulas that cover most everyday spreadsheet work, written up for someone new to Excel.',
    },
  ],

  'data analysis': [
    {
      title: 'Data Analysis with Python — Full Course for Beginners',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
      videoId: 'r-uOLxNrNk8',
      summary:
        'freeCodeCamp’s walkthrough of the analysis workflow — reading data, cleaning and transforming it, then visualising the results.',
    },
    {
      title: 'Kaggle Learn',
      provider: 'Course',
      type: 'course',
      url: 'https://www.kaggle.com/learn',
      summary:
        'Short hands-on micro-courses in Python, pandas, data visualisation and machine learning, each runnable against real datasets.',
    },
    {
      title: 'Learn Data Science — Full Course for Beginners',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
      videoId: 'ua-CiDNNj30',
      summary:
        'A non-technical introduction to data science, with an overview of statistics and how exploratory analysis works.',
    },
  ],

  'financial analysis': [
    {
      title: 'How to Read Financial Statements: Beginner’s Guide to Financial Analysis Part 1',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=JYLRI5Xtw2Q',
      videoId: 'JYLRI5Xtw2Q',
      durationMinutes: 9,
      summary:
        'A guided read of a real annual report: where to find the financial statements, and how to use them to judge a company’s health.',
    },
    {
      title: 'Financial ratios: the definitive guide',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-ratios-definitive-guide/',
      summary:
        'The main liquidity, profitability, leverage and efficiency ratios, how each is calculated, and what each one tells you.',
    },
    {
      title: 'Principles of Finance',
      provider: 'Article',
      type: 'article',
      url: 'https://openstax.org/details/books/principles-managerial-finance',
      summary:
        'A free, complete finance textbook covering financial statement analysis, ratio analysis, time value of money and forecasting.',
    },
  ],

  'risk management': [
    {
      title: 'Risk management: overview, importance and processes',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/risk-management/',
      summary:
        'What risk management is, why organisations need it, and the typical identify–assess–treat–monitor process.',
    },
    {
      title: 'Financial risk management books — overview and importance',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/financial-risk-management/',
      summary:
        'How financial risk differs from other risk categories, and recommended reading for going deeper.',
    },
  ],

  'digital payments': [
    {
      title: 'A guide to types of payment methods',
      provider: 'Article',
      type: 'article',
      url: 'https://stripe.com/guides/payment-methods',
      summary:
        'A clear breakdown of card, bank transfer, wallet and buy-now-pay-later payment methods and how each one settles.',
    },
    {
      title: 'Payment processing fees: overview, factors and types',
      provider: 'Article',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/payment-processing/',
      summary:
        'How payment processing works and what drives the fees around it — useful when you are explaining costs to someone else.',
    },
    {
      title: 'General principles for international remittance services',
      provider: 'Article',
      type: 'article',
      url: 'https://www.bis.org/cpmi/publ/d76.htm',
      summary:
        'The BIS Committee on Payment and Settlement Systems’ principles for sending money across borders: safety, speed, transparency and access.',
    },
  ],

  'communication': [
    {
      title: '5 ways to listen better',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=cSohjlYQI2A',
      videoId: 'cSohjlYQI2A',
      durationMinutes: 10,
      summary:
        'Julian Treasure on why careful listening has become rare, and the concrete things you can change to listen better.',
    },
    {
      title: 'Complete Communication Skills Course',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=A0BMyN3Eofk',
      videoId: 'A0BMyN3Eofk',
      summary:
        'A structured course covering verbal and non-verbal cues, body language, eye contact and listening.',
    },
    {
      title: 'Introduction to Communication Science',
      provider: 'Course',
      type: 'course',
      url: 'https://www.coursera.org/learn/communication',
      summary:
        'The study of how communication actually works — how messages are produced, transmitted and received, and where they break down.',
    },
  ],

  'problem solving': [
    {
      title: 'Effective Problem-Solving and Decision-Making',
      provider: 'Course',
      type: 'course',
      url: 'https://www.coursera.org/learn/problem-solving',
      summary:
        'A structured approach to breaking a problem down, generating and comparing options, and deciding.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      provider: 'Course',
      type: 'course',
      url: 'https://www.coursera.org/learn/career-foundations-toolkit',
      summary:
        'Transferable-skills modules for professional development, including problem solving, critical thinking and decision making.',
    },
  ],

  'attention to detail': [
    {
      title: 'The first secret of great design',
      provider: 'YouTube',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=9uOMectkCCs',
      videoId: '9uOMectkCCs',
      durationMinutes: 10,
      summary:
        'Tony Fadell on habituation and why training yourself to notice the small things is what separates careful work from careless work.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      provider: 'Course',
      type: 'course',
      url: 'https://www.coursera.org/learn/career-foundations-toolkit',
      summary:
        'Includes a module on attention to detail and technical accuracy — spotting inconsistencies and checking data before relying on it.',
    },
  ],
};

/**
 * Looks up curated resources for a catalogue skill name.
 *
 * Returns an empty array when the name is unknown, blank, or a custom skill.
 * Callers must render an honest empty state rather than substituting something
 * unrelated.
 */
export function getLearningResources(skillName: string | null | undefined): LearningResource[] {
  if (typeof skillName !== 'string') return [];
  const key = skillName.trim().toLowerCase();
  if (!key) return [];
  return learningResources[key] ?? [];
}

/**
 * The video played in the HerNext page, if the skill has one. A skill can hold
 * several videos; the first is the primary lesson and the rest become
 * "additional videos".
 */
export function getPrimaryVideo(skillName: string | null | undefined): LearningResource | null {
  return getLearningResources(skillName).find((r) => r.type === 'video' && r.videoId) ?? null;
}

/** Catalogue skill names that currently have curated resources. */
export const curatedSkillNames: readonly string[] = Object.keys(learningResources);

/** Internal consistency check: every `video` must carry the id needed to embed it. */
export function videoEmbedUrl(videoId: string): string {
  // youtube-nocookie avoids setting tracking cookies before the participant
  // chooses to play, and `rel=0`/`modestbranding` keep the frame HerNext-styled.
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export { toVideoId };