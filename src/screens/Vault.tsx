import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Heart, Truck, ShoppingBag, SlidersHorizontal } from 'lucide-react';

const FILTERS = ['All', 'Rent', 'Buy', 'Ships', 'Local'];

// Card background + border based on VIP status and theme
function cardBgClass(isVip: boolean, theme?: string | null): string {
  if (isVip) {
    switch (theme) {
      case 'blush-dream':   return 'bg-[linear-gradient(135deg,#ffdde1,#ffc2c7)] border border-pink-200';
      case 'soft-glow':     return 'bg-[linear-gradient(135deg,#f5e6ff,#e9d5f5)] border border-purple-200';
      case 'luxe-rose':     return 'bg-[linear-gradient(135deg,#fff0f3,#ffd6da)] border border-rose-200';
      case 'midnight':      return 'bg-[linear-gradient(135deg,#2d1b3d,#1a1025)] border border-purple-900/50';
      case 'champagne':     return 'bg-[linear-gradient(135deg,#fef9e7,#f5e6c8)] border border-yellow-200';
      case 'sage':          return 'bg-[linear-gradient(135deg,#e8f5e9,#c8e6c9)] border border-green-200';
      case 'ice-blue':      return 'bg-[linear-gradient(135deg,#e3f2fd,#bbdefb)] border border-blue-200';
      case 'peach-glow':    return 'bg-[linear-gradient(135deg,#fff3e0,#ffccbc)] border border-orange-200';
      // legacy theme ids (backward compat)
      case 'minimal':       return 'bg-white border border-rose-200';
      case 'soft-gradient': return 'bg-[linear-gradient(135deg,#fdf0ff,#e9d5f5)] border border-pink-100';
      case 'dark-luxury':   return 'bg-[linear-gradient(135deg,#2d1b3d,#1a1025)] border border-purple-800/50';
      default:              return 'bg-white border border-primary/25';
    }
  }
  return 'bg-white border border-transparent';
}
function cardShadowClass(isVip: boolean): string {
  return isVip ? 'shadow-[0_4px_24px_rgba(255,193,184,0.35)]' : 'shadow-medium';
}
const DARK_THEMES = new Set(['midnight', 'dark-luxury']);
function themeTextClass(theme?: string | null)  { return DARK_THEMES.has(theme ?? '') ? 'text-white'    : 'text-plum'; }
function themeMutedClass(theme?: string | null) { return DARK_THEMES.has(theme ?? '') ? 'text-white/45' : 'text-plum/35'; }
function themePriceClass(theme?: string | null) { return DARK_THEMES.has(theme ?? '') ? 'text-pink-300' : 'text-primary'; }

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
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('listings')
          .select('*, profiles(username, school_id)')
          .eq('is_available', true)
          .order('is_vip_listing', { ascending: false })
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
    // VIP listings always float to the top even after client-side filtering
    result.sort((a, b) => (b.is_vip_listing ? 1 : 0) - (a.is_vip_listing ? 1 : 0));
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
      if (l.rental_price_cents) parts.push(`$${(l.rental_price_cents / 100).toFixed(0)} rent`);
      if (l.price_cents) parts.push(`$${(l.price_cents / 100).toFixed(0)} buy`);
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
    <div className="min-h-screen bg-cream pb-28">

      {/* Header */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-6 pb-6 rounded-b-[28px]">
        <h2 className="font-display text-2xl font-bold text-plum mb-1">The Vault</h2>
        <p className="text-plum/50 text-xs font-medium mb-5">Shop prom dresses from girls near you</p>

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/30"/>
            <input
              type="text"
              placeholder="Color, designer, style..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 pr-4"
            />
          </div>
          <button
            type="button"
            aria-label="Filters"
            onClick={() => filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all active:scale-95 ${
              activeFilter !== 'All'
                ? 'bg-plum border-plum hover:bg-plum/90'
                : 'bg-white/80 border-primary/20 hover:bg-blush/70 hover:border-primary/40'
            }`}
          >
            <SlidersHorizontal size={17} className={activeFilter !== 'All' ? 'text-white' : 'text-plum/60'}/>
            {activeFilter !== 'All' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"/>
            )}
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div ref={filtersRef} className="flex gap-2.5 overflow-x-auto px-5 py-4 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === f
                ? 'bg-plum text-white shadow-soft'
                : 'bg-white text-plum/55 border border-plum/10 hover:bg-blush/70 hover:border-plum/20 transition-all'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5">
        <p className="text-plum/35 text-[11px] font-semibold uppercase tracking-wider mb-3">
          {filtered.length} {filtered.length === 1 ? 'dress' : 'dresses'} available
        </p>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-medium text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-primary"/>
            </div>
            <p className="font-display font-semibold text-plum text-base mb-1.5">No dresses found</p>
            <p className="text-plum/45 text-xs">Try a different filter or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(listing => {
              const isFav  = favorites.has(listing.id);
              const isVip  = !!listing.is_vip_listing;
              const theme  = listing.listing_theme ?? null;
              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className={`rounded-3xl overflow-hidden active:scale-[0.97] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${cardBgClass(isVip, theme)} ${cardShadowClass(isVip)}`}
                >
                  {/* Full-bleed photo — taller aspect */}
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-blush to-lavender relative overflow-hidden">
                    {listing.photo_urls?.length > 0 ? (
                      <img
                        src={listing.photo_urls[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag size={36} className="text-primary/25"/>
                      </div>
                    )}

                    {/* VIP badge — top left (overrides ships badge placement) */}
                    {isVip ? (
                      <div className="absolute top-2.5 left-2.5 bg-plum/75 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <span className="text-[9px] font-bold text-white tracking-widest uppercase">VIP</span>
                      </div>
                    ) : listing.ships ? (
                      <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Truck size={9} className="text-primary"/>
                        <span className="text-[9px] font-bold text-plum">Ships</span>
                      </div>
                    ) : null}

                    {/* Ships badge below VIP badge if both apply */}
                    {isVip && listing.ships && (
                      <div className="absolute top-9 left-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Truck size={9} className="text-primary"/>
                        <span className="text-[9px] font-bold text-plum">Ships</span>
                      </div>
                    )}

                    {/* Fav button — top right */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, listing.id)}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-90"
                    >
                      <Heart size={14} fill={isFav ? '#ff9e8e' : 'none'} color={isFav ? '#ff9e8e' : 'rgba(63,42,42,0.25)'}/>
                    </button>

                    {/* Rent/Buy badge — bottom left */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                        listing.listing_type === 'rent' ? 'bg-lavender/90 text-plum' :
                        listing.listing_type === 'sell' ? 'bg-sage/90 text-plum' : 'bg-primary/85 text-plum'
                      }`}>
                        {listing.listing_type === 'both' ? 'Rent & Buy' : listing.listing_type === 'rent' ? 'Rent' : 'Buy'}
                      </span>
                    </div>
                  </div>

                  {/* Info — compact but breathable */}
                  <div className="p-4">
                    <p className={`font-semibold text-sm leading-snug line-clamp-1 mb-1.5 ${themeTextClass(theme)}`}>
                      {listing.title}
                    </p>
                    {listing.designer && (
                      <p className={`text-[10px] mb-1 truncate ${themeMutedClass(theme)}`}>{listing.designer}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-[10px] ${themeMutedClass(theme)}`}>Size {listing.dress_size}</p>
                      <p className={`font-bold text-base ${themePriceClass(theme)}`}>{formatPrice(listing)}</p>
                    </div>
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
