import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import Environment from '@/environment'
import XHR from '@/scripts/xhr'

declare global {
  var environment: typeof Environment
  var xhr: XHR
}
globalThis.environment = Environment;
globalThis.xhr = new XHR();

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
