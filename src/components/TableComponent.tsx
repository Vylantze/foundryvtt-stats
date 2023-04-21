import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import styles from '@/styles/TableComponent.module.css';

import Table from 'react-bootstrap/Table';
import Statistics from '@/scripts/models/Statistics';
import StatsTableController from '@/scripts/classes/StatsTableController';
import TableTemplate from '@/scripts/models/TableTemplate';

interface IProps {
  stats: Statistics[]
}


export default function TableComponent (props: IProps) {
  const stats = props.stats;

  const [controller, setController] = useState<StatsTableController | undefined>(undefined);

  useEffect(() => {
    console.log('Constructing tableTemplates');
    setController(new StatsTableController(stats));
  }, [stats]);

  if (controller === undefined) return (<div />);

  return (
    <Table
      className={styles.table}
      bordered
    >
      <thead>
        <tr>
          <th className={styles.header} />
          {controller.stats.map((stat: Statistics) => {
            return (
              <th className={styles.header}>
                <Image
                  src={stat.user.avatar ?? ''}
                  alt={`${stat.user.name} avatar`}
                  width={50}
                  height={50}
                  priority
                />
                <div>{stat.user.name}</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>      
        {controller.templates.map((template: TableTemplate) => {
          const descriptionStyle = template.isNested ? `${styles.nested} ${styles.rowhead}` : styles.rowhead;
          const tdStyle = template.isNested ? `${styles.nested} ${styles.content}` : styles.content;
          return (
            <tr>
              <td className={descriptionStyle}>{template.name}</td>
              {template.values.map(value => <td className={tdStyle}>{value}</td>)}
            </tr>
          );
        })}
      </tbody>
    </Table>
  )
}