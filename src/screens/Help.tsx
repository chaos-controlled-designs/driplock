import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: 'How does the No Dupe Check work?',
    a: "When you lock in your look, you enter your dress color and silhouette. DripLock privately checks if anyone else at your school's event has locked the same combination. Only you see the result — your peers just see that you're locked in, not what you picked.",
  },
  {
    q: 'Can other girls at my school see my dress?',
    a: 'No! Your dress details are 100% private. Other girls at your school can only see that you are locked in for the event. Nobody sees your color, style, designer, or any other details.',
  },
  {
    q: 'How does renting work?',
    a: "Find a dress you love in The Vault, message the seller, and agree on pickup. You'll pay the rental price plus a refundable deposit. After your event, return the dress within the agreed timeframe to get your deposit back.",
  },
  {
    q: 'What is the deposit for?',
    a: "The deposit protects the seller in case the dress is damaged or not returned. Once the seller confirms the dress came back in good condition, your deposit is fully refunded.",
  },
  {
    q: 'Is shipping safe?',
    a: 'Yes! Your home address is never shown to the seller. DripLock protects your address when you choose the shipping option. A $2.99 shipping fee is added to cover the cost.',
  },
  {
    q: 'What is the buddy system rule?',
    a: 'For any in-person meetup, always bring a friend. Never go alone to meet someone from the app. Always meet in a public place like a mall, coffee shop, or library. Tell a trusted adult where you are going.',
  },
  {
    q: 'How do I list my dress?',
    a: "Tap 'List My Dress' from the home screen or hamburger menu. Add photos, fill in your dress details, set your price, choose rent or sell, and post! Your listing goes live immediately in The Vault for girls at other schools to browse.",
  },
  {
    q: 'What fees does DripLock charge?',
    a: 'DripLock takes a 10% platform fee on completed sales and rentals. There is also a $2.99 flat shipping fee when you choose to ship. Browsing and locking in your look are always free.',
  },
  {
    q: 'Can I change my locked look?',
    a: "Yes! Go to the Lock In screen and update your color and silhouette. The dupe check will run again automatically with your new selection.",
  },
];

export function Help() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream pb-10">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-blush px-5 pt-12 pb-8">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-4">
          <ArrowLeft size={16}/> Back
        </button>
        <h2 className="font-display text-2xl font-bold text-plum mb-1">Safety & Help 🛡️</h2>
        <p className="text-plum/60 text-sm">Everything you need to use DripLock safely</p>
      </div>

      <div className="px-4 pt-4">

        {/* Safety rules */}
        <h3 className="font-display text-lg font-semibold text-plum mb-3">Safety Rules</h3>
        <div className="flex flex-col gap-2 mb-6">
          {[
            { icon: '👯', title: 'Buddy System', desc: 'Always bring a friend to in-person meetups. Never go alone.' },
            { icon: '📍', title: 'Public Places Only', desc: 'Meet at a mall, coffee shop, or other public location.' },
            { icon: '🚫', title: 'No Home Addresses', desc: 'Never share your home address. Use in-app shipping.' },
            { icon: '🔒', title: 'Username Only', desc: 'Your real name is never shown to other users.' },
            { icon: '💬', title: 'Stay in the App', desc: 'Never move conversations to personal social media or texting.' },
            { icon: '🚨', title: 'Report Bad Behavior', desc: 'Use the report button if anything feels unsafe or wrong.' },
          ].map(r => (
            <div key={r.title} className="card flex gap-3">
              <span className="text-xl">{r.icon}</span>
              <div>
                <p className="font-semibold text-plum text-sm">{r.title}</p>
                <p className="text-plum/50 text-xs mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h3 className="font-display text-lg font-semibold text-plum mb-3">FAQ</h3>
        <div className="flex flex-col gap-2 mb-6">
          {FAQS.map((faq, i) => (
            <div key={i} className="card overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-plum text-sm pr-4">{faq.q}</span>
                {open === i ? <ChevronUp size={16} className="text-primary flex-shrink-0"/> : <ChevronDown size={16} className="text-plum/30 flex-shrink-0"/>}
              </button>
              {open === i && (
                <div className="px-4 pb-4 border-t border-plum/5">
                  <p className="text-plum/60 text-xs leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="card text-center">
          <p className="font-semibold text-plum text-sm mb-1">Still need help?</p>
          <p className="text-plum/50 text-xs mb-3">We're here for you 💕</p>
          <a href="mailto:support@driplock.app" className="text-primary font-semibold text-sm underline">
            support@driplock.app
          </a>
        </div>
      </div>
    </div>
  );
}