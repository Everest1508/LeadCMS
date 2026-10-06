import * as React from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USERS } from '@/data';
import { useStore } from '@/store';
import { go } from '@/router';

const STEPS = ['Capture', 'Centralize', 'Verify', 'Assign', 'Follow up', 'Convert', 'Analyze'];

export default function Login() {
  const { login } = useStore();
  const [who, setWho] = React.useState('Vikram Joshi');
  const [pw, setPw] = React.useState('demo1234');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const user = USERS.find((u) => u.name === who)!;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="dark relative hidden flex-col justify-between bg-[#1b1c1f] p-10 text-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-primary font-bold text-primary-foreground">B</span>
          <span className="grid leading-tight"><span className="font-bold tracking-[0.14em]">BEFORTH</span><span className="text-xs text-muted-foreground">CRM · Sales Suite</span></span>
        </div>
        <div className="grid gap-6">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Every lead, verified and moving toward Won.</h1>
          <p className="max-w-md text-muted-foreground">One inbox for Website, Instagram, Facebook, LinkedIn and WhatsApp leads. Verify, assign, follow up and track conversion in one place.</p>
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => <li key={s} className="rounded-full border px-3 py-1 text-xs text-muted-foreground"><span className="mr-1.5 text-primary">{i + 1}</span>{s}</li>)}
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">Prototype · demo data. Demo password: demo1234.</p>
      </div>
      <div className="grid place-items-center bg-muted/40 p-6">
        <Card className="w-full max-w-sm p-6">
          <div className="mb-6 grid gap-1">
            <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
            <p className="text-[13px] text-muted-foreground">Pick a role to explore the prototype.</p>
          </div>
          <form className="grid gap-4" onSubmit={async (e) => {
              e.preventDefault(); setLoading(true); setError('');
              try { await login(who.split(' ')[0]!.toLowerCase(), pw); go('dashboard'); }
              catch (err) { setError((err as Error).message); setLoading(false); }
            }}>
            {error && <Alert variant="danger" title={error} />}
            <Field label="Demo user">
              <Select value={who} onValueChange={setWho}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{USERS.map((u) => <SelectItem key={u.name} value={u.name}>{u.name} · {u.role}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Email"><Input leftIcon={<Mail />} value={user.email} readOnly /></Field>
            <Field label="Password"><Input leftIcon={<Lock />} type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
            <Button type="submit" loading={loading} className="w-full">Sign in as {user.role}</Button>
          </form>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />Role-based access: salespeople see only their assigned leads; admins also configure lead sources.</p>
        </Card>
      </div>
    </div>
  );
}
