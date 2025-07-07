import { Milestone, Task } from '@/types';

interface MilestonesTabProps {
  milestones: Milestone[];
}

const getStatusColor = (milestone: Milestone) => {
  if (milestone.completedAt) return 'text-green-400 bg-green-500/10 border-green-500/30';
  if (isOverdue(milestone.dueDate, milestone.completedAt)) return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (milestone.progress > 0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
};

const getStatusText = (milestone: Milestone) => {
  if (milestone.completedAt) return 'Completed';
  if (isOverdue(milestone.dueDate, milestone.completedAt)) return 'Overdue';
  if (milestone.progress > 0) return 'In Progress';
  return 'Not Started';
};

const getTaskStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'TODO': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'IN_REVIEW': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'DONE': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'CANCELLED': return 'text-red-400 bg-red-500/20 border-red-500/30';
  }
};

const getTaskPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'LOW': return 'text-green-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'HIGH': return 'text-orange-400';
    case 'URGENT': return 'text-red-400';
  }
};

const getTaskPriorityIcon = (priority: Task['priority']) => {
  switch (priority) {
    case 'LOW': return '🟢';
    case 'MEDIUM': return '🟡';
    case 'HIGH': return '🟠';
    case 'URGENT': return '🔴';
  }
};

const isOverdue = (dueDate: string | null, completedAt: string | null) => {
  if (!dueDate || completedAt) return false;
  return new Date(dueDate) < new Date();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No due date';
  return new Date(dateString).toLocaleDateString();
};

export default function MilestonesTab({ milestones }: MilestonesTabProps) {
  const completedMilestones = milestones.filter(m => m.completedAt);
  const inProgressMilestones = milestones.filter(m => !m.completedAt && m.progress > 0);
  const upcomingMilestones = milestones.filter(m => !m.completedAt && m.progress === 0);
  const averageProgress = milestones.length > 0 ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-400">{completedMilestones.length}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">In Progress</p>
              <p className="text-3xl font-bold text-blue-400">{inProgressMilestones.length}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-yellow-400">{upcomingMilestones.length}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">Avg Progress</p>
              <p className="text-3xl font-bold text-purple-400">{averageProgress}%</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h2 className="text-2xl font-bold text-white">{milestone.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(milestone)}`}>
                    {getStatusText(milestone)}
                  </span>
                </div>
                {milestone.description && (
                <p className="text-zinc-300 text-lg mb-4">{milestone.description}</p>
                )}
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-white font-semibold">{milestone.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        milestone.completedAt 
                          ? 'bg-green-500' 
                          : isOverdue(milestone.dueDate, milestone.completedAt)
                            ? 'bg-red-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>

                {milestone.tasks && milestone.tasks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Tasks</h3>
                      <span className="text-sm text-zinc-400">
                        {milestone.tasks.filter(t => t.status === 'DONE').length} of {milestone.tasks.length} completed
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {milestone.tasks.map((task) => {
                        const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
                        const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
                        
                        return (
                          <div key={task.id} className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="text-sm">{getTaskPriorityIcon(task.priority)}</span>
                                  <h4 className="font-medium text-white">{task.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTaskStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                  </span>
                                </div>
                                
                                {task.description && (
                                  <p className="text-zinc-400 text-sm mb-2 line-clamp-2">{task.description}</p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-zinc-500">
                                  <span className={getTaskPriorityColor(task.priority)}>
                                    {task.priority} Priority
                                  </span>
                                  
                                  {task.dueDate && (
                                    <span className={isOverdue(task.dueDate, task.completedAt) ? 'text-red-400' : ''}>
                                      Due: {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  
                                  {task.estimatedHours && (
                                    <span>Est: {task.estimatedHours}h</span>
                                  )}
                                  
                                  {totalSubtasks > 0 && (
                                    <span>Subtasks: {completedSubtasks}/{totalSubtasks}</span>
                                  )}
                                  
                                  {task._count.comments > 0 && (
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4z" />
                                      </svg>
                                      {task._count.comments}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {totalSubtasks > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-zinc-500">Subtask Progress</span>
                                  <span className="text-zinc-400">{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
                                </div>
                                <div className="w-full bg-zinc-800/50 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-right text-sm text-zinc-400">
                <div>Due: {formatDate(milestone.dueDate)}</div>
                {milestone.completedAt && (
                  <div className="text-green-400">Completed: {formatDate(milestone.completedAt)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {milestones.length === 0 && (
        <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Milestones Set</h3>
            <p className="text-zinc-500">Milestones will appear here as they are created.</p>
          </div>
        </div>
      )}
    </div>
  );
} 