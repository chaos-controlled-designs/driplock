import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ArrowLeft, Camera, ImagePlus, ShoppingBag, X, Star, Sparkles } from 'lucide-react';
import { isVIPActive } from '../lib/supabase';
import { VIPModal } from '../components/VIPModal';
const DRESS_SIZES = ['00','0','2','4','6','8','10','12','14','16','18','20'];
const SILHOUETTES = [
  'A-Line', 'Ball Gown', 'Mermaid', 'Fit & Flare',
  'Bodycon', 'Baby Doll', 'High-Low', 'Slip Dress',
  'Off-Shoulder', 'Strapless',
];
const POPULAR_DESIGNERS = [
  'Sherri Hill','Jovani','Portia & Scarlett','La Femme',
  'Faviana','Mac Duggal','Ellie Wilde','Terani Couture',
  'Ashley Lauren','Madison James','Other',
];
const CONDITIONS = [
  { value: 'new_with_tags',    label: 'New with tags — never worn' },
  { value: 'new_without_tags', label: 'New without tags — worn once' },
  { value: 'like_new',         label: 'Like new — excellent condition' },
  { value: 'good',             label: 'Good — minor signs of wear' },
  { value: 'fair',             label: 'Fair — visible wear, priced accordingly' },
];
const CATEGORIES = [
  { value: 'prom',       label: 'Prom' },
  { value: 'homecoming', label: 'Homecoming' },
  { value: 'cocktail',   label: 'Cocktail' },
];

const ACTIVE_PILL  = 'bg-gradient-to-r from-primary to-lavender text-plum border-transparent shadow-soft';
const INACTIVE_PILL = 'bg-white text-plum border-primary/20';

