import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import type { Webhook } from '@/store';

export async function copy(text: string, what = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast.success(what); } catch { toast.error('Copy failed', 'Select the text and copy it manually.'); }
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{label ?? 'Code'}</span>
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => { copy(code); setDone(true); setTimeout(() => setDone(false), 1500); }}>
          {done ? <Check className="size-3" /> : <Copy className="size-3" />}{done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">{code}</pre>
    </div>
  );
}

export const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="relative grid gap-2 pb-6 pl-9 last:pb-0">
    <span className="absolute left-0 top-0 grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{n}</span>
    <h4 className="text-[13px] font-semibold leading-6">{title}</h4>
    <div className="grid gap-2 text-[13px] text-muted-foreground [&_b]:font-medium [&_b]:text-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground">{children}</div>
  </li>
);

const Fields = ({ rows }: { rows: [string, string, string][] }) => (
  <table className="w-full text-xs">
    <tbody className="divide-y rounded-lg border">
      {rows.map(([k, req, d]) => (
        <tr key={k}><td className="px-3 py-1.5 font-mono text-foreground">{k}</td><td className="px-2">{req === 'req' ? <Badge variant="danger">required</Badge> : <span className="text-muted-foreground">optional</span>}</td><td className="px-3 py-1.5 text-muted-foreground">{d}</td></tr>
      ))}
    </tbody>
  </table>
);

/** Plain-text brief a non-technical admin can paste to their web developer. */
export function developerBrief(hook: Webhook, url: string) {
  if (hook.kind === 'website') return `Please send our website's enquiry form to the CRM.\n\nURL (POST): ${url}\nFields: name (required), phone or email (required), company, location, requirement, campaign\nFormat: JSON or normal form post\n\nTest:\ncurl -X POST '${url}' -H 'Content-Type: application/json' -d '{"name":"Test","phone":"9876543210"}'`;
  if (hook.kind === 'meta') return `Meta Lead Ads webhook\nCallback URL: ${url}\nVerify token: ${hook.secret}\nSubscribe the Page to the "leadgen" field.`;
  return `Google Ads lead form webhook\nWebhook URL: ${url}\nKey: ${hook.secret}`;
}

/** Simple step-by-step setup for one webhook, with its real URL filled in. */
export function Guide({ hook, base }: { hook: Webhook; base: string }) {
  const url = `${base.replace(/\/$/, '')}${hook.path}`;
  const brief = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-[13px]">
      <span className="flex-1 text-muted-foreground">Not a developer? Send everything below to the person who manages your {hook.kind === 'website' ? 'website' : 'ad account'}.</span>
      <button className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary" onClick={() => copy(developerBrief(hook, url), 'Instructions copied')}>Copy instructions</button>
    </div>
  );

  if (hook.kind === 'website') {
    const form = `<form id="crm-lead">
  <input name="name" placeholder="Your name" required>
  <input name="phone" placeholder="Phone">
  <input name="email" type="email" placeholder="Email">
  <input name="requirement" placeholder="What do you need?">
  <input name="hp" style="display:none" tabindex="-1" autocomplete="off">
  <button>Send enquiry</button>
</form>
<script>
document.getElementById('crm-lead').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await fetch('${url}', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
  });
  alert(r.ok ? 'Thanks, we will call you soon.' : 'Something went wrong, please try again.');
  if (r.ok) e.target.reset();
});
</script>`;
    return (
      <div className="grid gap-5">
        {brief}
        <ol>
          <Step n={1} title="Copy this link">
            <p>It is the address where your website sends each enquiry. Keep it private.</p>
            <CodeBlock label="Link" code={url} />
          </Step>
          <Step n={2} title="Put it on your website">
            <p><b>Easiest:</b> paste this form into your page where you want the enquiry form. It already knows where to send leads.</p>
            <CodeBlock label="Paste into your page (HTML)" code={form} />
            <p><b>Already have a form?</b> (WordPress, Elementor, Wix, Webflow…) Look for a setting called <b>Webhook</b> or <b>Send to URL</b> in your form tool and paste the link there.</p>
          </Step>
          <Step n={3} title="Send a test">
            <p>Click <b>Send test lead</b> on the webhook card. A new lead appears in the Lead Inbox within seconds. If it does, you are done.</p>
          </Step>
        </ol>
        <details className="rounded-lg border p-3 text-[13px]">
          <summary className="cursor-pointer font-medium">Which form fields are used?</summary>
          <div className="mt-3"><Fields rows={[['name', 'req', 'Contact name'], ['phone', '', 'Phone (phone or email is needed)'], ['email', '', 'Email'], ['company', '', 'Company'], ['location', '', 'City'], ['requirement', '', 'What they need'], ['campaign', '', `Which campaign${hook.campaign ? `, default "${hook.campaign}"` : ''}`]]} /></div>
        </details>
      </div>
    );
  }

  if (hook.kind === 'meta') {
    return (
      <div className="grid gap-5">
        <Alert variant="info" title="Easier way">Use the <b>Connect Meta Ads</b> button at the top of this page. It does all of this for you. Use the steps below only if you cannot connect directly.</Alert>
        {brief}
        <ol>
          <Step n={1} title="Open your Meta app"><p>Go to <b>developers.facebook.com → My Apps</b> → your app → <b>Webhooks</b> → choose <b>Page</b>.</p></Step>
          <Step n={2} title="Paste these two values">
            <CodeBlock label="Callback URL" code={url} />
            <CodeBlock label="Verify token" code={hook.secret} />
            <p>Click <b>Verify and save</b>. Then subscribe to <code>leadgen</code>.</p>
          </Step>
          <Step n={3} title="Allow the CRM to read the lead details">
            <p>Meta only tells us a lead arrived. To read the name and phone the server needs a Page access token.</p>
            {hook.metaConfigured ? <Alert variant="success" title="The server already has it." /> : <Alert variant="warning" title="Not set yet">Ask your developer to set <code>META_PAGE_TOKEN</code> on the server.</Alert>}
          </Step>
          <Step n={4} title="Send a test"><p>Click <b>Send test lead</b>, or use Meta's <b>Lead Ads Testing Tool</b>. The lead appears in the inbox.</p></Step>
        </ol>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <Alert variant="info" title="Easier way">Use the <b>Connect Google Ads</b> button at the top of this page. Use the steps below only if you cannot connect directly.</Alert>
      {brief}
      <ol>
        <Step n={1} title="Open your lead form in Google Ads"><p><b>Assets → Lead forms</b> (or edit the form on your campaign), then find <b>Webhook integration</b>.</p></Step>
        <Step n={2} title="Paste these two values">
          <CodeBlock label="Webhook URL" code={url} />
          <CodeBlock label="Key" code={hook.secret} />
        </Step>
        <Step n={3} title="Send a test">
          <p>Click <b>Send test data</b> in Google Ads, then save. You can also click <b>Send test lead</b> on the webhook card. The lead appears in the inbox.</p>
          <p>Tip: include name, phone and email questions in your form so the lead is filled in.</p>
        </Step>
      </ol>
    </div>
  );
}

