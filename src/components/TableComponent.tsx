import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import styles from '@/styles/TableComponent.module.css';

import Table from 'react-bootstrap/Table';
import Statistics from '@/scripts/models/Statistics';
import StatsTableController from '@/scripts/classes/StatsTableController';

import BreakdownTableComponent from "@/components/BreakdownTableComponent";

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
    <div className={styles.container}>
      <Table
        className={styles.table}
        bordered
      >
        <thead>
          <tr>
            <th className={styles.header} />
            {controller.stats.map((stat, index) => {
              return (
                <th className={styles.header} key={`header-${index}`}>
                  <Image
                    className={styles.avatar}
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
          {controller.templates.map((template, index) => {
            const descriptionStyle = template.isNested ? `${styles.nested} ${styles.rowhead}` : styles.rowhead;
            const nestedStyle = template.isNested ? `${styles.nested} ${styles.content}` : styles.content;
            const tdStyle = template.hoverData !== undefined ? `${nestedStyle} ${styles.tooltip}` : nestedStyle;
            return (
              <tr  key={`row-${index}`}>
                <td className={descriptionStyle}>{template.name}</td>
                {template.values.map((value, subIndex) =>
                  <td className={tdStyle} key={`row-${index}-td-${subIndex}`}>
                    {
                      template.hoverData !== undefined && template.hoverData[subIndex] !== undefined ?
                      <>
                        <span className={styles.tooltipable}>{value}</span>
                        <div className={styles.tooltiptext}>
                          <BreakdownTableComponent
                            data={template.hoverData[subIndex]}
                          />
                        </div>
                      </> :
                      <span>{value}</span>
                    }
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  )
}