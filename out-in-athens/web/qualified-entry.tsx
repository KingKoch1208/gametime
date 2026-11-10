// Web-only entry (swapped in by metro.config.js for the web build).
// The shareable web preview runs inside a sandboxed frame whose URL we don't
// control, so the router always starts at "/" instead of reading the page URL.
import { ExpoRoot } from 'expo-router';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ctx } = require('expo-router/_ctx');

export function App() {
  return <ExpoRoot context={ctx} location="/" />;
}
