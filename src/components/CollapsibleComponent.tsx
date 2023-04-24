  import React, { useState, PropsWithChildren, ReactNode } from 'react';
import { CaretDownFill, CaretUpFill } from 'react-bootstrap-icons';
import styles from '@/styles/CollapsibleComponent.module.css';

interface IProps {
  title: string | ReactNode
  startCollapsed?: boolean;
}

export default function CollapsibleComponent (props: PropsWithChildren<IProps>) {
  const [isExpanded, setIsExpanded] = useState<boolean>(!props.startCollapsed);
  const toggleCollapse = function () {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className={styles.collapsible}>
      <div className={styles.divider}>
        <div className={styles.title}>{props.title}</div>
        <div style={{ flex: 1 }} />
        <div
          className={styles.toggle}
          onClick={toggleCollapse}
        >
          {
            isExpanded ? 
            <CaretDownFill /> :
            <CaretUpFill />
          }
        </div>
      </div>
      <hr />
      {isExpanded ? props.children : <div />}
    </div>
  )
}