import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';
import type { Node, NodeChange, NodeMouseHandler, OnNodeDrag } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TaskModal from '../../components/organisms/TaskModal/TaskModal';
import { recalculateDependencies } from '../../logic/dependencies';
import type { TaskCard as TaskCardData } from '../../types/board';
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
  const [board, setBoard] = useState(buildMockBoard);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask =
    board.tasks.find((task) => task.id === selectedTaskId) ?? null;

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type !== 'task') return;
    const task = node.data.task as TaskCardData;
    console.log(`[modal] open "${task.title}"`);
    setSelectedTaskId(node.id);
  }, []);

  const closeModal = useCallback(() => setSelectedTaskId(null), []);

  const saveTask = useCallback((updated: TaskCardData) => {
    console.log(`[save] "${updated.title}"`, updated);
    setBoard((prev) => {
      const merged = prev.tasks.map((task) =>
        task.id === updated.id ? updated : task,
      );
      const { tasks, changes } = recalculateDependencies(merged);
      if (changes.length === 0) {
        console.log('[deps] recalculated — no changes');
      }
      for (const change of changes) {
        console.log(
          `[deps] "${change.title}": ${change.from} → ${change.to}`,
        );
      }
      return { ...prev, tasks };
    });
  }, []);

  // Board state is the source of truth: React Flow position changes are
  // written straight back into the tasks, so cards follow the cursor and the
  // board always holds current positions (persisted in Step 1.11).
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const moves = new Map<string, { x: number; y: number }>();
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        moves.set(change.id, change.position);
      }
    }
    if (moves.size === 0) return;
    setBoard((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        moves.has(task.id)
          ? { ...task, position: moves.get(task.id)! }
          : task,
      ),
    }));
  }, []);

  const logDrag = (phase: 'start' | 'end', node: Node) => {
    if (node.type !== 'task') return;
    const task = node.data.task as TaskCardData;
    console.log(
      `[drag] ${phase} "${task.title}" at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`,
    );
  };

  const onNodeDragStart: OnNodeDrag = useCallback((_event, node) => {
    logDrag('start', node);
  }, []);

  const onNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
    logDrag('end', node);
  }, []);

  useEffect(() => {
    console.log('[data] mock board loaded', board);
    console.log(
      `[data] ${board.tasks.length} tasks across ${board.phases.length} phases and ${board.swimlanes.length} swimlanes`,
    );
    // Log the initial board once on mount; drags update state continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      draggable: true,
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
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          fitView
          minZoom={0.08}
          maxZoom={1.75}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#d5d8e0"
          />
        </ReactFlow>
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          board={board}
          onClose={closeModal}
          onSave={saveTask}
        />
      )}
    </div>
  );
}

export default BoardPage;
