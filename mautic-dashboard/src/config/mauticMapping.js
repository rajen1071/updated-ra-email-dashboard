/**
 * mauticMapping.js
 * ------------------------------------------------------------------
 * Single source of truth for every Mautic ID / tag / name-pattern this
 * dashboard depends on. This file is imported by the Vercel serverless
 * functions in /api. If your Mautic setup changes (new email created,
 * new form added, tag renamed), update it here — nowhere else.
 * ------------------------------------------------------------------
 */

// Tag used to count "Total Contacts" on the overview page
export const TOTAL_CONTACTS_TAG = "Sign_Up";

// The single email whose Sent/Delivered/Opened/Clicked numbers power
// the top summary cards + the funnel + the trend chart on the main
// Dashboard page.
export const PRIMARY_DASHBOARD_EMAIL_ID = 77; // Gold Member Onboarding

// Forms that count towards "Form Submissions"
export const FORMS = [
  { id: 6, name: "Sign Up" },
  { id: 10, name: "Chomp Show Request Benefit" },
  { id: 11, name: "Free Template" },
  { id: 12, name: "Wait-list" },
  { id: 13, name: "Job Posting" },
  { id: 14, name: "Job Applied" },
  { id: 15, name: "Contact Us" },
];

// Confirmation email (sent to the person who submitted) + internal
// notification email (sent to the RA team) for each form that has one.
// Forms not listed here (e.g. Sign Up) don't have a separate pair.
export const FORM_EMAILS = [
  { formId: 10, formName: "Chomp Show Request Benefit", confirmationEmailId: 115, internalEmailId: 116 },
  { formId: 13, formName: "Job Posting", confirmationEmailId: 121, internalEmailId: 122 },
  { formId: 14, formName: "Job Applied", confirmationEmailId: 123, internalEmailId: 124 },
  { formId: 15, formName: "Contact Us", confirmationEmailId: 128, internalEmailId: 129 },
];

// "Email By Category" — each category maps to one Mautic email ID
export const CATEGORY_EMAILS = [
  { category: "Sign Up Email", emailId: 77, tag: "Sign_Up" },
  { category: "Follow Up Email", emailId: 113, tag: "follow_up" },
  { category: "News", emailId: 78, tag: "interest_news" },
  { category: "Chomp Show", emailId: 79, tag: "interest_chomp_show" },
  { category: "Jobs", emailId: 80, tag: "interest_jobs" },
  { category: "Resources", emailId: 81, tag: "interest_resources" },
  { category: "Restaurant Pulse", emailId: 82, tag: "interest_ra_pulse" },
  { category: "Blogs", emailId: 84, tag: "interest_blogs" },
];

// Nurture sequence — 14 emails, each with an A/B variant pair.
// IDs for step 1 and step 14 were explicitly confirmed. IDs for steps
// 2–13 follow the same "A then B = next ID" pattern found in the
// source report (e.g. 87/88, 89/90 ...). Double check these against
// Mautic before going live — if any pair looks off, fix it here only.
export const NURTURE_EMAILS = [
  { step: 1, name: "Welcome Email", variantA: 85, variantB: 86 },
  { step: 2, name: "Start Exploring Your Membership Email", variantA: 87, variantB: 88 },
  { step: 3, name: "Industry News Email", variantA: 89, variantB: 90 },
  { step: 4, name: "Industry Trends & Leadership Insights", variantA: 91, variantB: 92 },
  { step: 5, name: "Operator Spotlight", variantA: 93, variantB: 94 },
  { step: 6, name: "Labor & Compliance Education", variantA: 95, variantB: 96 },
  { step: 7, name: "Operational Improvement & Efficiency", variantA: 97, variantB: 98 },
  { step: 8, name: "Webinar & Educational Session", variantA: 99, variantB: 100 },
  { step: 9, name: "Industry Modernization & Strategic Thinking", variantA: 101, variantB: 102 },
  { step: 10, name: "Strategic Evaluation & Planning", variantA: 103, variantB: 104 },
  { step: 11, name: "Leadership, Planning & Long-Term Growth", variantA: 105, variantB: 106 },
  { step: 12, name: "Transformation & Success Stories", variantA: 107, variantB: 108 },
  { step: 13, name: "Industry Leadership & Community Impact", variantA: 109, variantB: 110 },
  { step: 14, name: "Future of Hospitality", variantA: 111, variantB: 112 },
];

// Newsletter / Blog — these are NOT fixed IDs. A new email is created
// every week, so the backend searches Mautic emails by name instead.
export const NEWSLETTER_NAME_CONTAINS = "Restaurant Association Newsletter";
export const BLOG_NAME_CONTAINS = "Blogs | Blog - 2026";

// Interest tags shown on "Email By Category" / used for segmenting
// contacts by what they clicked on the website.
export const INTEREST_TAGS = [
  { category: "News", tag: "interest_news" },
  { category: "Jobs", tag: "interest_jobs" },
  { category: "Chomp Show", tag: "interest_chomp_show" },
  { category: "Chomp Video", tag: "interest_chomp_video" },
  { category: "RA Pulse", tag: "interest_ra_pulse" },
  { category: "Academy", tag: "interest_academy" },
  { category: "Events", tag: "interest_events" },
  { category: "Resources", tag: "interest_resources" },
  { category: "Templates", tag: "interest_templates" },
  { category: "Calculators", tag: "interest_calculators" },
  { category: "Benefits", tag: "interest_benefits" },
  { category: "Contact Us", tag: "intent_contact" },
];
