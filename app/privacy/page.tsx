import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        MeterProof is operated by {OPERATOR.name}, the responsible party under the Protection of Personal Information Act 4 of 2013 (POPIA). This
        page explains what we collect, why, and what you can do about it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your email address, used to sign you in.</li>
        <li>Your name and postal address, if you enter them for a dispute letter.</li>
        <li>Your municipal account numbers and meter numbers.</li>
        <li>The meter readings, notes and photographs you log, with the time each was logged.</li>
        <li>The statement figures you enter, the resulting calculations, and dispute reference numbers.</li>
        <li>A record of payments: the product, amount, date and PayFast reference. We never see or store card or bank details.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>
        Only to provide the service you asked for: keeping your evidence timeline, calculating overcharges, producing your dispute pack, tracking
        your dispute, and taking payment. We do not sell your information or use it for advertising.
      </p>

      <h2>Who processes it for us</h2>
      <ul>
        <li>Supabase stores the database and your photographs.</li>
        <li>PayFast processes payments.</li>
        <li>
          Anthropic (Claude), in the United States, reads a statement photo or PDF if you upload one on the Check bill screen (to fill in
          the figures or explain the charges), and reads the digits on a meter photo when you log a reading, to catch typing mistakes.
          Only the answer comes back; Anthropic does not keep the file for MeterProof.
        </li>
        <li>Our hosting provider serves the website.</li>
      </ul>
      <p>
        These providers may store or process information outside South Africa. Where they do, we rely on agreements that require protection
        comparable to POPIA.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Until you delete it. You can delete a meter, a bill check or your whole account at any time from the Account screen, and the related
        photographs are removed with them. We keep payment records for as long as tax law requires.
      </p>

      <h2>Local mode</h2>
      <p>If you use MeterProof without signing in, everything is stored in your own browser and is never sent to us.</p>

      <h2>Your rights</h2>
      <p>
        You may ask us for a copy of your information, ask us to correct or delete it, or object to how it is used. Write to {OPERATOR.email}. If you
        are not satisfied with our answer, you may complain to the Information Regulator of South Africa.
      </p>

      <h2>Security</h2>
      <p>
        Access to your records is restricted to your own account by database rules, photographs are kept in private storage, and connections are
        encrypted. No system is perfectly secure; if a breach affects you, we will tell you and the Information Regulator.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes in a way that matters, we will say so on this page and update the date above.</p>
    </LegalPage>
  );
}
