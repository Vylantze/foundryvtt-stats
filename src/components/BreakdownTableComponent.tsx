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
  console.log('Records', data.records);
  
  const length = keys.length;
  const isSplitTable = length > 10;
  const middlePoint = isSplitTable ? Math.ceil(length / 2) : -1;

  const getBreakdownTD = function (key: string, value: number, total: number, isSplit: boolean = false) {
    return (
      <>
        <td className={`${styles.tablecell} ${styles.left}`}>
          {key}
        </td>
        <td className={styles.tablecell}>
          {value}
        </td>
        {
          total > 0 ?
          <td className={`${styles.tablecell} ${styles.right} ${isSplit ? styles.split : ''}`}>
            {getPercentage(value / total)}
          </td> : <td />
        }
      </>
    );
  }

  return (
    <table className={styles.component}>
      <tbody>
        {keys.map((key, index) => {
          const value = records[key];
          if (value === 0 || value === undefined) return;
          if (isSplitTable && index >= middlePoint) return;
          return (
            <tr className={styles.row} key={`breakdown-row-${index}`}>
              {getBreakdownTD(key, value, total, isSplitTable)}
              {
                isSplitTable && middlePoint + index < length ?
                getBreakdownTD(keys[middlePoint + index], records[keys[middlePoint + index]], total)
                : <></>
              }
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