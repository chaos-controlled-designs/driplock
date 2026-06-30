import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, isVIPActive } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ArrowLeft, Camera, ImagePlus, ShoppingBag, X, Star, Sparkles, Video, Check } from 'lucide-react';
import { VIPModal } from '../components/VIPModal';

const THEMES = [
  { id: 'blush-dream',  label: 'Blush Dream',  desc: 'Soft rose · romantic',      swatch: 'bg-[linear-gradient(135deg,#ffdde1,#ffc2c7)]', dark: false },
  { id: 'soft-glow',    label: 'Soft Glow',    desc: 'Lavender · dreamy mist',    swatch: 'bg-[linear-gradient(135deg,#f5e6ff,#e9d5f5)]', dark: false },
  { id: 'luxe-rose',    label: 'Luxe Rose',    desc: 'Pearl white · rose gold',   swatch: 'bg-[linear-gradient(135deg,#fff0f3,#ffd6da)]', dark: false },
  { id: 'midnight',     label: 'Midnight',     desc: 'Deep plum · editorial',     swatch: 'bg-[linear-gradient(135deg,#2d1b3d,#1a1025)]', dark: true  },
  { id: 'champagne',    label: 'Champagne',    desc: 'Warm gold · luxe glow',     swatch: 'bg-[linear-gradient(135deg,#fef9e7,#f5e6c8)]', dark: false },
  { id: 'sage',         label: 'Sage',         desc: 'Garden fresh · clean',      swatch: 'bg-[linear-gradient(135deg,#e8f5e9,#c8e6c9)]', dark: false },
  { id: 'ice-blue',     label: 'Ice Blue',     desc: 'Winter glam · crisp',       swatch: 'bg-[linear-gradient(135deg,#e3f2fd,#bbdefb)]', dark: false },
  { id: 'peach-glow',   label: 'Peach Glow',   desc: 'Sunset warmth · glam',      swatch: 'bg-[linear-gradient(135deg,#fff3e0,#ffccbc)]', dark: false },
];
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
  { value: 'prom',       label: 'Prom',       emoji: '👗', grad: 'from-rose-100 to-pink-200'    },
  { value: 'homecoming', label: 'Homecoming', emoji: '🌙', grad: 'from-amber-100 to-orange-200' },
];

const ACTIVE_PILL  = 'bg-gradient-to-r from-primary to-lavender text-plum border-transparent shadow-soft';
const INACTIVE_PILL = 'bg-white text-plum border-primary/20';

