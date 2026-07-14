import type { Node, NodeProps } from '@xyflow/react';
import styles from './regions.module.css';

export type LaneNodeType = Node<
  {
    label: string;
    color: string;
    width: number;
    height: number;
  },
  'lane'
>;

function LaneNode({ data }: NodeProps<LaneNodeType>) {
  return (
    <div
      className={styles.lane}
      style={{ width: data.width, height: data.height }}
    >
      <span className={styles.laneLabel} style={{ background: data.color }}>
        {data.label}
      </span>
    </div>
  );
}

export default LaneNode;
