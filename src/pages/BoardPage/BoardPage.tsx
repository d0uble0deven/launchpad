import { useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildMockBoard, MOCK_EMPLOYEE } from '../../data/mockBoard';
import LaneNode from './LaneNode';
import PhaseRegionNode from './PhaseRegionNode';
import TaskNode from './TaskNode';
import styles from './BoardPage.module.css';

const nodeTypes = {
  phaseRegion: PhaseRegionNode,
  lane: LaneNode,
  task: TaskNode,
};

const CANVAS_MARGIN = 60;

function BoardPage() {
  const [board] = useState(buildMockBoard);

  useEffect(() => {
    console.log('[data] mock board loaded', board);
    console.log(
      `[data] ${board.tasks.length} tasks across ${board.phases.length} phases and ${board.swimlanes.length} swimlanes`,
    );
  }, [board]);

  const nodes: Node[] = useMemo(() => {
    const lastPhase = board.phases[board.phases.length - 1]!;
    const lastLane = board.swimlanes[board.swimlanes.length - 1]!;
    const canvasWidth = lastPhase.x + lastPhase.width + CANVAS_MARGIN;
    const canvasHeight = lastLane.y + lastLane.height + CANVAS_MARGIN;

    const laneById = Object.fromEntries(
      board.swimlanes.map((lane) => [lane.id, lane]),
    );
    const phaseById = Object.fromEntries(
      board.phases.map((phase) => [phase.id, phase]),
    );

    const phaseNodes: Node[] = board.phases.map((phase, index) => ({
      id: `phase-${phase.id}`,
      type: 'phaseRegion',
      position: { x: phase.x, y: 0 },
      data: {
        label: phase.label,
        width: phase.width,
        height: canvasHeight,
        striped: index % 2 === 1,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -2,
      style: { pointerEvents: 'none' },
    }));

    const laneNodes: Node[] = board.swimlanes.map((lane) => ({
      id: `lane-${lane.id}`,
      type: 'lane',
      position: { x: 0, y: lane.y },
      data: {
        label: lane.label,
        color: lane.color,
        width: canvasWidth,
        height: lane.height,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
      style: { pointerEvents: 'none' },
    }));

    const taskNodes: Node[] = board.tasks.map((task) => ({
      id: task.id,
      type: 'task',
      position: task.position,
      data: {
        task,
        accentColor: laneById[task.ownerId]?.color ?? '#ffffff',
        ownerLabel: laneById[task.ownerId]?.label ?? task.ownerId,
        phaseLabel: phaseById[task.phaseId]?.label ?? '',
      },
      draggable: false,
    }));

    return [...phaseNodes, ...laneNodes, ...taskNodes];
  }, [board]);

  return (
    <div className={styles.boardPage}>
      <div className={styles.boardHeader}>
        <span className={styles.employeeName}>{MOCK_EMPLOYEE.name}</span>
        <span className={styles.employeeMeta}>
          {MOCK_EMPLOYEE.role} · {MOCK_EMPLOYEE.location} · Started{' '}
          {MOCK_EMPLOYEE.startDate} · Step {MOCK_EMPLOYEE.currentStep}
        </span>
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.08}
          maxZoom={1.75}
          nodesDraggable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#d5d8e0"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default BoardPage;
