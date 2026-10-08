/**
 * Server-side curated learning catalogue (docs/API_CONTRACT.md §21a).
 *
 * These are static, human-curated links that the backend serves directly for a
 * skill before it spends any AI or provider quota. The data mirrors the
 * frontend's static layer (`frontend/src/lib/learningResources.ts`) so both
 * layers agree on what "curated" means.
 *
 * Keying rules:
 * - Keys are lowercased `skills.name` values from the approved catalogue
 *   (see `backend/db/seed.ts`). They are NOT career titles.
 * - Custom participant skills are deliberately absent: they discover
 *   dynamically instead, and nothing here can be fabricated for them.
 * - Every URL is HTTPS and every YouTube id is a canonical 11-char id; the
 *   unit suite parses the whole catalogue against the response schema so a bad
 *   entry fails tests, never a live request.
 *
 * Mapping to `LearningResource`:
 * - `dedupeKey` is `youtube:{videoId}` for videos and `curated:{type}:{url}`
 *   for articles/courses, so discovery dedupes against the same identity.
 * - `provider` is "YouTube" for videos and the source hostname for
 *   articles/courses; `creator.name` is null when the original channel is not
 *   recorded (never invented) and the hostname for article/course publishers.
 * - Curated resources carry `isCurated: true`, `discoveredAt: null` and
 *   `level: "BEGINNER"`.
 */

import type { LearningResource, LearningResourceType } from './learning.types.js';
import { hostnameOf, isHttpsUrl, isValidYoutubeVideoId, parseYoutubeVideoId } from './validate.js';

interface CuratedEntry {
  title: string;
  type: LearningResourceType;
  url: string;
  /** Canonical 11-char YouTube id. Required only for `video` entries. */
  videoId?: string;
  durationMinutes?: number;
  summary: string;
}

/**
 * Curated results at or above this count fully satisfy the request: the
 * service returns them directly and skips the AI intent + provider search
 * entirely. Below it, curated entries are merged in front of discovery results.
 */
export const MIN_CURATED_RESULTS = 3;

