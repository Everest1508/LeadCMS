import * as React from 'react';

/** Hash router: `#/lead/L-1001?tab=verify` → ['lead', 'L-1001', 'verify']. Keeps back/forward working with zero deps. */
const parse = (): [string, string | undefined, string | undefined] => {
  const [path = '', q = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [name = 'dashboard', id] = path.split('/');
  return [name || 'dashboard', id, new URLSearchParams(q).get('tab') ?? undefined];
};
const subscribe = (cb: () => void) => { addEventListener('hashchange', cb); return () => removeEventListener('hashchange', cb); };
const snap = () => location.hash;

export function useRoute() {
  React.useSyncExternalStore(subscribe, snap);
  return parse();
}
export const go = (name: string, id?: string, tab?: string) => {
  location.hash = `/${name}${id ? `/${id}` : ''}${tab ? `?tab=${tab}` : ''}`;
};