export function NewListing() {
  const navigate  = useNavigate();
  const { id: listingId } = useParams();
  const isEditMode = !!listingId;
  const { user, profile } = useAuth();
  const isVIP      = isVIPActive(profile);
  const MAX_PHOTOS = isVIP ? 10 : 4;
  const [showVIPModal, setShowVIPModal] = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Photos — existing (already uploaded, edit mode) + new (pending upload)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [photos,       setPhotos]       = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const totalPhotoCount = existingPhotos.length + photos.length;

  // Video (VIP only) — existing (edit mode) + new (pending upload)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [video,        setVideo]        = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');

  // Theme (VIP only)
  const [listingTheme, setListingTheme] = useState('');

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
  const [loadingListing,  setLoadingListing]  = useState(isEditMode);
  const [loadError,       setLoadError]       = useState('');

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(URL.revokeObjectURL);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Edit mode: load existing listing and prefill the form
  useEffect(() => {
    if (!listingId || !user) return;
    const loadListing = async () => {
      const { data, error: loadErr } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (loadErr || !data) { setLoadError('Listing not found.'); setLoadingListing(false); return; }
      if (data.user_id !== user.id) { setLoadError("You don't have permission to edit this listing."); setLoadingListing(false); return; }

      setTitle(data.title ?? '');
      setDescription(data.description ?? '');
      setCategory(data.category ?? '');
      if (data.designer && POPULAR_DESIGNERS.includes(data.designer)) {
        setDesigner(data.designer);
      } else if (data.designer) {
        setDesigner('Other');
        setCustomDesigner(data.designer);
      }
      setColor(data.color ?? '');
      setSilhouette(data.silhouette ?? '');
      setDressSize(data.dress_size ?? '');
      setBust(data.bust_inches != null ? String(data.bust_inches) : '');
      setWaist(data.waist_inches != null ? String(data.waist_inches) : '');
      setHips(data.hips_inches != null ? String(data.hips_inches) : '');
      setCondition(data.condition ?? '');
      setListingType(data.listing_type ?? 'rent');
      setPrice(data.price_cents != null ? String(data.price_cents / 100) : '');
      setRentalPrice(data.rental_price_cents != null ? String(data.rental_price_cents / 100) : '');
      setDeposit(data.deposit_cents != null ? String(data.deposit_cents / 100) : '');
      setShips(!!data.ships);
      setLocalMeetup(!!data.local_meetup);
      setExistingPhotos(data.photo_urls ?? []);
      setExistingVideoUrl(data.video_url ?? null);
      setListingTheme(data.listing_theme ?? '');
      setLoadingListing(false);
    };
    loadListing();
  }, [listingId, user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const slots  = MAX_PHOTOS - totalPhotoCount;
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

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = '';
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

    // Upload video (VIP only) — only if a new video was selected
    let uploadedVideoUrl: string | null = isEditMode ? existingVideoUrl : null;
    if (isVIP && video) {
      setUploadProgress('Uploading your Story Mode video…');
      const ext  = video.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      const path = `${user!.id}/video-${Date.now()}.${ext}`;

      const { error: vidErr } = await supabase.storage
        .from('dresses')
        .upload(path, video, { contentType: video.type, upsert: false });

      if (vidErr) {
        setError(`Video upload failed: ${vidErr.message}`);
        setLoading(false); setUploadProgress('');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dresses')
        .getPublicUrl(path);

      uploadedVideoUrl = publicUrl;
    }

    setUploadProgress(isEditMode ? 'Saving your changes…' : 'Saving your listing…');

    const finalPhotoUrls = isEditMode ? [...existingPhotos, ...uploadedUrls] : uploadedUrls;

    const payload = {
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
      photo_urls:          finalPhotoUrls,
      video_url:           uploadedVideoUrl,
      listing_theme:       isVIP && listingTheme ? listingTheme : null,
      is_vip_listing:      isVIP,
    };

    const { error: err } = isEditMode
      ? await supabase.from('listings').update(payload).eq('id', listingId)
      : await supabase.from('listings').insert({ ...payload, user_id: user!.id });

    setUploadProgress('');
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  };

  // ── Edit mode: loading existing listing ───────────────────────────
  if (loadingListing) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  // ── Edit mode: load error (not found / not owner) ─────────────────
  if (loadError) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <X size={24} className="text-red-400"/>
      </div>
      <h2 className="font-display text-xl font-bold text-plum mb-2">Can't Edit This Listing</h2>
      <p className="text-plum/60 text-sm mb-8">{loadError}</p>
      <button type="button" onClick={() => navigate('/market')} className="btn-primary">Back to My Listings</button>
    </div>
  );

  // ── Success screen ──────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-5 shadow-glow">
        <ShoppingBag size={36} className="text-plum"/>
      </div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">
        {isEditMode ? 'Listing Updated!' : 'Listing Posted!'}
      </h2>
      <p className="text-plum/60 text-sm mb-8">
        {isEditMode
          ? 'Your changes are now live in The Vault.'
          : 'Your dress is now visible to girls across your school in The Vault.'}
      </p>
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
        <h2 className="font-display text-2xl font-bold text-plum mb-1">
          {isEditMode ? 'Edit Your Listing' : 'List Your Dress'}
        </h2>
        <p className="text-plum/60 text-sm">
          {isEditMode ? 'Update photos, pricing, and details' : 'Earn cash on your closet — safe, simple, girl-to-girl'}
        </p>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {/* ── Photo Upload ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Photos</label>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              totalPhotoCount >= MAX_PHOTOS
                ? 'bg-sage/60 text-plum'
                : 'bg-primary/15 text-plum/60'
            }`}>
              {totalPhotoCount}/{MAX_PHOTOS}
            </span>
          </div>
          <p className="text-plum/40 text-[11px] mb-3">
            First photo is your cover · Add up to {MAX_PHOTOS} photos
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            aria-label="Upload dress photos"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {totalPhotoCount === 0 ? (
            /* Empty state */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] bg-gradient-to-br from-blush via-cream to-lavender rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20 active:scale-[0.98] transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-3 shadow-soft">
                <Camera size={28} className="text-primary/60"/>
              </div>
              <p className="text-plum font-semibold text-sm mb-0.5">Add your photos</p>
              <p className="text-plum/40 text-xs">Tap to browse your camera roll</p>
              <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-full px-4 py-1.5">
                <p className="text-primary/70 text-[11px] font-semibold">Great photos = way more interest</p>
              </div>
            </button>
          ) : (
            <>
              {/* 3-column Instagram-style grid — existing photos first, then new */}
              <div className="grid grid-cols-3 gap-2">
                {existingPhotos.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-soft">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-plum/60 to-transparent pt-6 pb-1.5 px-2 flex items-center gap-1">
                        <Star size={8} fill="#ffd4c4" color="#ffd4c4"/>
                        <span className="text-white text-[9px] font-bold tracking-wide">Cover</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(idx)}
                      aria-label={`Remove photo ${idx + 1}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-plum/70 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <X size={11} className="text-white"/>
                    </button>
                  </div>
                ))}

                {previews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-soft">
                    <img
                      src={url}
                      alt={`New photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {existingPhotos.length === 0 && idx === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-plum/60 to-transparent pt-6 pb-1.5 px-2 flex items-center gap-1">
                        <Star size={8} fill="#ffd4c4" color="#ffd4c4"/>
                        <span className="text-white text-[9px] font-bold tracking-wide">Cover</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      aria-label={`Remove new photo ${idx + 1}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-plum/70 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <X size={11} className="text-white"/>
                    </button>
                  </div>
                ))}

                {/* Add slot */}
                {totalPhotoCount < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Add more photos"
                    className="aspect-square rounded-2xl border-2 border-dashed border-primary/25 bg-blush/30 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center">
                      <ImagePlus size={17} className="text-primary/60"/>
                    </div>
                    <span className="text-[9px] font-bold text-plum/40 uppercase tracking-wide">Add</span>
                  </button>
                )}
              </div>

              <p className="text-plum/30 text-[10px] mt-2">
                Tap <X size={9} className="inline mb-px"/> to remove · drag to reorder coming soon
              </p>
            </>
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
              <p className="text-plum/45 text-[11px]">Free accounts get 4 · Upgrade for more</p>
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

        {/* ── VIP: Story Mode Video ──────────────────────────── */}
        {isVIP && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-primary" />
              <label className="label mb-0">Story Mode Video</label>
              <span className="bg-primary/20 text-plum text-[9px] font-bold px-2 py-0.5 rounded-full">VIP</span>
            </div>
            <p className="text-plum/45 text-[11px] mb-3">Add a short video (up to 30s) so buyers can see the dress in motion.</p>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              aria-label="Upload dress video"
              className="hidden"
              onChange={handleVideoSelect}
            />

            {!video && !existingVideoUrl ? (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-5 rounded-2xl border-2 border-dashed border-primary/25 bg-lavender/15 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Video size={24} className="text-primary/60" />
                <span className="text-plum/55 text-xs font-medium">Tap to add a video</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <video
                  src={video ? videoPreview : existingVideoUrl ?? undefined}
                  controls
                  className="w-full rounded-2xl max-h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (videoPreview) URL.revokeObjectURL(videoPreview);
                    setVideo(null); setVideoPreview(''); setExistingVideoUrl(null);
                  }}
                  aria-label="Remove video"
                  className="absolute top-2 right-2 w-7 h-7 bg-plum/70 rounded-full flex items-center justify-center"
                >
                  <X size={13} className="text-white" />
                </button>
              </div>
            )}
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
          <div className="flex gap-3">
            {CATEGORIES.map(c => {
              const active = category === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-primary to-lavender text-plum border-transparent shadow-soft'
                      : 'bg-white text-plum/60 border-primary/20'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
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

        {/* ── VIP: Listing Theme ──────────────────────────────── */}
        {isVIP && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-primary" />
              <label className="label mb-0">Listing Theme</label>
              <span className="bg-primary/20 text-plum text-[9px] font-bold px-2 py-0.5 rounded-full">VIP</span>
            </div>
            <p className="text-plum/45 text-[11px] mb-3">Choose a vibe for your card in The Vault. Tap to select, tap again to clear.</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Default / no-theme option */}
              <button
                type="button"
                onClick={() => setListingTheme('')}
                className={`relative rounded-2xl overflow-hidden transition-all active:scale-95 text-left ${
                  !listingTheme ? 'ring-2 ring-plum shadow-medium' : 'ring-1 ring-plum/10 shadow-soft'
                }`}
              >
                <div className="w-full h-24 bg-white flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-1 opacity-20">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-sm bg-plum" />
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2 bg-white border-t border-plum/5">
                  <p className="font-bold text-[11px] text-plum leading-tight">Default</p>
                  <p className="text-[10px] text-plum/40 mt-0.5">Clean white card</p>
                </div>
                {!listingTheme && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-plum rounded-full flex items-center justify-center shadow-soft">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>

              {/* Theme options */}
              {THEMES.map(t => {
                const active = listingTheme === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setListingTheme(active ? '' : t.id)}
                    className={`relative rounded-2xl overflow-hidden transition-all active:scale-95 text-left ${
                      active ? 'ring-2 ring-plum shadow-medium' : 'ring-1 ring-plum/10 shadow-soft'
                    }`}
                  >
                    {/* Swatch — taller for visual impact */}
                    <div className={`w-full h-24 ${t.swatch} relative`}>
                      {/* Subtle center dot accent */}
                      <div className={`absolute inset-0 flex items-center justify-center`}>
                        <div className={`w-8 h-8 rounded-full border-2 ${t.dark ? 'border-white/20' : 'border-white/60'} backdrop-blur-sm`} />
                      </div>
                    </div>
                    {/* Label bar */}
                    <div className={`px-3 py-2.5 border-t ${t.dark ? 'bg-[#1a1025] border-white/5' : 'bg-white border-plum/5'}`}>
                      <p className={`font-bold text-[11px] leading-tight ${t.dark ? 'text-white' : 'text-plum'}`}>
                        {t.label}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${t.dark ? 'text-white/35' : 'text-plum/38'}`}>
                        {t.desc}
                      </p>
                    </div>
                    {/* Selected checkmark */}
                    {active && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-plum rounded-full flex items-center justify-center shadow-soft">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          {loading
            ? (isEditMode ? 'Saving…' : 'Posting…')
            : isEditMode
              ? 'Save Changes'
              : `Post My Listing${photos.length > 0 ? ` · ${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''}`}
        </button>

      </div>

      <VIPModal open={showVIPModal} onClose={() => setShowVIPModal(false)} userId={user?.id} />
    </div>
  );
}
