"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useVendor } from "@/context/VendorContext";

const CATEGORIES = ["Portrait", "Studio", "Fantasy", "Outdoor", "Urban"];

export default function BackdropUploadPage() {
  const router = useRouter();
  const { addBackdrop, toast } = useVendor();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [category, setCategory] = useState("Studio");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addKw = () => {
    if (kwInput.trim() && !keywords.includes(kwInput.trim())) {
      setKeywords([...keywords, kwInput.trim()]);
      setKwInput("");
    }
  };

  const publish = () => {
    if (!title.trim() || !image) {
      toast("Please add an image and title.", "error");
      return;
    }
    addBackdrop({
      id: `bd-${Date.now()}`,
      title: title.trim(),
      description,
      keywords,
      category,
      image,
    });
    toast("Backdrop published!", "success");
    router.push("/vendor/dashboard");
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-line dark:border-white/10 bg-white dark:bg-surface-dark px-5 py-3">
        <button onClick={() => router.back()} className="text-v-body text-teal dark:text-off-white">
          ← Back
        </button>
        <h1 className="text-v-title text-ink dark:text-white/90">Backdrop Upload</h1>
      </div>

      <div className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal/60 bg-vendor-teal-tint"
        >
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt="" className="h-full w-full rounded-lg object-cover" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-teal dark:text-off-white" />
              <p className="mt-2 text-v-body text-ink dark:text-white/90">Drag and drop backdrop image or click to upload</p>
              <p className="text-v-meta text-vendor-text-grey">Recommended: 2000×2000px, PNG or JPG</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setImage(URL.createObjectURL(f));
          }}
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Backdrop Title"
          className="vendor-input"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="vendor-input h-[80px] resize-none"
        />
        <div>
          <p className="text-v-body text-ink dark:text-white/90">Keywords / Tags</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k} className="flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-v-meta font-bold text-teal dark:text-off-white">
                {k}
                <button onClick={() => setKeywords(keywords.filter((x) => x !== k))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKw();
                }
              }}
              placeholder="Add keyword…"
              className="w-28 rounded-full border border-dashed border-line dark:border-white/10 px-3 py-1 text-v-meta focus:border-teal focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-v-body text-ink dark:text-white/90">Usage Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="vendor-input mt-1"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={publish}
          className="w-full rounded-md bg-vendor-coral-bright px-5 py-3 text-v-tsm font-bold text-white"
        >
          Save & Publish
        </button>
      </div>
    </div>
  );
}
