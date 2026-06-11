import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Shield } from 'lucide-react';

export function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUsername, setOtherUsername] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: conv } = await supabase
        .from('conversations').select('*').eq('id', id!).single();
      if (conv) {
        const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
        const { data: profile } = await supabase
          .from('profiles').select('username').eq('id', otherId).single();
        setOtherUsername(profile?.username ?? 'Unknown');
      }
      const { data: msgs } = await supabase
        .from('messages').select('*')
        .eq('conversation_id', id!)
        .order('created_at', { ascending: true });
      if (msgs) setMessages(msgs);
      setLoading(false);
    };
    load();
  }, [id, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, payload => {
        setMessages(m => [...m, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const send = async () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({
      conversation_id: id!, sender_id: user.id, content,
    });
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-400 animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Header */}
      <div className="bg-cream/90 backdrop-blur-sm border-b border-plum/5 px-4 py-3 flex items-center gap-3 flex-shrink-0 pt-14">
        <button type="button" aria-label="Go back to chats" onClick={() => navigate('/chats')} className="w-9 h-9 rounded-full bg-ivory flex items-center justify-center shadow-soft">
          <ArrowLeft size={16} className="text-plum"/>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center font-bold text-primary text-sm">
          {otherUsername.slice(0,2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-plum text-sm">@{otherUsername}</p>
          <p className="text-plum/40 text-[10px]">DripLock member</p>
        </div>
      </div>

      {/* Safety banner */}
      <div className="bg-sage/30 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <Shield size={12} className="text-plum/40"/>
        <p className="text-plum/50 text-[10px]">Never share personal info. Buddy system for meetups. Stay safe! 💕</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-plum/40 text-sm">Start the conversation! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? 'bg-gradient-to-r from-primary to-rose-400 text-white rounded-br-sm'
                  : 'bg-ivory text-plum rounded-bl-sm shadow-soft'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-plum/30'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="border-t border-plum/5 px-4 py-3 flex gap-2 flex-shrink-0 bg-cream">
        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="input flex-1"
        />
        <button
          type="button"
          aria-label="Send message"
          onClick={send}
          disabled={!text.trim()}
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-primary to-rose-400 flex items-center justify-center shadow-glow disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} color="white"/>
        </button>
      </div>
    </div>
  );
}