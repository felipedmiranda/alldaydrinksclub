// Event requests from the website, emailed to Felipe through Resend (https://resend.com).
// Vercel settings → Environment Variables:
//   RESEND_API_KEY  the key from Resend (required)
//   REQUEST_TO      who receives requests (default felipe@bolero.ph)
//   REQUEST_FROM    the sender; until malabar.ph is verified in Resend keep the default,
//                   which only delivers to the email address of the Resend account itself.
const crypto = require("node:crypto");

const TO = process.env.REQUEST_TO || "felipe@bolero.ph";
const FROM =
  process.env.REQUEST_FROM || "All Day Drinks Club <onboarding@resend.dev>";

const text = (v, max) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

// What the visitor sent, checked; or the message to show them.
function clean(input) {
  const r = {
    name: text(input.name, 120),
    email: text(input.email, 200).toLowerCase(),
    phone: text(input.phone, 40),
    occasion: text(input.occasion, 40) || "Event",
    date: text(input.date, 40),
    venue: text(input.venue, 200),
    summary: text(input.summary, 3000),
  };
  if (!r.name) return { error: "Write your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))
    return { error: "Write an email we can reply to." };
  if (!r.summary) return { error: "Build your event first." };
  return r;
}

function email(r) {
  const lines = [
    `New event request from the website`,
    ``,
    `Name: ${r.name}`,
    `Email: ${r.email}`,
    r.phone ? `Mobile: ${r.phone}` : null,
    `Occasion: ${r.occasion}`,
    r.date ? `Date: ${r.date}` : null,
    r.venue ? `Venue: ${r.venue}` : null,
    ``,
    r.summary,
    ``,
    `Reply to this email to answer ${r.name}.`,
  ].filter((l) => l !== null);
  return {
    from: FROM,
    to: [TO],
    reply_to: r.email,
    subject: `Event request · ${r.occasion}${r.date ? " · " + r.date : ""} · ${r.name}`,
    text: lines.join("\n"),
  };
}

async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Use POST." });
  const input =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  // A filled hidden field means a bot: answer as if it worked and send nothing.
  if (text(input.website, 200)) return res.status(200).json({ ok: true });
  const r = clean(input);
  if (r.error) return res.status(400).json({ error: r.error });
  if (!process.env.RESEND_API_KEY)
    return res
      .status(503)
      .json({
        error:
          "Requests are not switched on yet. Please email felipe@bolero.ph.",
      });
  const body = email(r);
  // The same request sent twice (a double tap, a retry) is emailed once.
  const key = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!sent || !sent.ok)
    return res
      .status(502)
      .json({
        error: "The request did not go through. Please email felipe@bolero.ph.",
      });
  return res.status(200).json({ ok: true });
}

module.exports = handler;
module.exports.clean = clean;
module.exports.email = email;
