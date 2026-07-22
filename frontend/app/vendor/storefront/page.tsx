"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useVendor } from "@/context/VendorContext";
import { PageHeader } from "@/components/vendor/shared";

export default function StorefrontPage() {
  const { storefront, updateStorefront, toast } = useVendor();
  const [bio, setBio] = useState(storefront.bio);
  const [tags, setTags] = useState(storefront.tags);
  const [tagInput, setTagInput] = useState("");
  const [name, setName] = useState(storefront.businessName);
  const [instagram, setInsta] = useState(storefront.instagram);
  const [tiktok, setTk] = useState(storefront.tiktok);
  const [website, setWeb] = useState(storefront.website);
  const [shipping, setShipping] = useState(storefront.shippingPolicy);
  const [cover, setCover] = useState(storefront.cover);
  const [logo, setLogo] = useState(storefront.logo);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && tags.length < 8 && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const save = () => {
    updateStorefront({ businessName: name, bio, tags, instagram, tiktok, website, shippingPolicy: shipping, cover, logo });
    toast("Storefront updated!", "success");
  };

  return (
    <div>
      <PageHeader title="Storefront Settings" subtitle="Customise your public vendor page" />

      <div className="space-y-5 lg:space-y-6">
        {/* Desktop: cover/logo side-by-side with form */}
        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-8 space-y-5 lg:space-y-0">
          <div className="space-y-5">
            <div>
              <label className="text-v-body text-ink dark:text-white/90">Cover Image</label>
              <div
                onClick={() => coverRef.current?.click()}
                className="mt-1 flex h-20 lg:h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line bg-white dark:border-white/10 dark:bg-surface-dark overflow-hidden transition-colors hover:border-ink/40 dark:hover:border-white/20"
              >
                {cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cover} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-vendor-text-grey">
                    <Upload className="h-5 w-5" />
                    <p className="text-v-meta">1200 × 400px recommended</p>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCover(URL.createObjectURL(f));
              }} />
            </div>

            <div>
              <label className="text-v-body text-ink dark:text-white/90">Logo</label>
              <div
                onClick={() => logoRef.current?.click()}
                className="mt-1 flex h-16 w-16 lg:h-20 lg:w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-line bg-white dark:border-white/10 dark:bg-surface-dark transition-colors hover:border-ink/40 dark:hover:border-white/20"
              >
                {logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logo} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Upload className="h-5 w-5 text-mid-grey" />
                )}
              </div>
              <p className="text-v-meta text-vendor-text-grey">400×400px minimum</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setLogo(URL.createObjectURL(f));
              }} />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-v-body text-ink dark:text-white/90">Business Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="vendor-input mt-1" />
            </div>

            <div>
              <label className="text-v-body text-ink dark:text-white/90">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                className="vendor-input mt-1 h-[88px] resize-none"
              />
              <p className="mt-1 text-right text-v-meta text-vendor-text-grey">{bio.length}/300</p>
            </div>

            <div>
              <label className="text-v-body text-ink dark:text-white/90">Category Tags (max 8)</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-v-meta font-bold text-teal dark:text-off-white">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 8 ? (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag…"
                    className="w-24 rounded-full border border-dashed border-line dark:border-white/10 px-3 py-1 text-v-meta focus:border-teal focus:outline-none"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <label className="text-v-body text-ink dark:text-white/90">Social Links</label>
          <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-5 lg:space-y-0">
            <input
              value={instagram}
              onChange={(e) => setInsta(e.target.value)}
              placeholder="Instagram handle (no @)"
              className="vendor-input"
            />
            <input
              value={tiktok}
              onChange={(e) => setTk(e.target.value)}
              placeholder="TikTok handle (no @)"
              className="vendor-input"
            />
            <input
              value={website}
              onChange={(e) => setWeb(e.target.value)}
              placeholder="Website URL"
              className="vendor-input"
            />
          </div>
        </div>

        <div>
          <label className="text-v-body text-ink dark:text-white/90">Shipping & Returns Policy</label>
          <textarea
            value={shipping}
            onChange={(e) => setShipping(e.target.value.slice(0, 1000))}
            className="vendor-input mt-1 h-[72px] resize-none"
          />
        </div>

        <button
          onClick={save}
          className="w-full rounded-full bg-vendor-coral-bright py-3 lg:h-btn-d text-v-tsm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Save Storefront Settings
        </button>
      </div>
    </div>
  );
}
