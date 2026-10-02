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
 * - Every URL was checked to resolve before being added here.
 *
 * These are static, human-curated links. HerNext does not generate, rank or
 * personalise them; a skill simply either has entries or does not.
 */

export type LearningResourceProvider = 'YouTube' | 'Article' | 'Course';

export interface LearningResource {
  title: string;
  provider: LearningResourceProvider;
  /** Opens externally. YouTube entries are normal watch URLs, not embeds. */
  url: string;
  durationMinutes?: number;
  summary: string;
}

export const learningResources: Record<string, LearningResource[]> = {
  'customer service': [
    {
      title: 'The secret to great customer service',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=aKmp4CDdAVg',
      summary:
        'A customer service leader breaks down the "happy to help" framework: patience, understanding and respect as the three things that turn a difficult call around.',
    },
    {
      title: 'Customer service skills and techniques',
      provider: 'Article',
      url: 'https://www.zendesk.com/blog/customer-service-skills/',
      summary:
        'An overview of the core customer service skills, how to practise them, and how to measure whether they are working.',
    },
    {
      title: 'Customer Service: Adapting to Your Customers’ Cues',
      provider: 'Course',
      url: 'https://www.codecademy.com/learn/ext-courses/customer-service-adapting-to-your-customers-cues',
      summary:
        'Learn to read a customer’s mood and communication style, then adjust your support approach to the individual in front of you.',
    },
  ],

  'transaction processing': [
    {
      title: 'The General Ledger',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/general-ledger/',
      summary:
        'What a general ledger is, how transactions get posted into it, and why it is the record every other report is built from.',
    },
    {
      title: 'Understanding bank financial statements',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-statements-for-banks/',
      summary:
        'A guided read of a bank’s financial statements and the accounts behind them — useful for making sense of transaction activity on an account.',
    },
    {
      title: 'What is a deposit slip and how is it used?',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/wealth-management/deposit-slip/',
      summary:
        'How paper and digital deposit slips record payments into an account, and the part they play in proving a transaction happened.',
    },
  ],

  'cash management': [
    {
      title: 'Cash management: overview and importance',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/cash-management/',
      summary:
        'What cash management covers, why holding and deploying cash well matters, and the processes that support it.',
    },
    {
      title: 'Cash flow guide: EBITDA, FCF and FCFF',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/valuation/cash-flow-guide-ebitda-cf-fcf-fcff/',
      summary:
        'A practical walk-through of the main cash flow measures and how to read them when you are tracking money moving through a business.',
    },
  ],

  'financial record keeping': [
    {
      title: 'What is bookkeeping?',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bookkeeping/',
      summary:
        'The day-to-day work of recording financial transactions, and how it differs from accounting.',
    },
    {
      title: 'Apply Bookkeeping & Accounting for Financial Reporting',
      provider: 'Course',
      url: 'https://www.coursera.org/learn/bookkeeping',
      summary:
        'A structured course on recording transactions and turning those records into financial reports.',
    },
    {
      title: 'Accounting for Decision Making',
      provider: 'Course',
      url: 'https://www.coursera.org/learn/accounting',
      summary:
        'Learns to read accounting information and use it to make decisions, rather than just producing figures.',
    },
  ],

  'reconciliation': [
    {
      title: 'Bank reconciliation: definition and example',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/bank-reconciliation/',
      summary:
        'The step-by-step procedure for comparing your records to a bank statement, plus a downloadable statement template.',
    },
    {
      title: 'Define the purpose of a bank reconciliation and prepare one',
      provider: 'Article',
      url: 'https://openstax.org/books/principles-financial-accounting/pages/8-6-define-the-purpose-of-a-bank-reconciliation-and-prepare-a-bank-reconciliation-and-its-associated-journal-entries',
      summary:
        'An academic treatment of why reconciliations exist as an internal control, the timing differences they absorb, and the resulting journal entries.',
    },
  ],

  'fraud awareness': [
    {
      title: 'Fraud’s hidden cost',
      provider: 'Article',
      url: 'https://www.acfe.com/fraud-resources/frauds-hidden-cost',
      summary:
        'A fraud awareness training package from the Association of Certified Fraud Examiners, covering common occupational fraud types and the warning signs to watch for.',
    },
    {
      title: 'Employee Fraud Awareness Training',
      provider: 'Course',
      url: 'https://www.acfe.com/training-events-and-products/employee-fraud-awareness-training',
      summary:
        'ACFE’s structured programme for teaching staff to recognise and report fraud. Notes ACFE research that untrained organisations lose roughly twice as much.',
    },
  ],

  'excel': [
    {
      title: 'Microsoft Excel Tutorial for Beginners — Full Course',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
      summary:
        'A full freeCodeCamp course that builds six real projects while covering data entry, formulas, navigation and saving.',
    },
    {
      title: 'Excel help and learning',
      provider: 'Article',
      url: 'https://support.microsoft.com/en-us/excel',
      summary:
        'Microsoft’s own Excel help centre: official documentation, tutorials and video training for every part of the product.',
    },
    {
      title: 'Basic Excel formulas for beginners',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/excel/basic-excel-formulas-beginners/',
      summary:
        'The handful of formulas that cover most everyday spreadsheet work, written up for someone new to Excel.',
    },
  ],

  'data analysis': [
    {
      title: 'Data Analysis with Python — Full Course for Beginners',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
      summary:
        'freeCodeCamp’s walkthrough of the analysis workflow — reading data, cleaning and transforming it, then visualising the results.',
    },
    {
      title: 'Kaggle Learn',
      provider: 'Course',
      url: 'https://www.kaggle.com/learn',
      summary:
        'Short hands-on micro-courses in Python, pandas, data visualisation and machine learning, each runnable against real datasets.',
    },
    {
      title: 'Learn Data Science — Full Course for Beginners',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
      summary:
        'A non-technical introduction to data science, with an overview of statistics and how exploratory analysis works.',
    },
  ],

  'financial analysis': [
    {
      title: 'Financial ratios: the definitive guide',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/accounting/financial-ratios-definitive-guide/',
      summary:
        'The main liquidity, profitability, leverage and efficiency ratios, how each is calculated, and what each one tells you.',
    },
    {
      title: 'Principles of Finance',
      provider: 'Article',
      url: 'https://openstax.org/details/books/principles-managerial-finance',
      summary:
        'A free, complete finance textbook covering financial statement analysis, ratio analysis, time value of money and forecasting.',
    },
    {
      title: 'Free financial modelling guide',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/financial-modeling/free-financial-modeling-guide/',
      summary:
        'How to build a financial model in stages, from assumptions through to a three-statement output.',
    },
  ],

  'risk management': [
    {
      title: 'Risk management: overview, importance and processes',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/risk-management/',
      summary:
        'What risk management is, why organisations need it, and the typical identify–assess–treat–monitor process.',
    },
    {
      title: 'Financial risk management books — overview and importance',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/financial-risk-management/',
      summary:
        'How financial risk differs from other risk categories, and recommended reading for going deeper.',
    },
  ],

  'digital payments': [
    {
      title: 'A guide to types of payment methods',
      provider: 'Article',
      url: 'https://stripe.com/guides/payment-methods',
      summary:
        'A clear breakdown of card, bank transfer, wallet and buy-now-pay-later payment methods and how each one settles.',
    },
    {
      title: 'Payment processing fees: overview, factors and types',
      provider: 'Article',
      url: 'https://corporatefinanceinstitute.com/resources/finance/payment-processing/',
      summary:
        'How payment processing works and what drives the fees around it — useful when you are explaining costs to someone else.',
    },
    {
      title: 'General principles for international remittance services',
      provider: 'Article',
      url: 'https://www.bis.org/cpmi/publ/d76.htm',
      summary:
        'The BIS Committee on Payment and Settlement Systems’ principles for sending money across borders: safety, speed, transparency and access.',
    },
  ],

  'communication': [
    {
      title: 'Complete Communication Skills Course',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=A0BMyN3Eofk',
      summary:
        'A structured course covering verbal and non-verbal cues, body language, eye contact and listening.',
    },
    {
      title: '5 ways to listen better',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=cSohjlYQI2A',
      summary:
        'Julian Treasure on why careful listening has become rare, and the concrete things you can change to listen better.',
    },
    {
      title: 'Introduction to Communication Science',
      provider: 'Course',
      url: 'https://www.coursera.org/learn/communication',
      summary:
        'The study of how communication actually works — how messages are produced, transmitted and received, and where they break down.',
    },
  ],

  'problem solving': [
    {
      title: 'Effective Problem-Solving and Decision-Making',
      provider: 'Course',
      url: 'https://www.coursera.org/learn/problem-solving',
      summary:
        'A structured approach to breaking a problem down, generating and comparing options, and deciding.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      provider: 'Course',
      url: 'https://www.coursera.org/learn/career-foundations-toolkit',
      summary:
        'Transferable-skills modules for professional development, including problem solving, critical thinking and decision making.',
    },
  ],

  'attention to detail': [
    {
      title: 'The first secret of great design',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=9uOMectkCCs',
      summary:
        'Tony Fadell on habituation and why training yourself to notice the small things is what separates careful work from careless work.',
    },
    {
      title: 'Career Foundations: A Toolkit to Build Your Future',
      provider: 'Course',
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

/** Catalogue skill names that currently have curated resources. */
export const curatedSkillNames: readonly string[] = Object.keys(learningResources);