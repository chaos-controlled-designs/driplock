import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Listing, CONDITIONS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Truck, MapPin, MessageCircle, Heart, Shield, ShoppingBag, X } from 'lucide-react';

const STRIPE_LINKS = {
  low:      'https://buy.stripe.com/00wfZafgFgAzdSZ9dggYU00',  // $8.99
  standard: 'https://buy.stripe.com/5kQeV62tT8436qx758gYU02',  // $10.99
  premium:  'https://buy.stripe.com/fZu4gs3xXbgf2ah2OSgYU01',  // $15.99
};

function getStripeLink(listing: Listing, type: 'rent' | 'buy'): string {
  if (type === 'rent') return STRIPE_LINKS.low;
  const cents = listing.price_cents ?? 0;
  if (cents >= 10000) return STRIPE_LINKS.premium;
  return STRIPE_LINKS.standard;
}

function getPlatformFee(listing: Listing, type: 'rent' | 'buy'): number {
  if (type === 'rent') return 8.99;
  const cents = listing.price_cents ?? 0;
  if (cents >= 10000) return 15.99;
  return 10.99;
}

function getAutoMessage(type: 'rent' | 'buy', title: string): string {
  if (type === 'rent') {
    return `Platform fee paid for "${title}"!\n\nNext steps:\n\nSeller — please ship the dress within 2 days. Share your tracking number here.\n\nBuyer — send your shipping address in this chat.\n\nThe dress must be returned within 7 days after prom in the same condition it was received.\n\nKeep all communication here for everyone's protection!`;
  }
  return `Platform fee paid for "${title}"!\n\nNext steps:\n\nSeller — please ship the dress within 3 days. Share your tracking number here.\n\nBuyer — send your shipping address in this chat. Message here within 48 hours of receiving if there are any issues.\n\nEnjoy your dress!`;
}

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing,       setListing]       = useState<Listing | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [photoIndex,    setPhotoIndex]    = useState(0);
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [showSafety,    setShowSafety]    = useState(false);
  const [checkoutType,  setCheckoutType]  = useState<'rent' | 'buy' | null>(null);
  const [checkoutDone,  setCheckoutDone]  = useState(false);

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

  const getOrCreateConversation = async (): Promise<string | null> => {
    if (!listing || !user) return null;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user_a.eq.${user.id},user_b.eq.${listing.user_id}),and(user_a.eq.${listing.user_id},user_b.eq.${user.id})`)
      .single();
    if (existing) return existing.id;
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user_a: user.id, user_b: listing.user_id, listing_id: listing.id })
      .select('id').single();
    return newConv?.id ?? null;
  };

  const handleMessage = async () => {
    const convId = await getOrCreateConversation();
    if (convId) navigate(`/chat/${convId}`);
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutType || !listing || !user) return;
    setCheckoutDone(true);
    try {
      const convId = await getOrCreateConversation();
      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_id: user.id,
          content: getAutoMessage(checkoutType, listing.title),
        });
      }
    } catch {
      // Stripe link still opens — message failure is non-critical
    }
  };

  const conditionLabel = (val: string) =>
    CONDITIONS.find(c => c.value === val)?.label ?? val;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

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

  const canRent = listing.listing_type !== 'sell' && !!listing.rental_price_cents;
  const canBuy  = listing.listing_type !== 'rent' && !!listing.price_cents;
  const isOwner = listing.user_id === user?.id;

  return (
    <div className="min-h-screen bg-cream pb-32">

      {/* ── Photo gallery ── */}
      <div className="relative">
        <div className="w-full aspect-[4/5] bg-gradient-to-br from-blush to-lavender flex items-center justify-center overflow-hidden">
          {listing.photo_urls.length > 0 ? (
            <img src={listing.photo_urls[photoIndex]} alt={listing.title} className="w-full h-full object-cover"/>
          ) : (
            <ShoppingBag size={64} className="text-primary/30"/>
          )}
        </div>

        <button type="button" aria-label="Go back" onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-soft">
          <ArrowLeft size={18} className="text-plum"/>
        </button>

        <button type="button" aria-label="Add to wishlist"
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-soft">
          <Heart size={18} className="text-primary"/>
        </button>

        {listing.photo_urls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.photo_urls.map((_, i) => (
              <button key={i} type="button" aria-label={`Photo ${i + 1}`}
                onClick={() => setPhotoIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">

        {/* ── Title + price pills ── */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-plum mb-1">{listing.title}</h2>
          {listing.designer && <p className="text-plum/50 text-sm mb-2">{listing.designer}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            {canRent && (
              <div className="bg-lavender rounded-xl px-3 py-1.5">
                <p className="text-[10px] text-plum/50 font-medium">Rent</p>
                <p className="text-plum font-bold text-sm">{formatPrice(listing.rental_price_cents!)}/weekend</p>
              </div>
            )}
            {canBuy && (
              <div className="bg-sage rounded-xl px-3 py-1.5">
                <p className="text-[10px] text-plum/50 font-medium">Buy</p>
                <p className="text-plum font-bold text-sm">{formatPrice(listing.price_cents!)}</p>
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

        {/* ── Details card ── */}
        <div className="card mb-4">
          <h3 className="font-semibold text-plum text-sm mb-3">Dress Details</h3>
          <div className="grid grid-cols-2 gap-y-2">
            {[
              { label: 'Size',      value: listing.dress_size },
              { label: 'Color',     value: listing.color },
              { label: 'Silhouette',value: listing.silhouette },
              { label: 'Category', value: listing.category },
              { label: 'Condition',value: listing.condition ? conditionLabel(listing.condition) : null },
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
                {listing.bust_inches  && <div><p className="text-plum/40 text-[10px]">Bust</p><p className="text-plum text-xs font-medium">{listing.bust_inches}"</p></div>}
                {listing.waist_inches && <div><p className="text-plum/40 text-[10px]">Waist</p><p className="text-plum text-xs font-medium">{listing.waist_inches}"</p></div>}
                {listing.hips_inches  && <div><p className="text-plum/40 text-[10px]">Hips</p><p className="text-plum text-xs font-medium">{listing.hips_inches}"</p></div>}
              </div>
            </div>
          )}
        </div>

        {/* ── Shipping / meetup ── */}
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

        {/* ── Description ── */}
        {listing.description && (
          <div className="card mb-4">
            <h3 className="font-semibold text-plum text-sm mb-2">Description</h3>
            <p className="text-plum/60 text-xs leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* ── Buyer actions ── */}
        {!isOwner && (
          <>
            {/* Rent / Buy CTAs */}
            <div className="flex flex-col gap-3 mb-3">
              {canRent && (
                <button
                  type="button"
                  onClick={() => { setCheckoutType('rent'); setCheckoutDone(false); }}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-plum active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }}
                >
                  Rent This Dress — {formatPrice(listing.rental_price_cents!)}/wknd
                </button>
              )}
              {canBuy && (
                <button
                  type="button"
                  onClick={() => { setCheckoutType('buy'); setCheckoutDone(false); }}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-plum active:scale-95 transition-all border border-primary/30"
                  style={canRent
                    ? { background: '#fff8f0' }
                    : { background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }
                  }
                >
                  Buy This Dress — {formatPrice(listing.price_cents!)}
                </button>
              )}
            </div>

            {/* Message seller */}
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
              <button
                type="button"
                onClick={() => setShowSafety(true)}
                className="w-full bg-white border border-primary/25 text-plum font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all mb-4 shadow-soft"
              >
                <MessageCircle size={18} className="text-primary"/>
                Message Seller
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Checkout sheet ── */}
      {checkoutType && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-plum/25 backdrop-blur-sm"
            onClick={() => { if (!checkoutDone) setCheckoutType(null); }}
          />
          <div className="relative bg-white rounded-t-[32px] px-5 pt-6 pb-10 z-10 max-h-[92vh] overflow-y-auto">

            {/* Sheet header */}
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-plum text-base">
                {checkoutType === 'rent' ? 'Rent This Dress' : 'Buy This Dress'}
              </p>
              {!checkoutDone && (
                <button type="button" aria-label="Close" onClick={() => setCheckoutType(null)}
                  className="w-8 h-8 rounded-full bg-cream flex items-center justify-center">
                  <X size={16} className="text-plum/50"/>
                </button>
              )}
            </div>

            {/* Dress thumbnail */}
            <div className="flex gap-3 mb-5 bg-cream rounded-2xl p-3">
              <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-blush to-lavender overflow-hidden flex-shrink-0">
                {listing.photo_urls.length > 0 && (
                  <img src={listing.photo_urls[0]} alt={listing.title} className="w-full h-full object-cover"/>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <p className="font-bold text-plum text-sm leading-tight">{listing.title}</p>
                {listing.designer && <p className="text-plum/50 text-xs mt-0.5">{listing.designer}</p>}
                <p className="text-plum/50 text-xs mt-1">Size {listing.dress_size} · {listing.color}</p>
              </div>
            </div>

            {/* Price breakdown */}
            {(() => {
              const dressCents  = checkoutType === 'rent' ? listing.rental_price_cents! : listing.price_cents!;
              const dressPrice  = dressCents / 100;
              const fee         = getPlatformFee(listing, checkoutType);
              const shipping    = listing.ships ? 2.99 : 0;
              const total       = dressPrice + fee + shipping;
              const stripeLink  = getStripeLink(listing, checkoutType);
              const suffix      = checkoutType === 'rent' ? '/wknd' : '';

              return (
                <>
                  <div className="bg-cream rounded-2xl p-4 mb-5">
                    {/* Line items */}
                    <div className="flex flex-col gap-2.5 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-plum/60 text-sm">
                            {checkoutType === 'rent' ? 'Rental price' : 'Dress price'}
                          </p>
                          <p className="text-plum/35 text-[10px]">From seller</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">
                          {formatPrice(dressCents)}{suffix}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-plum/60 text-sm">Platform fee (10%)</p>
                          <p className="text-plum/35 text-[10px]">Transaction support + protection</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">${fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-plum/60 text-sm">Shipping</span>
                        <span className="text-plum font-semibold text-sm">
                          {listing.ships ? '$2.99' : 'Local pickup'}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-plum/10 mb-3"/>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-plum font-bold text-sm">Total Due</span>
                      <span className="text-plum font-bold text-2xl">${total.toFixed(2)}</span>
                    </div>

                    <div className="h-px bg-plum/10 mb-3"/>

                    {/* Stripe amount callout */}
                    <div className="bg-primary/10 rounded-xl px-3 py-2.5 flex justify-between items-center">
                      <div>
                        <p className="text-plum text-xs font-bold">Charged via Stripe now</p>
                        <p className="text-plum/45 text-[10px]">Dress price paid directly to seller</p>
                      </div>
                      <span className="text-primary font-bold text-lg">${fee.toFixed(2)}</span>
                    </div>
                  </div>

                  {checkoutDone ? (
                    <div className="bg-sage/40 rounded-2xl p-5 text-center">
                      <p className="font-bold text-plum text-base mb-1.5">Payment started!</p>
                      <p className="text-plum/60 text-xs leading-relaxed mb-4">
                        Complete checkout in the new tab. A message has been sent to the chat with next steps for both of you.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setCheckoutType(null); handleMessage(); }}
                        className="px-6 py-2.5 rounded-2xl bg-plum text-white text-xs font-bold active:scale-95 transition-all"
                      >
                        View Chat with Seller
                      </button>
                    </div>
                  ) : (
                    <a
                      href={stripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCheckoutConfirm}
                      className="block w-full py-4 rounded-2xl text-center font-bold text-sm text-plum active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }}
                    >
                      Confirm & Pay ${fee.toFixed(2)} →
                    </a>
                  )}
                </>
              );
            })()}

            {/* Rental how-it-works */}
            {checkoutType === 'rent' && !checkoutDone && (
              <div className="mt-4 bg-lavender/30 rounded-2xl px-4 py-4">
                <p className="text-plum font-semibold text-xs mb-2">How rentals work</p>
                <ul className="text-plum/60 text-[11px] space-y-1.5 leading-relaxed">
                  <li>· Seller ships the dress within 2 days of payment</li>
                  <li>· Buyer sends shipping address via chat</li>
                  <li>· Buyer returns dress within 7 days after prom</li>
                  <li>· Dress must be returned in original condition</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
