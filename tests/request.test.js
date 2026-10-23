// The request form's endpoint: checks the visitor's details, ignores bots, emails Felipe once.
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

let sent = [];
globalThis.fetch = async (url, init) => {
  sent.push({ url, init, body: JSON.parse(init.body) });
  return new Response("{}", { status: 200 });
};
process.env.RESEND_API_KEY = "test-key";
const handler = require("../api/request.js");

beforeEach(() => {
  sent = [];
});

function call(body, method = "POST") {
  return new Promise((done) => {
    const res = {
      code: 200,
      status(c) {
        this.code = c;
        return this;
      },
      json(d) {
        done({ code: this.code, data: d });
      },
    };
    handler({ method, body }, res);
  });
}

const good = {
  name: "Ana Cruz",
  email: "Ana@Firm.ph",
  phone: "0917 000 0000",
  occasion: "Wedding",
  date: "2026-12-12",
  venue: "Tagaytay",
  summary: "Kiosk Bar, 1 day, 150 guests",
};

test("a request needs a name, a real email and the event", () => {
  assert.deepEqual(handler.clean({ ...good, name: " " }), {
    error: "Write your name.",
  });
  assert.ok(handler.clean({ ...good, email: "ana" }).error);
  assert.ok(handler.clean({ ...good, summary: "" }).error);
  assert.equal(handler.clean(good).email, "ana@firm.ph");
});

test("a good request is emailed to Felipe, with the visitor as reply-to", async () => {
  const r = await call(good);
  assert.equal(r.code, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "https://api.resend.com/emails");
  assert.deepEqual(sent[0].body.to, ["felipe@bolero.ph"]);
  assert.equal(sent[0].body.reply_to, "ana@firm.ph");
  assert.match(sent[0].body.subject, /Wedding · 2026-12-12 · Ana Cruz/);
  assert.match(sent[0].body.text, /Mobile: 0917 000 0000\n/);
  assert.ok(sent[0].init.headers["Idempotency-Key"]);
});

test("the same request gets the same idempotency key", async () => {
  await call(good);
  await call(good);
  assert.equal(
    sent[0].init.headers["Idempotency-Key"],
    sent[1].init.headers["Idempotency-Key"],
  );
});

test("bad input and bots send nothing", async () => {
  assert.equal((await call({ ...good, email: "x" })).code, 400);
  assert.equal((await call({ ...good, website: "spam.example" })).code, 200);
  assert.equal((await call(good, "GET")).code, 405);
  assert.equal(sent.length, 0);
});
