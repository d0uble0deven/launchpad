import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import type { Node, NodeChange, NodeMouseHandler, OnNodeDrag } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Button from '../../components/atoms/Button/Button';
import Select from '../../components/atoms/Select/Select';
import TaskModal from '../../components/organisms/TaskModal/TaskModal';
import { recalculateDependencies } from '../../logic/dependencies';
import { summarizeBoard } from '../../logic/progress';
import { useAppState } from '../../state/AppStateContext';
import type {
  OnboardingBoard,
  TaskCard as TaskCardData,
  TaskCategory,
  TaskStatus,
} from '../../types/board';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../types/board';
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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...(Object.entries(STATUS_LABELS) as Array<[TaskStatus, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All categories' },
  ...(Object.entries(CATEGORY_LABELS) as Array<[TaskCategory, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

function BoardPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { state, updateBoard, resetAll } = useAppState();

  const employee = state.employees.find((e) => e.id === employeeId) ?? null;
  const board =
    state.boards.find((b) => b.employeeId === employeeId) ?? null;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>(
    'all',
  );

  const boardId = board?.id ?? null;
  const setBoard = useCallback(
    (updater: (prev: OnboardingBoard) => OnboardingBoard) => {
      if (boardId) updateBoard(boardId, updater);
    },
    [boardId, updateBoard],
  );

  useEffect(() => {
    if (!board || !employee) return;
    console.log(`[data] board loaded for ${employee.name}`, board);
    console.log(
      `[data] ${board.tasks.length} tasks across ${board.phases.length} phases and ${board.swimlanes.length} swimlanes`,
    );
    // Log once per employee; drags update state continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const selectedTask =
    board?.tasks.find((task) => task.id === selectedTaskId) ?? null;

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type !== 'task') return;
    const task = node.data.task as TaskCardData;
    console.log(`[modal] open "${task.title}"`);
    setSelectedTaskId(node.id);
  }, []);

  const closeModal = useCallback(() => setSelectedTaskId(null), []);

  const logDependencyChanges = (
    changes: { title: string; from: string; to: string }[],
  ) => {
    if (changes.length === 0) {
      console.log('[deps] recalculated — no changes');
    }
    for (const change of changes) {
      console.log(`[deps] "${change.title}": ${change.from} → ${change.to}`);
    }
  };

  const createTask = useCallback(() => {
    if (!board) return;
    const phase = board.phases[0]!;
    const lane = board.swimlanes[0]!;
    const task: TaskCardData = {
      id: `t-${Date.now()}`,
      title: 'New task',
      description: '',
      ownerId: lane.id,
      status: 'not-started',
      category: 'intake',
      phaseId: phase.id,
      dependsOn: [],
      links: [],
      notes: '',
      activity: [
        {
          id: `t-${Date.now()}-a1`,
          timestamp: new Date().toISOString(),
          message: 'Card created',
        },
      ],
      position: { x: phase.x + 20, y: lane.y + 24 },
    };
    console.log(
      `[card] created "${task.title}" in ${phase.label} / ${lane.label}`,
    );
    setBoard((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    setSelectedTaskId(task.id);
  }, [board, setBoard]);

  const deleteTask = useCallback(
    (id: string) => {
      const target = board?.tasks.find((task) => task.id === id);
      if (!target) return;
      console.log(`[card] deleted "${target.title}"`);
      setBoard((prev) => {
        const remaining = prev.tasks
          .filter((task) => task.id !== id)
          .map((task) =>
            task.dependsOn.includes(id)
              ? { ...task, dependsOn: task.dependsOn.filter((d) => d !== id) }
              : task,
          );
        const { tasks, changes } = recalculateDependencies(remaining);
        logDependencyChanges(changes);
        return { ...prev, tasks };
      });
      setSelectedTaskId(null);
    },
    [board, setBoard],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const source = board?.tasks.find((task) => task.id === id);
      if (!source) return;
      const copy: TaskCardData = {
        ...structuredClone(source),
        id: `t-${Date.now()}`,
        title: `${source.title} (copy)`,
        position: {
          x: source.position.x + 28,
          y: source.position.y + 28,
        },
        activity: [
          {
            id: `t-${Date.now()}-a1`,
            timestamp: new Date().toISOString(),
            message: `Duplicated from "${source.title}"`,
          },
        ],
      };
      console.log(`[card] duplicated "${source.title}" → "${copy.title}"`);
      setBoard((prev) => ({ ...prev, tasks: [...prev.tasks, copy] }));
      setSelectedTaskId(copy.id);
    },
    [board, setBoard],
  );

  const saveTask = useCallback(
    (updated: TaskCardData) => {
      console.log(`[save] "${updated.title}"`, updated);
      setBoard((prev) => {
        const merged = prev.tasks.map((task) =>
          task.id === updated.id ? updated : task,
        );
        const { tasks, changes } = recalculateDependencies(merged);
        logDependencyChanges(changes);
        return { ...prev, tasks };
      });
    },
    [setBoard],
  );

  // Board state is the source of truth: React Flow position changes are
  // written straight back into the tasks, so cards follow the cursor and the
  // board always holds current positions.
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
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
    },
    [setBoard],
  );

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

  // Dropping a card into a different phase region or swimlane reassigns its
  // phase/owner data (decided 2026-07-14; see roadmap open question 2).
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      logDrag('end', node);
      if (node.type !== 'task') return;
      const width = node.measured?.width ?? 210;
      const height = node.measured?.height ?? 110;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      setBoard((prev) => {
        const task = prev.tasks.find((t) => t.id === node.id);
        if (!task) return prev;
        const phase = prev.phases.find(
          (p) => centerX >= p.x && centerX < p.x + p.width,
        );
        const lane = prev.swimlanes.find(
          (l) => centerY >= l.y && centerY < l.y + l.height,
        );
        const phaseId = phase?.id ?? task.phaseId;
        const ownerId = lane?.id ?? task.ownerId;
        if (phaseId === task.phaseId && ownerId === task.ownerId) return prev;
        const phaseLabel =
          prev.phases.find((p) => p.id === phaseId)?.label ?? phaseId;
        const laneLabel =
          prev.swimlanes.find((l) => l.id === ownerId)?.label ?? ownerId;
        console.log(
          `[drag] "${task.title}" reassigned to ${phaseLabel} / ${laneLabel}`,
        );
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  phaseId,
                  ownerId,
                  activity: [
                    ...t.activity,
                    {
                      id: `${t.id}-a${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      message: `Moved to ${phaseLabel} / ${laneLabel}`,
                    },
                  ],
                }
              : t,
          ),
        };
      });
    },
    [setBoard],
  );

  const nodes: Node[] = useMemo(() => {
    if (!board) return [];
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
        dimmed:
          (statusFilter !== 'all' && task.status !== statusFilter) ||
          (categoryFilter !== 'all' && task.category !== categoryFilter),
      },
      draggable: true,
    }));

    return [...phaseNodes, ...laneNodes, ...taskNodes];
  }, [board, statusFilter, categoryFilter]);

  if (!employee || !board) {
    return (
      <div className={styles.notFound}>
        <p>No onboarding board found for this employee.</p>
        <Link to="/">← Back to dashboard</Link>
      </div>
    );
  }

  const summary = summarizeBoard(employee, board);

  return (
    <div className={styles.boardPage}>
      <div className={styles.boardHeader}>
        <Link to="/" className={styles.backLink}>
          ← Dashboard
        </Link>
        <span className={styles.employeeName}>{employee.name}</span>
        <span className={styles.employeeMeta}>
          {employee.role} · {employee.location} · Started {employee.startDate}{' '}
          · Step {summary.currentStep} of {summary.totalCount} ·{' '}
          {summary.overallPct}% complete
        </span>
        <div className={styles.headerActions}>
          <div className={styles.filters}>
            <Select
              aria-label="Filter by status"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as TaskStatus | 'all')
              }
            />
            <Select
              aria-label="Filter by category"
              options={CATEGORY_FILTER_OPTIONS}
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as TaskCategory | 'all')
              }
            />
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset Data
          </Button>
          <Button variant="primary" size="sm" onClick={createTask}>
            + New Card
          </Button>
        </div>
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          key={board.id}
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
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {selectedTask && (
        <TaskModal
          key={selectedTask.id}
          task={selectedTask}
          board={board}
          onClose={closeModal}
          onSave={saveTask}
          onDelete={() => deleteTask(selectedTask.id)}
          onDuplicate={() => duplicateTask(selectedTask.id)}
        />
      )}
    </div>
  );
}

export default BoardPage;
