import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { getFormSubmissions, getFormName } from "./_lib/mauticClient.js";
import { FORMS } from "../src/config/mauticMapping.js";

async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const formId = req.query.formId;
    if (!formId) {
      res.status(400).json({ error: "Missing formId query param" });
      return;
    }

    // Prefer the name we already have mapped locally; fall back to Mautic.
    const known = FORMS.find((f) => String(f.id) === String(formId));
    const formName = known ? known.name : await getFormName(formId);

    const submissions = await getFormSubmissions(formId, range);

    res.status(200).json({ formId, formName, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