export function NewListing() {
  const navigate  = useNavigate();
  const { user, profile } = useAuth();
  const MAX_PHOTOS = isVIPActive(profile) ? 10 : 6;
  const [showVIPModal, setShowVIPModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photos
  const [photos,   setPhotos]   = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Form fields
  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [category,       setCategory]       = useState('');
  const [designer,       setDesigner]       = useState('');
  const [customDesigner, setCustomDesigner] = useState('');
  const [color,          setColor]          = useState('');
  const [silhouette,     setSilhouette]     = useState('');
  const [dressSize,      setDressSize]      = useState('');
  const [bust,           setBust]           = useState('');
  const [waist,          setWaist]          = useState('');
  const [hips,           setHips]           = useState('');
  const [condition,      setCondition]      = useState('');
  const [listingType,    setListingType]    = useState('rent');
  const [price,          setPrice]          = useState('');
  const [rentalPrice,    setRentalPrice]    = useState('');
  const [deposit,        setDeposit]        = useState('');
  const [ships,          setShips]          = useState(false);
  const [localMeetup,    setLocalMeetup]    = useState(true);

  const [loading,         setLoading]         = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState('');
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => { previews.forEach(URL.revokeObjectURL); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const slots  = MAX_PHOTOS - photos.length;
    const toAdd  = files.slice(0, slots);
    if (!toAdd.length) return;

    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = ''; // allow re-selecting same file
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const finalDesigner = designer === 'Other' ? customDesigner : designer;

  const handleSubmit = async () => {
    if (!title || !category || !dressSize || !condition || !listingType) {
      setError('Please fill in all required fields.'); return;
    }
    if (!ships && !localMeetup) {
      setError('Please select at least one pickup option.'); return;
    }
    setLoading(true); setError(''); setUploadProgress('');

    // Upload photos to Supabase Storage
    const uploadedUrls: string[] = [];
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}…`);
        const file = photos[i];
        const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `${user!.id}/${Date.now()}-${i}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('dresses')
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadErr) {
          setError(`Photo ${i + 1} upload failed: ${uploadErr.message}`);
          setLoading(false); setUploadProgress('');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dresses')
          .getPublicUrl(path);

        uploadedUrls.push(publicUrl);
      }
    }

    setUploadProgress('Saving your listing…');

    const { error: err } = await supabase.from('listings').insert({
      user_id:             user!.id,
      title:               title.trim(),
      description:         description.trim() || null,
      category,
      designer:            finalDesigner || null,
      color:               color || null,
      silhouette:          silhouette || null,
      dress_size:          dressSize,
      bust_inches:         bust  ? parseInt(bust)  : null,
      waist_inches:        waist ? parseInt(waist) : null,
      hips_inches:         hips  ? parseInt(hips)  : null,
      condition,
      listing_type:        listingType,
      price_cents:         price       ? Math.round(parseFloat(price)       * 100) : null,
      rental_price_cents:  rentalPrice ? Math.round(parseFloat(rentalPrice) * 100) : null,
      deposit_cents:       deposit     ? Math.round(parseFloat(deposit)     * 100) : null,
      ships,
      local_meetup:        localMeetup,
      photo_urls:          uploadedUrls,
    });

    setUploadProgress('');
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  };

  // ── Success screen ──────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-5 shadow-glow">
        <ShoppingBag size={36} className="text-plum"/>
      </div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">Listing Posted!</h2>
      <p className="text-plum/60 text-sm mb-8">Your dress is now visible to girls across your school in The Vault.</p>
      <button type="button" onClick={() => navigate('/market')} className="btn-primary mb-3">View My Listings</button>
      <button type="button" onClick={() => navigate('/vault')}  className="btn-secondary">Browse The Vault</button>
    </div>
  );

  // ── Form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-10">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-blush px-5 pt-12 pb-6 rounded-b-[28px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <h2 className="font-display text-2xl font-bold text-plum mb-1">List Your Dress</h2>
        <p className="text-plum/60 text-sm">Earn cash on your closet — safe, simple, girl-to-girl</p>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {/* ── Photo Upload ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Photos</label>
            <span className="text-plum/35 text-[10px] font-semibold">
              {photos.length}/{MAX_PHOTOS} added
            </span>
          </div>

          {/* Hidden file input — multiple, images only */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            aria-label="Upload dress photos"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {photos.length === 0 ? (
            /* Empty state — full tap-to-add area */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] bg-gradient-to-br from-blush via-cream to-lavender rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-primary/25 active:scale-[0.98] transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-3 shadow-soft">
                <Camera size={28} className="text-primary/70"/>
              </div>
              <p className="text-plum/70 text-sm font-semibold">Add up to {MAX_PHOTOS} photos</p>
              <p className="text-plum/35 text-xs mt-1">Tap to browse your camera roll</p>
              <p className="text-primary/50 text-[10px] mt-3 font-medium">Great photos = way more interest!</p>
            </button>
          ) : (
            <div className="flex flex-col gap-3">

              {/* Primary / cover photo */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-medium">
                <img
                  src={previews[0]}
                  alt="Cover photo"
                  className="w-full h-full object-cover"
                />
                {/* Cover badge */}
                <div className="absolute bottom-3 left-3 bg-plum/65 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Star size={10} fill="#ffd4c4" color="#ffd4c4"/>
                  <span className="text-white text-[10px] font-bold tracking-wide">Cover</span>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePhoto(0)}
                  aria-label="Remove cover photo"
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-plum/65 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
                >
                  <X size={14} className="text-white"/>
                </button>
              </div>

              {/* Additional photos + add button */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
                {previews.slice(1).map((url, idx) => (
                  <div
                    key={idx + 1}
                    className="relative flex-shrink-0 w-[88px] h-[88px] rounded-2xl overflow-hidden shadow-soft"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx + 1)}
                      aria-label={`Remove photo ${idx + 2}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-plum/65 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <X size={11} className="text-white"/>
                    </button>
                  </div>
                ))}

                {/* Add more slot */}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Add more photos"
                    className="flex-shrink-0 w-[88px] h-[88px] rounded-2xl border-2 border-dashed border-primary/30 bg-blush/50 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ImagePlus size={20} className="text-primary/60"/>
                    <span className="text-[9px] font-bold text-plum/45 uppercase tracking-wide">Add More</span>
                  </button>
                )}
              </div>

              <p className="text-plum/35 text-[10px] font-medium">
                First photo is the cover. Tap <X size={9} className="inline"/> to remove any photo.
              </p>
            </div>
          )}
        </div>

        {/* VIP photo slot nudge for free users */}
        {!isVIPActive(profile) && (
          <div className="bg-gradient-to-r from-primary/15 to-lavender/25 rounded-2xl border border-primary/15 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles size={12} className="text-plum/50" />
                <p className="font-semibold text-plum text-xs">VIP: 10 photos per listing</p>
              </div>
              <p className="text-plum/45 text-[11px]">Free accounts get 6 · Upgrade for more</p>
            </div>
            <button
              type="button"
              onClick={() => setShowVIPModal(true)}
              className="flex-shrink-0 bg-plum rounded-xl px-3 py-1.5 text-white text-[11px] font-bold"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* ── Title ───────────────────────────────────────────── */}
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

        {/* ── Category ────────────────────────────────────────── */}
        <div>
          <label className="label">Category <span className="text-primary">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button type="button" key={c.value} onClick={() => setCategory(c.value)}
                className={`py-2.5 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  category === c.value ? ACTIVE_PILL : INACTIVE_PILL
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Designer ────────────────────────────────────────── */}
        <div>
          <label className="label">Designer</label>
          <div className="relative mb-2">
            <select aria-label="Designer" value={designer} onChange={e => setDesigner(e.target.value)} className="input appearance-none pr-10">
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

        {/* ── Color ────────────────────────────────────────────── */}
        <div>
          <label className="label">Color</label>
          <input type="text" placeholder="e.g. Emerald Green, Blush Pink..." value={color} onChange={e => setColor(e.target.value)} className="input"/>
        </div>

        {/* ── Silhouette ───────────────────────────────────────── */}
        <div>
          <label className="label">Silhouette</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {SILHOUETTES.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setSilhouette(silhouette === s ? '' : s)}
                className={`py-3 px-3 rounded-2xl text-xs font-semibold border transition-all text-center ${
                  silhouette === s
                    ? 'bg-primary border-primary text-plum shadow-soft'
                    : 'bg-white border-primary/20 text-plum/60 hover:border-primary/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Size ────────────────────────────────────────────── */}
        <div>
          <label className="label">Dress Size <span className="text-primary">*</span></label>
          <div className="flex flex-wrap gap-2">
            {DRESS_SIZES.map(s => (
              <button type="button" key={s} onClick={() => setDressSize(s)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                  dressSize === s ? ACTIVE_PILL : INACTIVE_PILL
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Measurements ────────────────────────────────────── */}
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

        {/* ── Condition ───────────────────────────────────────── */}
        <div>
          <label className="label">Condition <span className="text-primary">*</span></label>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map(c => (
              <button type="button" key={c.value} onClick={() => setCondition(c.value)}
                className={`py-3 px-4 rounded-2xl text-left text-xs font-medium border transition-all ${
                  condition === c.value
                    ? 'bg-primary/10 border-primary text-plum'
                    : 'bg-white border-primary/15 text-plum/70'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Listing type ─────────────────────────────────────── */}
        <div>
          <label className="label">Listing Type <span className="text-primary">*</span></label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: 'rent', label: 'Rent Only' },
              { value: 'sell', label: 'Sell Only' },
              { value: 'both', label: 'Rent & Sell' },
            ].map(t => (
              <button type="button" key={t.value} onClick={() => setListingType(t.value)}
                className={`py-2.5 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  listingType === t.value ? ACTIVE_PILL : INACTIVE_PILL
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

        {/* ── Pickup options ───────────────────────────────────── */}
        <div>
          <label className="label">Pickup Options <span className="text-primary">*</span></label>
          <div className="flex flex-col gap-2">
            <label className="card flex items-center gap-3 cursor-pointer">
              <input type="checkbox" aria-label="Ship nationwide" checked={ships} onChange={e => setShips(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold text-plum text-sm">Ship Nationwide</p>
                <p className="text-plum/50 text-xs">$2.99 shipping fee added at checkout · address protected</p>
              </div>
            </label>
            <label className="card flex items-center gap-3 cursor-pointer">
              <input type="checkbox" aria-label="Local meetup" checked={localMeetup} onChange={e => setLocalMeetup(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold text-plum text-sm">Local Meetup</p>
                <p className="text-plum/50 text-xs">Buddy system required · public place only</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Description ─────────────────────────────────────── */}
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

        {/* Upload progress */}
        {uploadProgress && (
          <div className="flex items-center gap-3 bg-blush rounded-2xl px-4 py-3">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0"/>
            <p className="text-plum/70 text-xs font-medium">{uploadProgress}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Posting…' : `Post My Listing${photos.length > 0 ? ` · ${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''}`}
        </button>

      </div>

      <VIPModal open={showVIPModal} onClose={() => setShowVIPModal(false)} userId={user?.id} />
    </div>
  );
}
