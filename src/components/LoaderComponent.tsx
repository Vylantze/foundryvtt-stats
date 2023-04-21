import React from 'react';
import styles from '@/styles/LoaderComponent.module.css';

interface IProps {
  margin?: string
}

export default function LoaderComponent (props: IProps) {
  const margin = props.margin !== undefined ? props.margin : '50px 0px';

  return (
    <div className={styles.container} style={{ margin }}>
      <div className={styles.loader} />
    </div>
  )
}