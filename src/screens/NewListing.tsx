import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ArrowLeft, Camera } from 'lucide-react';

const DRESS_SIZES = ['00','0','2','4','6','8','10','12','14','16','18','20'];

const SILHOUETTES = ['A-Line','Ball Gown','Mermaid','Trumpet','Sheath','Empire','Two-Piece'];

const POPULAR_DESIGNERS = [
  'Sherri Hill','Jovani','Portia & Scarlett','La Femme',
  'Faviana','Mac Duggal','Ellie Wilde','Terani Couture',
  'Ashley Lauren','Madison James','Other'
];

const CONDITIONS = [
  { value: 'new_with_tags',    label: '🏷️ New with tags — never worn' },
  { value: 'new_without_tags', label: '✨ New without tags — worn once' },
  { value: 'like_new',         label: '💫 Like new — excellent condition' },
  { value: 'good',             label: '👍 Good — minor signs of wear' },
  { value: 'fair',             label: '🔧 Fair — visible wear, priced accordingly' },
];

const CATEGORIES = [
  { value: 'prom',       label: '👑 Prom' },
  { value: 'homecoming', label: '🌟 Homecoming' },
  { value: 'cocktail',   label: '✨ Cocktail / Formal' },
];

export function NewListing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [designer, setDesigner] = useState('');
  const [customDesigner, setCustomDesigner] = useState('');
  const [color, setColor] = useState('');
  const [silhouette, setSilhouette] = useState('');
  const [dressSize, setDressSize] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [condition, setCondition] = useState('');
  const [listingType, setListingType] = useState('rent');
  const [price, setPrice] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [ships, setShips] = useState(false);
  const [localMeetup, setLocalMeetup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const finalDesigner = designer === 'Other' ? customDesigner : designer;

  const handleSubmit = async () => {
    if (!title || !category || !dressSize || !condition || !listingType) {
      setError('Please fill in all required fields.'); return;
    }
    if (!ships && !localMeetup) {
      setError('Please select at least one pickup option.'); return;
    }
    setLoading(true); setError('');

    const { error: err } = await supabase.from('listings').insert({
      user_id: user!.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      designer: finalDesigner || null,
      color: color || null,
      silhouette: silhouette || null,
      dress_size: dressSize,
      bust_inches: bust ? parseInt(bust) : null,
      waist_inches: waist ? parseInt(waist) : null,
      hips_inches: hips ? parseInt(hips) : null,
      condition,
      listing_type: listingType,
      price_cents: price ? Math.round(parseFloat(price) * 100) : null,
      rental_price_cents: rentalPrice ? Math.round(parseFloat(rentalPrice) * 100) : null,
      deposit_cents: deposit ? Math.round(parseFloat(deposit) * 100) : null,
      ships,
      local_meetup: localMeetup,
      photo_urls: [],
    });

    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">Listing Posted!</h2>
      <p className="text-plum/60 text-sm mb-8">Your dress is now visible to girls across the country in The Vault.</p>
      <button type="button" onClick={() => navigate('/market')} className="btn-primary mb-3">View My Listings</button>
      <button type="button" onClick={() => navigate('/vault')} className="btn-secondary">Browse The Vault</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-10">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-blush px-5 pt-12 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <h2 className="font-display text-2xl font-bold text-plum mb-1">List Your Dress ✨</h2>
        <p className="text-plum/60 text-sm">Earn cash on your closet — safe, simple, girl-to-girl</p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Photos */}
        <div>
          <label className="label">Photos (coming soon)</label>
          <div className="flex gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex-1 aspect-square bg-ivory rounded-2xl border border-plum/10 flex items-center justify-center">
                <Camera size={i===0?20:14} className="text-plum/20"/>
              </div>
            ))}
          </div>
          <p className="text-plum/40 text-[10px] mt-1">Photo upload coming soon — add up to 4 photos</p>
        </div>

        {/* Title */}
        <div>
          <label className="label">Title <span className="text-primary">*</span></label>
          <input
            type="text"
            placeholder="e.g. Sherri Hill Emerald Ball Gown"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input"
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Category <span className="text-primary">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button type="button" key={c.value} onClick={() => setCategory(c.value)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === c.value ? 'bg-primary text-white border-primary' : 'bg-white text-plum border-plum/10'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Designer */}
        <div>
          <label className="label">Designer</label>
          <div className="relative mb-2">
            <select value={designer} onChange={e => setDesigner(e.target.value)} className="input appearance-none pr-10">
              <option value="">Select designer (optional)</option>
              {POPULAR_DESIGNERS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40 pointer-events-none"/>
          </div>
          {designer === 'Other' && (
            <input
              type="text"
              placeholder="Type designer name"
              value={customDesigner}
              onChange={e => setCustomDesigner(e.target.value)}
              className="input"
            />
          )}
        </div>

        {/* Color + Silhouette */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Color</label>
            <input type="text" placeholder="e.g. Emerald" value={color} onChange={e => setColor(e.target.value)} className="input"/>
          </div>
          <div className="flex-1">
            <label className="label">Silhouette</label>
            <div className="relative">
              <select value={silhouette} onChange={e => setSilhouette(e.target.value)} className="input appearance-none pr-8">
                <option value="">Select</option>
                {SILHOUETTES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-plum/40 pointer-events-none"/>
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="label">Dress Size <span className="text-primary">*</span></label>
          <div className="flex flex-wrap gap-2">
            {DRESS_SIZES.map(s => (
              <button type="button" key={s} onClick={() => setDressSize(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dressSize === s ? 'bg-primary text-white border-primary' : 'bg-white text-plum border-plum/10'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Measurements */}
        <div>
          <label className="label">Measurements (inches)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Bust',  value: bust,  setter: setBust },
              { label: 'Waist', value: waist, setter: setWaist },
              { label: 'Hips',  value: hips,  setter: setHips },
            ].map(m => (
              <div key={m.label}>
                <p className="text-plum/40 text-[10px] font-semibold mb-1">{m.label}</p>
                <input
                  type="number"
                  placeholder='e.g. 34"'
                  value={m.value}
                  onChange={e => m.setter(e.target.value)}
                  className="input text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="label">Condition <span className="text-primary">*</span></label>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map(c => (
              <button type="button" key={c.value} onClick={() => setCondition(c.value)}
                className={`py-3 px-4 rounded-xl text-left text-xs font-medium border transition-all ${
                  condition === c.value ? 'bg-primary/10 border-primary text-plum' : 'bg-white border-plum/10 text-plum/70'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listing type */}
        <div>
          <label className="label">Listing Type <span className="text-primary">*</span></label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: 'rent', label: 'Rent Only' },
              { value: 'sell', label: 'Sell Only' },
              { value: 'both', label: 'Rent & Sell' },
            ].map(t => (
              <button type="button" key={t.value} onClick={() => setListingType(t.value)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  listingType === t.value ? 'bg-primary text-white border-primary' : 'bg-white text-plum border-plum/10'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {(listingType === 'rent' || listingType === 'both') && (
            <div className="mb-3">
              <label className="label">Rental Price / Weekend</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-plum/40 font-medium">$</span>
                <input type="number" placeholder="e.g. 50" value={rentalPrice} onChange={e => setRentalPrice(e.target.value)} className="input pl-7"/>
              </div>
            </div>
          )}
          {(listingType === 'sell' || listingType === 'both') && (
            <div className="mb-3">
              <label className="label">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-plum/40 font-medium">$</span>
                <input type="number" placeholder="e.g. 120" value={price} onChange={e => setPrice(e.target.value)} className="input pl-7"/>
              </div>
            </div>
          )}
          {(listingType === 'rent' || listingType === 'both') && (
            <div>
              <label className="label">Security Deposit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-plum/40 font-medium">$</span>
                <input type="number" placeholder="e.g. 75" value={deposit} onChange={e => setDeposit(e.target.value)} className="input pl-7"/>
              </div>
              <p className="text-plum/40 text-[10px] mt-1">Returned when dress comes back in good condition</p>
            </div>
          )}
        </div>

        {/* Pickup options */}
        <div>
          <label className="label">Pickup Options <span className="text-primary">*</span></label>
          <div className="flex flex-col gap-2">
            <label className="card flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={ships} onChange={e => setShips(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold text-plum text-sm">📦 Ship Nationwide</p>
                <p className="text-plum/50 text-xs">$2.99 shipping fee added at checkout · address protected</p>
              </div>
            </label>
            <label className="card flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={localMeetup} onChange={e => setLocalMeetup(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold text-plum text-sm">📍 Local Meetup</p>
                <p className="text-plum/50 text-xs">Buddy system required · public place only</p>
              </div>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description (optional)</label>
          <textarea
            placeholder="Tell buyers about the dress — alterations made, how it fits, any flaws..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </div>

        <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? 'Posting...' : '✨ Post My Listing'}
        </button>

      </div>
    </div>
  );
}