const CATALOGUE: Record<string, CuratedEntry[]> = {
  'customer service': [
    {
      title: 'The secret to great customer service',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=aKmp4CDdAVg',
      videoId: 'aKmp4CDdAVg',
      durationMinutes: 10,
      summary:
        'A customer service leader breaks down the "happy to help" framework: patience, understanding and respect as the three things that turn a difficult call around.',
    },
    {
      title: 'Customer service skills and techniques',
      type: 'article',
      url: 'https://www.zendesk.com/blog/customer-service-skills/',
      summary:
        'An overview of the core customer service skills, how to practise them, and how to measure whether they are working.',
    },
    {
      title: 'Customer Service: Adapting to Your Customers\u2019 Cues',
      type: 'course',
      url: 'https://www.codecademy.com/learn/ext-courses/customer-service-adapting-to-your-customers-cues',
      summary:
        'Learn to read a customer\u2019s mood and communication style, then adjust your support approach to the individual in front of you.',
    },
  ],

  'transaction processing': [
    {
      title: 'The General Ledger',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/general-ledger/',
      summary:
        'What a general ledger is, how transactions get posted into it, and why it is the record every other report is built from.',
    },
    {
      title: 'Understanding bank financial statements',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-statements-for-banks/',
      summary:
        'A guided read of a bank\u2019s financial statements and the accounts behind them \u2014 useful for making sense of transaction activity on an account.',
    },
    {
      title: 'What is a deposit slip and how is it used?',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/wealth-management/deposit-slip/',
      summary:
        'How paper and digital deposit slips record payments into an account, and the part they play in proving a transaction happened.',
    },
  ],

  'cash management': [
    {
      title: 'Understanding Cash Flow vs Profit',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=y-sihv9YZqQ',
      videoId: 'y-sihv9YZqQ',
      durationMinutes: 10,
      summary:
        'A CPA walks through why a profitable business can still run short of cash, and what to track week to week so it does not happen to you.',
    },
    {
      title: 'Cash management: overview and importance',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/cash-management/',
      summary:
        'What cash management covers, why holding and deploying cash well matters, and the processes that support it.',
    },
    {
      title: 'Cash flow guide: EBITDA, FCF and FCFF',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/valuation/cash-flow-guide-ebitda-cf-fcf-fcff/',
      summary:
        'A practical walk-through of the main cash flow measures and how to read them when you are tracking money moving through a business.',
    },
  ],

  'financial record keeping': [
    {
      title: 'ACCOUNTING BASICS: a Guide to (Almost) Everything',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=yYX4bvQSqbo',
      videoId: 'yYX4bvQSqbo',
      durationMinutes: 10,
      summary:
        'Walks the whole accounting cycle: identifying a transaction, writing a journal entry, posting it to the general ledger, adjusting, and producing the financial statements.',
    },
    {
      title: 'What is bookkeeping?',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bookkeeping/',
      summary:
        'The day-to-day work of recording financial transactions, and how it differs from accounting.',
    },
    {
      title: 'Apply Bookkeeping & Accounting for Financial Reporting',
      type: 'course',
      url: 'https://www.coursera.org/learn/bookkeeping',
      summary:
        'A structured course on recording transactions and turning those records into financial reports.',
    },
  ],

  'reconciliation': [
    {
      title: 'Easy Bank Reconciliation for Beginners Explained!',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=nM5kJB97O1c',
      videoId: 'nM5kJB97O1c',
      durationMinutes: 10,
      summary:
        'A full worked reconciliation in Excel \u2014 deposits in transit, outstanding cheques, bank charges and a recording error \u2014 then the journal entries that follow.',
    },
    {
      title: 'Bank reconciliation: definition and example',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bank-reconciliation/',
      summary:
        'The step-by-step procedure for comparing your records to a bank statement, plus a downloadable statement template.',
    },
    {
      title: 'Define the purpose of a bank reconciliation and prepare one',
      type: 'article',
      url: 'https://openstax.org/books/principles-financial-accounting/pages/8-6-define-the-purpose-of-a-bank-reconciliation-and-prepare-a-bank-reconciliation-and-its-associated-journal-entries',
      summary:
        'An academic treatment of why reconciliations exist as an internal control, the timing differences they absorb, and the resulting journal entries.',
    },
  ],

  'fraud awareness': [
    {
      title: 'Fraud Risk Management with Expert Trainer Mohamad Kaissi',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dO6HwQXbPNk',
      videoId: 'dO6HwQXbPNk',
      summary:
        'An ACFE trainer on how organisations build anti-fraud controls, and why general fraud awareness training is not enough on its own.',
    },
    {
      title: 'Fraud\u2019s hidden cost',
      type: 'article',
      url: 'https://www.acfe.com/fraud-resources/frauds-hidden-cost',
      summary:
        'A fraud awareness training package from the Association of Certified Fraud Examiners, covering common occupational fraud types and the warning signs to watch for.',
    },
    {
      title: 'Employee Fraud Awareness Training',
      type: 'course',
      url: 'https://www.acfe.com/training-events-and-products/employee-fraud-awareness-training',
      summary:
        'ACFE\u2019s structured programme for teaching staff to recognise and report fraud. Notes ACFE research that untrained organisations lose roughly twice as much.',
    },
  ],

  'excel': [
    {
      title: 'Microsoft Excel Tutorial for Beginners \u2014 Full Course',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
      videoId: 'Vl0H-qTclOg',
      summary:
        'A full freeCodeCamp course that builds six real projects while covering data entry, formulas, navigation and saving.',
    },
    {
      title: 'Excel help and learning',
      type: 'article',
      url: 'https://support.microsoft.com/en-us/excel',
      summary:
        'Microsoft\u2019s own Excel help centre: official documentation, tutorials and video training for every part of the product.',
    },
    {
      title: 'Basic Excel formulas for beginners',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/excel/basic-excel-formulas-beginners/',
      summary:
        'The handful of formulas that cover most everyday spreadsheet work, written up for someone new to Excel.',
    },
  ],

  'data analysis': [
    {
      title: 'Data Analysis with Python \u2014 Full Course for Beginners',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
      videoId: 'r-uOLxNrNk8',
      summary:
        'freeCodeCamp\u2019s walkthrough of the analysis workflow \u2014 reading data, cleaning and transforming it, then visualising the results.',
    },
    {
      title: 'Kaggle Learn',
      type: 'course',
      url: 'https://www.kaggle.com/learn',
      summary:
        'Short hands-on micro-courses in Python, pandas, data visualisation and machine learning, each runnable against real datasets.',
    },
    {
      title: 'Learn Data Science \u2014 Full Course for Beginners',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
      videoId: 'ua-CiDNNj30',
      summary:
        'A non-technical introduction to data science, with an overview of statistics and how exploratory analysis works.',
    },
  ],

  'financial analysis': [
    {
      title: 'How to Read Financial Statements: Beginner\u2019s Guide to Financial Analysis Part 1',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=JYLRI5Xtw2Q',
      videoId: 'JYLRI5Xtw2Q',
      durationMinutes: 9,
      summary:
        'A guided read of a real annual report: where to find the financial statements, and how to use them to judge a company\u2019s health.',
    },
    {
      title: 'Financial ratios: the definitive guide',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-ratios-definitive-guide/',
      summary:
        'The main liquidity, profitability, leverage and efficiency ratios, how each is calculated, and what each one tells you.',
    },
    {
      title: 'Principles of Finance',
      type: 'article',
      url: 'https://openstax.org/details/books/principles-managerial-finance',
      summary:
        'A free, complete finance textbook covering financial statement analysis, ratio analysis, time value of money and forecasting.',
    },
  ],

  'risk management': [
    {
      title: 'Risk management: overview, importance and processes',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/risk-management/',
      summary:
        'What risk management is, why organisations need it, and the typical identify\u2013assess\u2013treat\u2013monitor process.',
    },
    {
      title: 'Financial risk management books \u2014 overview and importance',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/financial-risk-management/',
      summary:
        'How financial risk differs from other risk categories, and recommended reading for going deeper.',
    },
  ],

  'digital payments': [
    {
      title: 'A guide to types of payment methods',
      type: 'article',
      url: 'https://stripe.com/guides/payment-methods',
      summary:
        'A clear breakdown of card, bank transfer, wallet and buy-now-pay-later payment methods and how each one settles.',
    },
    {
      title: 'Payment processing fees: overview, factors and types',
      type: 'article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/payment-processing/',
      summary:
        'How payment processing works and what drives the fees around it \u2014 useful when you are explaining costs to someone else.',
    },
    {
      title: 'General principles for international remittance services',
      type: 'article',
      url: 'https://www.bis.org/cpmi/publ/d76.htm',
      summary:
        'The BIS Committee on Payment and Settlement Systems\u2019 principles for sending money across borders: safety, speed, transparency and access.',
    },
  ],

  'communication': [
    {
      title: '5 ways to listen better',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=cSohjlYQI2A',
      videoId: 'cSohjlYQI2A',
      durationMinutes: 10,
      summary:
        'Julian Treasure on why careful listening has become rare, and the concrete things you can change to listen better.',
    },
    {
      title: 'Complete Communication Skills Course',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=A0BMyN3Eofk',
      videoId: 'A0BMyN3Eofk',
      summary:
        'A structured course covering verbal and non-verbal cues, body language, eye contact and listening.',
    },
    {
      title: 'Introduction to Communication Science',
      type: 'course',
      url: 'https://www.coursera.org/learn/communication',
      summary:
        'The study of how communication actually works \u2014 how messages are produced, transmitted and received, and where they break down.',
    },
  ],

  'problem solving': [
    {
      title: 'Effective Problem-Solving and Decision-Making',
      type: 'course',
      url: 'https://www.coursera.org/learn/problem-solving',
      summary:
        'A structured approach to breaking a problem down, generating and comparing options, and deciding.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      type: 'course',
      url: 'https://www.coursera.org/learn/career-foundations-toolkit',
      summary:
        'Transferable-skills modules for professional development, including problem solving, critical thinking and decision making.',
    },
  ],

  'attention to detail': [
    {
      title: 'The first secret of great design',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=9uOMectkCCs',
      videoId: '9uOMectkCCs',
      durationMinutes: 10,
      summary:
        'Tony Fadell on habituation and why training yourself to notice the small things is what separates careful work from careless work.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      type: 'course',
      url: 'https://www.coursera.org/learn/career-foundations-toolkit',
      summary:
        'Includes a module on attention to detail and technical accuracy \u2014 spotting inconsistencies and checking data before relying on it.',
    },
  ],
};

