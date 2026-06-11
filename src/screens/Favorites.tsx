import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Heart, Truck, ShoppingBag } from 'lucide-react';

interface Wishlist {
  listing_id: string;
  listings: Listing | Listing[];
}

export function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('wishlists')
        .select('listing_id, listings(*, profiles(username, school_id))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        const extractedListings = data.map((w: Wishlist) => {
          const listing = Array.isArray(w.listings) ? w.listings[0] : w.listings;
          return listing;
        }).filter(Boolean);
        setListings(extractedListings);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  const removeFavorite = async (listingId: string) => {
    if (!user) return;
    await supabase.from('wishlists').delete()
      .eq('user_id', user.id).eq('listing_id', listingId);
    setListings(l => l.filter(item => item.id !== listingId));
  };

  const formatPrice = (l: Listing) => {
    if (l.listing_type === 'rent' && l.rental_price_cents)
      return `$${(l.rental_price_cents / 100).toFixed(0)}/weekend`;
    if (l.listing_type === 'sell' && l.price_cents)
      return `$${(l.price_cents / 100).toFixed(0)}`;
    if (l.listing_type === 'both') {
      const parts = [];
      if (l.rental_price_cents) parts.push(`Rent $${(l.rental_price_cents / 100).toFixed(0)}`);
      if (l.price_cents) parts.push(`Buy $${(l.price_cents / 100).toFixed(0)}`);
      return parts.join(' · ');
    }
    return 'Price TBD';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-cream">
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-4 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <div className="flex items-center gap-2">
          <Heart size={22} color="#d4789a" fill="#d4789a"/>
          <h2 className="font-display text-2xl font-bold text-plum">My Favorites</h2>
        </div>
        <p className="text-plum/50 text-sm mt-1">
          {listings.length} saved dress{listings.length !== 1 ? 'es' : ''}
        </p>
      </div>

      <div className="px-4 pt-4">
        {listings.length === 0 ? (
          <div className="card text-center py-12">
            <Heart size={48} color="rgba(63,42,47,0.15)" className="mx-auto mb-4"/>
            <h3 className="font-display text-lg font-semibold text-plum mb-2">No favorites yet</h3>
            <p className="text-plum/50 text-sm mb-6">
              Tap the heart on any dress in The Vault to save it here!
            </p>
            <button type="button" onClick={() => navigate('/vault')} className="btn-primary mx-auto" style={{ maxWidth: 200 }}>
              Browse The Vault
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map(listing => (
              <div key={listing.id} className="card p-0 overflow-hidden cursor-pointer active:scale-95 transition-all">
                <div
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="w-full aspect-[3/4] bg-gradient-to-br from-blush to-lavender flex items-center justify-center relative"
                >
                  {listing.photo_urls?.length > 0 ? (
                    <img src={listing.photo_urls[0]} alt={listing.title} className="w-full h-full object-cover"/>
                  ) : (
                    <ShoppingBag size={28} className="text-primary/40"/>
                  )}
                  {listing.ships && (
                    <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Truck size={10} className="text-primary"/>
                      <span className="text-[9px] font-semibold text-plum">Ships</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFavorite(listing.id); }}
                    aria-label="Remove from favorites"
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center active:scale-95 transition-all border-none cursor-pointer"
                  >
                    <Heart size={14} color="#d4789a" fill="#d4789a"/>
                  </button>
                </div>
                <div onClick={() => navigate(`/listing/${listing.id}`)} className="p-3">
                  <p className="font-semibold text-plum text-xs leading-tight mb-1 line-clamp-2">{listing.title}</p>
                  {listing.designer && <p className="text-plum/40 text-[10px] mb-1">{listing.designer}</p>}
                  <p className="text-plum/50 text-[10px] mb-2">Size {listing.dress_size}</p>
                  <p className="text-primary font-bold text-xs">{formatPrice(listing)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}