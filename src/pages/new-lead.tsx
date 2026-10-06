import * as React from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { PRIORITIES, SOURCES, findDuplicates, type Priority, type Source } from '@/data';
import { useStore } from '@/store';
import { go } from '@/router';

const blank = { name: '', company: '', email: '', phone: '', location: '', requirement: '', value: '', source: 'Manual Entry' as Source, priority: 'Warm' as Priority };

/** Manual lead entry with live duplicate detection (phone / email / company). */
export function NewLeadDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { addLead, peers } = useStore();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState(blank);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const dups = findDuplicates({ id: '', phone: f.phone, email: f.email, company: f.company }, peers);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setF(blank); }}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus /> New lead</Button>}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>New lead</DialogTitle><DialogDescription>Manual entry. Lead lands in the inbox as New.</DialogDescription></DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const lead = await addLead({ ...f, value: Number(f.value) || 0 });
            if (!lead) return;
            toast.success('Lead created', `${lead.id} is in the Lead Inbox.`);
            setOpen(false); setF(blank); go('lead', lead.id);
          }}
        >
          {dups.length > 0 && (
            <Alert variant="warning" title="Possible duplicate lead found">
              Matches {dups.slice(0, 2).map((d) => <button key={d.id} type="button" className="mx-1 font-medium text-primary hover:underline" onClick={() => { setOpen(false); go('lead', d.id); }}>{d.id} ({d.name})</button>)}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required><Input required value={f.name} onChange={set('name')} placeholder="Rahul Patil" /></Field>
            <Field label="Company"><Input value={f.company} onChange={set('company')} placeholder="ABC Industries Pvt. Ltd." /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={set('phone')} placeholder="+91 98220 41533" /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={set('email')} placeholder="name@company.com" /></Field>
            <Field label="Location"><Input value={f.location} onChange={set('location')} placeholder="Nashik" /></Field>
            <Field label="Estimated value (₹)"><Input inputMode="numeric" value={f.value} onChange={set('value')} placeholder="250000" /></Field>
            <Field label="Source">
              <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v as Source })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Requirement"><Input value={f.requirement} onChange={set('requirement')} placeholder="ERP Software" /></Field>
          <DialogFooter><Button type="submit">Create lead</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