/** Developer-side setup (done once by whoever deploys the CRM). */
export function PlatformSetup({ platform, redirect }: { platform: 'meta' | 'google'; redirect: string }) {
  if (platform === 'meta') {
    return (
      <ol>
        <Step n={1} title="Create a Meta app">
          <p>Go to <b>developers.facebook.com → My Apps → Create app</b>, choose the <b>Business</b> type, and connect it to your Meta Business portfolio. Add the <b>Facebook Login</b> (or <b>Facebook Login for Business</b>) and <b>Webhooks</b> products.</p>
        </Step>
        <Step n={2} title="Register the redirect address">
          <p>Facebook Login → Settings → <b>Valid OAuth Redirect URIs</b>:</p>
          <CodeBlock label="Redirect URI" code={redirect} />
          <p>Also set the <b>Deauthorize callback URL</b> to <code>{redirect.replace(/\/connections\/meta\/callback$/, '/meta/deauthorize')}</code>.</p>
        </Step>
        <Step n={3} title="Webhooks (instant leads)">
          <p>Webhooks → <b>Page</b> → subscribe to the <code>leadgen</code> field. Callback URL <code>{redirect.replace(/\/connections\/meta\/callback$/, '/meta/webhook')}</code> and a verify token of your choice (same value as <code>META_VERIFY_TOKEN</code>).</p>
        </Step>
        <Step n={4} title="Server settings">
          <CodeBlock label="Environment" code={'META_APP_ID=…\nMETA_APP_SECRET=…\nMETA_VERIFY_TOKEN=…\nMETA_GRAPH_VERSION=v25.0   # current version from Meta\'s changelog\nPUBLIC_BASE_URL=https://crm.yourcompany.com\nCRM_ENCRYPTION_KEY=<Fernet key>'} />
        </Step>
        <Step n={5} title="Permissions and review">
          <p>While the app is in <b>Development mode</b>, only people with a role on the app can connect (add your own account as Admin or Tester). For real customers you need <b>Business Verification</b>, <b>App Review</b> with Advanced Access for <code>leads_retrieval</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_metadata</code>, <code>ads_read</code> and <code>business_management</code>, then switch the app to <b>Live</b>.</p>
        </Step>
      </ol>
    );
  }
  return (
    <ol>
      <Step n={1} title="Create a Google Cloud project">
        <p>At <b>console.cloud.google.com</b> create a project and enable the <b>Google Ads API</b>.</p>
      </Step>
      <Step n={2} title="Configure the OAuth consent screen">
        <p>APIs &amp; Services → <b>OAuth consent screen</b> (Google Auth Platform). Choose <b>External</b>, fill in the app name, support email and your privacy-policy URL, and add the scope <code>https://www.googleapis.com/auth/adwords</code>. While the app is in <b>Testing</b>, only listed test users can connect and refresh tokens expire after 7 days.</p>
      </Step>
      <Step n={3} title="Create OAuth credentials">
        <p>Credentials → Create → <b>OAuth client ID</b> → Web application. Authorised redirect URI:</p>
        <CodeBlock label="Redirect URI" code={redirect} />
      </Step>
      <Step n={4} title="Get a developer token">
        <p>Sign in to a Google Ads <b>manager account</b> → Tools → <b>API Center</b> and apply. A new token only works on test accounts until Google approves <b>Basic access</b> (needed for real customers).</p>
      </Step>
      <Step n={5} title="Server settings">
        <CodeBlock label="Environment" code={'GOOGLE_CLIENT_ID=…\nGOOGLE_CLIENT_SECRET=…\nGOOGLE_DEVELOPER_TOKEN=…\nGOOGLE_LOGIN_CUSTOMER_ID=   # manager id, only if you use one\nPUBLIC_BASE_URL=https://crm.yourcompany.com\nCRM_ENCRYPTION_KEY=<Fernet key>'} />
      </Step>
      <Step n={6} title="Before real customers">
        <p>Google must <b>verify your OAuth app</b> (the <code>adwords</code> scope is sensitive): brand verification, privacy policy, a demo video. Then publish the consent screen to <b>Production</b>.</p>
      </Step>
    </ol>
  );
}
