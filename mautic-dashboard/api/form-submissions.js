import { getFormSubmissionCount, getEmailStats } from "./_lib/mauticClient.js";
import { FORMS, FORM_EMAILS } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const rows = await Promise.all(
      FORMS.map(async (form) => {
        const submissions = await getFormSubmissionCount(form.id);
        const emailPair = FORM_EMAILS.find((fe) => fe.formId === form.id);

        let userEmail = null;
        let internalEmail = null;

        if (emailPair) {
          [userEmail, internalEmail] = await Promise.all([
            getEmailStats(emailPair.confirmationEmailId),
            getEmailStats(emailPair.internalEmailId),
          ]);
        }

        return {
          formId: form.id,
          formName: form.name,
          submissions,
          emailStatus: emailPair ? "sent" : "no-email-configured",
          userEmail: userEmail
            ? {
                sent: userEmail.sent,
                delivered: userEmail.delivered,
                opened: userEmail.opened,
                clicked: userEmail.clicked,
              }
            : null,
          internalEmail: internalEmail
            ? {
                sent: internalEmail.sent,
                delivered: internalEmail.delivered,
                opened: internalEmail.opened,
                clicked: internalEmail.clicked,
              }
            : null,
        };
      })
    );

    const totals = rows.reduce(
      (acc, r) => {
        acc.submissions += r.submissions;
        if (r.userEmail) {
          acc.userSent += r.userEmail.sent;
          acc.userDelivered += r.userEmail.delivered;
          acc.userOpened += r.userEmail.opened;
          acc.userClicked += r.userEmail.clicked;
        }
        if (r.internalEmail) {
          acc.internalSent += r.internalEmail.sent;
          acc.internalDelivered += r.internalEmail.delivered;
          acc.internalOpened += r.internalEmail.opened;
          acc.internalClicked += r.internalEmail.clicked;
        }
        return acc;
      },
      {
        submissions: 0,
        userSent: 0,
        userDelivered: 0,
        userOpened: 0,
        userClicked: 0,
        internalSent: 0,
        internalDelivered: 0,
        internalOpened: 0,
        internalClicked: 0,
      }
    );

    res.status(200).json({ forms: rows, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