/** Catalogue skill names that currently have curated resources. */
export const curatedSkillNames: readonly string[] = Object.keys(CATALOGUE);

/**
 * Hostnames the curated catalogue links to, derived from the data itself.
 * Anything outside this set (and "YouTube") is rejected by the response
 * schema, so a malformed or unvetted resource can never leave the backend.
 */
export const curatedProviderHosts: ReadonlySet<string> = new Set(
  Object.values(CATALOGUE)
    .flat()
    .map((entry) => hostnameOf(entry.url))
    .filter((host): host is string => host !== null && host !== 'youtube.com' && host !== 'www.youtube.com'),
);

/** true when `provider` is the curated provider "YouTube" or a curated host. */
export function isAllowedProvider(provider: string): boolean {
  if (provider === 'YouTube') return true;
  return curatedProviderHosts.has(provider.toLowerCase());
}

/** The curated entries for a normalized skill name, filtered by requested types. */
export function curatedResourcesFor(skillName: string, types: readonly LearningResourceType[]): LearningResource[] {
  const key = skillName.trim().toLowerCase().replace(/\s+/g, ' ');
  if (key.length === 0) return [];
  const entries = CATALOGUE[key];
  if (entries === undefined) return [];
  const wanted = new Set<string>(types);
  return entries
    .filter((entry) => wanted.has(entry.type))
    .map(toLearningResource)
    .filter((resource): resource is LearningResource => resource !== null);
}

