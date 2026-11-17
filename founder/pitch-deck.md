<!-- /founder:pitch-deck · 2026-11-17 · input: MeterProof (project at C:\Users\baxmt\OneDrive\Desktop\MeterProof); sent ahead; R1m pre-seed; pre-launch, no traction; solo founder -->

# MeterProof pitch deck (sent ahead, 12 slides)

Assumption: the deck is read without you in the room, so slides carry full sentences and there are no speaker notes.
Assumption: the founder name comes from the repository's git author; surname and background are placeholders.
Assumption: market figures cover the two metros with published account counts (Johannesburg, eThekwini); the other five are placeholders.

## Slide 1: Title
**Headline:** MeterProof helps South African households prove an estimated municipal bill wrong and get the money back.
- MeterProof: timestamped meter photos, the overcharge in rands, and a formal dispute letter, from R79.
- Bongumusa [surname], founder.
- Built for Johannesburg, eThekwini, Tshwane, Cape Town, Ekurhuleni, Mangaung and Buffalo City.

**Visual:** The phone screen showing a meter photo with its database timestamp beside a red rand figure: "Overbilled R1,240" [example from the app's own calculation].

## Slide 2: Problem
**Headline:** Metros bill hundreds of thousands of households on guessed readings, and the household has to prove the guess wrong.
- In February 2026, eThekwini estimated 64,147 of 524,760 water meter readings, about 1 in 8 ([IOL, April 2026](https://iol.co.za/news/south-africa/kwazulu-natal/2026-04-14-councillors-criticise-ethekwinis-estimated-billing-system-as-ratepayer-frustration-grows/)).
- After City Power took over Johannesburg electricity billing in July 2025, it credited R136m to 86 overcharged customers, with 116 cases still open ([News24, March 2026](https://www.news24.com/southafrica/news/city-power-billing-changes-leave-joburg-residents-with-sky-high-bills-20260310-0582)).
- Today a household phones the call centre, queues at a walk-in centre, or pays a service 15% of the refund ([Billdog](https://www.billdog.co.za/)). Without dated evidence of the real reading, the municipality's figure stands.

**Visual:** One estimated bill line ("Reading: E 48 210") next to the real meter photo showing 47 980.

## Slide 3: Solution
**Headline:** MeterProof turns a monthly phone photo into evidence a municipality has to answer.
- **Evidence:** each meter photo gets a database timestamp that cannot be edited or deleted.
- **Proof in rands:** the bill check applies the metro's official 2026/27 tariff to the gap between billed and actual readings.
- **Action:** a dispute letter citing the evidence, a safe average payment while it runs, and an escalation tracker up to the Public Protector.

**Visual:** Three screenshots in a row: reading log, bill check result, first page of the PDF letter.

## Slide 4: Product
**Headline:** A household goes from an estimated bill to a sent dispute letter in about 10 minutes.
1. Photograph the meter each month (free, 2 automatic reads every 30 days).
2. Snap the statement: the app reads the billed figures from the photo or PDF.
3. See the overcharge in rands and the fair amount to keep paying.
4. Download the dispute pack (R79) and log the reference number; after 21 business days the tracker drafts the escalation.

**The unexpected moment:** the bill explainer translates every line on the statement, and flags charges worth querying that the user did not know to look for.

**Before / after:** Before, a phone call and "your reading is correct". After, a dated photo, the tariff maths and a letter that sets out exactly what must be corrected.

**Visual:** The four steps as a horizontal flow with one screenshot each. [Time a real user from bill to letter; replace "about 10 minutes"]

## Slide 5: Market size
**Headline:** Two metros alone hold over 2 million billed accounts, worth about R2.2bn a year at MeterProof's prices.
- Johannesburg: about 1.1 million accounts ([MyBroadband](https://mybroadband.co.za/news/government/636913-city-of-johannesburg-says-there-is-no-billing-system-collapse.html)). eThekwini: 924,585 active accounts, October 2024 ([IOL](https://iol.co.za/dailynews/news/2025-01-23-ethekwini-municipal-bill-services-migrating-to-digital/)).
- **TAM** (estimate): [accounts in all 7 metros] × R1,080 a year. The two sourced metros alone: 2.02m × R1,080 = **R2.2bn**.
- **SAM** (estimate): postpaid residential accounts with smartphones in those metros: [share of accounts that are postpaid residential] × 2.02m × R1,080.
- **SOM** (estimate): 1% of the two metros' accounts paying within 3 years: 20,200 × R1,080 = **R21.8m a year**.
- R1,080 is the target blended revenue per paying customer (R90 a month) from `founder/pricing-strategy.md`, an estimate.
- **Why now:** municipal electricity prices rose 9.01% on 1 July 2026 ([Engineering News](https://www.engineeringnews.co.za/article/nersa-approves-higher-electricity-hikes-for-202627-after-r547bn-error-2026-03-10)), so every wrong kWh costs more. And AI can now read a statement photo for under R1, which makes do-it-yourself disputes cheap enough to sell for R79.

**Visual:** Nested circles: R2.2bn, SAM [placeholder], R21.8m.

## Slide 6: Traction
**Headline:** MeterProof is fully built and pre-launch: zero users and zero revenue today.
- Built and working: 7 metros, all 2026/27 tariff tables except Mangaung's checked against the municipality's own documents, PayFast payments, AI bill and meter reading, dispute PDF and escalation tracker.
- Demand evidence, not yet ours: the eThekwini, Johannesburg and Tshwane coverage above, where Tshwane still had 4,813 accounts on estimated billing in June 2026 ([Rekord](https://www.citizen.co.za/rekord/news-headlines/local-news/2026/06/19/thousands-still-receive-estimated-bills-as-e-tshwane-disputes-continue/)).
- [Waitlist sign-ups or Quick Bill Check uses before launch, if any]

**Visual:** No growth chart yet. Show the product's live Quick Bill Check result on the landing page, and replace it with weekly sign-ups once launched.

## Slide 7: Business model
**Headline:** Free logging builds the evidence; customers pay when a bill goes wrong, at gross margins above 80%.
- Free: meter log, overcharge estimate. Dispute Pack: R79 once-off (R99 after launch). Account Shield: R129 a quarter. Landlord: R299 a month for 30 meters.
- Gross margin (estimates from `founder/pricing-strategy.md`): pack 92%, Shield 87%, Landlord 81%, after PayFast fees and AI costs.
- LTV (estimate): Shield R43 a month × 87% margin × 30 months (assumes 10% churn a quarter) = **R1,122**. CAC: [first paid-channel CAC]. LTV/CAC: [after first test].
- 24-month projection (estimate): 7,500 free users by month 12 and 30,000 by month 24, 8% paying, R90 a month each. That is **R54,000 MRR at month 12 and R216,000 MRR at month 24** (R2.6m annual run rate).

**Visual:** Bar chart of projected MRR by quarter, labelled "estimate" with the assumptions under it.

## Slide 8: Competition
**Headline:** MeterProof is the only option that collects evidence before the bad bill and costs a flat R79 instead of a share of the refund.
- **2x2:** X axis, when evidence is collected (after the bill to every month before it). Y axis, cost to the household (a share of the refund or a large fee, to a small flat fee).
- [Billdog](https://www.billdog.co.za/): after the bill, 15% success fee. [AuditCheck](https://www.auditcheck.net/): after the bill, R1,500 residential synopsis. [Billing Assist](https://billingassist.co.za/): monthly tracking, R49 a month (launch price), no dispute letter found. MeterProof: monthly evidence, R79 a dispute.
- **Defensible because:** months of locked, timestamped readings cannot be recreated by a competitor after the dispute starts, and a household that has logged a year of readings will not move them.
- **Nobody else:** database-clock timestamps that cannot be edited, plus tariff maths verified per metro every 1 July.

**Visual:** The 2x2 with MeterProof alone in the top-right (monthly evidence, small flat fee).

## Slide 9: Go-to-market
**Headline:** MeterProof will launch through residents' associations and community groups in the metros where billing is already front-page news.
- **Main channel:** residents' associations, ratepayer groups and suburb WhatsApp and Facebook groups in Johannesburg and eThekwini. Offer each group a free talk and a group code. CAC: [measured after first 5 groups].
- **Hook:** the free Quick Bill Check on the landing page, which shows a household its likely overcharge without signing up.
- **Earned media:** each billing story (R136m City Power credits, eThekwini estimates) is a chance to offer journalists the free check.
- **Working now:** nothing yet; pre-launch.
- **What the money changes:** paid tests on Facebook and Google for "estimated bill" searches, and a part-time community lead running 20 association sessions a quarter.

**Visual:** A map of the 7 metros, with Johannesburg and eThekwini highlighted as launch metros.

## Slide 10: Team
**Headline:** A solo founder who built the whole product, payments and verified tariff engine before raising a rand.
- Bongumusa [surname]: designed and built MeterProof alone, including PayFast billing, Supabase evidence storage and the tariff engine for 7 metros.
- [Relevant background: years in software, any billing, utilities, legal or consumer-rights experience]
- [Personal link to the problem, e.g. a bill you fought yourself, with the amount]
- **This round pays for:** a part-time community and support lead to run association sessions and answer disputes, and a legal review of the letters, terms and privacy policy.

**Visual:** Founder photo, with three one-line achievements beside it.

## Slide 11: The ask
**Headline:** R1m pre-seed takes MeterProof to 1,000 paying customers and 50 documented refunds in 15 months.
- **Raising:** R1m pre-seed. Instrument: [SAFE or convertible note, cap].
- **Use of funds:** founder salary for 12 months, 40% (R400,000). Customer acquisition and association sessions, 30% (R300,000). Part-time community and support lead, 15% (R150,000). Hosting, AI costs, legal review and tariff upkeep, 15% (R150,000).
- **Milestones:** 1,000 paying customers; 50 resolved disputes with the rand recovered recorded; CAC measured on 2 channels; Nelson Mandela Bay added once its tariff is published.
- **Next round:** seed in about 15 to 18 months, on recovery data and paying-customer growth.

**Visual:** Pie chart of the four buckets, with the three milestones on a timeline beneath it.

## Slide 12: Closing
**Headline:** No South African household should pay for water or electricity it never used.
- Vision: every metro bill checked against a real reading before it is paid.
- Contact: Bongumusa [surname], [email], [phone], [site URL].
- The number to remember: **1 in 8** eThekwini water readings in February 2026 were estimates.

**Visual:** The "Overbilled" figure from slide 1, now marked "Credited".

## Appendix

1. **Unit economics detail:** the cost table from `founder/pricing-strategy.md`: PayFast 3.2% + R2, Claude costs per call, hosting about R1,000 a month (estimate), break-even at 27 Shield subscribers.
2. **Tariff engine:** sources and verification status for each metro's 2026/27 tables, and the 1 July update process.
3. **Evidence integrity:** how readings get a database timestamp and cannot be edited or deleted, and what the dispute PDF contains.
4. **Competitor breakdown:** Billdog, AuditCheck and Billing Assist side by side, prices checked 17 November 2026.
5. **Legal position:** MeterProof provides administrative templates and calculations, not legal advice; [summary of the legal review once done].

## Numbers to find

- Your surname, background, personal story, email, phone and site URL (slides 1, 10, 12)
- Account counts for Tshwane, Cape Town, Ekurhuleni, Mangaung and Buffalo City (slide 5 TAM)
- Share of metro accounts that are postpaid residential (slide 5 SAM)
- Measured time from bill to letter (slide 4)
- Waitlist or Quick Bill Check uses before launch (slide 6)
- CAC from the first association sessions and paid test, and LTV/CAC (slides 7, 9)
- Instrument and valuation cap (slide 11)
- Results of the legal review (appendix 5)

## Checklist

- Every headline states a takeaway: yes.
- One idea per slide: yes. Market size and why now share slide 5 because why now explains the market's timing; split them if slide 5 reads crowded.
- Under 30 words of body text: not applied, because this deck is sent ahead and needs fuller text.
- Story order: problem (2), solution (3, 4), proof (5, 6, 7), opportunity (8, 9), team (10), ask (11): yes.
