/**
 * metricDefinitions.js
 * ------------------------------------------------------------------
 * What each bounce / DNC number on the dashboard means. Used by the
 * card tooltips and the "Bounced vs DNC" panel so the wording is the
 * same everywhere. Keep these in line with the calculations in
 * api/_lib/mauticClient.js (getEmailStats, getDncCount, getDncBreakdown).
 * ------------------------------------------------------------------
 */
import { PRIMARY_DASHBOARD_EMAIL_ID } from "./mauticMapping.js";

export const METRICS = {
  bouncedEmails: {
    label: "BOUNCED EMAILS",
    info:
      `How many times email #${PRIMARY_DASHBOARD_EMAIL_ID} bounced (couldn't be delivered). ` +
      "Mautic sometimes records the same bounce twice, and we count it the same way Mautic " +
      "does, so the numbers match. The same person can be counted more than once, so this " +
      "is not the number of people.",
  },
  bouncedContacts: {
    label: "BOUNCED CONTACTS",
    info:
      "People with the Sign_Up tag that Mautic stopped emailing because an email to them " +
      "bounced. Each person is counted once.",
  },
  hardBounced: {
    label: "HARD-BOUNCED CONTACTS",
    info:
      "Bounced people whose email address doesn't work at all, for example the mailbox or " +
      "the domain doesn't exist.",
  },
  softBounced: {
    label: "SOFT-BOUNCED CONTACTS",
    info:
      "Bounced people whose email couldn't be delivered for a temporary reason, like a full " +
      "mailbox. The mail server tried 5 times, then gave up.",
  },
  dncContacts: {
    label: "DNC CONTACTS",
    info:
      "People with the Sign_Up tag that Mautic will no longer email. This happens when their " +
      "email bounces, they unsubscribe, or someone blocks them manually.",
  },
  bounceRate: {
    label: "BOUNCE RATE",
    info: `Out of all the times email #${PRIMARY_DASHBOARD_EMAIL_ID} was sent, the percentage that bounced.`,
  },
};