/** Maps one curated entry to the API resource shape; null when malformed. */
function toLearningResource(entry: CuratedEntry): LearningResource | null {
  const host = hostnameOf(entry.url);
  if (host === null || !isHttpsUrl(entry.url)) return null;

  if (entry.type === 'video') {
    const videoId = entry.videoId ?? parseYoutubeVideoId(entry.url);
    if (videoId === null || !isValidYoutubeVideoId(videoId)) return null;
    return {
      dedupeKey: `youtube:${videoId}`,
      type: 'video',
      provider: 'YouTube',
      title: entry.title,
      creator: { name: null, url: null },
      sourceUrl: entry.url,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      durationMinutes: entry.durationMinutes ?? null,
      summary: entry.summary,
      level: 'BEGINNER',
      isCurated: true,
      discoveredAt: null,
      publishedAt: null,
    };
  }

  return {
    dedupeKey: `curated:${entry.type}:${entry.url}`,
    type: entry.type,
    provider: host,
    title: entry.title,
    creator: { name: host, url: null },
    sourceUrl: entry.url,
    videoId: null,
    embedUrl: null,
    thumbnail: null,
    durationMinutes: null,
    summary: entry.summary,
    level: 'BEGINNER',
    isCurated: true,
    discoveredAt: null,
    publishedAt: null,
  };
}
