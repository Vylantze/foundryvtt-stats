import React, { useEffect, useState } from 'react';
import styles from '@/styles/BreakdownTableComponent.module.css';

import { getPercentage } from '@/scripts/utils';

interface BreakdownTableType {
  total?: number;
  records?: Record<string, number>;
}

interface IProps {
  data?: BreakdownTableType;
}

export type { BreakdownTableType }
export default function BreakdownTableComponent (props: IProps) {
  const data = props.data;
  const total = data?.total ?? 0;
  if (data === undefined || data.records === undefined) return (<div />);

  const records = data.records;
  const keys = Object.keys(data.records);

  return (
    <table className={styles.component}>
      <tbody>
        {keys.map((key, index) => {
          if (records[key] === 0 || records[key] === undefined) return;
          return (
            <tr className={styles.row} key={`breakdown-row-${index}`}>
              <td className={`${styles.tablecell} ${styles.left}`}>
                {key}
              </td>
              <td className={styles.tablecell}>
                {records[key]}
              </td>
              <td className={styles.tablecell}>
                {getPercentage(records[key] / total)}
              </td>
            </tr>
          );
        })}
        {
          total > 0 ?
          <>
            <tr className={`${styles.row} ${styles.total}`} key="breakdown-row-total">
              <td className={`${styles.tablecell} ${styles.left}`}>
                Total
              </td>
              <td className={styles.tablecell}>
                {total}
              </td>
              <td className={styles.tablecell}>
                100%
              </td>
            </tr>
          </> : <tr />
        }
      </tbody>
    </table>
  )
}