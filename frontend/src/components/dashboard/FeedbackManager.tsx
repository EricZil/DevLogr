import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface Feedback {
  id: string;
  message: string;
  rating: number;
  category: 'GENERAL' | 'FEATURE_REQUEST' | 'IMPROVEMENT' | 'PRAISE';
  submittedBy: string;
  createdAt: string;
}

interface FeedbackManagerProps {
  projectId: string;
}



const getCategoryColor = (category: Feedback['category']) => {
  switch (category) {
    case 'FEATURE_REQUEST': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'IMPROVEMENT': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'PRAISE': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'GENERAL': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes>1?'s':''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours>1?'s':''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days>1?'s':''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months>1?'s':''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years>1?'s':''} ago`;
}

export default function FeedbackManager({ projectId }: FeedbackManagerProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const { error } = useNotification();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      username: string;
      avatar?: string;
    };
  }[]>>({});
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = api.getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?id=${projectId}&action=feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setFeedback(responseData.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (id: string) => {
    try {
      const token = api.getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback?id=${id}&action=comments`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setCommentsMap(prev => ({ ...prev, [id]: responseData.data }));
        }
      }
    } catch (err) { console.error(err); }
  };

  const addComment = async (id: string) => {
    if (!commentInput.trim()) return;
    try {
      const token = api.getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback?id=${id}&action=comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ content: commentInput.trim() })
      });
      if (res.ok) {
        setCommentInput('');
        fetchComments(id);
      }
    } catch (err) { console.error(err); }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      const token = api.getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        setFeedback(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) { console.error(err); }
  };

  const filteredAndSorted = feedback
    .filter(item => {
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (filterRating !== 'ALL' && item.rating !== parseInt(filterRating)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating_high': return b.rating - a.rating;
        case 'rating_low': return a.rating - b.rating;
        default: return 0;
      }
    });

  const averageRating = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;
  const ratingDistribution = [5,4,3,2,1].map(r => feedback.filter(f => f.rating === r).length);

  if (loading) {
    return (
      <div className="text-center py-16 text-zinc-400">Loading feedback...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 p-6 border border-white/10 rounded-2xl">
          <p className="text-sm text-zinc-400 mb-1">Total Reviews</p>
          <p className="text-3xl font-bold text-white">{feedback.length}</p>
        </div>
        <div className="bg-black/40 p-6 border border-white/10 rounded-2xl">
          <p className="text-sm text-zinc-400 mb-1">Average Rating</p>
          <p className="text-3xl font-bold text-yellow-400">{averageRating.toFixed(1)}</p>
        </div>
        <div className="bg-black/40 p-6 border border-white/10 rounded-2xl">
          <p className="text-sm text-zinc-400 mb-1">5★ Reviews</p>
          <p className="text-3xl font-bold text-green-400">{ratingDistribution[0]}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-zinc-400 font-medium">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="ALL">All</option>
              <option value="GENERAL">General</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="IMPROVEMENT">Improvement</option>
              <option value="PRAISE">Praise</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-zinc-400 font-medium">Rating:</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="ALL">All</option>
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-400 font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="rating_high">Rating High → Low</option>
            <option value="rating_low">Rating Low → High</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSorted.map(item => (
          <div key={item.id} className="bg-black/30 border border-white/5 rounded-xl p-6 flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
              {(item.submittedBy ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{item.submittedBy ?? 'Anonymous'}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>{item.category.replace('_',' ')}</span>
                  <span className="text-sm text-yellow-400">{'★'.repeat(item.rating)}</span>
                  <button onClick={() => deleteFeedback(item.id)} className="text-red-400 hover:text-red-300 ml-2 text-xs">Delete</button>
                </div>
                <span className="text-xs text-zinc-500 bg-black/30 px-2 py-1 rounded-lg">{relativeTime(item.createdAt)}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-line">{item.message}</p>
              {(commentsMap[item.id]?.length ?? 0) > 0 && (
                <button onClick={() => {
                  setExpanded(prev => {
                    const s = new Set(prev); 
                    if (s.has(item.id)) {
                      s.delete(item.id);
                    } else {
                      s.add(item.id);
                    }
                    return s;
                  });
                  if (!commentsMap[item.id]) fetchComments(item.id);
                }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/20 px-2 py-1 rounded-lg ml-2">
                  {expanded.has(item.id)?'Hide':'Show'} Comments
                </button>
              )}
              {expanded.has(item.id) && (
                <div className="mt-4 space-y-4">
                  {commentsMap[item.id]?.map(c=>(
                    <div key={c.id} className="bg-black/20 p-3 rounded-lg text-sm text-zinc-300">
                      <span className="font-semibold text-white mr-2">{c.user?.name || c.user?.username}</span>
                      <span className="text-xs text-zinc-500">{relativeTime(c.createdAt)}</span>
                      <p className="mt-1">{c.content}</p>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder="Add comment" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                    <button onClick={()=>addComment(item.id)} className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm">Send</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSorted.length === 0 && feedback.length > 0 && (
        <div className="text-center py-16 text-zinc-500">No feedback matches your filters.</div>
      )}
      {feedback.length === 0 && (
        <div className="text-center py-16 text-zinc-500">No feedback yet.</div>
      )}
    </div>
  );
} 