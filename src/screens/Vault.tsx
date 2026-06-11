import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Heart, Truck, ShoppingBag } from 'lucide-react';

const FILTERS = ['All', 'Rent', 'Buy', 'Ships', 'Local'];

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
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', listingId);
      setFavorites(prev => { const n = new Set(prev); n.delete(listingId); return n; });
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listingId });
      setFavorites(prev => new Set(prev).add(listingId));
    }
  };

  const formatPrice = (l: Listing) => {
    if (l.listing_type === 'rent' && l.rental_price_cents) return `$${(l.rental_price_cents / 100).toFixed(0)}/wknd`;
    if (l.listing_type === 'sell' && l.price_cents) return `$${(l.price_cents / 100).toFixed(0)}`;
    if (l.listing_type === 'both') {
      const parts = [];
      if (l.rental_price_cents) parts.push(`Rent $${(l.rental_price_cents / 100).toFixed(0)}`);
      if (l.price_cents) parts.push(`Buy $${(l.price_cents / 100).toFixed(0)}`);
      return parts.join(' · ');
    }
    return 'Price TBD';
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-6 pb-5">
        <h2 className="font-display text-2xl font-bold text-plum mb-0.5">The Vault</h2>
        <p className="text-plum/50 text-xs font-medium mb-3">Shop dresses from girls near you</p>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-plum/30"/>
          <input
            type="text"
            placeholder="Search by color, designer, style..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
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
                ? 'bg-gradient-to-r from-primary to-lavender text-plum shadow-soft'
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
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={22} className="text-primary"/>
            </div>
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
                      <ShoppingBag size={32} className="text-primary/40"/>
                    )}
                    {listing.ships && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Truck size={9} className="text-primary"/>
                        <span className="text-[9px] font-bold text-plum">Ships</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, listing.id)}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-95"
                    >
                      <Heart size={13} fill={isFav ? '#ff9e8e' : 'none'} color={isFav ? '#ff9e8e' : 'rgba(63,42,42,0.25)'}/>
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        listing.listing_type === 'rent' ? 'bg-lavender/80 text-plum' :
                        listing.listing_type === 'sell' ? 'bg-sage text-plum' : 'bg-rose/80 text-plum'
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
