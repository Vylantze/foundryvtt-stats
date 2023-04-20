import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'

import CompiledStats from '@/scripts/models/CompiledStats'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const url = globalThis.environment.STATS_URL;

  const [data, setData] = useState<CompiledStats | undefined>(undefined);
  
  // https://ultimatecourses.com/blog/using-async-await-inside-react-use-effect-hook
  useEffect(() => {
    (async () => {
      const response = await globalThis.xhr.get<CompiledStats>(url);
      console.log('Response', response);
      if (response === null) return;
      setData(response);
    })().catch(console.error);
  }, [])

  return (
    <>
      <Head>
        <title>FoundryVTT Stats</title>
        <meta name="description" content="Stats for FoundryVTT" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <pre>
            {JSON.stringify(data, null, '\t')}
          </pre>
        </div>
      </main>
    </>
  )
}
