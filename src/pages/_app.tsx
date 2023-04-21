import '@/styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import type { AppProps } from 'next/app'

import ThemeProvider from '@/providers/ThemeProvider'

import Environment from '@/environment'
import XHR from '@/scripts/xhr'

declare global {
  var environment: typeof Environment
  var xhr: XHR
}
globalThis.environment = Environment;
globalThis.xhr = new XHR();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
