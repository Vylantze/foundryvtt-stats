import React, { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'

import { formatDate } from '@/scripts/utils';
import CompiledStats from '@/scripts/models/CompiledStats'

import Head from 'next/head'
import { Inter } from 'next/font/google'

import CollapsibleComponent from '@/components/CollapsibleComponent';
import LoaderComponent from '@/components/LoaderComponent';
import TableComponent from '@/components/TableComponent';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const backgroundImage = 'https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/gm/gfllgt2cu5ta1.png';

  const [data, setData] = useState<CompiledStats | undefined>(undefined);
  
  // https://ultimatecourses.com/blog/using-async-await-inside-react-use-effect-hook
  useEffect(() => {
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
        <title>Campaign Stats</title>
        <meta name="description" content="Did you roll a 20 or a 1?" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
      </Head>
      <main className={`${styles.main} ${styles.background}`} style={{ backgroundImage: 'url("https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/modules/pf2e-beginner-box/assets/artwork-vignettes/view-of-otari.webp")' }}>
        {
          data === undefined ?
          <LoaderComponent /> :
          (
          <div className={styles.content}>
            <div className={styles.date}>Last updated: {formatDate(data.lastUpdated, 'asTime')}</div>
            <CollapsibleComponent
              title={(<h1>Total</h1>)}
            >
              <TableComponent stats={data.overall} />
            </CollapsibleComponent>
            <CollapsibleComponent
              title={(<h1>Last Session</h1>)}
            >
              <TableComponent stats={data.lastSession} />
            </CollapsibleComponent>
          </div>
          )
        }
      </main>
    </>
  )
}
