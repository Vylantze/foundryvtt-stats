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
  if (data === undefined || total === 0 || data.records === undefined) return (<div />);

  const records = data.records;
  const keys = Object.keys(data.records);

  return (
    <div className={styles.component}>
      {keys.map((key, index) => {
        if (records[key] === 0 || records[key] === undefined) return;
        return (
          <div className={styles.row} key={`breakdown-row-${index}`}>
            <div className={styles.left}>
              {key}:
            </div>
            <div className={styles.right}>
              {records[key]} ({getPercentage(records[key] / total)})
            </div>
          </div>
        );
      })}
      <hr className={styles.divider} key="breakdown-row-divider" />
      <div className={styles.row} key="breakdown-row-total">
        <div className={styles.left}>
          Total:
        </div>
        <div className={styles.right}>
          {total} (100%)
        </div>
      </div>
    </div>
  )
}