/**
 * Studio Feed dummy data (S-06)
 *
 * Edit the FEED_POSTS array below to change what appears in the TikTok-style feed.
 * Each post showcases one product with a full-screen editorial image.
 */

export interface FeedPost {
  id: string;
  /** full-screen editorial image (portrait 9:16 recommended) */
  image: string;
  /** optional portrait video; image remains its poster/fallback */
  videoUrl?: string | null;
  /** featured product details */
  product: {
    id: string;
    name: string;
    vendorName: string;
    priceGHS: number;
  };
  /** social counters shown on the right rail */
  likes: number;
  rankCount: number;
  shares?: number;
  /** optional creator attribution (not shown in minimal S-06 UI) */
  creator?: {
    username: string;
    avatar: string;
  };
}

export const FEED_POSTS: FeedPost[] = [
  {
    id: "feed-1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcq4jaZmQkSh0gQM0rNaBEYS0rAPy202AcMf_5pCYfMvyqUP5jwzMJcp3gZOjhkuX19k4jsqf9POz3ycY9h691indGJIyYmYYjMAW6wcTxQ8G4-BSZvR6DIfd6PLaDHdl-332y8cAUEXvcw91Lv8WMB-dlAcSVf_NTv71U58kY8NQTGCuStUR4cR_W0sWQncm_yHYuYROYXNqFpTzHHbFet7b3ebD4q7iA_K6JmrAYmLcDNkcEAXRomZjECNTBR2UYamKOlAmnxV0",
    product: {
      id: "a1111111-1111-1111-1111-111111111111",
      name: "Onyx Structure Blazer",
      vendorName: "Maison d'Art",
      priceGHS: 450,
    },
    likes: 2400,
    rankCount: 86,
    shares: 312,
  },
  {
    id: "feed-2",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGQGAI4je-xvxWHvsKpm66WukkH5K2FvDwmjPONEJcbEcQfSyqgVhVX7nK3D39XOTk9qY-qOabasrW3jZ856X9YrsDvdyd2lTEa6gwnVYcgQ6cnRLmZhbsj_izefXaBmlg3PUlBmsaleHY-3gVzz4vyybIqHuwLQS6riZjjRBbpvWsnGRaevTznCQJXG29VBtburxJXeT0Ki_U6NTbxzJnRmvKBdoaHT7_EpjifsvQBBq4AdoRiTYU6n9JGnbXN8DrGz4PsWf6B5M",
    product: {
      id: "a2222222-2222-2222-2222-222222222222",
      name: "Geometric Silk Drape",
      vendorName: "Lumière",
      priceGHS: 895,
    },
    likes: 1820,
    rankCount: 64,
    shares: 210,
  },
  {
    id: "feed-3",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSf0u66zWoxAwO-x6fo7SWQs8RtaJ9u3kJQC3uaMTtxx-plHy8PLEvHjenGmKUcfLlW0dswvKernjfbhJ6Rs9GzBkCXrcwKF1H2aYMyADoUj0bJchWDkt4CcuT3BzbMMWcIDMHeueXgkIhJ251fZiLBweyO0dulIaVDrc-Zkn2K8TRTxFxbIluAR0HTcIsJqpL2E3GecNFmy-4yIfW8WBQ_8BoFl9mfWErlVX1KCpZH1jZiagbN4OgYM3x39FIpd4kBP4SreAEoTE",
    product: {
      id: "a6666666-6666-6666-6666-666666666666",
      name: "Surrealist Drape Dress",
      vendorName: "Maison d'Afrik",
      priceGHS: 410,
    },
    likes: 950,
    rankCount: 42,
    shares: 98,
  },
  {
    id: "feed-4",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuXU0iPUBJV5Ue2Kc1XO9RMcTnp6lSRDXW3QWg15yunc0O4fub7J2LqYLDgVtDAKWjOi92liFKkFmPl9glcVmh6-JPas2DDibFG3GrYpVhHchmV3SRu7VdhLvubECflyVH37oLD2ecl8FScgNRhEiBRqi0bJ9Lp9CUyuHJuzIgmP6T195KHK2uJokaQhanTYkkV955U_qkXysf2JfC4cBkCUqOiAj6TO8LCZCck_VwqGzVwBVU0fLjqCt1Q4ytXqHMSVQO0p3D5cA",
    product: {
      id: "a4444444-4444-4444-4444-444444444444",
      name: "Coastal Linen Shirt",
      vendorName: "Maison d'Afrik",
      priceGHS: 180,
    },
    likes: 3200,
    rankCount: 112,
    shares: 540,
  },
  {
    id: "feed-5",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuARx_IGGR7m-Qr7KE0_Kq7dZH4sIntIpt79bFbnXs86piyxEL3octS2USY0d_ak5FBpXWHLbkngz4M9FiYeBzMd_sudigVuAwqCgovP2Dj_fCse9cdRbZX8Loo3tLLIEuOEHZKV7A-DajIIK2hN8q9O18COFhRzUaZskdLJ8cXVPHApBg7WFx-32lEQ94j1KLFlMlKjpN5sxC5GsCzue29_A9iFPQq17-Efv7XF7NXrvOTzi7pKA9Zcb1NT3LM--JiVcKqXXH36hxo",
    product: {
      id: "b3333333-3333-3333-3333-333333333333",
      name: "Structured Wool Overcoat",
      vendorName: "Maison d'Afrik",
      priceGHS: 620,
    },
    likes: 1450,
    rankCount: 58,
    shares: 176,
  },
  {
    id: "feed-6",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrRKJgMfAT252pRRiL0YrXpaaeSLwETBaShi5yQeiYkSKuBt8xhclBPsnGTq6lzPZNKAiC3SNAUzeA659sC3wz9VgdHdFH4u4bIm2j2s4kPhNS9ncCCuNyp-FXHbRaHHq32fgtTw7oCalNOcRRbq3g-Ltpsq-9zZSzpo401qm-QGBRnimdmybRM9WfmM61TGTncRNgGWKkx_7OlU_WDu7pU58sDjPHCXBgk84Mn5iWlCCY50JFubSs_fPd_o7_myv6b-zhj9Pl41I",
    product: {
      id: "a3333333-3333-3333-3333-333333333333",
      name: "Adinkra Symbol Tote",
      vendorName: "Adinkra Atelier",
      priceGHS: 95,
    },
    likes: 760,
    rankCount: 31,
    shares: 84,
  },
];
