import React, { useEffect, useState } from 'react';
import styles from '@/styles/DegreeOfSuccessComponent.module.css';

import DegreeOfSuccessObject from '@/scripts/models/DegreeOfSuccessObject';
import { getPercentage } from '@/scripts/utils';

interface IProps {
  data?: DegreeOfSuccessObject
}

const getDisplayName = function (key: 'totalChecksMade' | 'critSuccess' | 'success' | 'failure' | 'critFailure' | 'noResult'): string {
  switch(key) {
    case 'critSuccess': return 'Critical success';
    case 'success': return 'Success';
    case 'failure': return 'Failure';
    case 'critFailure': return 'Critical failure';
    case 'noResult': return 'No result';
    default: return 'Total';
  }
}

const getSuccessPercentage = function (data: DegreeOfSuccessObject, key: 'totalChecksMade' | 'critSuccess' | 'success' | 'failure' | 'critFailure' | 'noResult'): string {
  return getPercentage(data[key] / data.totalChecksMade);
}

export default function DegreeOfSuccessComponent (props: IProps) {
  const data = props.data;
  if (data === undefined || data.totalChecksMade === undefined) return (<div />);
  const keys = Object.keys(data).filter(key => key !== 'totalValid');

  return (
    <div className={styles.component}>
      {keys.map(objKey => {
        const key = objKey as 'totalChecksMade' | 'critSuccess' | 'success' | 'failure' | 'critFailure' | 'noResult';
        if (data[key] === 0 || data[key] === undefined) return;
        return (
          <div className={styles.row}>
            <div className={styles.left}>
              {getDisplayName(key)}:
            </div>
            <div className={styles.right}>
              {data[key]} ({getSuccessPercentage(data, key)})
            </div>
          </div>
        );
      })}
    </div>
  )
}