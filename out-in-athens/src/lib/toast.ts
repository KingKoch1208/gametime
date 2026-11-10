// Tiny global toast. Native alerts don't show in the hosted web preview, so in-app
// confirmations ("Thanks, we'll check this listing") go through here instead.
type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

export function onToast(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
