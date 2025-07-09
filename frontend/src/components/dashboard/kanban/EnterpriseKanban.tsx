'use client';

import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Task } from '@/types';

interface EnterpriseKanbanProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick: (task: Task) => void;
}

const STATUS_COLUMNS: { id: Task['status']; title: string; color: string; icon: string; bgClass?: string; iconClass?: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'from-gray-600 to-gray-700', icon: '📋', bgClass: 'bg-zinc-800/50' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'from-blue-600 to-blue-700', icon: '🚀', bgClass: 'bg-zinc-800/50' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'from-purple-600 to-purple-700', icon: '👀', bgClass: 'bg-zinc-800/50' },
  { id: 'DONE', title: 'Done', color: 'from-green-600 to-green-700', icon: '✅', bgClass: 'bg-zinc-800/50' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'from-red-600 to-red-700', icon: '🚫', bgClass: 'bg-zinc-800/50' },
];

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const sortableProps = useSortable({ id: task.id });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = sortableProps;

  const style = isDragging ? {
    opacity: 0.9,
  } : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: 1,
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      URGENT: 'bg-red-500 text-red-100',
      HIGH: 'bg-orange-500 text-orange-100',
      MEDIUM: 'bg-yellow-500 text-yellow-100',
      LOW: 'bg-green-500 text-green-100',
    };
    return colors[priority];
  };

  return (
    <motion.div
      ref={setNodeRef}
      id={task.id}
      style={style}
      {...attributes}
      {...listeners}
      initial={!isDragging ? { opacity: 0, y: 20 } : undefined}
      animate={!isDragging ? { opacity: 1, y: 0 } : undefined}
      exit={!isDragging ? { opacity: 0, y: -20 } : undefined}
      whileHover={!isDragging ? { scale: 1.01 } : undefined}
      className={`bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-md p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow ${isDragging ? 'shadow-md ring-1 ring-blue-500/50' : ''}`}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-white text-xs line-clamp-1 flex-1">{task.title}</h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)} font-medium ml-1.5`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="text-zinc-400 text-[10px] line-clamp-1">{task.description}</p>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center space-x-1 text-zinc-500">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>
                  {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} subtasks
                </span>
              </div>
              <span className="text-zinc-400">
                {Math.round((task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-2 text-zinc-500">
            {task._count.comments > 0 && (
              <span className="flex items-center">
                <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4z" />
                </svg>
                <span>{task._count.comments}</span>
              </span>
            )}
          </div>

          {isClient && task.dueDate && (
            <span className={`text-[10px] ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-zinc-500'}`}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.milestone && (
          <div className="mt-0.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px]">
              <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              {task.milestone.title}
            </span>
          </div>
        )}

        {task.estimatedHours && (
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all"
              style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DroppableColumn({ status, tasks, children }: { status: Task['status']; tasks: Task[]; children: React.ReactNode }) {
  const column = STATUS_COLUMNS.find(col => col.id === status)!;
  
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className={`bg-gradient-to-r ${column.color} p-0.5 rounded-t-lg`}>
        <div className="bg-zinc-900 rounded-t-lg px-2 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-base">{column.icon}</span>
              <h3 className="font-medium text-white text-sm">{column.title}</h3>
              <span className="bg-white/10 text-zinc-300 text-xs px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 backdrop-blur-sm border-x border-b border-white/10 rounded-b-lg p-1.5 flex-1 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5 min-h-full">
            {children}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function EnterpriseKanban({ tasks, onTaskMove, onTaskClick }: EnterpriseKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [columnBounds, setColumnBounds] = useState<Record<string, DOMRect | null>>({});
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const activeCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeId) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        
        const newCardPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
          width: cardPosition.width,
          height: cardPosition.height
        };
        setCardPosition(newCardPosition);
        
        if (Object.keys(columnBounds).length > 0) {
          let hoveredColumn = Object.entries(columnBounds).find(([, rect]) => {
            if (!rect) return false;
            return e.clientX >= rect.left && 
                   e.clientX <= rect.right && 
                   e.clientY >= rect.top && 
                   e.clientY <= rect.bottom;
          });
          
          if (!hoveredColumn) {
            let closestDistance = Infinity;
            let closestColumn: [string, DOMRect | null] | null = null;
            
            Object.entries(columnBounds).forEach(([id, rect]) => {
              if (!rect) return;
              
              const cardCenterX = newCardPosition.x + (newCardPosition.width / 2);
              const cardCenterY = newCardPosition.y + (newCardPosition.height / 2);
              
              let distanceX = 0;
              if (cardCenterX < rect.left) {
                distanceX = rect.left - cardCenterX;
              } else if (cardCenterX > rect.right) {
                distanceX = cardCenterX - rect.right;
              }
              
              let distanceY = 0;
              if (cardCenterY < rect.top) {
                distanceY = rect.top - cardCenterY;
              } else if (cardCenterY > rect.bottom) {
                distanceY = cardCenterY - rect.bottom;
              }
              
              const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
              
              if (distance < closestDistance) {
                closestDistance = distance;
                closestColumn = [id, rect];
              }
            });
            
            if (closestColumn && closestDistance < 150) {
              hoveredColumn = closestColumn;
            }
          }
          
          setDragTarget(hoveredColumn ? hoveredColumn[0] : null);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeId, columnBounds, dragOffset, cardPosition.width, cardPosition.height]);

  useEffect(() => {
    const calculateColumnBounds = () => {
      const bounds: Record<string, DOMRect | null> = {};
      
      STATUS_COLUMNS.forEach(column => {
        const columnElement = document.querySelector(`[data-column-id="${column.id}"]`);
        bounds[column.id] = columnElement ? columnElement.getBoundingClientRect() : null;
      });
      
      setColumnBounds(bounds);
    };
    
    calculateColumnBounds();
    window.addEventListener('resize', calculateColumnBounds);
    
    return () => {
      window.removeEventListener('resize', calculateColumnBounds);
    };
  }, []);



  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const foundTask = tasks.find(t => t.id === active.id);
    if (foundTask) {
      setActiveTask(foundTask);
      
      if (event.activatorEvent instanceof MouseEvent) {
        const mouseEvent = event.activatorEvent;
        
        const element = document.getElementById(active.id.toString());
        if (element) {
          activeCardRef.current = element;
          
          const rect = element.getBoundingClientRect();
          setCardPosition({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          });
          
          setDragOffset({
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top
          });
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setDragTarget(over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    let targetColumn: Task['status'] | null = null;
    
    if (dragTarget && STATUS_COLUMNS.some(col => col.id === dragTarget)) {
      targetColumn = dragTarget as Task['status'];
    } 
    else if (over) {
      if (STATUS_COLUMNS.some(col => col.id === over.id)) {
        targetColumn = over.id as Task['status'];
      } 
      else {
        const overTask = tasks.find(t => t.id === over.id);
        if (overTask) {
          targetColumn = overTask.status;
        }
      }
    }
    
    if (targetColumn && targetColumn !== task.status) {
      onTaskMove(taskId, targetColumn);
    }
    
    setActiveId(null);
    setActiveTask(null);
    setDragTarget(null);
  };

  const CustomDragOverlay = () => {
    if (!activeId || !activeTask || !activeCardRef.current) return null;
    
    const dragStyles: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: `${cardPosition.width}px`,
      height: `${cardPosition.height}px`,
      pointerEvents: 'none',
      zIndex: 9999,
      transform: `translate3d(${mousePosition.x - dragOffset.x}px, ${mousePosition.y - dragOffset.y}px, 0)`,
      opacity: 0.9,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      transition: 'none',
      willChange: 'transform',
      transformOrigin: '0 0',
    };
    
    return createPortal(
      <div style={dragStyles} className="task-drag-overlay">
        <TaskCard task={activeTask} isDragging />
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-medium text-white">Kanban Board</h3>
          <p className="text-zinc-400 text-xs mt-0.5">Drag and drop tasks to update their status</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-2 h-full overflow-x-auto pb-2">
          {STATUS_COLUMNS.map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            const isTargetColumn = dragTarget === column.id;
            
            return (
              <div 
                key={column.id}
                id={`column-${column.id}`}
                data-column-id={column.id}
                className={`flex-1 min-w-[180px] max-w-[250px] transition-all duration-200 ${isTargetColumn ? 'scale-[1.01]' : ''}`}
              >
                <DroppableColumn status={column.id} tasks={columnTasks}>
                  <div 
                    className={`space-y-1.5 min-h-[100px] rounded-lg transition-all duration-200 ${
                      isTargetColumn 
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/50 p-1.5' 
                        : activeId ? 'p-1.5' : ''
                    }`}
                  >
                    <AnimatePresence>
                      {columnTasks.map(task => (
                        <div key={task.id} onClick={() => onTaskClick(task)}>
                          <TaskCard task={task} isDragging={task.id === activeId} />
                        </div>
                      ))}
                    </AnimatePresence>
                    
                    {columnTasks.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-6 text-zinc-600 transition-all duration-200 ${
                        isTargetColumn 
                          ? 'bg-blue-500/10 border border-dashed border-blue-500/50 rounded-lg' 
                          : activeId ? 'bg-zinc-800/30 border border-dashed border-zinc-500/30 rounded-lg' : ''
                      }`}>
                        <svg className="w-6 h-6 mb-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-[10px]">No tasks yet</p>
                        <p className={`text-[10px] ${isTargetColumn ? 'text-blue-400 font-medium' : ''}`}>
                          {isTargetColumn ? 'Drop here!' : 'Drop tasks here'}
                        </p>
                      </div>
                    )}
                  </div>
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        {activeId && <CustomDragOverlay />}
      </DndContext>
    </div>
  );
} 