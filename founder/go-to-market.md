<!-- /founder:go-to-market · 2026-11-17 · input: MeterProof (project at C:\Users\baxmt\OneDrive\Desktop\MeterProof) -->

# MeterProof go-to-market plan

Assumption: launch date is Tuesday 12 January 2027, when December and January bills land and holidays are over. Move it if you need longer.
Assumption: the budget is $0 to $500 a month, about R0 to R9,000 at an estimated R18 to the dollar.
Assumption: launch metros are Johannesburg and eThekwini, as in `founder/pitch-deck.md` and `founder/fundraise-prep.md`.

## 1. Launch readiness check

**Is the MVP enough?** Yes. Logging, bill check, dispute PDF, tracker and payments are built. Before launch, only these must be done:
1. Live PayFast keys and `NEXT_PUBLIC_DEMO_MODE=false` (README, "Going live").
2. Your own SMTP sender in Supabase. The README warns the built-in sender allows only a few emails an hour, and every sign-in needs an email code.
3. Legal review of `/terms`, `/privacy` and the letter text.

**Enough users to reach?** Yes. Johannesburg has about 1.1 million accounts ([MyBroadband](https://mybroadband.co.za/news/government/636913-city-of-johannesburg-says-there-is-no-billing-system-collapse.html)) and eThekwini 924,585 ([IOL](https://iol.co.za/dailynews/news/2025-01-23-ethekwini-municipal-bill-services-migrating-to-digital/)). The 90-day target of 900 free accounts is under 0.05% of them.

**Biggest risk:** the sign-in email limit. If a residents' association talk sends 60 people to sign up in one evening and only a handful get their code, the launch fails silently. Fix item 2 first, then test 50 sign-ups in an hour.

## 2. Pre-launch (15 December 2026 to 11 January 2027)

**Where the audience already gathers**
- [JoburgCAN](https://joburgcan.org.za/): OUTA's Joburg Community Action Network, with affiliates across all seven city regions. It already publishes "[My bill is wrong, now what?](https://joburgcan.org.za/resources/take-action-my-bill-is-wrong-now-what/)" and runs a [webinar hub](https://joburgcan.org.za/webinar-hub/).
- [OUTA](https://www.outa.co.za/): writes about Joburg billing and customer debt.
- [r/southafrica](https://www.reddit.com/r/southafrica/): about 409,000 members; self-promotion is not banned, but disclose that you built it ([ReplyHey, checked 2026-08-19](https://www.replyhey.com/subreddits/southafrica)). Read the sidebar rules before each post.
- Suburb residents' associations and their WhatsApp groups. Reach them through JoburgCAN affiliates rather than joining groups uninvited.
- I could not confirm that r/johannesburg or r/durban exist and are active, so they are not listed. No eThekwini ratepayers' body could be confirmed either: ask councillors' offices in the first week.

**Posts before launch**
1. **r/southafrica, 5 January:** text post. "I worked out what an estimated Joburg electricity bill actually overcharged, using City Power's 2026/27 tariff. Here is the maths." Show one anonymised example from the bill check, disclose "I built a free tool that does this" in the last line, with no link in the title.
2. **LinkedIn, 7 January:** for landlords and managing agents. "eThekwini estimated 1 in 8 water readings in February 2026 ([IOL](https://iol.co.za/news/south-africa/kwazulu-natal/2026-04-14-councillors-criticise-ethekwinis-estimated-billing-system-as-ratepayer-frustration-grows/)). If you manage 20 units, that is about 2 to 3 wrong bills a month. Here is how to prove one." Post Tuesday or Wednesday morning.
3. **JoburgCAN, by 15 December:** offer a 10-minute segment for their next webinar: "Building evidence before the bill: logging your meter monthly." No pitch, the tool is the example.
4. **Local press, 8 January:** email the reporter who wrote [IOL's 29 October piece on Joburg billing complaints](https://iol.co.za/the-star/city-watch/2026-10-29-ratepayers-question-value-for-money-as-joburg-billing-complaints-persist/). Offer the free Quick Bill Check and one anonymised worked example.

**Waitlist: no.** The free tier is the waitlist. Its value grows with every monthly photo, so tell people to start logging now, before their next bad bill. A waitlist would delay the evidence they need.

**Assets**
- Landing page: run `/founder:landing-page`. The hero should be the Quick Bill Check, with the overcharge shown in rands next to the R79 price.
- Demo: a 60-second vertical phone recording. Meter photo, statement photo, overcharge in red, PDF letter. No voice-over; captions only, since most people watch muted on WhatsApp.
- Social proof before customers: give 20 free Dispute Packs to members of 2 associations in exchange for permission to quote the outcome. Ask each for one sentence and the rand credited, once resolved.

## 3. Launch day: 12 January 2027

Product Hunt and Hacker News are left out: their audiences are global builders, not South African households with a municipal account. The three that fit:

**Reddit (r/southafrica)**
- Text post, 07:00 SAST: "My January bill was estimated again, so I built a free tool that logs your meter and works out the overcharge in rands. Joburg, Durban, Cape Town, Tshwane, Ekurhuleni, Mangaung, Buffalo City."
- Body: what it does, what is free, what costs R79, and that it is not legal advice. One link, at the end.
- Reply to every comment within the hour. When someone posts their own bill problem, answer it fully without linking.

**WhatsApp and residents' association groups**
- The 60-second video, plus a 3-line message the chair forwards: the problem, the free check link, and the group code.
- Send through chairs, never cold into groups. Ask JoburgCAN which 3 affiliates had the most billing complaints in 2026.

**LinkedIn (Landlord plan)**
- Post at 08:00: a before-and-after of one estimated bill for a 10-unit building, with the Landlord price (R299 a month for 30 meters).
- Tag nobody you do not know. Send it directly to 20 managing agents and body corporate trustees in your network.

## 4. Post-launch growth (first 90 days)

**Channel ranking**

| # | Channel | CAC per paying customer | Time to results | First action this week |
|---|---|---|---|---|
| 1 | Residents' association talks with a group code | Estimate: R50 to R150 (petrol, printing, your time) | 1 to 2 weeks per talk | Email JoburgCAN offering the webinar segment |
| 2 | Answering billing questions on r/southafrica | Estimate: R0 cash, about 1 hour a day | 2 to 4 weeks | Search r/southafrica for "estimated bill" and answer the 5 newest posts |
| 3 | Local press tied to billing stories | Estimate: R0 cash | Unpredictable; days when it lands | Send the IOL reporter one worked example |
| 4 | Search content (section below) | Estimate: R0 cash | 2 to 4 months | Publish the Johannesburg dispute guide |
| 5 | Facebook ads to Joburg and Durban homeowners, sending people to the Quick Bill Check | Estimate: R150 to R400 | 1 week to measure | R3,000 test (section 6) |

**Content that matches what people search**
1. "How to dispute an estimated City Power bill (2026)": on the site, then answer Reddit threads with it.
2. "eThekwini estimated water reading: what to do next": site page, shared in Durban association groups.
3. "What to keep paying during a municipal billing dispute (Section 102)": the safe average payment explained, which JoburgCAN's guide also stresses.
4. "How to read and photograph your water and electricity meter": a 30-second video for WhatsApp, embedded in the site.
5. "Every line on a Johannesburg municipal statement, explained": built from the bill explainer, as a page and a LinkedIn carousel.

Turn each into one Reddit answer, one WhatsApp video or image, and one association newsletter paragraph.

**Communities to join**
- [JoburgCAN](https://joburgcan.org.za/)
- [OUTA](https://www.outa.co.za/)
- [r/southafrica](https://www.reddit.com/r/southafrica/)

**Partnerships**
1. **JoburgCAN and OUTA:** ask to link the free Quick Bill Check from their "[My bill is wrong, now what?](https://joburgcan.org.za/resources/take-action-my-bill-is-wrong-now-what/)" page. It already tells residents to keep records and reference numbers, which is what MeterProof does.
2. **Schindlers Attorneys:** they co-ran the OUTA billing dispute webinar ([Daily Maverick](https://www.dailymaverick.co.za/article/2024-02-01-how-to-effectively-dispute-and-rectify-municipal-billing-discrepancies-outa-and-schindlers-attorneys/)). Propose a referral both ways: they send small disputes to MeterProof, and MeterProof suggests a lawyer when a dispute passes the Public Protector stage or exceeds [an amount you choose].

**Growth tactic specific to MeterProof:** publish the recovered total every month. The app already shows a public rand total recovered across all users on the landing page. On the 1st of each month, send local press and JoburgCAN one line: "MeterProof users had R[X] credited back by the metros this month." It turns every resolved dispute into a press hook, and it is a figure no competitor can copy.

## 5. Launch metrics

| Metric | Day 30 | Day 60 | Day 90 | Tool | If below target |
|---|---|---|---|---|---|
| Free accounts | 200 | 500 | 900 | Supabase: count of `profiles` | Book 2 more association talks; repost the Reddit guide |
| Paying customers (pack or plan) | 15 | 40 | 75 | Supabase `payments`, PayFast dashboard | Check the bill-check-to-pack step; test the overcharge shown next to the price |
| Dispute letters sent (reference number logged) | 4 | 10 | 20 | Supabase `disputes` with `submitted_on` set | Call 5 pack buyers and ask what stopped them sending it |
| Disputes resolved with rand credited | 0 | 3 | 8 | Supabase `disputes.recovered_rand` | Follow up every open dispute at 21 business days; send the escalation letter |
| CAC per channel | Measured on 1 | Measured on 2 | Measured on 3 | A spreadsheet of spend and group codes | Drop the channel above R400 a paying customer |

The day-60 column matches the 8-week targets in `founder/fundraise-prep.md`. For the full setup, run `/founder:metrics-dashboard`.

## 6. Budget

**At R9,000 a month (the $500 top of the range):**
- R3,000: Facebook ads test, one creative per metro, sending people to the Quick Bill Check.
- R2,000: association talks (petrol, A5 flyers with the group code and a QR code).
- R2,000: boosting the best association or Reddit-derived post as a Facebook ad, once a winner is clear.
- R2,000: kept back for whatever wins in month 1.

**Free:** Reddit answers, JoburgCAN and OUTA, press, LinkedIn posts, search content, and the monthly recovered-total line.
**Worth paying for:** only ads that send people to the free Quick Bill Check, because it shows the overcharge before asking for money. Do not pay for app-install or brand-awareness ads.

**One spend under $200 (R3,000): the Facebook ads test.** Run two R1,500 campaigns for 14 days, one to Johannesburg homeowners and one to Durban homeowners, both sending people to the Quick Bill Check. It returns the one number the raise is missing, a measured CAC on a paid channel (`founder/fundraise-prep.md`, section 1). It also shows which metro converts better, so the next R6,000 goes to the right city.
