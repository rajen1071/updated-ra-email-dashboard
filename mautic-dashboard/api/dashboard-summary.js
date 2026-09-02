import { getEmailStats, countContactsByTag, getFormSubmissionCount, getDncCount } from "./_lib/mauticClient.js";
import { PRIMARY_DASHBOARD_EMAIL_ID, TOTAL_CONTACTS_TAG, FORMS } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const [emailStats, totalContacts, dnc, formCounts] = await Promise.all([
      getEmailStats(PRIMARY_DASHBOARD_EMAIL_ID),
      countContactsByTag(TOTAL_CONTACTS_TAG),
      getDncCount(),
      Promise.all(FORMS.map((f) => getFormSubmissionCount(f.id))),
    ]);

    const totalFormSubmissions = formCounts.reduce((sum, c) => sum + c, 0);

    res.status(200).json({
      totalContacts,
      formSubmissions: totalFormSubmissions,
      emailsSent: emailStats.sent,
      delivered: emailStats.delivered,
      opened: emailStats.opened,
      clicked: emailStats.clicked,
      bounced: emailStats.bounced,
      dnc,
      deliveryRate: emailStats.sent ? ((emailStats.delivered / emailStats.sent) * 100).toFixed(2) : "0",
      openRate: emailStats.sent ? ((emailStats.opened / emailStats.sent) * 100).toFixed(1) : "0",
      clickRate: emailStats.sent ? ((emailStats.clicked / emailStats.sent) * 100).toFixed(1) : "0",
      bounceRate: emailStats.sent ? ((emailStats.bounced / emailStats.sent) * 100).toFixed(2) : "0",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
