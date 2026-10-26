import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { getBouncedContacts } from "./_lib/mauticClient.js";
import { TOTAL_CONTACTS_TAG } from "../src/config/mauticMapping.js";

const PAGE_SIZE = 50;

// One page of bounced Sign_Up contacts. ?cursor= comes from the previous
// page's nextCursor. Totals per type are on /api/deliverability.
async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const type = ["hard", "soft"].includes(req.query.type) ? req.query.type : "all";
    const cursor = Math.max(0, parseInt(req.query.cursor, 10) || 0);

    const result = await getBouncedContacts({
      tag: TOTAL_CONTACTS_TAG,
      range,
      type,
      cursor,
      pageSize: PAGE_SIZE,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
