import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Listing, CONDITIONS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Truck, MapPin, MessageCircle, Heart, Shield, ShoppingBag } from 'lucide-react';

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

function getPaymentLabel(listing: Listing): string {
  if (listing.listing_type === 'rent') return 'Pay Fee & Rent This Dress';
  if (listing.listing_type === 'sell') return 'Pay Fee & Buy This Dress';
  return 'Pay Platform Fee & Complete Transaction';
}

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*, profiles(username, school_id)')
        .eq('id', id!)
        .single();
      if (data) setListing(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleMessage = async () => {
    if (!listing || !user) return;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user_a.eq.${user.id},user_b.eq.${listing.user_id}),and(user_a.eq.${listing.user_id},user_b.eq.${user.id})`)
      .single();

    if (existing) { navigate(`/chat/${existing.id}`); return; }

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user_a: user.id, user_b: listing.user_id, listing_id: listing.id })
      .select('id').single();

    if (newConv) navigate(`/chat/${newConv.id}`);
  };

  const conditionLabel = (val: string) =>
    CONDITIONS.find(c => c.value === val)?.label ?? val;

  const formatPrice = (cents: number) => `$${(cents/100).toFixed(0)}`;

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="font-semibold text-plum mb-4">Listing not found</p>
      <button type="button" onClick={() => navigate('/vault')} className="btn-primary">Back to Vault</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-32">

      {/* Photo gallery */}
      <div className="relative">
        <div className="w-full aspect-[4/5] bg-gradient-to-br from-blush to-lavender flex items-center justify-center overflow-hidden">
          {listing.photo_urls.length > 0 ? (
            <img src={listing.photo_urls[photoIndex]} alt={listing.title} className="w-full h-full object-cover"/>
          ) : (
            <ShoppingBag size={64} className="text-primary/30"/>
          )}
        </div>

        {/* Back button */}
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-soft"
        >
          <ArrowLeft size={18} className="text-plum"/>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-soft"
        >
          <Heart size={18} className="text-primary"/>
        </button>

        {/* Photo dots */}
        {listing.photo_urls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.photo_urls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setPhotoIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">

        {/* Title + price */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-plum mb-1">{listing.title}</h2>
          {listing.designer && <p className="text-plum/50 text-sm mb-2">{listing.designer}</p>}

          <div className="flex items-center gap-3 flex-wrap">
            {listing.listing_type !== 'sell' && listing.rental_price_cents && (
              <div className="bg-lavender rounded-xl px-3 py-1.5">
                <p className="text-[10px] text-plum/50 font-medium">Rent</p>
                <p className="text-plum font-bold text-sm">{formatPrice(listing.rental_price_cents)}/weekend</p>
              </div>
            )}
            {listing.listing_type !== 'rent' && listing.price_cents && (
              <div className="bg-sage rounded-xl px-3 py-1.5">
                <p className="text-[10px] text-plum/50 font-medium">Buy</p>
                <p className="text-plum font-bold text-sm">{formatPrice(listing.price_cents)}</p>
              </div>
            )}
            {listing.deposit_cents && (
              <div className="bg-blush rounded-xl px-3 py-1.5">
                <p className="text-[10px] text-plum/50 font-medium">Deposit</p>
                <p className="text-plum font-bold text-sm">{formatPrice(listing.deposit_cents)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details card */}
        <div className="card mb-4">
          <h3 className="font-semibold text-plum text-sm mb-3">Dress Details</h3>
          <div className="grid grid-cols-2 gap-y-2">
            {[
              { label: 'Size', value: listing.dress_size },
              { label: 'Color', value: listing.color },
              { label: 'Silhouette', value: listing.silhouette },
              { label: 'Category', value: listing.category },
              { label: 'Condition', value: listing.condition ? conditionLabel(listing.condition) : null },
            ].filter(d => d.value).map(d => (
              <div key={d.label}>
                <p className="text-plum/40 text-[10px] font-semibold uppercase tracking-wider">{d.label}</p>
                <p className="text-plum text-xs font-medium">{d.value}</p>
              </div>
            ))}
          </div>
          {(listing.bust_inches || listing.waist_inches || listing.hips_inches) && (
            <div className="mt-3 pt-3 border-t border-plum/5">
              <p className="text-plum/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Measurements</p>
              <div className="flex gap-4">
                {listing.bust_inches && <div><p className="text-plum/40 text-[10px]">Bust</p><p className="text-plum text-xs font-medium">{listing.bust_inches}"</p></div>}
                {listing.waist_inches && <div><p className="text-plum/40 text-[10px]">Waist</p><p className="text-plum text-xs font-medium">{listing.waist_inches}"</p></div>}
                {listing.hips_inches && <div><p className="text-plum/40 text-[10px]">Hips</p><p className="text-plum text-xs font-medium">{listing.hips_inches}"</p></div>}
              </div>
            </div>
          )}
        </div>

        {/* Shipping / meetup */}
        <div className="card mb-4">
          <h3 className="font-semibold text-plum text-sm mb-3">Pickup Options</h3>
          {listing.ships && (
            <div className="flex items-center gap-2 mb-2">
              <Truck size={16} className="text-primary"/>
              <div>
                <p className="text-plum text-xs font-semibold">Ships Nationwide</p>
                <p className="text-plum/50 text-[10px]">$2.99 shipping fee · address protected</p>
              </div>
            </div>
          )}
          {listing.local_meetup && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary"/>
              <div>
                <p className="text-plum text-xs font-semibold">Local Meetup Available</p>
                <p className="text-plum/50 text-[10px]">Buddy system required · public place only</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <div className="card mb-4">
            <h3 className="font-semibold text-plum text-sm mb-2">Description</h3>
            <p className="text-plum/60 text-xs leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Safety checklist before messaging */}
        {showSafety ? (
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-primary"/>
              <h3 className="font-semibold text-plum text-sm">Safety Checklist</h3>
            </div>
            {[
              'I will bring a friend to any in-person meetup',
              'I will meet in a public place (mall, coffee shop, etc.)',
              'I will not share my home address',
              'I told a trusted adult where I am going',
            ].map((rule, i) => (
              <label key={i} className="flex items-start gap-2 mb-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-primary" onChange={e => {
                  if (i === 3 && e.target.checked) setSafetyChecked(true);
                }}/>
                <span className="text-plum/70 text-xs">{rule}</span>
              </label>
            ))}
            <button type="button" onClick={handleMessage} disabled={!safetyChecked} className="btn-primary mt-3">
              Message Seller
            </button>
          </div>
        ) : (
          listing.user_id !== user?.id && (
            <button
              type="button"
              onClick={() => setShowSafety(true)}
              className="w-full bg-gradient-to-r from-primary to-lavender text-plum font-semibold py-4 rounded-2xl shadow-soft flex items-center justify-center gap-2 active:scale-95 transition-all mb-3"
            >
              <MessageCircle size={18}/>
              Message Seller
            </button>
          )
        )}

        {/* Payment button — shown to buyer only */}
        {listing.user_id !== user?.id && (
          <div className="card mb-4">
            <p className="font-bold text-plum text-sm mb-1">Ready to make it official?</p>
            <p className="text-plum/50 text-xs mb-4 leading-relaxed">
              A small platform fee covers transaction support and keeps both parties protected.
            </p>
            {paid ? (
              <div className="bg-sage/40 rounded-2xl px-4 py-4 text-center">
                <p className="font-bold text-plum text-sm mb-0.5">Payment started!</p>
                <p className="text-plum/55 text-xs leading-relaxed">
                  Complete checkout in the new tab, then message the seller to confirm.
                </p>
              </div>
            ) : (
              <a
                href={getPaymentLink(listing)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPaid(true)}
                className="block w-full py-4 rounded-2xl text-center font-bold text-sm text-plum active:scale-95 transition-all shadow-medium"
                style={{ background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }}
              >
                {getPaymentLabel(listing)}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
