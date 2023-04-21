import React, { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'

import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'

import CompiledStats from '@/scripts/models/CompiledStats'

import { useTheme } from '@/providers/ThemeProvider';

import LoaderComponent from '@/components/LoaderComponent';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const backgroundImage = 'https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/gm/gfllgt2cu5ta1.png';

  const [data, setData] = useState<CompiledStats | undefined>(undefined);
  const theme = useTheme();
  
  // https://ultimatecourses.com/blog/using-async-await-inside-react-use-effect-hook
  useEffect(() => {
    console.log('Theme', theme);
    (async () => {
      const url = globalThis.environment.STATS_URL;
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
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
      </Head>
      <main className={`${styles.main} ${styles.background}`}>
        {
          data === undefined ?
          <LoaderComponent /> :
          (
          <div className={styles.description}>
            <pre>
              {JSON.stringify(data, null, '\t')}
            </pre>
          </div>
          )
        }
      </main>
    </>
  )
}
