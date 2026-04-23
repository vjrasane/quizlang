import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortItem } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";
import { mulberry32 } from "../utils";

interface Props {
  items: SortItem[];
  onAnswer: (correct: boolean, answer: unknown) => void;
  seed?: number;
  reviewAnswer?: number[];
}

function GripIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      className="text-text-muted shrink-0"
    >
      <circle cx="4" cy="2.5" r="1" />
      <circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9.5" r="1" />
      <circle cx="8" cy="9.5" r="1" />
    </svg>
  );
}

function SortableItem({
  id,
  text,
  disabled,
}: {
  id: string;
  text: string;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border bg-bg-2 border-border text-sm sm:text-base text-text-primary select-none flex items-center gap-2 touch-none ${
        isDragging ? "opacity-30" : ""
      } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
    >
      {!disabled && <GripIcon />}
      {text}
    </div>
  );
}

export function Sorting({ items, onAnswer, seed, reviewAnswer }: Props) {
  const { t } = useLocale();
  const readOnly = reviewAnswer !== undefined;

  const correctOrder = useMemo(
    () => [...items].sort((a, b) => a.key - b.key),
    [items],
  );

  const shuffled = useMemo(() => {
    const arr = [...items];
    const rng = seed != null ? mulberry32(seed) : Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [items, seed]);

  const [order, setOrder] = useState<SortItem[]>(() =>
    reviewAnswer
      ? reviewAnswer.map((key) => items.find((it) => it.key === key)!)
      : shuffled,
  );
  const [submitted, setSubmitted] = useState(readOnly);
  const [locked, setLocked] = useState(readOnly);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const ids = order.map((it) => `sort-${it.key}`);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || locked) return;

    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx !== newIdx) {
      setOrder((prev) => arrayMove(prev, oldIdx, newIdx));
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = order.every(
      (item, i) => item.key === correctOrder[i].key,
    );
    if (allCorrect) setLocked(true);
    onAnswer(
      allCorrect,
      order.map((it) => it.key),
    );
  };

  const activeItem = activeId
    ? order.find((it) => `sort-${it.key}` === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {order.map((item, i) => (
              <div key={item.key} className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-muted w-5 text-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 rounded-lg border border-dashed border-border p-0.5">
                  {submitted ? (
                    <div
                      className={`w-full text-left px-3 sm:px-4 py-3 rounded-md ${
                        item.key === correctOrder[i].key
                          ? "bg-correct-bg text-correct"
                          : "bg-incorrect-bg text-incorrect"
                      }`}
                    >
                      {item.text}
                      {item.key !== correctOrder[i].key && item.notes && (
                        <p className="text-xs opacity-75 mt-1.5 px-2 py-1 rounded border border-black/15 bg-black/5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <SortableItem
                      id={`sort-${item.key}`}
                      text={item.text}
                      disabled={locked}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>

        {!submitted && !locked && (
          <ActionButton onClick={handleSubmit}>{t("submit")}</ActionButton>
        )}
        {submitted && !locked && (
          <ActionButton onClick={() => setSubmitted(false)}>
            {t("tryAgain")}
          </ActionButton>
        )}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-full text-left px-3 sm:px-4 py-3 rounded-lg border border-accent bg-bg-2 text-sm sm:text-base text-text-primary shadow-lg flex items-center gap-2">
            <GripIcon />
            {activeItem.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
