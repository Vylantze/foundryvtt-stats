import React, { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'

import { formatDate } from '@/scripts/utils';
import CompiledStats from '@/scripts/models/CompiledStats'

import Form from 'react-bootstrap/Form';
import Head from 'next/head'
import { Inter } from 'next/font/google'

import CollapsibleComponent from '@/components/CollapsibleComponent';
import LoaderComponent from '@/components/LoaderComponent';
import TableComponent from '@/components/TableComponent';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const backgroundImage = 'https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/gm/gfllgt2cu5ta1.png';

  const [data, setData] = useState<CompiledStats | undefined>(undefined);
  const [sessionIndex, setSessionIndex] = useState<number>(0);

  const sessions = data?.sessions;
  
  // https://ultimatecourses.com/blog/using-async-await-inside-react-use-effect-hook
  useEffect(() => {
    (async () => {
      const url = globalThis.environment.STATS_URL;
      const response = await globalThis.xhr.get<CompiledStats>(url);
      console.log('Response', response);
      if (response === null) return;
      setData(response);
    })().catch(console.error);
  }, []);

  const onSelect = function (event: React.ChangeEvent<HTMLSelectElement> | undefined): React.ChangeEventHandler<HTMLSelectElement> | undefined {
    if (event === undefined) return undefined;
    const index = parseInt(event.currentTarget?.value);
    setSessionIndex(index);
  }

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
          data === undefined || sessions === undefined ?
          <LoaderComponent /> :
          (
          <div className={styles.content}>
            <div className={styles.lastUpdated}>Last updated: {formatDate(data.lastUpdated, 'asTime')}</div>
            <CollapsibleComponent
              title={(<h1>Total</h1>)}
            >
              <TableComponent stats={data.overall} />
            </CollapsibleComponent>

            <CollapsibleComponent
              title={(<h1>Session ({formatDate(sessions[sessionIndex].date, 'asDate')})</h1>)}
            >
              <div className={styles.sessionSelectContainer}>
                <Form.Select
                  className={styles.sessionSelect}
                  value={sessionIndex}
                  onChange={onSelect}
                >
                  {data.sessions.map((session, index) => {
                    return (
                      <option
                        key={`option-${index}-${session.date}`}
                        value={index}
                      >
                        {formatDate(session.date, 'asDate')}
                      </option>
                    )
                  })}
                </Form.Select>
              </div>
              <TableComponent stats={sessions[sessionIndex].data} />
            </CollapsibleComponent>
          </div>
          )
        }
      </main>
    </>
  )
}
