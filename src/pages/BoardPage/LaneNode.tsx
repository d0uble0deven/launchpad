import type { Node, NodeProps } from '@xyflow/react';
import type { BoardZoomMode } from '../../logic/boardNavigation';
import styles from './regions.module.css';

export type LaneNodeType = Node<
  {
    label: string;
    color: string;
    width: number;
    height: number;
    /** When 'overview', the label counter-scales to stay screen-readable. */
    zoomMode?: BoardZoomMode;
  },
  'lane'
>;

function LaneNode({ data }: NodeProps<LaneNodeType>) {
  return (
    <div
      className={styles.lane}
      style={{ width: data.width, height: data.height }}
    >
      <span
        className={`${styles.laneLabel} ${data.zoomMode === 'overview' ? styles.laneLabelOverview : ''}`}
        style={{ background: data.color }}
      >
        {data.label}
      </span>
    </div>
  );
}

export default LaneNode;
