import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Listing, CONDITIONS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Truck, MapPin, MessageCircle, Heart, Shield,
  ShoppingBag, X, Lock, Users,
} from 'lucide-react';

const PLATFORM_FEE_RATE = 0.10;
const SHIPPING_FEE = 2.99;

type TransType = 'rent' | 'buy';
type CheckoutMethod = 'ship' | 'meetup';
interface CheckoutConfig { transType: TransType; method: CheckoutMethod }

// Stripe links are fixed-price placeholders until full payment processing is wired.
function getStripeLink(listing: Listing, transType: TransType): string {
  if (transType === 'rent') return 'https://buy.stripe.com/00wfZafgFgAzdSZ9dggYU00';
  const cents = listing.price_cents ?? 0;
  if (cents >= 10000) return 'https://buy.stripe.com/fZu4gs3xXbgf2ah2OSgYU01';
  return 'https://buy.stripe.com/5kQeV62tT8436qx758gYU02';
}

function getAutoMessage(transType: TransType, method: CheckoutMethod, title: string): string {
  const label = transType === 'rent' ? `"${title}" rental` : `"${title}"`;

  if (method === 'ship') {
    const returnNote = transType === 'rent'
      ? '\n\n🔄 RETURN: Dress must be shipped back within 7 days after prom in original condition with tracking.'
      : '';
    return (
      `✅ Payment started for ${label}!\n\n` +
      `📦 SELLER: Do NOT ship the dress yet. Wait for a confirmation email from DripLock first. ` +
      `We hold the payment in escrow and will notify you once it's cleared and time to ship.\n\n` +
      `📍 BUYER: Reply here with your full shipping address. ` +
      `Once you receive the dress and confirm it's in good condition, let us know here — ` +
      `DripLock will then release payment to the seller.` +
      returnNote + '\n\n' +
      `Keep all communication in this chat for both your protection. 💕`
    );
  }

  // meetup
  const returnNote = transType === 'rent'
    ? '\n\n🔄 RETURN: Agree on return date and location at the meetup.'
    : '';
  return (
    `✅ Platform fee paid for ${label} — local meetup confirmed!\n\n` +
    `🤝 BOTH: Agree on a meetup time and public location in this chat.\n\n` +
    `⚠️ SAFETY REMINDERS:\n` +
    `· Meet in a busy public place (mall, coffee shop, school parking lot)\n` +
    `· Bring a friend — never go alone\n` +
    `· Do not share your home address\n` +
    `· Inspect the dress carefully before handing over payment` +
    returnNote + '\n\n' +
    `Keep all communication in this chat for both your protection. 💕`
  );
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
  const [checkout,      setCheckout]      = useState<CheckoutConfig | null>(null);
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
    if (!checkout || !listing || !user) return;
    setCheckoutDone(true);
    try {
      const convId = await getOrCreateConversation();
      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_id: user.id,
          content: getAutoMessage(checkout.transType, checkout.method, listing.title),
        });
      }
    } catch {
      // Stripe link still opens — message failure is non-critical
    }
  };

  const openCheckout = (transType: TransType, method: CheckoutMethod) => {
    setCheckout({ transType, method });
    setCheckoutDone(false);
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

  // Helper: render ship + meetup buttons for a given transaction type
  const renderTransactionButtons = (transType: TransType) => {
    const cents  = transType === 'rent' ? listing.rental_price_cents! : listing.price_cents!;
    const label  = transType === 'rent' ? 'Rent' : 'Buy';
    const suffix = transType === 'rent' ? '/wknd' : '';
    const isPrimary = (transType === 'rent' && !canBuy) || (transType === 'buy' && !canRent);

    return (
      <div className="flex flex-col gap-2">
        <p className="text-plum/45 text-[10px] font-bold uppercase tracking-widest px-1">
          {label} — {formatPrice(cents)}{suffix}
        </p>

        {listing.ships && (
          <button
            type="button"
            onClick={() => openCheckout(transType, 'ship')}
            className="w-full rounded-2xl text-left px-5 py-4 active:scale-[0.98] transition-all"
            style={isPrimary
              ? { background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }
              : { background: '#fff8f0', border: '1px solid rgba(255,193,184,0.5)' }
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                <Truck size={16} className="text-plum"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-plum text-sm leading-tight">
                  {label} with Shipping
                  <span className="ml-1.5 text-[10px] font-semibold bg-sage text-plum rounded-full px-2 py-0.5">Recommended</span>
                </p>
                <p className="text-plum/55 text-[11px] mt-0.5">Full amount held by DripLock · Safest option</p>
              </div>
            </div>
          </button>
        )}

        {listing.local_meetup && (
          <button
            type="button"
            onClick={() => openCheckout(transType, 'meetup')}
            className="w-full rounded-2xl text-left px-5 py-4 bg-white border border-plum/10 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-plum/60"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-plum text-sm leading-tight">Local Meetup</p>
                <p className="text-plum/55 text-[11px] mt-0.5">Pay platform fee only · Settle dress price in person</p>
              </div>
            </div>
          </button>
        )}
      </div>
    );
  };

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
              { label: 'Size',       value: listing.dress_size },
              { label: 'Color',      value: listing.color },
              { label: 'Silhouette', value: listing.silhouette },
              { label: 'Category',   value: listing.category },
              { label: 'Condition',  value: listing.condition ? conditionLabel(listing.condition) : null },
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
            {/* Transaction option buttons */}
            <div className="flex flex-col gap-5 mb-4">
              {canRent && renderTransactionButtons('rent')}
              {canBuy  && renderTransactionButtons('buy')}
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
      {checkout && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-plum/25 backdrop-blur-sm"
            onClick={() => { if (!checkoutDone) setCheckout(null); }}
          />
          <div className="relative bg-white rounded-t-[32px] px-5 pt-6 pb-10 z-10 max-h-[92vh] overflow-y-auto">

            {/* Sheet header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-bold text-plum text-base">
                  {checkout.method === 'ship'
                    ? (checkout.transType === 'rent' ? 'Rent with Shipping' : 'Buy with Shipping')
                    : (checkout.transType === 'rent' ? 'Rent — Local Meetup' : 'Buy — Local Meetup')}
                </p>
                <p className="text-plum/40 text-[11px] mt-0.5">
                  {checkout.method === 'ship' ? 'Full amount via Stripe escrow' : 'Platform fee via Stripe · Dress price in person'}
                </p>
              </div>
              {!checkoutDone && (
                <button type="button" aria-label="Close" onClick={() => setCheckout(null)}
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

            {/* ── SHIP breakdown ── */}
            {checkout.method === 'ship' && (() => {
              const dressCents  = checkout.transType === 'rent' ? listing.rental_price_cents! : listing.price_cents!;
              const dressPrice  = dressCents / 100;
              const platformFee = Math.round(dressPrice * PLATFORM_FEE_RATE * 100) / 100;
              const total       = dressPrice + platformFee + SHIPPING_FEE;
              const suffix      = checkout.transType === 'rent' ? '/wknd' : '';
              const link        = getStripeLink(listing, checkout.transType);

              return (
                <>
                  <div className="bg-cream rounded-2xl p-4 mb-4">
                    <div className="flex flex-col gap-2.5 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-plum/60 text-sm">
                            {checkout.transType === 'rent' ? 'Rental price' : 'Dress price'}
                          </p>
                          <p className="text-plum/35 text-[10px]">Released to seller after you confirm delivery</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">{formatPrice(dressCents)}{suffix}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-plum/60 text-sm">Platform fee (10%)</p>
                          <p className="text-plum/35 text-[10px]">Escrow &amp; buyer protection</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-plum/60 text-sm">Shipping</p>
                          <p className="text-plum/35 text-[10px]">Your address is only shared after payment</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">${SHIPPING_FEE.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-px bg-plum/10 mb-3"/>
                    <div className="flex justify-between items-center">
                      <span className="text-plum font-bold text-sm">Total Due via Stripe</span>
                      <span className="text-plum font-bold text-2xl">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Escrow explanation */}
                  <div className="bg-white border border-primary/20 rounded-2xl px-4 py-3 mb-4 flex gap-3 items-start">
                    <Lock size={15} className="text-primary mt-0.5 flex-shrink-0"/>
                    <div>
                      <p className="text-plum text-xs font-bold mb-0.5">Secure Escrow — Seller Protected Too</p>
                      <p className="text-plum/55 text-[11px] leading-relaxed">
                        Your full payment goes to DripLock, not the seller.
                        Seller ships only after DripLock confirms payment.
                        We release the dress price to the seller after you confirm safe delivery.
                      </p>
                    </div>
                  </div>

                  {checkoutDone ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-sage/40 rounded-2xl px-4 py-3 text-center">
                        <p className="font-bold text-plum text-base">Payment Started! ✅</p>
                        <p className="text-plum/55 text-xs mt-1">Complete checkout in the Stripe tab, then follow the steps below.</p>
                      </div>
                      <div className="bg-lavender/50 rounded-2xl px-4 py-3">
                        <p className="font-bold text-plum text-xs mb-1">📦 For the Seller</p>
                        <p className="text-plum/65 text-[11px] leading-relaxed">
                          <span className="font-semibold text-plum">Do NOT ship yet.</span>{' '}
                          Wait for a confirmation email from DripLock — we'll notify you once payment clears and it's safe to ship.
                        </p>
                      </div>
                      <div className="bg-primary/10 rounded-2xl px-4 py-3">
                        <p className="font-bold text-plum text-xs mb-1">📍 For You (Buyer)</p>
                        <p className="text-plum/65 text-[11px] leading-relaxed">
                          Send your shipping address in chat. Once you receive the dress and confirm it's in good condition,
                          DripLock will release payment to the seller.
                        </p>
                      </div>
                      <button type="button" onClick={() => { setCheckout(null); handleMessage(); }} className="btn-primary">
                        Go to Chat →
                      </button>
                    </div>
                  ) : (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCheckoutConfirm}
                      className="block w-full py-4 rounded-2xl text-center font-bold text-sm text-plum active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg, #ffc1b8 0%, #ffd4c4 100%)', boxShadow: '0 6px 24px rgba(255,193,184,0.45)' }}
                    >
                      Pay ${total.toFixed(2)} Securely →
                    </a>
                  )}

                  {checkout.transType === 'rent' && !checkoutDone && (
                    <div className="mt-4 bg-lavender/30 rounded-2xl px-4 py-3">
                      <p className="text-plum font-semibold text-xs mb-1.5">Rental return policy</p>
                      <ul className="text-plum/60 text-[11px] space-y-1 leading-relaxed">
                        <li>· Return dress within 7 days after prom with tracking</li>
                        <li>· Must be in original condition — no stains or damage</li>
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}

            {/* ── MEETUP breakdown ── */}
            {checkout.method === 'meetup' && (() => {
              const dressCents  = checkout.transType === 'rent' ? listing.rental_price_cents! : listing.price_cents!;
              const dressPrice  = dressCents / 100;
              const platformFee = Math.round(dressPrice * PLATFORM_FEE_RATE * 100) / 100;
              const suffix      = checkout.transType === 'rent' ? '/wknd' : '';
              const link        = getStripeLink(listing, checkout.transType);

              return (
                <>
                  {/* Two-part payment breakdown */}
                  <div className="flex flex-col gap-3 mb-4">
                    {/* Stripe portion */}
                    <div className="bg-cream rounded-2xl p-4">
                      <p className="text-plum/40 text-[10px] font-bold uppercase tracking-widest mb-2.5">Pay now via Stripe</p>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-plum/60 text-sm">Platform fee (10%)</p>
                          <p className="text-plum/35 text-[10px]">Confirms the transaction on DripLock</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-plum/10 mb-3"/>
                      <div className="flex justify-between items-center">
                        <span className="text-plum font-bold text-sm">Stripe charge</span>
                        <span className="text-plum font-bold text-xl">${platformFee.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* In-person portion */}
                    <div className="bg-white border border-plum/10 rounded-2xl p-4">
                      <p className="text-plum/40 text-[10px] font-bold uppercase tracking-widest mb-2.5">Pay seller in person at meetup</p>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-plum/60 text-sm">
                            {checkout.transType === 'rent' ? 'Rental price' : 'Dress price'}
                          </p>
                          <p className="text-plum/35 text-[10px]">Cash (or agreed method) directly to seller</p>
                        </div>
                        <span className="text-plum font-semibold text-sm">{formatPrice(dressCents)}{suffix}</span>
                      </div>
                      <div className="h-px bg-plum/10 mb-3"/>
                      <div className="flex justify-between items-center">
                        <span className="text-plum font-bold text-sm">At meetup</span>
                        <span className="text-plum font-bold text-xl">{formatPrice(dressCents)}{suffix}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety reminders */}
                  <div className="bg-white border border-primary/20 rounded-2xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={14} className="text-primary"/>
                      <p className="text-plum text-xs font-bold">Meetup Safety Rules</p>
                    </div>
                    <ul className="text-plum/60 text-[11px] space-y-1 leading-relaxed">
                      <li>· Meet in a busy public place — mall, coffee shop, school</li>
                      <li>· Always bring a friend — never go alone</li>
                      <li>· Do not share your home address</li>
                      <li>· Inspect the dress before handing over any payment</li>
                    </ul>
                  </div>

                  {checkoutDone ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-sage/40 rounded-2xl px-4 py-3 text-center">
                        <p className="font-bold text-plum text-base">Platform Fee Paid! ✅</p>
                        <p className="text-plum/55 text-xs mt-1">Now coordinate your meetup in chat.</p>
                      </div>
                      <div className="bg-lavender/50 rounded-2xl px-4 py-3">
                        <p className="font-bold text-plum text-xs mb-1">🤝 Next Steps</p>
                        <ul className="text-plum/65 text-[11px] leading-relaxed space-y-1">
                          <li>· Message the seller to agree on time &amp; location</li>
                          <li>· Choose a busy public spot — mall, coffee shop, etc.</li>
                          <li>· Bring a friend, inspect dress, then hand over {formatPrice(dressCents)}{suffix}</li>
                        </ul>
                      </div>
                      <button type="button" onClick={() => { setCheckout(null); handleMessage(); }} className="btn-primary">
                        Message Seller to Arrange Meetup →
                      </button>
                    </div>
                  ) : (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCheckoutConfirm}
                      className="block w-full py-4 rounded-2xl text-center font-bold text-sm text-plum active:scale-95 transition-all border border-primary/30"
                      style={{ background: '#fff8f0' }}
                    >
                      Pay Platform Fee ${platformFee.toFixed(2)} →
                    </a>
                  )}
                </>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}
