/**
 * HerNext-owned lesson notes, keyed by the same normalised skill names as
 * `learningResources.ts`.
 *
 * Purpose: the learning page should teach something on its own, not just hand
 * the participant a list of outbound links. These notes are written by us in
 * plain language so we can render a short lesson inline and use the curated
 * resources as supporting material.
 *
 * This is deliberately static copy, not generated content. It is not
 * personalised or ranked, and it never claims the participant has any skill
 * level. Where a skill has no entry, callers render an honest empty state
 * rather than inventing one.
 *
 * Keep entries short: `whatYouWillLearn` is 3–4 bullets, `keyTakeaways` is
 * 2–3 sentences. A long page is worse than a short one that gets read.
 */

export interface SkillLesson {
  /** One sentence on why this skill is worth the participant's time. */
  whyItMatters: string;
  /** The core ideas, written as outcomes rather than topics. */
  whatYouWillLearn: string[];
  /** The two or three things worth remembering after the resources. */
  keyTakeaways: string[];
  /**
   * A small, concrete thing to produce while learning. HerNext does not grade
   * it and it is not attached to any assessment — it exists so the skill
   * produces evidence rather than just a completed checkbox.
   */
  practicePrompt: string;
}

export const skillLessons: Record<string, SkillLesson> = {
  'customer service': {
    whyItMatters:
      'Every interaction with a customer decides whether they trust the business enough to stay. Service quality is the part of the job people actually remember.',
    whatYouWillLearn: [
      'Read the customer’s situation before you reach for a solution.',
      'De-escalate a tense conversation by naming the problem and confirming what they want.',
      'Write replies that are short, specific and clear about what happens next.',
    ],
    keyTakeaways: [
      'Most complaints are about feeling unheard, not about the underlying problem.',
      'Always end with an explicit next step and a time, so nobody has to chase you.',
    ],
    practicePrompt:
      'Write a reply to a customer who is angry about a delayed payment. Keep it under six sentences and include a specific next step.',
  },

  'transaction processing': {
    whyItMatters:
      'Transaction processing is the plumbing money moves through. If entries are wrong or duplicated, every figure the business reports later is wrong too.',
    whatYouWillLearn: [
      'Follow a transaction from capture to posting, including the audit trail.',
      'Check the details that cause most errors: amounts, dates, references and duplicates.',
      'Handle failed, reversed and corrected transactions without losing the original record.',
    ],
    keyTakeaways: [
      'Capture, validate, post, then reconcile — in that order, every time.',
      'Never overwrite an earlier record. Correct it with a visible, traceable entry.',
    ],
    practicePrompt:
      'List the five checks you would run on a new transaction before posting it, and say which one catches the most errors.',
  },

  'cash management': {
    whyItMatters:
      'Cash is the only thing that pays bills. Businesses fail while profitable because they ran out of it, so managing cash is a daily discipline, not a month-end task.',
    whatYouWillLearn: [
      'Read cash flow separately from profit, and why the two can tell opposite stories.',
      'Forecast inflows and outflows weekly so you can act before you are short.',
      'Set aside money for tax and known costs instead of treating the balance as free.',
    ],
    keyTakeaways: [
      'Profit is an opinion about the period; cash is a fact about the bank account.',
      'A rolling 13-week cash forecast is the single most useful early-warning tool.',
    ],
    practicePrompt:
      'Build a one-page weekly cash forecast for a month: expected money in, money out and the lowest balance the week it produces.',
  },

  'financial record keeping': {
    whyItMatters:
      'Records are how a business proves what happened and to whom. Without clean books, every other financial skill becomes guesswork.',
    whatYouWillLearn: [
      'Record transactions from source document to ledger without losing detail.',
      'Apply double-entry so debits always equal credits.',
      'Keep an audit trail that lets someone else retrace your work.',
    ],
    keyTakeaways: [
      'If you cannot explain a number back to its source document, you cannot defend it.',
      'Record it when it happens, not when you remember to.',
    ],
    practicePrompt:
      'Write the journal entry for a customer paying an invoice, then explain in one sentence why it balances.',
  },

  reconciliation: {
    whyItMatters:
      'Reconciliation is the control that proves your records match the bank’s. Skipping it is how errors and unauthorised activity stay hidden for months.',
    whatYouWillLearn: [
      'Match bank statement lines to your records and explain every difference.',
      'Handle timing differences: deposits in transit, outstanding payments, bank charges.',
      'Post the adjusting entries a reconciliation produces.',
    ],
    keyTakeaways: [
      'The reconciled balance must be the balance in your own ledger, not the statement.',
      'A difference you cannot explain is a finding, not a rounding issue.',
    ],
    practicePrompt:
      'Reconcile a small account with three lines and one bank charge, then journal the charge. State the reconciled balance.',
  },

  'fraud awareness': {
    whyItMatters:
      'Fraud usually starts with something small and ordinary — an invoice address change, a payment request from a familiar name. Knowing the patterns is what stops it.',
    whatYouWillLearn: [
      'Recognise the common types of fraud and where each one typically enters an organisation.',
      'Spot the behavioural red flags that accompany a fraudulent request.',
      'Know the control that exists to stop it, and escalate when something feels off.',
    ],
    keyTakeaways: [
      'Verify payment detail changes out of band, using a contact you already trust.',
      'Anyone can report a concern without being certain, and early reporting is never held against you.',
    ],
    practicePrompt:
      'Write the verification steps you would follow before releasing a payment to a supplier whose bank details changed by email.',
  },

  excel: {
    whyItMatters:
      'Spreadsheets are the default tool for finance and operations work. Being fast and reliable in Excel is often the difference between doing the work and still doing the work.',
    whatYouWillLearn: [
      'Structure data so formulas can work on it and errors are visible.',
      'Use lookups and conditional logic instead of manual, error-prone editing.',
      'Protect a working file: absolute references, validation and a clean sheet layout.',
    ],
    keyTakeaways: [
      'One table per sheet, headers on row 1, no merged cells inside data.',
      'If you are dragging a formula down hundreds of rows, the reference is probably wrong.',
    ],
    practicePrompt:
      'Build a sheet that takes a raw transaction list and returns the total per category using a lookup and a SUMIF.',
  },

  'data analysis': {
    whyItMatters:
      'Analysis turns a pile of numbers into a decision someone can act on. It is the skill that lets you contribute evidence instead of an opinion.',
    whatYouWillLearn: [
      'Ask a sharp question before touching the data.',
      'Clean and reshape data so a conclusion is not an artefact of a messy source.',
      'Summarise findings honestly, including what the data cannot tell you.',
    ],
    keyTakeaways: [
      'The question determines the analysis. “What should we do?” is not an analysis question.',
      'Report the limitation, not just the headline number.',
    ],
    practicePrompt:
      'Take any dataset you have access to and write the one question you would answer, the single chart you would build, and what decision it would inform.',
  },

  'financial analysis': {
    whyItMatters:
      'Financial analysis is how you judge whether a business, a budget or an investment is actually sound, instead of taking a headline figure at face value.',
    whatYouWillLearn: [
      'Read the three financial statements and how they link together.',
      'Calculate and interpret the core ratios: liquidity, profitability, leverage and efficiency.',
      'Compare periods and peers rather than judging a number in isolation.',
    ],
    keyTakeaways: [
      'A ratio means nothing without the comparison: last year, budget, or a competitor.',
      'Always check the notes. Accounting choices move reported numbers without changing reality.',
    ],
    practicePrompt:
      'Pick a company you know and find its current ratio and net margin. Write one sentence on what each number tells you and one on what it hides.',
  },

  'risk management': {
    whyItMatters:
      'Risk work is how organisations act before something goes wrong, rather than explaining it afterwards. It protects the business and the people in it.',
    whatYouWillLearn: [
      'Identify a risk, then rate it by likelihood and impact instead of by how worried you feel.',
      'Choose a treatment — reduce, avoid, transfer or accept — and justify it.',
      'Keep an owner and a review date on every risk so it does not quietly disappear.',
    ],
    keyTakeaways: [
      'A risk register nobody reviews is a list of worries, not a control.',
      'Accepting a risk is a decision. Write it down as one.',
    ],
    practicePrompt:
      'Write one risk register entry for a task on your roadmap: description, likelihood, impact, treatment, owner and review date.',
  },

  'digital payments': {
    whyItMatters:
      'Digital payments are how money now moves for most people and businesses. Understanding how they settle, and what they cost, is a practical financial skill.',
    whatYouWillLearn: [
      'Compare the payment methods people use — cards, bank transfer, wallets and mobile money.',
      'Follow a digital payment from authorisation to settlement.',
      'Account for fees, chargebacks and the delay before money is final.',
    ],
    keyTakeaways: [
      'Authorisation is not settlement. The money can still be reversed after approval.',
      'Fees and settlement timing belong in your cash forecast, not just your income figure.',
    ],
    practicePrompt:
      'Take one payment you made digitally and trace it: method, who processed it, when it settled and what it cost.',
  },

  communication: {
    whyItMatters:
      'Most work happens through other people, so how clearly you write and speak decides how fast things get done and how often they get misunderstood.',
    whatYouWillLearn: [
      'Structure a message so the point survives a skim.',
      'Adjust tone and channel to the reader and the stakes.',
      'Listen actively enough that you are solving their problem rather than your own.',
    ],
    keyTakeaways: [
      'Lead with the ask, then give the context.',
      'Ask one clarifying question instead of guessing. It is faster than a wrong answer.',
    ],
    practicePrompt:
      'Rewrite a work message so the request is in the first sentence and the whole thing fits in four.',
  },

  'problem solving': {
    whyItMatters:
      'Problem solving is the skill that makes every other skill useful. It is how you work through something with no instructions and no obvious answer.',
    whatYouWillLearn: [
      'Separate the symptom from the actual problem before solving anything.',
      'Generate options, then test them against defined criteria rather than preference.',
      'Decide with evidence, and record the reasoning so it can be reviewed.',
    ],
    keyTakeaways: [
      'Define the problem precisely and half the solution appears.',
      'Deciding is part of the job. Documenting why is what makes it defensible.',
    ],
    practicePrompt:
      'Take a problem you are stuck on and write it as a single sentence, list three possible causes, and note what evidence would confirm each one.',
  },

  'attention to detail': {
    whyItMatters:
      'Most serious mistakes in financial and operational work are small ones that nobody checked. Detail discipline is a control, and it is a hireable skill.',
    whatYouWillLearn: [
      'Use a checklist or a second pass so nothing depends on remembering.',
      'Spot inconsistencies between numbers, dates, names and totals.',
      'Verify against the source rather than trusting a copy or a summary.',
    ],
    keyTakeaways: [
      'Most errors are caught by comparing, not by looking harder.',
      'When a deadline compresses, the check step is the first thing to protect.',
    ],
    practicePrompt:
      'Take a document you produced and list five checks you should run before submitting it. Then run them.',
  },
};

/**
 * Looks up HerNext lesson notes for a catalogue skill name.
 *
 * Returns `null` when the name is unknown, blank, or a custom skill so callers
 * can render an honest "no lesson yet" state instead of borrowing another
 * skill's content.
 */
export function getSkillLesson(skillName: string | null | undefined): SkillLesson | null {
  if (typeof skillName !== 'string') return null;
  const key = skillName.trim().toLowerCase();
  if (!key) return null;
  return skillLessons[key] ?? null;
}

/** Catalogue skill names that currently have HerNext lesson notes. */
export const lessonSkillNames: readonly string[] = Object.keys(skillLessons);