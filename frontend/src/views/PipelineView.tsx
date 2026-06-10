import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AlertCircle } from 'lucide-react';
import { Candidate } from '../types';

interface PipelineViewProps {
  candidates: Candidate[];
  updateStatus: (id: number, status: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ candidates, updateStatus }) => {
  const statuses = [
    { id: 'new', label: '📥 Nuovi', color: 'border-blue-200 dark:border-blue-800' },
    { id: 'reviewed', label: '🔍 Revisionati', color: 'border-yellow-200 dark:border-yellow-800' },
    { id: 'shortlisted', label: '⭐ Selezionati', color: 'border-emerald-200 dark:border-emerald-800' },
    { id: 'rejected', label: '❌ Scartati', color: 'border-red-200 dark:border-red-800' }
  ];

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    updateStatus(Number(draggableId), destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map(status => {
          const candidatesInStatus = candidates.filter(c => c.status === status.id);
          return (
            <Droppable droppableId={status.id} key={status.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`h-full rounded-2xl p-3 transition-colors duration-200 ${snapshot.isDraggingOver
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 ring-opacity-50'
                      : 'bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                >
                  <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${status.color}`}>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{status.label}</h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                      {candidatesInStatus.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[100px]">
                    {candidatesInStatus.map((c, index) => (
                      <Draggable key={c.id} draggableId={String(c.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-xl border shadow-sm transition-all ${c.status === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-75'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md cursor-grab active:cursor-grabbing'
                              } ${snapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-500 rotate-2 scale-105 z-50 opacity-100' : ''}`}
                          >
                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {c.name || 'Candidato Anonimo'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{c.email}</div>
                            {c.status === 'rejected' && (
                              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-1.5 rounded-md">
                                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                <span className="leading-tight">{c.rejection_reason || "Non soddisfa i requisiti minimi"}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {candidatesInStatus.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        Trascina qui
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};