import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Listing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, ShoppingBag } from 'lucide-react';

export function Market() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setListings(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleAvailable = async (id: string, current: boolean) => {
    await supabase.from('listings').update({ is_available: !current }).eq('id', id);
    setListings(l => l.map(item => item.id === id ? { ...item, is_available: !current } : item));
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings(l => l.filter(item => item.id !== id));
  };

  const formatPrice = (l: Listing) => {
    if (l.listing_type === 'rent' && l.rental_price_cents) return `$${(l.rental_price_cents/100).toFixed(0)}/wknd`;
    if (l.listing_type === 'sell' && l.price_cents) return `$${(l.price_cents/100).toFixed(0)}`;
    return 'Rent + Buy';
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blush via-cream to-lavender px-5 pt-6 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-plum mb-1">Cash In</h2>
            <p className="text-plum/50 text-sm">{listings.length} dress{listings.length !== 1 ? 'es' : ''} listed</p>
          </div>
          <button type="button" onClick={() => navigate('/new-listing')} className="flex items-center gap-2 bg-gradient-to-r from-primary to-lavender text-plum px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft active:scale-95 transition-all">
            <Plus size={16}/> Add Dress
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">

        {/* Earnings banner */}
        <div className="rounded-3xl p-5 mb-5 bg-gradient-to-r from-blush via-lavender to-blush border border-primary/15 shadow-medium">
          <p className="text-plum/50 text-xs font-semibold uppercase tracking-wider mb-1">Potential Earnings</p>
          <p className="font-display text-4xl font-bold text-plum mb-0.5">
            ${listings.reduce((sum, l) => sum + (l.rental_price_cents ?? l.price_cents ?? 0) / 100, 0).toFixed(0)}
          </p>
          <p className="text-plum/50 text-xs">across {listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>

        {listings.length === 0 ? (
          <div className="card text-center py-10">
            <div className="w-16 h-16 rounded-3xl bg-blush flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-primary"/>
            </div>
            <h3 className="font-display text-lg font-semibold text-plum mb-2">No listings yet</h3>
            <p className="text-plum/50 text-sm mb-6">List last year's dress and earn cash back on your closet!</p>
            <button type="button" onClick={() => navigate('/new-listing')} className="btn-primary">List My First Dress</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-3xl border border-primary/10 shadow-medium flex gap-4 p-4">
                {/* Photo */}
                <div className="w-24 h-28 rounded-2xl bg-gradient-to-br from-blush to-lavender flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {listing.photo_urls.length > 0 ? (
                    <img src={listing.photo_urls[0]} alt={listing.title} className="w-full h-full object-cover"/>
                  ) : (
                    <ShoppingBag size={24} className="text-primary/40"/>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-plum text-sm leading-tight mb-0.5 line-clamp-1">{listing.title}</p>
                  <p className="text-plum/40 text-xs mb-1">Size {listing.dress_size}</p>
                  <p className="text-primary font-bold text-sm mb-2">{formatPrice(listing)}</p>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${listing.is_available ? 'bg-sage text-plum' : 'bg-plum/10 text-plum/40'}`}>
                      {listing.is_available ? 'Active' : 'Hidden'}
                    </span>
                    <button
                      type="button"
                      aria-label={listing.is_available ? 'Hide listing' : 'Show listing'}
                      onClick={() => toggleAvailable(listing.id, listing.is_available)}
                      className="text-plum/30 hover:text-plum transition-colors"
                    >
                      {listing.is_available ? <Eye size={14}/> : <EyeOff size={14}/>}
                    </button>
                    <button
                      type="button"
                      aria-label="View listing"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                      className="text-plum/30 hover:text-primary transition-colors"
                    >
                      <Edit size={14}/>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete listing"
                      onClick={() => deleteListing(listing.id)}
                      className="text-plum/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
