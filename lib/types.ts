export type GiftTheme = "romantic-dark" | "floral-light" | "minimal";

export type MediaType = "youtube" | "spotify" | "none";

export type CaptionPosition = "bottom" | "center" | "top" | "hidden";

export type PhotoFilter = "none" | "film" | "bw" | "soft";

export type ExperienceStyle = "classic" | "scrapbook" | "cinema";

export type SlideDurationKey =
  | "welcome"
  | "counter"
  | "personal"
  | "timeline"
  | "constellation"
  | "reasons"
  | "coupons"
  | "places"
  | "photo"
  | "video"
  | "scratch"
  | "capsule"
  | "chapters"
  | "message"
  | "promises"
  | "album"
  | "ending";

export type GiftPhoto = {
  url: string;
  pathname: string;
  filename: string;
  contentType?: string;
  caption?: string;
  memoryDate?: string;
  location?: string;
  quizQuestion?: string;
  quizAnswer?: string;
  captionPosition?: CaptionPosition;
  filter?: PhotoFilter;
  polaroid?: boolean;
};

export type GiftAsset = {
  url: string;
  pathname: string;
  filename: string;
  contentType?: string;
};

export type GiftVideo = GiftAsset & {
  caption?: string;
};

export type GiftPlace = {
  name: string;
  note: string;
};

export type GiftTimelineEvent = {
  title: string;
  date?: string;
  description: string;
};

export type GiftCoupon = {
  title: string;
  description: string;
};

export type GiftMessageChapter = {
  title: string;
  body: string;
};

export type GiftData = {
  slug: string;
  creatorName: string;
  recipientName: string;
  recipientNickname?: string;
  specialDate: string;
  openingHint?: string;
  message: string;
  mediaUrl?: string;
  mediaType: MediaType;
  audio?: GiftAsset;
  videos: GiftVideo[];
  theme: GiftTheme;
  experienceStyle?: ExperienceStyle;
  primaryColor?: string;
  coverPhotoPathname?: string;
  ogTitle?: string;
  ogDescription?: string;
  photos: GiftPhoto[];
  reasons: string[];
  promises: string[];
  hiddenMessages: string[];
  places: GiftPlace[];
  insideJokes: string[];
  timelineEvents: GiftTimelineEvent[];
  coupons: GiftCoupon[];
  messageChapters: GiftMessageChapter[];
  firstLoveMoment?: string;
  favoriteMoment?: string;
  untoldThing?: string;
  surpriseQuestion?: string;
  surpriseAnswer?: string;
  capsuleDate?: string;
  capsuleMessage?: string;
  finalSignature?: string;
  secretWord?: string;
  slideDurations: Partial<Record<SlideDurationKey, number>>;
  createdAt: string;
  updatedAt: string;
};

export type GiftIndexItem = {
  slug: string;
  creatorName: string;
  recipientName: string;
  specialDate: string;
  theme: GiftTheme;
  photoCount: number;
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type GiftIndex = {
  updatedAt: string;
  items: GiftIndexItem[];
};

export type DraftGift = {
  slug: string;
  creatorName: string;
  recipientName: string;
  recipientNickname: string;
  specialDate: string;
  openingHint: string;
  photos: GiftPhoto[];
  message: string;
  mediaUrl: string;
  audio?: GiftAsset;
  videos: GiftVideo[];
  theme: GiftTheme;
  experienceStyle: ExperienceStyle;
  primaryColor: string;
  coverPhotoPathname: string;
  ogTitle: string;
  ogDescription: string;
  reasons: string[];
  promises: string[];
  hiddenMessages: string[];
  places: GiftPlace[];
  insideJokes: string[];
  timelineEvents: GiftTimelineEvent[];
  coupons: GiftCoupon[];
  messageChapters: GiftMessageChapter[];
  firstLoveMoment: string;
  favoriteMoment: string;
  untoldThing: string;
  surpriseQuestion: string;
  surpriseAnswer: string;
  capsuleDate: string;
  capsuleMessage: string;
  finalSignature: string;
  secretWord: string;
  slideDurations: Partial<Record<SlideDurationKey, number>>;
};
