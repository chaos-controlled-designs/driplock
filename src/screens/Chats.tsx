import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Shield } from 'lucide-react';

interface ConversationData {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  listings: { title: string };
  otherUsername: string;
  lastMessage: string;
  lastTime: string;
}

export function Chats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [convos, setConvos] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;
        const { data } = await supabase
          .from('conversations')
          .select('*, listings(title)')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (data) {
          const withNames = await Promise.all(data.map(async (c) => {
            const otherId = c.user_a === user.id ? c.user_b : c.user_a;
            const { data: profile } = await supabase
              .from('profiles').select('username').eq('id', otherId).single();
            const { data: lastMsg } = await supabase
              .from('messages').select('content, created_at')
              .eq('conversation_id', c.id)
              .order('created_at', { ascending: false }).limit(1).single();
            return { ...c, otherUsername: profile?.username ?? 'Unknown', lastMessage: lastMsg?.content ?? 'No messages yet', lastTime: lastMsg?.created_at ?? c.created_at };
          }));
          setConvos(withNames);
        }
      } catch (error) {
        console.error('Load chats error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins/60)}h`;
    return `${Math.floor(mins/1440)}d`;
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="bg-gradient-to-br from-lavender to-blush px-5 pt-6 pb-6">
        <h2 className="font-display text-2xl font-bold text-plum mb-1">Messages</h2>
        <p className="text-plum/60 text-sm">Keep all conversations inside DripLock</p>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-sage/40 rounded-2xl p-3 flex gap-2 items-start mb-4">
          <Shield size={14} className="text-plum/50 flex-shrink-0 mt-0.5"/>
          <p className="text-plum/70 text-xs leading-relaxed">Never share personal contact info. All safe communication stays here.</p>
        </div>

        {convos.length === 0 ? (
          <div className="card text-center py-10">
            <MessageCircle size={40} className="text-plum/20 mx-auto mb-3"/>
            <h3 className="font-semibold text-plum text-sm mb-1">No messages yet</h3>
            <p className="text-plum/50 text-xs mb-4">Find a dress you love and message the seller!</p>
            <button type="button" onClick={() => navigate('/vault')} className="btn-primary">Browse The Vault</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {convos.map(c => (
              <button type="button" key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="card flex items-center gap-3 text-left active:scale-95 transition-all">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center flex-shrink-0 font-bold text-plum text-sm">
                  {c.otherUsername.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-plum text-sm">@{c.otherUsername}</p>
                    <p className="text-plum/30 text-[10px]">{timeAgo(c.lastTime)}</p>
                  </div>
                  {c.listings && <p className="text-primary text-[10px] font-medium mb-0.5 truncate">Re: {c.listings.title}</p>}
                  <p className="text-plum/50 text-xs truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}