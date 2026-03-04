"use client";

import { cn } from "@/lib/utils";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { createContext, useCallback, useState } from "react";

// --- Types ---
export type { DragEndEvent } from "@dnd-kit/core";

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
}

export interface KanbanItem {
  id: string;
  column: string;
  [key: string]: unknown;
}

// --- Context ---
interface KanbanContextValue {
  activeId: string | null;
}

const KanbanContext = createContext<KanbanContextValue>({ activeId: null });

// --- KanbanProvider ---
interface KanbanProviderProps<T extends KanbanItem> {
  columns: KanbanColumn[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  children: (column: KanbanColumn) => ReactNode;
}

export function KanbanProvider<T extends KanbanItem>({
  columns,
  data,
  onDataChange,
  onDragEnd: externalDragEnd,
  children,
}: KanbanProviderProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !onDataChange) return;

      const activeItem = data.find((item) => item.id === active.id);
      if (!activeItem) return;

      // Check if dropping over a column
      const overColumn = columns.find((col) => col.id === over.id);
      if (overColumn && activeItem.column !== overColumn.id) {
        onDataChange(
          data.map((item) =>
            item.id === active.id ? { ...item, column: overColumn.id } : item,
          ) as T[],
        );
        return;
      }

      // Check if dropping over another card
      const overItem = data.find((item) => item.id === over.id);
      if (overItem && activeItem.column !== overItem.column) {
        onDataChange(
          data.map((item) =>
            item.id === active.id ? { ...item, column: overItem.column } : item,
          ) as T[],
        );
      }
    },
    [data, columns, onDataChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      if (externalDragEnd) {
        externalDragEnd(event);
      }
    },
    [externalDragEnd],
  );

  return (
    <KanbanContext.Provider value={{ activeId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(children)}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  );
}

// --- KanbanBoard (Column) ---
interface KanbanBoardProps {
  id: string;
  children: ReactNode;
}

export function KanbanBoard({ id, children }: KanbanBoardProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border bg-muted/30 transition-colors",
        isOver && "bg-muted/60 border-primary/30",
      )}
    >
      {children}
    </div>
  );
}

// --- KanbanHeader ---
interface KanbanHeaderProps {
  children: ReactNode;
  count?: number;
}

export function KanbanHeader({ children, count }: KanbanHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3 border-b">
      <div className="flex items-center gap-2 font-medium text-sm">
        {children}
      </div>
      {count !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

// --- KanbanCards ---
interface KanbanCardsProps<T extends KanbanItem> {
  id: string;
  children: (item: T) => ReactNode;
  items?: T[];
}

export function KanbanCards<T extends KanbanItem>({
  id,
  children,
  items = [],
}: KanbanCardsProps<T>) {
  const columnItems = items.filter((item) => item.column === id);

  return (
    <SortableContext
      items={columnItems.map((i) => i.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
        {columnItems.map(children)}
      </div>
    </SortableContext>
  );
}

// --- KanbanCard ---
interface KanbanCardProps {
  id: string;
  column: string;
  name: string;
  children?: ReactNode;
}

export function KanbanCard({ id, children, name }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/20",
      )}
    >
      {children || <p className="text-sm font-medium">{name}</p>}
    </div>
  );
}
