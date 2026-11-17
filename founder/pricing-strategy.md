<!-- /founder:pricing-strategy · 2026-11-17 · input: MeterProof (project at C:\Users\baxmt\OneDrive\Desktop\MeterProof) -->

# MeterProof pricing strategy

Assumption: prices are VAT-inclusive and MeterProof is not yet VAT registered (turnover under R1m).
Assumption: the buyer is a South African household or small landlord disputing an estimated municipal bill, as the README describes.
Assumption: the current prices in the code are the founder's pricing idea: Free (3 meters), Dispute Pack R79 once-off, Account Shield R39 a month (unlimited packs), Landlord R299 a month (30 meters).

**The current idea has one flaw that costs money.** Account Shield at R39 a month includes unlimited dispute packs, so anyone who needs one pack pays R39, downloads it and cancels. Nobody rational pays R79. The fix is below: bill Shield quarterly, so its cheapest entry (R129) costs more than one pack.

## 1. Pricing model analysis

| Model | Fit | Pros | Cons |
|---|---|---|---|
| Flat subscription | 3 | Predictable revenue for the tracker | Bill disputes are episodic: people subscribe for one fight and leave |
| Usage-based | 2 | Matches AI cost per bill read | Households hate metered bills, which is the problem MeterProof fights |
| Per-seat | 1 | None | One account holder per home; seats mean nothing here |
| Freemium | 5 | The monthly photo log only has value if people start before the bad bill arrives | AI reads on free users cost real money (see section 4) |
| Credits | 2 | Caps AI cost | Adds a currency to learn for a R79 purchase |
| One-time purchase | 4 | Matches the moment of pain: "this bill is wrong today" | No recurring revenue on its own |

**Recommendation: freemium logger, one-time pack, subscription for repeat fighters.** This is the current structure, which is right, because the free log builds the evidence and the pack is bought at the moment of anger. Only the Shield billing period and the free AI limit need to change.

## 2. Tier design

The Dispute Pack (R99 once-off) stays as an add-on that any free user can buy.

### Free: R0
- Up to 3 meters
- Unlimited timestamped meter photos
- Overcharge estimator for all 7 metros
- 2 AI reads a month (meter photo or bill scan)
- Bill explainer: 1 a month
- Upgrade trigger: the estimator shows an overcharge, and the next step (the PDF letter) is the paid pack.

### Account Shield: R129 a quarter (R43 a month) or R429 a year (R35.75 a month, 17% off)
- Everything in Free
- Unlimited dispute packs (PDF letter, photo evidence, tariff maths)
- Reference number and 21-business-day escalation tracker
- Escalation letters up to the Public Protector
- Unlimited AI reads and bill explanations
- Monthly reading reminder (.ics)
- Upgrade trigger: a second dispute within 12 months, or a dispute that reaches escalation. Quarterly billing is the gate, because R129 is above one R99 pack and the pack-then-cancel trick stops paying.

### Landlord: R299 a month or R2,990 a year (17% off, 2 months free)
- Everything in Shield
- Up to 30 meters with property labels
- One dispute tracker per property
- Upgrade trigger: more than 30 meters, or a managing agent or body corporate. Self-serve up to 30 meters; above that, sales-led with a quote, because portfolios that size also want a statement for each owner.

## 3. Competitive pricing context (checked 2026-11-17)

