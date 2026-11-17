import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms and refunds" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and refunds">
      <p>These terms apply when you use MeterProof, operated by {OPERATOR.name}. By using the service you agree to them.</p>

      <h2>What MeterProof is</h2>
      <p>
        MeterProof provides administrative templates and billing calculations, not legal advice. It helps you record meter readings, compare them
        with a municipal statement, and prepare a dispute letter. It does not act for you, lodge the dispute for you, or guarantee any outcome
        from your municipality.
      </p>

      <h2>Calculations and tariffs</h2>
      <p>
        Amounts are estimates based on published residential tariffs and the figures you enter. Tariffs that could not be confirmed from the municipality&rsquo;s own documents are marked indicative. Fixed
        charges, rebates and special tariffs on your account are not modelled. Always check the result against your own statement before relying on
        it.
      </p>

      <h2>What you must do</h2>
      <ul>
        <li>Enter readings truthfully and upload only photographs of your own meter.</li>
        <li>Keep paying the amounts on your account that are not in dispute.</li>
        <li>Check the letter before you send it. You are its author and sender.</li>
      </ul>

      <h2>Prices</h2>
      <ul>
        <li>Logging readings and estimating overcharges is free. A free account also gets 2 automatic photo or bill reads and 1 bill explanation every 30 days.</li>
        <li>Dispute Pack: R79 once-off for one bill check, including VAT where applicable.</li>
        <li>Account Shield: R129 a quarter, debited every 3 months until cancelled. Includes unlimited dispute packs and unlimited automatic reads.</li>
        <li>Landlord: R299 a month, debited monthly until cancelled. Everything in Account Shield, for up to 30 meters.</li>
      </ul>
      <p>Without the Landlord plan an account can hold up to 3 meters.</p>
      <p>Payments are processed by PayFast. We do not store card or bank details.</p>

      <h2>Cancelling Account Shield or Landlord</h2>
      <p>
        Cancel at any time through PayFast or your bank. Access continues until the end of the period already paid for. We do not refund part of
        a billing period.
      </p>

      <h2>Refunds</h2>
      <p>
        If a Dispute Pack you paid for cannot be generated or downloaded because of a fault on our side, write to {OPERATOR.email} within 30 days
        and we will fix it or refund you in full. Because a pack is a digital document delivered immediately, we do not otherwise refund a pack
        once it has been downloaded. Nothing here limits rights you have under the Consumer Protection Act or the Electronic Communications and
        Transactions Act.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we are not liable for losses arising from your use of the calculations or letters, including disconnection,
        interest or penalties charged by a municipality. Our total liability to you is limited to what you paid us in the previous 12 months.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the law of South Africa.</p>

      <h2>Contact</h2>
      <p>Questions and complaints: {OPERATOR.email}.</p>
    </LegalPage>
  );
}
