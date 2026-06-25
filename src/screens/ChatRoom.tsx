import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Message, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Shield } from 'lucide-react';

const STRIPE_LINKS = {
  low:      'https://buy.stripe.com/00wfZafgFgAzdSZ9dggYU00',  // $8.99
  standard: 'https://buy.stripe.com/5kQeV62tT8436qx758gYU02',  // $10.99
  premium:  'https://buy.stripe.com/fZu4gs3xXbgf2ah2OSgYU01',  // $15.99
};

function getPaymentLink(listing: Listing): string {
  if (listing.listing_type === 'rent') return STRIPE_LINKS.low;
  const cents = listing.price_cents ?? 0;
  if (cents >= 10000) return STRIPE_LINKS.premium;
  return STRIPE_LINKS.standard;
}

export function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [otherUsername, setOtherUsername] = useState('');
  const [listing,       setListing]       = useState<Listing | null>(null);
  const [text,          setText]          = useState('');
  const [loading,       setLoading]       = useState(true);
  const [paid,          setPaid]          = useState(false);
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
        if (conv.listing_id) {
          const { data: lst } = await supabase
            .from('listings').select('*').eq('id', conv.listing_id).single();
          if (lst) setListing(lst as Listing);
        }
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
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Header */}
      <div className="bg-cream/90 backdrop-blur-sm border-b border-plum/5 px-4 py-3 flex items-center gap-3 flex-shrink-0 pt-14">
        <button type="button" aria-label="Go back to chats" onClick={() => navigate('/chats')} className="w-9 h-9 rounded-full bg-ivory flex items-center justify-center shadow-soft">
          <ArrowLeft size={16} className="text-plum"/>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center font-bold text-plum text-sm">
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
        <p className="text-plum/50 text-[10px]">Never share personal info. Buddy system for meetups. Stay safe!</p>
      </div>

      {/* Payment bar — shown when a listing is attached to this chat */}
      {listing && (
        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 border-b border-primary/10 bg-[linear-gradient(135deg,#fff0eb_0%,#ffd4c4_60%)]">
          <div className="flex-1 min-w-0">
            <p className="text-plum font-semibold text-xs leading-tight line-clamp-1">{listing.title}</p>
            <p className="text-plum/50 text-[10px] mt-0.5">
              {listing.listing_type === 'rent' ? 'Platform fee: $8.99' : listing.listing_type === 'sell' && (listing.price_cents ?? 0) >= 10000 ? 'Platform fee: $15.99' : 'Platform fee: $10.99'}
            </p>
          </div>
          {paid ? (
            <span className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 bg-sage text-plum rounded-full">
              Payment sent!
            </span>
          ) : (
            <a
              href={getPaymentLink(listing)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPaid(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-plum text-xs font-bold active:scale-95 transition-all shadow-soft whitespace-nowrap bg-[#ffc1b8]"
            >
              Pay Fee →
            </a>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-plum/40 text-sm">Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? 'bg-gradient-to-r from-primary to-lavender text-plum rounded-br-sm'
                  : 'bg-ivory text-plum rounded-bl-sm shadow-soft'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-plum/50' : 'text-plum/30'}`}>
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
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-primary to-lavender flex items-center justify-center shadow-glow disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} color="#3f2a2a"/>
        </button>
      </div>
    </div>
  );
}