| Competitor | Price | What's included | MeterProof position |
|---|---|---|---|
| [Billdog](https://www.billdog.co.za/) | 15% success fee, nothing upfront | Done-for-you: analysis of 36 bills, letters under Section 102 of the Municipal Systems Act, case tracking | **Far below.** On a R3,000 recovery Billdog takes R450; MeterProof charges R99. The pitch: keep 100% of your refund if you send the letter yourself. |
| [AuditCheck](https://www.auditcheck.net/) | R1,500 residential synopsis, R2,500 commercial; audits and retainers quoted | Professional audit for owners, body corporates and attorneys | **Far below** for households. Landlord at R2,990 a year is above one residential synopsis, so it has to win on ongoing evidence, not on the one-off audit. |
| [Billing Assist](https://billingassist.co.za/) | R49 a month launch subscription (from the site's terms, via search; the pricing page did not load) | Bill analysis, water and electricity tracking, anomaly alerts | **Just below** at R43 a month, because MeterProof adds the dispute letter and escalation that Billing Assist's listing does not mention. |
## 4. Unit economics check

Sourced inputs:
- PayFast card fee: 3.2% plus R2, excluding VAT ([payfast.io/fees](https://payfast.io/fees)). With 15% VAT on the fee: R99 costs R5.95, R129 costs R7.05, R299 costs R13.30.
- Claude Opus 5.5 (the model in `lib/claude.ts`): $4 per million input tokens, $20 per million output tokens (Anthropic API price list, cached 2026-11-03).

Estimates:
- Estimate: one AI call is about 3,000 input tokens (one photo plus the prompt) and 1,500 output tokens (thinking plus JSON). That gives 3,000 × $4/1M = $0.012, plus 1,500 × $20/1M = $0.030, for $0.042. At an estimated R18 to the dollar, that is **R0.76 a call**.
- Estimate: an active Shield user makes 3 calls a month (1 meter read, 1 bill read, 1 explanation), so R2.30. A Landlord makes 50 calls a month (30 meter reads, 10 bill reads, 10 explanations), so R38.
- Estimate: fixed hosting at launch is Supabase Pro $25 plus Vercel Pro $20 plus an email sender $10, which is $55 or **about R1,000 a month**. The free tiers cost R0 until traffic forces the move.

| Tier | Revenue a month | Variable cost a month | Gross margin | Customers to cover R1,000 fixed |
|---|---|---|---|---|
| Free | R0 | R1.52 (2 capped AI reads) | n/a | n/a |
| Dispute Pack | R99 once | R5.95 PayFast + R2.30 AI = R8.25 | 92% | 11 packs a month |
| Shield | R43 | R2.35 PayFast + R2.30 AI + R1 infra = R5.65 | 87% | 27 subscribers |
| Landlord | R299 | R13.30 PayFast + R38 AI + R5 infra = R56.30 | 81% | 5 subscribers |

Without the 2-read cap, 1,000 free users each making 3 Opus calls cost about R2,300 a month and bring in nothing. Keep the cap until the free-to-pack conversion rate is known. Testing Claude Haiku 5.5 ($0.10 / $0.50) on meter reads could cut that cost by about 97%, if its accuracy on meter photos holds up. Measure that before switching.

Target blended ARPU (paying customers): **R90 a month**. Estimate: 40% buy one pack (R99), 50% hold Shield (R43), 10% hold Landlord (R299), which works out to R39.60 + R21.50 + R29.90 = R91.

## 5. Pricing psychology

- **Anchoring:** show the overcharge first. The bill check already computes it in rands, so put the pack price beside it ("You were billed R1,240 too much. The letter costs R99."). The price is then compared with the overcharge, not with free apps. Also show Billdog's model as a line: "Success-fee services keep 15%. You keep all of it."
- **Decoy:** the single pack is the decoy for Shield once someone has had a second bad bill. Next to the pack button, show "Shield: R129 for 3 months, every dispute included". The R30 gap is small enough that a repeat victim takes Shield.
- **Annual framing:** show the annual Shield as "R35.75 a month, billed R429 a year". For Landlord, use "2 months free", not "17% off", because months are easier to picture than a percentage.

## 6. Launch pricing vs. scale pricing

- **Launch price (first 90 days): keep the pack at R79 and Shield at R129 a quarter.** Without outcome data there is no proof yet that the letter recovers money, so a low pack price lowers the risk of the first purchase. Switch Shield to quarterly billing on day one, because the arbitrage costs money from the first sale.
- **Scale price: pack at R99, then R149.** Raise it to R99 at day 90. Raise it to R149 when the tracker shows the median recovered amount above R1,000 across at least 20 resolved disputes. At R149 the pack is still about 10% of a typical recovery, below Billdog's 15%.
- **Grandfathering:** founding Shield and Landlord subscribers keep their price for 12 months from signup, then move to the current price with 30 days' notice by email. Pack prices are not grandfathered, because each pack is a new purchase.
- **Price increase triggers:**
  1. Free-to-pack conversion above 8% for 2 months in a row: demand is not price-limited.
  2. 20 resolved disputes with a median recovery above R1,000: move the pack to R149.
  3. Shield churn under 10% a quarter: raise annual Shield to R499.
  4. Ten or more Landlord accounts at the 30-meter limit: add a 60-meter tier at R499 a month.
  5. Every 1 July tariff update: review prices, because the maths has to be re-verified then anyway.
