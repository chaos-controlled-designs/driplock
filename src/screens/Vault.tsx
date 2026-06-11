import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Heart, Truck, Sparkles } from 'lucide-react';

const FILTERS = ['All', 'Rent', 'Buy', 'Ships', 'Local'];

const STORIES = [
  { emoji: '👑', label: 'Prom' },
  { emoji: '🌟', label: 'Homecoming' },
  { emoji: '✨', label: 'Cocktail' },
  { emoji: '💖', label: 'New Tags' },
  { emoji: '💸', label: 'Under $50' },
];

interface WishItem {
  listing_id: string;
}

export function Vault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('listings')
          .select('*, profiles(username, school_id)')
          .eq('is_available', true)
          .order('created_at', { ascending: false });
        if (data) { setListings(data); setFiltered(data); }

        if (user) {
          const { data: wishData } = await supabase
            .from('wishlists')
            .select('listing_id')
            .eq('user_id', user.id);
          if (wishData) {
            setFavorites(new Set(wishData.map((w: WishItem) => w.listing_id)));
          }
        }
      } catch (error) {
        console.error('Load vault error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    let result = [...listings];
    if (search) result = result.filter(l =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.designer?.toLowerCase().includes(search.toLowerCase()) ||
      l.color?.toLowerCase().includes(search.toLowerCase())
    );
    if (activeFilter === 'Rent')  result = result.filter(l => l.listing_type === 'rent' || l.listing_type === 'both');
    if (activeFilter === 'Buy')   result = result.filter(l => l.listing_type === 'sell' || l.listing_type === 'both');
    if (activeFilter === 'Ships') result = result.filter(l => l.ships);
    if (activeFilter === 'Local') result = result.filter(l => l.local_meetup);
    setFiltered(result);
  }, [listings, search, activeFilter]);

  const toggleFavorite = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (favorites.has(listingId)) {
      await supabase.from('wishlists').delete()
        .eq('user_id', user.id).eq('listing_id', listingId);
      setFavorites(prev => { const n = new Set(prev); n.delete(listingId); return n; });
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listingId });
      setFavorites(prev => new Set(prev).add(listingId));
    }
  };

  const formatPrice = (l: Listing) => {
    if (l.listing_type === 'rent' && l.rental_price_cents) return `$${(l.rental_price_cents/100).toFixed(0)}/wknd`;
    if (l.listing_type === 'sell' && l.price_cents) return `$${(l.price_cents/100).toFixed(0)}`;
    if (l.listing_type === 'both') {
      const parts = [];
      if (l.rental_price_cents) parts.push(`Rent $${(l.rental_price_cents/100).toFixed(0)}`);
      if (l.price_cents) parts.push(`Buy $${(l.price_cents/100).toFixed(0)}`);
      return parts.join(' · ');
    }
    return 'Price TBD';
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blush via-cream to-lavender px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-plum">The Vault</h2>
            <p className="text-plum/50 text-xs font-medium">Dresses from girls near you ✨</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={15} color="white"/>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-plum/30"/>
          <input
            type="text"
            placeholder="Search color, designer, style..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Stories / Browse-by row */}
      <div className="flex gap-4 overflow-x-auto px-4 pt-3 pb-1 no-scrollbar">
        {STORIES.map(s => (
          <button key={s.label} type="button" className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center text-2xl border-2 border-white shadow-soft">
              {s.emoji}
            </div>
            <span className="text-[10px] font-semibold text-plum/60 whitespace-nowrap">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === f
                ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-glow'
                : 'bg-white text-plum/60 border border-primary/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4">
        <p className="text-plum/40 text-xs font-medium mb-3">{filtered.length} dresses available</p>

        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">👗</div>
            <p className="font-semibold text-plum text-sm mb-1">No dresses found</p>
            <p className="text-plum/50 text-xs">Try a different filter or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(listing => {
              const isFav = favorites.has(listing.id);
              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="bg-white rounded-3xl overflow-hidden shadow-soft border border-primary/10 active:scale-95 transition-all cursor-pointer"
                >
                  {/* Image */}
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-blush to-lavender flex items-center justify-center relative">
                    {listing.photo_urls?.length > 0 ? (
                      <img src={listing.photo_urls[0]} alt={listing.title} className="w-full h-full object-cover"/>
                    ) : (
                      <span className="text-4xl">👗</span>
                    )}
                    {listing.ships && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 shadow-soft">
                        <Truck size={9} className="text-primary"/>
                        <span className="text-[9px] font-bold text-plum">Ships</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, listing.id)}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-95 shadow-soft"
                    >
                      <Heart size={13} fill={isFav ? '#ec4899' : 'none'} color={isFav ? '#ec4899' : '#2D1B3540'}/>
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        listing.listing_type === 'rent' ? 'bg-lavender text-plum' :
                        listing.listing_type === 'sell' ? 'bg-sage text-plum' : 'bg-blush text-plum'
                      }`}>
                        {listing.listing_type === 'both' ? 'Rent or Buy' : listing.listing_type === 'rent' ? 'Rent' : 'Buy'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-plum text-xs leading-tight mb-0.5 line-clamp-1">{listing.title}</p>
                    {listing.designer && <p className="text-plum/40 text-[10px]">{listing.designer}</p>}
                    <p className="text-plum/40 text-[10px] mb-1.5">Size {listing.dress_size}</p>
                    <p className="font-bold text-xs text-primary">{formatPrice(listing)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
