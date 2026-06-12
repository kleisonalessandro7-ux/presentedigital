"use client";

import {
  AnimatePresence,
  animate,
  motion,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useTransform
} from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Images,
  LockKeyhole,
  MapPin,
  MessageCircleHeart,
  Pause,
  Play,
  Printer,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  Ticket,
  Volume2
} from "lucide-react";
import QRCode from "qrcode";
import {
  CSSProperties,
  RefObject,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getMediaEmbedUrl } from "@/lib/media";
import type {
  ExperienceStyle,
  GiftCoupon,
  GiftData,
  GiftMessageChapter,
  GiftPhoto,
  GiftPlace,
  GiftTheme,
  GiftTimelineEvent,
  GiftVideo
} from "@/lib/types";

type GiftExperienceProps = {
  gift: GiftData;
};

type Slide =
  | { id: "welcome"; type: "welcome"; chapter: string }
  | { id: "counter"; type: "counter"; chapter: string }
  | { id: "personal"; type: "personal"; chapter: string }
  | { id: "timeline"; type: "timeline"; chapter: string }
  | { id: "constellation"; type: "constellation"; chapter: string }
  | { id: "reasons"; type: "reasons"; chapter: string }
  | { id: "coupons"; type: "coupons"; chapter: string }
  | { id: "places"; type: "places"; chapter: string }
  | { id: string; type: "photo"; photo: GiftPhoto; index: number; chapter: string }
  | { id: string; type: "video"; video: GiftVideo; index: number; chapter: string }
  | { id: "scratch"; type: "scratch"; chapter: string }
  | { id: "capsule"; type: "capsule"; chapter: string }
  | { id: "chapters"; type: "chapters"; chapter: string }
  | { id: "message"; type: "message"; chapter: string }
  | { id: "promises"; type: "promises"; chapter: string }
  | { id: "album"; type: "album"; chapter: string }
  | { id: "ending"; type: "ending"; chapter: string };

function isSlideInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "label",
        "video",
        "audio",
        "iframe",
        "[role='button']",
        "[role='tab']",
        "[role='slider']",
        "[contenteditable='true']",
        "[data-no-slide-drag='true']"
      ].join(",")
    )
  );
}

const defaultReasons = [
  "o seu jeito de sorrir",
  "a calma que você traz",
  "as conversas que ficam",
  "os detalhes que só você percebe",
  "a forma como tudo ganha sentido"
];

const defaultPromises = [
  "Prometo guardar nossos dias com carinho.",
  "Prometo continuar escolhendo você nos detalhes.",
  "Prometo fazer do amor uma presença, não só uma palavra."
];

const defaultHiddenMessages = [
  "Você é meu lugar favorito.",
  "Tem amor escondido em cada estrela.",
  "Ainda quero viver muitos começos com você."
];

const themeVisuals: Record<
  GiftTheme,
  {
    gradients: string[];
    text: string;
    muted: string;
    accent: string;
    progress: string;
    control: string;
    controlText: string;
    overlay: string;
  }
> = {
  "romantic-dark": {
    gradients: [
      "radial-gradient(circle at 20% 15%, rgba(236,72,153,0.42), transparent 28rem), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.36), transparent 30rem), linear-gradient(135deg, #07050f 0%, #16071b 48%, #080611 100%)",
      "radial-gradient(circle at 70% 18%, rgba(236,72,153,0.36), transparent 28rem), radial-gradient(circle at 24% 72%, rgba(139,92,246,0.34), transparent 32rem), linear-gradient(135deg, #080611 0%, #1b0924 55%, #0c0715 100%)",
      "radial-gradient(circle at 48% 20%, rgba(244,114,182,0.36), transparent 30rem), radial-gradient(circle at 85% 78%, rgba(99,102,241,0.28), transparent 32rem), linear-gradient(145deg, #090512 0%, #1a0a20 58%, #07050f 100%)"
    ],
    text: "text-white",
    muted: "text-pink-100/82",
    accent: "text-pink-200",
    progress: "bg-gradient-to-r from-pink-400 to-violet-400",
    control: "border-white/15 bg-white/10 hover:bg-white/18",
    controlText: "text-white",
    overlay: "from-slate-950 via-slate-950/44 to-transparent"
  },
  "floral-light": {
    gradients: [
      "radial-gradient(circle at 18% 18%, rgba(251,207,232,0.82), transparent 24rem), radial-gradient(circle at 78% 18%, rgba(196,181,253,0.72), transparent 28rem), linear-gradient(135deg, #fff7fb 0%, #fde7f3 48%, #eee7ff 100%)",
      "radial-gradient(circle at 70% 20%, rgba(244,114,182,0.28), transparent 26rem), radial-gradient(circle at 18% 75%, rgba(167,139,250,0.28), transparent 30rem), linear-gradient(135deg, #fffafc 0%, #f9e0ee 52%, #ebe7ff 100%)",
      "radial-gradient(circle at 50% 18%, rgba(236,72,153,0.24), transparent 26rem), radial-gradient(circle at 83% 82%, rgba(139,92,246,0.22), transparent 28rem), linear-gradient(145deg, #fff7fb 0%, #f7dce9 52%, #f4f0ff 100%)"
    ],
    text: "text-slate-950",
    muted: "text-slate-700",
    accent: "text-pink-700",
    progress: "bg-gradient-to-r from-pink-500 to-violet-500",
    control: "border-slate-950/10 bg-white/58 hover:bg-white/78",
    controlText: "text-slate-950",
    overlay: "from-slate-950/86 via-slate-950/34 to-transparent"
  },
  minimal: {
    gradients: [
      "radial-gradient(circle at 18% 18%, rgba(236,72,153,0.25), transparent 24rem), linear-gradient(135deg, #050505 0%, #111827 54%, #0a0a0a 100%)",
      "radial-gradient(circle at 78% 22%, rgba(139,92,246,0.24), transparent 26rem), linear-gradient(135deg, #0a0a0a 0%, #1f2937 52%, #050505 100%)",
      "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.1), transparent 24rem), radial-gradient(circle at 16% 80%, rgba(236,72,153,0.18), transparent 28rem), linear-gradient(145deg, #050505 0%, #101010 55%, #111827 100%)"
    ],
    text: "text-white",
    muted: "text-slate-300",
    accent: "text-pink-200",
    progress: "bg-gradient-to-r from-white to-pink-300",
    control: "border-white/12 bg-white/8 hover:bg-white/14",
    controlText: "text-white",
    overlay: "from-black via-black/45 to-transparent"
  },
  "cinema-night": {
    gradients: [
      "radial-gradient(circle at 20% 18%, rgba(225,29,72,0.34), transparent 26rem), radial-gradient(circle at 82% 15%, rgba(245,158,11,0.24), transparent 24rem), linear-gradient(135deg, #05020a 0%, #16070d 48%, #03020a 100%)",
      "radial-gradient(circle at 72% 22%, rgba(244,63,94,0.28), transparent 28rem), radial-gradient(circle at 22% 82%, rgba(251,191,36,0.18), transparent 30rem), linear-gradient(145deg, #03020a 0%, #190b10 56%, #05020a 100%)",
      "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.12), transparent 20rem), radial-gradient(circle at 85% 78%, rgba(225,29,72,0.22), transparent 28rem), linear-gradient(135deg, #06030c 0%, #1c1015 55%, #05020a 100%)"
    ],
    text: "text-white",
    muted: "text-rose-100/82",
    accent: "text-amber-200",
    progress: "bg-gradient-to-r from-rose-400 to-amber-300",
    control: "border-white/14 bg-white/10 hover:bg-white/16",
    controlText: "text-white",
    overlay: "from-black via-black/48 to-transparent"
  },
  "starry-sky": {
    gradients: [
      "radial-gradient(circle at 20% 18%, rgba(56,189,248,0.26), transparent 26rem), radial-gradient(circle at 78% 20%, rgba(249,168,212,0.2), transparent 24rem), linear-gradient(135deg, #020617 0%, #0f172a 50%, #030712 100%)",
      "radial-gradient(circle at 68% 18%, rgba(125,211,252,0.2), transparent 28rem), radial-gradient(circle at 22% 80%, rgba(236,72,153,0.18), transparent 30rem), linear-gradient(145deg, #020617 0%, #111827 55%, #020617 100%)",
      "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.12), transparent 18rem), radial-gradient(circle at 84% 82%, rgba(14,165,233,0.2), transparent 28rem), linear-gradient(135deg, #030712 0%, #0b1120 60%, #020617 100%)"
    ],
    text: "text-white",
    muted: "text-sky-100/82",
    accent: "text-sky-200",
    progress: "bg-gradient-to-r from-sky-300 to-pink-300",
    control: "border-white/14 bg-white/10 hover:bg-white/16",
    controlText: "text-white",
    overlay: "from-slate-950 via-slate-950/46 to-transparent"
  },
  "vintage-letter": {
    gradients: [
      "radial-gradient(circle at 18% 18%, rgba(190,18,60,0.2), transparent 24rem), radial-gradient(circle at 80% 18%, rgba(146,64,14,0.18), transparent 26rem), linear-gradient(135deg, #fff7ed 0%, #ffedd5 48%, #ffe4e6 100%)",
      "radial-gradient(circle at 75% 20%, rgba(244,63,94,0.18), transparent 26rem), radial-gradient(circle at 18% 78%, rgba(180,83,9,0.14), transparent 30rem), linear-gradient(135deg, #fff7ed 0%, #fed7aa 52%, #fff1f2 100%)",
      "radial-gradient(circle at 50% 18%, rgba(190,18,60,0.14), transparent 24rem), radial-gradient(circle at 82% 82%, rgba(120,53,15,0.14), transparent 28rem), linear-gradient(145deg, #fffbeb 0%, #fed7aa 54%, #fff7ed 100%)"
    ],
    text: "text-stone-950",
    muted: "text-stone-700",
    accent: "text-rose-800",
    progress: "bg-gradient-to-r from-rose-700 to-amber-700",
    control: "border-stone-950/12 bg-white/64 hover:bg-white/82",
    controlText: "text-stone-950",
    overlay: "from-stone-950/80 via-stone-950/28 to-transparent"
  },
  "luxury-gold": {
    gradients: [
      "radial-gradient(circle at 18% 18%, rgba(245,158,11,0.26), transparent 24rem), radial-gradient(circle at 80% 18%, rgba(255,255,255,0.12), transparent 24rem), linear-gradient(135deg, #030712 0%, #11100a 50%, #020617 100%)",
      "radial-gradient(circle at 75% 20%, rgba(251,191,36,0.22), transparent 26rem), radial-gradient(circle at 18% 78%, rgba(236,72,153,0.12), transparent 30rem), linear-gradient(145deg, #020617 0%, #17130a 55%, #030712 100%)",
      "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.1), transparent 22rem), radial-gradient(circle at 82% 82%, rgba(245,158,11,0.18), transparent 28rem), linear-gradient(135deg, #030712 0%, #0f0b05 55%, #020617 100%)"
    ],
    text: "text-white",
    muted: "text-amber-100/80",
    accent: "text-amber-200",
    progress: "bg-gradient-to-r from-amber-200 to-yellow-500",
    control: "border-amber-200/18 bg-white/8 hover:bg-white/14",
    controlText: "text-white",
    overlay: "from-black via-black/48 to-transparent"
  },
  "neon-heart": {
    gradients: [
      "radial-gradient(circle at 20% 18%, rgba(236,72,153,0.36), transparent 24rem), radial-gradient(circle at 80% 18%, rgba(34,211,238,0.28), transparent 26rem), linear-gradient(135deg, #09090b 0%, #16051c 48%, #020617 100%)",
      "radial-gradient(circle at 72% 22%, rgba(34,211,238,0.28), transparent 28rem), radial-gradient(circle at 22% 82%, rgba(236,72,153,0.28), transparent 30rem), linear-gradient(145deg, #020617 0%, #15051a 56%, #09090b 100%)",
      "radial-gradient(circle at 48% 20%, rgba(255,255,255,0.12), transparent 20rem), radial-gradient(circle at 86% 80%, rgba(236,72,153,0.28), transparent 28rem), linear-gradient(135deg, #09090b 0%, #101026 55%, #020617 100%)"
    ],
    text: "text-white",
    muted: "text-cyan-100/82",
    accent: "text-cyan-200",
    progress: "bg-gradient-to-r from-pink-400 to-cyan-300",
    control: "border-cyan-200/18 bg-white/9 hover:bg-white/16",
    controlText: "text-white",
    overlay: "from-black via-black/46 to-transparent"
  }
};

type ThemeVisual = (typeof themeVisuals)[GiftTheme];

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysSince(date: string) {
  const start = parseLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
}

function formatDate(date?: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parseLocalDate(date));
}

function daysUntil(date?: string) {
  if (!date) {
    return 0;
  }

  const target = parseLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function cleanList(values: string[] | undefined, fallback: string[]) {
  const cleaned = (values || []).map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function cleanPlaces(values: GiftPlace[] | undefined) {
  return (values || []).filter((place) => place.name.trim() || place.note.trim());
}

function cleanTimelineEvents(values: GiftTimelineEvent[] | undefined) {
  return (values || []).filter((event) => event.title.trim() || event.description.trim());
}

function cleanCoupons(values: GiftCoupon[] | undefined) {
  return (values || []).filter((coupon) => coupon.title.trim() || coupon.description.trim());
}

function cleanChapters(values: GiftMessageChapter[] | undefined) {
  return (values || []).filter((chapter) => chapter.title.trim() || chapter.body.trim());
}

function AnimatedNumber({ value, active }: { value: number; active: boolean }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString("pt-BR")
  );

  useEffect(() => {
    if (!active) {
      motionValue.set(0);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 2.1,
      ease: [0.22, 1, 0.36, 1]
    });

    return () => controls.stop();
  }, [active, motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
}

function TypingText({
  text,
  active,
  className
}: {
  text: string;
  active: boolean;
  className: string;
}) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    if (!active) {
      setVisible("");
      return;
    }

    setVisible("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [active, text]);

  return (
    <p className={className}>
      {visible}
      <span className="ml-1 inline-block h-7 w-[2px] translate-y-1 animate-softPulse rounded-full bg-current" />
    </p>
  );
}

function EnvelopeGate({
  gift,
  onOpen,
  onPrintInvite,
  onPrintCoupons,
  canPrint,
  hasCoupons,
  qrUrl
}: {
  gift: GiftData;
  onOpen: () => void;
  onPrintInvite: () => void;
  onPrintCoupons: () => void;
  canPrint: boolean;
  hasCoupons: boolean;
  qrUrl: string;
}) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);

  function startHold() {
    setHolding(true);
    timerRef.current = window.setTimeout(onOpen, 1100);
  }

  function stopHold() {
    setHolding(false);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#07050f] px-4 py-5 text-center text-white sm:items-center sm:px-6 sm:py-6"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.9 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(236,72,153,0.28),transparent_30rem),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.22),transparent_28rem)]" />
      <div className="absolute inset-0 film-grain opacity-35" />

      <motion.div
        className="relative w-full max-w-lg"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="mb-5 text-sm font-bold uppercase text-pink-200">
          Respire fundo
        </p>
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onClick={onOpen}
          className="group mx-auto block w-full max-w-sm rounded-[10px] border border-pink-200/30 bg-pink-100/8 p-5 shadow-glow backdrop-blur-xl sm:p-8"
        >
          <div className="relative mx-auto aspect-[1.45] max-w-[220px] overflow-hidden rounded-lg border border-pink-100/30 bg-gradient-to-br from-pink-200 via-pink-100 to-violet-200 shadow-2xl sm:max-w-[270px]">
            <div className="absolute inset-x-0 top-0 h-1/2 origin-top bg-pink-200/90 [clip-path:polygon(0_0,100%_0,50%_100%)] transition duration-700 group-hover:rotate-x-12" />
            <div className="absolute inset-0 [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)] bg-pink-100/95" />
            <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-glow">
              <Heart size={24} fill="currentColor" aria-hidden="true" />
            </div>
          </div>
          <span className="mt-5 block font-display text-3xl leading-tight sm:mt-7 sm:text-4xl">
            Carta para {gift.recipientName}
          </span>
          <span className="mx-auto mt-4 block max-w-xs text-sm leading-6 text-pink-100/80">
            {gift.openingHint || "Toque e segure para abrir uma lembrança feita só para você."}
          </span>
          <span className="mt-6 block h-1 overflow-hidden rounded-full bg-white/12">
            <motion.span
              className="block h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-400"
              animate={{ width: holding ? "100%" : "0%" }}
              transition={{ duration: holding ? 1.1 : 0.2, ease: "linear" }}
            />
          </span>
        </button>
        <div className="mx-auto mt-4 grid max-w-sm gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrintInvite}
            disabled={!canPrint}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/16 disabled:opacity-45"
          >
            <QrCode size={17} aria-hidden="true" />
            Imprimir convite
          </button>
          <button
            type="button"
            onClick={onPrintCoupons}
            disabled={!canPrint || !hasCoupons}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/16 disabled:opacity-45"
          >
            <Printer size={17} aria-hidden="true" />
            Imprimir cupons
          </button>
        </div>
        {qrUrl ? (
          <div className="mx-auto mt-4 flex max-w-sm items-center gap-3 rounded-2xl border border-white/14 bg-white/10 p-3 text-left backdrop-blur-xl">
            <div className="rounded-xl bg-white p-2">
              <img src={qrUrl} alt="QR Code do presente" className="h-20 w-20" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">QR do presente</p>
              <p className="mt-1 text-xs leading-5 text-pink-100/80">
                Use este codigo para imprimir e entregar o presente em papel.
              </p>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function SoundStartGate({
  gift,
  onStart
}: {
  gift: GiftData;
  onStart: (withSound: boolean) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#07050f] px-6 text-center text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.7 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(236,72,153,0.32),transparent_28rem),radial-gradient(circle_at_78%_80%,rgba(139,92,246,0.24),transparent_30rem)]" />
      <div className="relative z-10 max-w-lg">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-white/14 bg-white/10 shadow-glow backdrop-blur-xl">
          <Volume2 size={32} aria-hidden="true" />
        </div>
        <p className="mb-4 text-sm font-bold uppercase text-pink-200">Antes de abrir</p>
        <h1 className="font-display text-5xl leading-tight sm:text-6xl">
          Começar com som?
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-pink-100/80">
          {gift.audio
            ? "Há uma mensagem de voz esperando junto com a carta."
            : "A música e os detalhes sonoros ficam melhores quando você começa por aqui."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onStart(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-slate-950 shadow-glow"
          >
            <Play size={17} aria-hidden="true" />
            Começar com som
          </button>
          <button
            type="button"
            onClick={() => onStart(false)}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-xl"
          >
            Continuar sem som
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SurpriseGate({
  gift,
  onUnlock
}: {
  gift: GiftData;
  onUnlock: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const expected = (gift.surpriseAnswer || "").trim().toLowerCase();

  function submit() {
    if (!expected || answer.trim().toLowerCase() === expected) {
      setError(false);
      onUnlock();
      return;
    }

    setError(true);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center overflow-hidden bg-[#07050f] px-6 text-center text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.7 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(236,72,153,0.28),transparent_28rem),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.22),transparent_30rem)]" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/14 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950">
          <LockKeyhole size={24} aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-bold uppercase text-pink-100">Antes da carta</p>
        <h2 className="font-display text-4xl leading-tight">
          {gift.surpriseQuestion || "Uma pergunta só nossa"}
        </h2>
        <input
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
          className="mt-6 h-12 w-full rounded-lg border border-white/14 bg-black/30 px-4 text-center text-white outline-none placeholder:text-white/45 focus:border-pink-200"
          placeholder="Digite a resposta"
        />
        {error ? (
          <p className="mt-3 text-sm font-semibold text-pink-100">
            Tente de novo com carinho.
          </p>
        ) : null}
        <button
          type="button"
          onClick={submit}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-slate-950 shadow-glow"
        >
          Abrir surpresa
        </button>
      </div>
    </motion.div>
  );
}

function GiftQrCode({ onReady }: { onReady?: (dataUrl: string) => void }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    QRCode.toDataURL(window.location.href, {
      margin: 1,
      width: 160,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then((dataUrl) => {
      setQr(dataUrl);
      onReady?.(dataUrl);
    });
  }, [onReady]);

  if (!qr) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/14 bg-white p-3 text-slate-950 shadow-violet">
      <img src={qr} alt="QR Code do presente" className="h-32 w-32" />
    </div>
  );
}

type MusicDockMode = "open" | "minimized" | "hidden";

function MusicDock({
  mediaEmbedUrl,
  sourceUrl,
  mode,
  onModeChange
}: {
  mediaEmbedUrl: string;
  sourceUrl?: string;
  mode: MusicDockMode;
  onModeChange: (mode: MusicDockMode) => void;
}) {
  const isSpotify = mediaEmbedUrl.includes("spotify.com");

  return (
    <div className="pointer-events-none fixed right-3 top-[4.85rem] z-40 w-[min(22rem,calc(100vw-1.5rem))] text-white sm:bottom-24 sm:right-4 sm:top-auto">
      {mode === "open" ? (
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/12 bg-black/44 p-3 shadow-violet backdrop-blur-xl transition duration-300">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase text-pink-100">Trilha sonora</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onModeChange("minimized")}
                className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/80"
              >
                Minimizar
              </button>
              <button
                type="button"
                onClick={() => onModeChange("hidden")}
                className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/80"
              >
                Esconder
              </button>
            </div>
          </div>
          <iframe
            title="Trilha sonora do presente"
            src={mediaEmbedUrl}
            className={`w-full rounded-xl border-0 ${isSpotify ? "h-24" : "h-44"}`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-xs font-bold text-pink-100 hover:bg-white/10"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Abrir no app
            </a>
          ) : null}
        </div>
      ) : null}

      {mode !== "open" ? (
        <button
          type="button"
          onClick={() => onModeChange("open")}
          className={`pointer-events-auto ml-auto flex h-11 items-center gap-2 rounded-full border border-white/14 bg-black/42 px-4 text-sm font-bold text-white shadow-violet backdrop-blur-xl transition ${
            mode === "hidden" ? "opacity-60" : "opacity-100"
          }`}
        >
          <Volume2 size={17} aria-hidden="true" />
          Trilha
        </button>
      ) : null}
    </div>
  );
}

function AudioDock({
  audioRef,
  sourceUrl,
  visible,
  active,
  blocked,
  onToggle,
  onPlay,
  onPause
}: {
  audioRef: RefObject<HTMLAudioElement>;
  sourceUrl: string;
  visible: boolean;
  active: boolean;
  blocked: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onPause: () => void;
}) {
  return (
    <div
      className={
        visible
          ? "fixed left-3 top-[4.85rem] z-40 text-white sm:bottom-24 sm:left-4 sm:top-auto"
          : "sr-only"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 items-center gap-2 rounded-full border border-white/14 bg-black/42 px-4 text-sm font-bold text-white shadow-violet backdrop-blur-xl transition hover:bg-black/55"
      >
        {active ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {blocked ? "Liberar som" : "Som"}
      </button>
      <audio
        ref={audioRef}
        src={sourceUrl}
        className="sr-only"
        preload="auto"
        loop
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onPause}
      />
    </div>
  );
}

type PrintMode = "invite" | "coupons" | "letter" | "qr";

function PrintableGiftSheets({
  gift,
  coupons,
  qrUrl,
  shareUrl
}: {
  gift: GiftData;
  coupons: GiftCoupon[];
  qrUrl: string;
  shareUrl: string;
}) {
  const cover =
    gift.photos.find((photo) => photo.pathname === gift.coverPhotoPathname) ||
    gift.photos[0];
  const printedCoupons = coupons.length
    ? coupons.slice(0, 8)
    : [
        {
          title: "Vale abraco demorado",
          description: "Para usar em qualquer dia que pedir mais carinho."
        },
        {
          title: "Vale encontro surpresa",
          description: "Um momento escolhido com calma, so para nos dois."
        },
        {
          title: "Vale filme juntinhos",
          description: "Com direito a escolher o filme e ficar perto."
        }
      ];

  return (
    <div className="printable-gift-pages" aria-hidden="true">
      <section className="printable-page printable-invite">
        <div className="print-ornament print-ornament-left" />
        <div className="print-ornament print-ornament-right" />
        <div className="print-invite-grid">
          <div className="print-invite-copy">
            <p className="print-eyebrow">Um presente digital espera por voce</p>
            <h1>Para {gift.recipientName}</h1>
            <p className="print-subtitle">
              Com amor de {gift.creatorName}, em uma lembranca feita para abrir devagar.
            </p>
            <div className="print-date-row">
              <span>Desde {formatDate(gift.specialDate)}</span>
              <span>{gift.photos.length} memorias</span>
            </div>
            <p className="print-note">
              Aponte a camera do celular para o QR Code e abra a surpresa.
            </p>
          </div>
          <div className="print-qr-card">
            {cover ? (
              <img className="print-cover" src={cover.url} alt="" />
            ) : null}
            <div className="print-qr-frame">
              {qrUrl ? <img src={qrUrl} alt="QR Code do presente" /> : null}
            </div>
            <p>{shareUrl}</p>
          </div>
        </div>
      </section>

      <section className="printable-page printable-coupons">
        <div className="print-coupon-header">
          <p className="print-eyebrow">Vales para usar com carinho</p>
          <h2>Cupons de amor</h2>
          <p>
            Para {gift.recipientName}, de {gift.creatorName}
          </p>
        </div>
        <div className="print-coupon-grid">
          {printedCoupons.map((coupon, index) => (
            <article className="print-coupon" key={`${coupon.title}-${index}`}>
              <div>
                <span>Vale {String(index + 1).padStart(2, "0")}</span>
                <h3>{coupon.title}</h3>
                <p>{coupon.description}</p>
              </div>
              <div className="print-coupon-foot">
                <span>Para destacar e usar quando quiser</span>
                <span>Presente digital</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GiftExperience({ gift }: GiftExperienceProps) {
  const visual = themeVisuals[gift.theme];
  const reasons = useMemo(() => cleanList(gift.reasons, defaultReasons), [gift.reasons]);
  const promises = useMemo(
    () => cleanList(gift.promises, defaultPromises),
    [gift.promises]
  );
  const hiddenMessages = useMemo(
    () => cleanList(gift.hiddenMessages, defaultHiddenMessages),
    [gift.hiddenMessages]
  );
  const places = useMemo(() => cleanPlaces(gift.places), [gift.places]);
  const timelineEvents = useMemo(
    () => cleanTimelineEvents(gift.timelineEvents),
    [gift.timelineEvents]
  );
  const coupons = useMemo(() => cleanCoupons(gift.coupons), [gift.coupons]);
  const chapters = useMemo(() => cleanChapters(gift.messageChapters), [gift.messageChapters]);
  const slides = useMemo<Slide[]>(() => {
    const placeSlides: Slide[] = places.length
      ? [{ id: "places", type: "places", chapter: "Lugares" }]
      : [];
    const timelineSlides: Slide[] = timelineEvents.length
      ? [{ id: "timeline", type: "timeline", chapter: "Linha do tempo" }]
      : [];
    const couponSlides: Slide[] = coupons.length
      ? [{ id: "coupons", type: "coupons", chapter: "Vales" }]
      : [];
    const chapterSlides: Slide[] = chapters.length
      ? [{ id: "chapters", type: "chapters", chapter: "Capítulos" }]
      : [];
    const photoSlides: Slide[] = gift.photos.map((photo, index) => ({
      id: `photo-${index}`,
      type: "photo",
      photo,
      index,
      chapter: "Memórias"
    }));
    const videoSlides: Slide[] = (gift.videos || []).map((video, index) => ({
      id: `video-${index}`,
      type: "video",
      video,
      index,
      chapter: "Vídeos"
    }));

    return [
      { id: "welcome", type: "welcome", chapter: "Abertura" },
      { id: "counter", type: "counter", chapter: "Tempo" },
      { id: "personal", type: "personal", chapter: "Entre nós" },
      ...timelineSlides,
      { id: "constellation", type: "constellation", chapter: "Segredos" },
      { id: "reasons", type: "reasons", chapter: "Motivos" },
      ...couponSlides,
      ...placeSlides,
      ...photoSlides,
      ...videoSlides,
      { id: "scratch", type: "scratch", chapter: "Revelação" },
      { id: "capsule", type: "capsule", chapter: "Futuro" },
      ...chapterSlides,
      { id: "message", type: "message", chapter: "Carta" },
      { id: "promises", type: "promises", chapter: "Promessas" },
      { id: "album", type: "album", chapter: "Álbum" },
      { id: "ending", type: "ending", chapter: "Final" }
    ];
  }, [chapters.length, coupons.length, gift.photos, gift.videos, places.length, timelineEvents.length]);
  const [soundReady, setSoundReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [musicMode, setMusicMode] = useState<MusicDockMode>("minimized");
  const [surpriseUnlocked, setSurpriseUnlocked] = useState(
    !gift.surpriseQuestion || !gift.surpriseAnswer
  );
  const [sealed, setSealed] = useState(true);
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [holdUntil, setHoldUntil] = useState(0);
  const [holdTick, setHoldTick] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [printQrUrl, setPrintQrUrl] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideDragControls = useDragControls();
  const currentSlide = slides[current];
  const primary = gift.primaryColor || "#ec4899";
  const experienceStyle = gift.experienceStyle || "classic";
  const currentGradient = `${visual.gradients[current % visual.gradients.length]}, radial-gradient(circle at ${mouse.x}% ${mouse.y}%, ${primary}44, transparent 16rem)`;
  const specialDays = useMemo(() => daysSince(gift.specialDate), [gift.specialDate]);
  const mediaEmbedUrl = useMemo(() => getMediaEmbedUrl(gift.mediaUrl), [gift.mediaUrl]);
  const isLast = current === slides.length - 1;
  const currentDelay =
    (gift.slideDurations || {})[currentSlide.type as keyof GiftData["slideDurations"]] ||
    (currentSlide.type === "message"
      ? 18
      : currentSlide.type === "photo"
        ? 10
        : currentSlide.type === "video"
          ? 30
          : currentSlide.type === "coupons"
            ? 16
            : currentSlide.type === "constellation" || currentSlide.type === "album"
              ? 14
              : currentSlide.type === "scratch" || currentSlide.type === "capsule"
                ? 14
                : 9);

  const experienceStarted = soundReady && surpriseUnlocked && !sealed;
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        left: `${(index * 29 + 7) % 100}%`,
        size: `${5 + (index % 5) * 2}px`,
        duration: `${12 + (index % 8)}s`,
        delay: `${-1 * ((index * 0.55) % 9)}s`,
        drift: `${(index % 2 === 0 ? 1 : -1) * (26 + (index % 6) * 14)}px`
      })),
    []
  );
  const petals = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        left: `${(index * 41 + 13) % 100}%`,
        width: `${8 + (index % 5) * 3}px`,
        duration: `${11 + (index % 9)}s`,
        delay: `${-1 * ((index * 0.72) % 12)}s`,
        drift: `${(index % 2 === 0 ? 1 : -1) * (70 + (index % 5) * 24)}px`
      })),
    []
  );
  const skyStars = useMemo(
    () =>
      Array.from({ length: 72 }, (_, index) => ({
        left: `${(index * 37 + 11) % 100}%`,
        top: `${(index * 53 + 7) % 100}%`,
        size: `${1 + (index % 4) * 0.75}px`,
        opacity: `${0.28 + (index % 6) * 0.1}`,
        delay: `${-1 * ((index * 0.37) % 4)}s`,
        duration: `${2.8 + (index % 7) * 0.45}s`
      })),
    []
  );
  const skyShootingStars = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        top: `${8 + index * 13}%`,
        left: `${-18 - index * 10}%`,
        delay: `${index * 2.7}s`,
        duration: `${4.8 + index * 0.45}s`,
        width: `${92 + index * 14}px`
      })),
    []
  );

  const goTo = useCallback(
    (index: number) => {
      setHoldUntil(Date.now() + 8000);
      setCurrent(Math.min(Math.max(index, 0), slides.length - 1));
    },
    [slides.length]
  );

  const next = useCallback(() => {
    setHoldUntil(Date.now() + 8000);
    setCurrent((index) => Math.min(index + 1, slides.length - 1));
  }, [slides.length]);

  const previous = useCallback(() => {
    setHoldUntil(Date.now() + 8000);
    setCurrent((index) => Math.max(index - 1, 0));
  }, []);

  function replay() {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setAutoPlay(true);
    setCurrent(0);
    setSealed(true);
    setSoundReady(false);
    setSoundEnabled(false);
    setAudioPlaying(false);
    setAudioBlocked(false);
    setMusicMode("minimized");
    setSurpriseUnlocked(!gift.surpriseQuestion || !gift.surpriseAnswer);
  }

  function startExperience(withSound: boolean) {
    setSoundEnabled(withSound);
    setSoundReady(true);

    if (withSound && mediaEmbedUrl && !gift.audio) {
      setMusicMode(window.innerWidth >= 768 ? "open" : "minimized");
    }

    if (withSound && gift.audio && audioRef.current) {
      audioRef.current.volume = 0.86;
      void audioRef.current
        .play()
        .then(() => {
          setAudioPlaying(true);
          setAudioBlocked(false);
        })
        .catch(() => {
          setAudioBlocked(true);
        });
    }
  }

  function toggleAudio() {
    if (!audioRef.current) {
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.volume = 0.86;
      void audioRef.current
        .play()
        .then(() => {
          setAudioPlaying(true);
          setAudioBlocked(false);
          setSoundEnabled(true);
        })
        .catch(() => {
          setAudioBlocked(true);
        });
      return;
    }

    audioRef.current.pause();
    setAudioPlaying(false);
  }

  function printSheet(mode: PrintMode) {
    const type =
      mode === "coupons" ? "cupons" : mode === "letter" ? "carta" : mode === "qr" ? "qr" : "convite";
    window.open(`/presente/${gift.slug}/imprimir?tipo=${type}`, "_blank", "noopener,noreferrer");
  }

  const holdForInteraction = useCallback((seconds = 18) => {
    setHoldUntil(Date.now() + seconds * 1000);
  }, []);

  const handleSlidePointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isSlideInteractiveTarget(event.target)) {
        holdForInteraction(18);
        return;
      }

      slideDragControls.start(event);
    },
    [holdForInteraction, slideDragControls]
  );

  const handleVideoPlay = useCallback(() => {
    setAutoPlay(false);
    holdForInteraction(600);
  }, [holdForInteraction]);

  const handleVideoPause = useCallback(() => {
    setAutoPlay(true);
    holdForInteraction(10);
  }, [holdForInteraction]);

  const handleVideoEnded = useCallback(() => {
    setAutoPlay(true);
    holdForInteraction(4);
  }, [holdForInteraction]);

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -70) {
      next();
    }

    if (info.offset.x > 70) {
      previous();
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (sealed) {
        return;
      }

      if (event.key === "ArrowRight") {
        next();
      }

      if (event.key === "ArrowLeft") {
        previous();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, previous, sealed]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!shareUrl) {
      return;
    }

    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 420,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then(setPrintQrUrl);
  }, [shareUrl]);

  useEffect(() => {
    if (holdUntil <= Date.now()) {
      return;
    }

    const timer = window.setTimeout(() => setHoldTick((value) => value + 1), holdUntil - Date.now());

    return () => window.clearTimeout(timer);
  }, [holdUntil, holdTick]);

  useEffect(() => {
    if (!sealed && soundEnabled && gift.audio && audioRef.current) {
      audioRef.current.volume = audioRef.current.paused ? 0 : audioRef.current.volume;
      void audioRef.current.play().then(() => {
        setAudioPlaying(true);
        setAudioBlocked(false);
        const fade = window.setInterval(() => {
          if (!audioRef.current) {
            window.clearInterval(fade);
            return;
          }

          audioRef.current.volume = Math.min(0.86, audioRef.current.volume + 0.08);

          if (audioRef.current.volume >= 0.86) {
            window.clearInterval(fade);
          }
        }, 140);
      }).catch(() => {
        setAudioBlocked(true);
      });
    }
  }, [gift.audio, sealed, soundEnabled]);

  useEffect(() => {
    if (sealed || !autoPlay || isLast || holdUntil > Date.now()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrent((index) => Math.min(index + 1, slides.length - 1));
    }, currentDelay * 1000);

    return () => window.clearTimeout(timer);
  }, [autoPlay, currentDelay, holdTick, holdUntil, isLast, sealed, slides.length]);

  return (
    <main
      className={`gift-experience ${
        gift.theme === "floral-light" || gift.theme === "vintage-letter"
          ? "gift-experience-light"
          : ""
      } relative h-[100svh] overflow-hidden ${visual.text}`}
      onPointerMove={(event) =>
        setMouse({
          x: Math.round((event.clientX / window.innerWidth) * 100),
          y: Math.round((event.clientY / window.innerHeight) * 100)
        })
      }
    >
      <PrintableGiftSheets
        gift={gift}
        coupons={coupons}
        qrUrl={printQrUrl}
        shareUrl={shareUrl}
      />

      {gift.audio ? (
        <AudioDock
          audioRef={audioRef}
          sourceUrl={gift.audio.url}
          visible={soundReady}
          active={audioPlaying && soundEnabled}
          blocked={audioBlocked}
          onToggle={toggleAudio}
          onPlay={() => {
            setAudioPlaying(true);
            setAudioBlocked(false);
          }}
          onPause={() => setAudioPlaying(false)}
        />
      ) : null}

      {soundReady && mediaEmbedUrl ? (
        <MusicDock
          mediaEmbedUrl={mediaEmbedUrl}
          sourceUrl={gift.mediaUrl}
          mode={musicMode}
          onModeChange={setMusicMode}
        />
      ) : null}

      {!soundReady ? (
        <SoundStartGate
          gift={gift}
          onStart={startExperience}
        />
      ) : null}

      {soundReady && !surpriseUnlocked ? (
        <SurpriseGate gift={gift} onUnlock={() => setSurpriseUnlocked(true)} />
      ) : null}

      {soundReady && surpriseUnlocked && sealed ? (
        <EnvelopeGate
          gift={gift}
          onOpen={() => {
            setSealed(false);
          }}
          onPrintInvite={() => printSheet("invite")}
          onPrintCoupons={() => printSheet("coupons")}
          canPrint={Boolean(printQrUrl)}
          hasCoupons
          qrUrl={printQrUrl}
        />
      ) : null}

      {experienceStarted ? (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGradient}
              className="absolute inset-0"
              style={{ background: currentGradient }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </AnimatePresence>

          <div className="starry-sky-layer pointer-events-none absolute inset-0 overflow-hidden">
            {skyStars.map((star, index) => (
              <span
                key={`sky-star-${index}`}
                className="sky-star"
                style={
                  {
                    left: star.left,
                    top: star.top,
                    "--star-size": star.size,
                    "--star-opacity": star.opacity,
                    "--star-delay": star.delay,
                    "--star-duration": star.duration
                  } as CSSProperties
                }
              />
            ))}
            {skyShootingStars.map((star, index) => (
              <span
                key={`sky-shooting-${index}`}
                className="sky-shooting-star"
                style={
                  {
                    left: star.left,
                    top: star.top,
                    "--shooting-delay": star.delay,
                    "--shooting-duration": star.duration,
                    "--shooting-width": star.width
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((particle, index) => (
              <span
                key={index}
                className="heart-particle hand-heart"
                style={
                  {
                    left: particle.left,
                    "--heart-size": particle.size,
                    "--heart-duration": particle.duration,
                    "--heart-delay": particle.delay,
                    "--heart-drift": particle.drift,
                    background: index % 3 === 0 ? primary : "rgba(236, 72, 153, 0.72)"
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-0 overflow-hidden transition-transform duration-500"
            style={{
              transform: `translate3d(${(mouse.x - 50) * 0.08}px, ${(mouse.y - 50) * 0.06}px, 0)`
            }}
          >
            {petals.map((petal, index) => (
              <span
                key={index}
                className="petal-particle"
                style={
                  {
                    left: petal.left,
                    "--petal-width": petal.width,
                    "--petal-duration": petal.duration,
                    "--petal-delay": petal.delay,
                    "--petal-drift": petal.drift
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 film-grain opacity-20" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 mx-auto h-px max-w-3xl bg-pink-200/16">
            <span className="heartbeat-line" />
          </div>

          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
            <div className="mx-auto flex max-w-5xl gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(index)}
                  className="pointer-events-auto h-4 flex-1 rounded-full py-[6px]"
                  aria-label={`Ir para slide ${index + 1}`}
                  title={slide.chapter}
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-white/20">
                    <motion.span
                      className={`block h-full rounded-full ${visual.progress}`}
                      animate={{ width: index <= current ? "100%" : "0%" }}
                      transition={{ duration: 0.45 }}
                    />
                  </span>
                </button>
              ))}
            </div>
            <div className="mx-auto mt-3 max-w-5xl text-xs font-bold uppercase tracking-normal text-white/56">
              {currentSlide.chapter}
            </div>
          </div>

          <motion.div
            className="relative z-20 h-full"
            drag="x"
            dragControls={slideDragControls}
            dragDirectionLock
            dragListener={false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onPointerDownCapture={handleSlidePointerDownCapture}
            onDragEnd={handleDragEnd}
            style={{ touchAction: "pan-y" }}
          >
            <AnimatePresence mode="wait">
              <motion.section
                key={currentSlide.id}
                className={`mobile-safe-slide relative flex h-full items-start justify-center overflow-y-auto overscroll-contain px-4 pb-44 pt-32 sm:px-10 sm:pb-48 sm:pt-40 ${
                  experienceStyle === "scrapbook" ? "scrapbook-scene" : ""
                }`}
                initial={{ opacity: 0, y: 28, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.99 }}
                transition={{
                  duration: experienceStyle === "cinema" ? 1.05 : 0.75,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
            {currentSlide.type === "welcome" ? (
              <WelcomeSlide gift={gift} visual={visual} />
            ) : null}

            {currentSlide.type === "counter" ? (
              <CounterSlide
                active={currentSlide.type === "counter"}
                days={specialDays}
                date={gift.specialDate}
                visual={visual}
              />
            ) : null}

            {currentSlide.type === "personal" ? (
              <PersonalSlide gift={gift} visual={visual} />
            ) : null}

            {currentSlide.type === "timeline" ? (
              <TimelineSlide events={timelineEvents} visual={visual} />
            ) : null}

            {currentSlide.type === "constellation" ? (
              <ConstellationSlide
                gift={gift}
                hiddenMessages={hiddenMessages}
                visual={visual}
              />
            ) : null}

            {currentSlide.type === "reasons" ? (
              <ReasonsSlide reasons={reasons} visual={visual} />
            ) : null}

            {currentSlide.type === "coupons" ? (
              <CouponsSlide coupons={coupons} visual={visual} />
            ) : null}

            {currentSlide.type === "places" ? (
              <PlacesSlide places={places} visual={visual} />
            ) : null}

            {currentSlide.type === "photo" ? (
              <PhotoSlide
                photo={currentSlide.photo}
                index={currentSlide.index}
                total={gift.photos.length}
                visual={visual}
                onInteract={() => setHoldUntil(Date.now() + 8000)}
                experienceStyle={experienceStyle}
              />
            ) : null}

            {currentSlide.type === "video" ? (
              <VideoSlide
                video={currentSlide.video}
                visual={visual}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
              />
            ) : null}

            {currentSlide.type === "scratch" ? (
              <ScratchSlide gift={gift} visual={visual} />
            ) : null}

            {currentSlide.type === "capsule" ? (
              <CapsuleSlide gift={gift} visual={visual} />
            ) : null}

            {currentSlide.type === "chapters" ? (
              <ChaptersSlide chapters={chapters} visual={visual} />
            ) : null}

            {currentSlide.type === "message" ? (
              <MessageSlide
                gift={gift}
                active={currentSlide.type === "message"}
                visual={visual}
              />
            ) : null}

            {currentSlide.type === "promises" ? (
              <PromisesSlide promises={promises} visual={visual} />
            ) : null}

            {currentSlide.type === "album" ? (
              <AlbumSlide gift={gift} visual={visual} />
            ) : null}

            {currentSlide.type === "ending" ? (
              <EndingSlide
                gift={gift}
                reasons={reasons}
                mediaEmbedUrl={mediaEmbedUrl}
                mediaUrl={gift.mediaUrl}
                hasAudio={Boolean(gift.audio)}
                onReplay={replay}
                onOpenMusic={() => {
                  if (mediaEmbedUrl) {
                    setMusicMode("open");
                  }

                  if (gift.audio && audioRef.current?.paused) {
                    toggleAudio();
                  }
                }}
                onPrintInvite={() => printSheet("invite")}
                onPrintQr={() => printSheet("qr")}
                onPrintCoupons={() => printSheet("coupons")}
                onPrintLetter={() => printSheet("letter")}
                onPrintPackage={() => window.open(`/presente/${gift.slug}/imprimir?tipo=pacote`, "_blank", "noopener,noreferrer")}
                onGoTo={(type) => {
                  const target = slides.findIndex((slide) => slide.type === type);
                  if (target >= 0) {
                    goTo(target);
                  }
                }}
                visual={visual}
              />
            ) : null}
          </motion.section>
        </AnimatePresence>
      </motion.div>

      <button
        type="button"
        onClick={previous}
        disabled={current === 0 || sealed}
        className={`fixed left-5 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-xl transition disabled:opacity-30 md:inline-flex ${visual.control} ${visual.controlText}`}
        aria-label="Slide anterior"
        title="Slide anterior"
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={next}
        disabled={isLast || sealed}
        className={`fixed right-5 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-xl transition disabled:opacity-30 md:inline-flex ${visual.control} ${visual.controlText}`}
        aria-label="Próximo slide"
        title="Próximo slide"
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-full border border-white/10 bg-black/24 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={previous}
            disabled={current === 0 || sealed}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-30 ${visual.control} ${visual.controlText}`}
            aria-label="Slide anterior"
            title="Slide anterior"
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setAutoPlay((value) => !value)}
            disabled={sealed}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-30 ${visual.control} ${visual.controlText}`}
            aria-label={autoPlay ? "Pausar" : "Reproduzir"}
            title={autoPlay ? "Pausar" : "Reproduzir"}
          >
            {autoPlay ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isLast || sealed}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-30 ${visual.control} ${visual.controlText}`}
            aria-label="Próximo slide"
            title="Próximo slide"
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
        </>
      ) : null}
    </main>
  );
}

function WelcomeSlide({ gift, visual }: { gift: GiftData; visual: ThemeVisual }) {
  const photos = gift.photos.slice(0, 5);

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div>
        <motion.p
          className={`mb-5 text-sm font-bold uppercase ${visual.accent}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
        >
          Para {gift.recipientName}
        </motion.p>
        <motion.h1
          className="ink-title break-words font-display slide-title-safe"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Com amor de {gift.creatorName}
        </motion.h1>
        <motion.p
          className={`mt-7 max-w-2xl text-lg leading-8 ${visual.muted}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          Cada capítulo aqui foi feito para parecer uma lembrança acordando devagar.
        </motion.p>
      </div>

      <div className="relative hidden min-h-[420px] lg:block">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.pathname}
            className="absolute left-1/2 top-1/2 w-56 rounded-sm bg-white p-3 shadow-2xl"
            style={{
              rotate: `${-14 + index * 7}deg`,
              x: -150 + index * 42,
              y: -150 + (index % 2) * 90
            }}
            initial={{ opacity: 0, y: -80, rotate: 0 }}
            animate={{ opacity: 1, y: -150 + (index % 2) * 90 }}
            transition={{ delay: 0.2 + index * 0.13, duration: 0.8 }}
          >
            <img src={photo.url} alt="" className="aspect-[4/5] w-full object-cover" />
            <p className="mt-2 truncate text-center text-xs font-semibold text-slate-700">
              {photo.caption || "nossa memória"}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CounterSlide({
  days,
  date,
  active,
  visual
}: {
  days: number;
  date: string;
  active: boolean;
  visual: ThemeVisual;
}) {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <p className={`mb-6 text-sm font-bold uppercase ${visual.accent}`}>
        Desde {formatDate(date)}
      </p>
      <h2 className="font-display text-6xl leading-none sm:text-8xl">
        <AnimatedNumber value={days} active={active} />
      </h2>
      <p className={`mx-auto mt-7 max-w-3xl text-2xl leading-9 sm:text-4xl ${visual.muted}`}>
        dias de memórias, escolhas, encontros e pequenos instantes que ficaram.
      </p>
    </div>
  );
}

function PersonalSlide({ gift, visual }: { gift: GiftData; visual: ThemeVisual }) {
  const cards = [
    {
      title: "Quando eu percebi",
      body: gift.firstLoveMoment
    },
    {
      title: "Meu momento favorito",
      body: gift.favoriteMoment
    },
    {
      title: "Nunca te falei",
      body: gift.untoldThing
    }
  ].filter((card) => card.body);
  const jokes = cleanList(gift.insideJokes, ["aquelas pequenas coisas que só a gente entende"]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Entre nós
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Coisas que pertencem só à nossa história.
      </h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {(cards.length ? cards : [{ title: "Só nós", body: jokes[0] }]).map((card, index) => (
          <motion.div
            key={card.title}
            className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <p className="text-sm font-bold uppercase text-pink-100">{card.title}</p>
            <p className={`mt-4 text-lg leading-8 ${visual.muted}`}>{card.body}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {jokes.slice(0, 8).map((joke) => (
          <span
            key={joke}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-xl"
          >
            {joke}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineSlide({
  events,
  visual
}: {
  events: GiftTimelineEvent[];
  visual: ThemeVisual;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Linha do tempo
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Alguns capítulos que trouxeram a gente até aqui.
      </h2>
      <div className="relative mt-10">
        <div className="absolute left-5 top-0 hidden h-full w-px bg-white/16 md:block" />
        <div className="grid gap-4">
          {events.slice(0, 12).map((event, index) => (
            <motion.div
              key={`${event.title}-${index}`}
              className="relative rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur-xl md:ml-12"
              initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="absolute -left-[43px] top-6 hidden h-4 w-4 rounded-full bg-pink-300 shadow-glow md:block" />
              <p className={`text-sm font-bold uppercase ${visual.accent}`}>
                {event.date ? formatDate(event.date) : `Momento ${index + 1}`}
              </p>
              <h3 className="mt-2 text-2xl font-bold">{event.title}</h3>
              <p className={`mt-3 text-lg leading-8 ${visual.muted}`}>{event.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CouponsSlide({
  coupons,
  visual
}: {
  coupons: GiftCoupon[];
  visual: ThemeVisual;
}) {
  const [opened, setOpened] = useState<number[]>([]);
  const pointerStartRef = useRef<{ index: number; x: number; y: number } | null>(null);

  function toggle(index: number) {
    setOpened((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function startCouponTouch(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    event.stopPropagation();
    pointerStartRef.current = {
      index,
      x: event.clientX,
      y: event.clientY
    };
  }

  function finishCouponTouch(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    event.stopPropagation();
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!start || start.index !== index) {
      return;
    }

    const movement = Math.hypot(event.clientX - start.x, event.clientY - start.y);

    if (movement <= 18) {
      toggle(index);
    }
  }

  function cancelCouponTouch() {
    pointerStartRef.current = null;
  }

  function handleCouponKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggle(index);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Vales de amor
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Cupons para usar quando o coração pedir.
      </h2>
      <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coupons.slice(0, 12).map((coupon, index) => {
          const active = opened.includes(index);

          return (
            <motion.button
              key={`${coupon.title}-${index}`}
              type="button"
              data-no-slide-drag="true"
              onPointerDown={(event) => startCouponTouch(event, index)}
              onPointerUp={(event) => finishCouponTouch(event, index)}
              onPointerCancel={cancelCouponTouch}
              onPointerLeave={cancelCouponTouch}
              onKeyDown={(event) => handleCouponKeyboard(event, index)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="group relative block min-h-48 w-full touch-manipulation select-none overflow-hidden rounded-2xl border border-dashed border-pink-100/45 bg-white/10 p-5 text-left backdrop-blur-xl transition hover:bg-white/16 active:scale-[0.99]"
              initial={{ opacity: 0, y: 26, rotate: index % 2 ? 1.5 : -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.985 }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-dashed border-white/18" />
              <Ticket className="mb-6 text-pink-100" size={28} aria-hidden="true" />
              <p className="text-sm font-bold uppercase text-pink-100">Cupom {index + 1}</p>
              <h3 className="mt-3 text-2xl font-bold">{coupon.title}</h3>
              <motion.p
                className={`mt-4 text-base leading-7 ${visual.muted}`}
                animate={{ opacity: active ? 1 : 0.72 }}
              >
                {active ? coupon.description : "Toque para revelar este vale."}
              </motion.p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ChaptersSlide({
  chapters,
  visual
}: {
  chapters: GiftMessageChapter[];
  visual: ThemeVisual;
}) {
  const [selected, setSelected] = useState(0);
  const current = chapters[selected] || chapters[0];

  if (!current) {
    return null;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="grid gap-3">
        <p className={`mb-2 text-sm font-bold uppercase ${visual.accent}`}>
          Carta em capítulos
        </p>
        {chapters.map((chapter, index) => (
          <button
            key={`${chapter.title}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            className={`rounded-xl border p-4 text-left transition ${
              selected === index
                ? "border-pink-200 bg-white text-slate-950"
                : "border-white/12 bg-white/10 hover:bg-white/16"
            }`}
          >
            <span className="text-xs font-bold uppercase">Capítulo {index + 1}</span>
            <span className="mt-1 block text-lg font-bold">{chapter.title}</span>
          </button>
        ))}
      </div>
      <motion.div
        key={selected}
        className="rounded-2xl border border-white/12 bg-white/10 p-6 shadow-violet backdrop-blur-xl sm:p-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BookOpen size={28} className="mb-6 text-pink-100" aria-hidden="true" />
        <h2 className="font-display slide-title-safe">
          {current.title}
        </h2>
        <p className={`mt-6 whitespace-pre-wrap text-xl leading-9 ${visual.muted}`}>
          {current.body}
        </p>
      </motion.div>
    </div>
  );
}

function ConstellationSlide({
  gift,
  hiddenMessages,
  visual
}: {
  gift: GiftData;
  hiddenMessages: string[];
  visual: ThemeVisual;
}) {
  const [selected, setSelected] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [tripleSecretOpen, setTripleSecretOpen] = useState(false);
  const initials = `${gift.creatorName[0] || ""}${gift.recipientName[0] || ""}`.toUpperCase();
  const safeHiddenMessages = hiddenMessages.length
    ? hiddenMessages
    : ["Algumas estrelas guardam segredos que so aparecem para quem olha com calma."];
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        x: 8 + ((index * 23) % 84),
        y: 12 + ((index * 37) % 72),
        size: 4 + (index % 4) * 2,
        delay: index * 0.16
      })),
    []
  );
  const shootingStars = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        top: 12 + index * 15,
        delay: index * 1.6,
        duration: 4.5 + index * 0.35
      })),
    []
  );

  function selectHiddenMessage(index: number) {
    setSelected(index % safeHiddenMessages.length);
  }

  function stopSecretGesture(event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function handleSecretKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    revealTripleSecret();
  }

  function revealTripleSecret() {
    setTapCount((current) => {
      const next = current + 1;

      if (next >= 3) {
        setTripleSecretOpen(true);
        return 0;
      }

      return next;
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative mx-auto aspect-square w-full max-w-[min(78vw,320px)] overflow-hidden rounded-2xl border border-white/12 bg-black/20 shadow-violet backdrop-blur-xl sm:aspect-[1.45] sm:max-w-none sm:min-h-[360px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.18),transparent_12rem),radial-gradient(circle_at_70%_72%,rgba(236,72,153,0.16),transparent_14rem)]" />
        {shootingStars.map((star, index) => (
          <motion.span
            key={`shooting-${index}`}
            className="pointer-events-none absolute h-px w-24 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            style={{
              top: `${star.top}%`,
              left: "-30%",
              rotate: "-18deg"
            }}
            animate={{
              x: ["0vw", "130vw"],
              opacity: [0, 0.9, 0]
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M50 78 C24 58 18 42 28 30 C37 19 48 28 50 37 C52 28 63 19 72 30 C82 42 76 58 50 78Z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeDasharray="1.2 1.8"
            strokeWidth="0.45"
          />
          <polyline
            points={stars.slice(0, 9).map((star) => `${star.x},${star.y}`).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="0.25"
          />
          <polyline
            points={stars.slice(9).map((star) => `${star.x},${star.y}`).join(" ")}
            fill="none"
            stroke="rgba(236,72,153,0.22)"
            strokeWidth="0.25"
          />
        </svg>
        {stars.map((star, index) => (
          <motion.button
            key={index}
            type="button"
            onPointerDown={stopSecretGesture}
            onPointerUp={stopSecretGesture}
            onClick={(event) => {
              event.stopPropagation();
              selectHiddenMessage(index);
            }}
            className="absolute rounded-full bg-white shadow-glow transition hover:scale-150"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size
            }}
            animate={{
              scale: [1, 1.55, 1],
              opacity: [0.58, 1, 0.68],
              boxShadow: [
                "0 0 10px rgba(255,255,255,0.38)",
                "0 0 22px rgba(236,72,153,0.78)",
                "0 0 10px rgba(255,255,255,0.42)"
              ]
            }}
            transition={{
              duration: 2.4 + (index % 5) * 0.28,
              repeat: Infinity,
              delay: star.delay
            }}
            aria-label="Revelar mensagem secreta"
            title="Revelar mensagem secreta"
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-6xl text-white/10 sm:text-9xl">{initials}</p>
        </div>
        {tripleSecretOpen ? (
          <motion.span
            className="pointer-events-none absolute h-1 w-36 rounded-full bg-gradient-to-r from-transparent via-pink-100 to-transparent shadow-glow"
            style={{ left: "-18%", top: "24%", rotate: "-18deg" }}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: "150vw", opacity: [0, 1, 0] }}
            transition={{ duration: 1.25, ease: "easeOut" }}
          />
        ) : null}
      </div>
      <div>
        <p className={`mb-4 text-sm font-bold uppercase ${visual.accent}`}>
          Constelação de nós dois
        </p>
        <h2 className="font-display slide-title-safe">
          Há frases escondidas nas estrelas.
        </h2>
        <motion.p
          key={selected}
          className={`mt-5 rounded-2xl border border-white/12 bg-white/10 p-4 text-lg leading-7 backdrop-blur-xl sm:mt-7 sm:p-5 sm:text-xl sm:leading-8 ${visual.muted}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {safeHiddenMessages[selected % safeHiddenMessages.length]}
        </motion.p>
        <button
          type="button"
          data-no-slide-drag="true"
          onPointerDown={stopSecretGesture}
          onPointerUp={stopSecretGesture}
          onKeyDown={handleSecretKeyboard}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            revealTripleSecret();
          }}
          className="mt-4 touch-manipulation select-none rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-bold text-pink-100 backdrop-blur-xl hover:bg-white/16"
        >
          Toque 3 vezes para revelar
        </button>
        {tripleSecretOpen ? (
          <motion.p
            className="mt-3 rounded-2xl border border-pink-200/20 bg-pink-500/12 p-4 text-base font-semibold leading-7 text-pink-100"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Segredo: algumas estrelas só brilham porque lembram você.
          </motion.p>
        ) : tapCount ? (
          <p className="mt-2 text-xs font-semibold text-pink-100/80">
            Mais {3 - tapCount} toque{3 - tapCount === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReasonsSlide({ reasons, visual }: { reasons: string[]; visual: ThemeVisual }) {
  return (
    <div className="relative mx-auto min-h-[520px] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black/16 p-6 text-center backdrop-blur-xl sm:p-10">
      <div className="absolute inset-0 overflow-hidden">
        {reasons.concat(reasons).slice(0, 34).map((reason, index) => (
          <motion.span
            key={`${reason}-${index}`}
            className="absolute rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-xl"
            style={{
              left: `${(index * 31) % 92}%`,
              top: -60
            }}
            animate={{ y: [0, 640], opacity: [0, 1, 0] }}
            transition={{
              duration: 8 + (index % 7),
              repeat: Infinity,
              delay: index * 0.28,
              ease: "linear"
            }}
          >
            {reason}
          </motion.span>
        ))}
      </div>
      <div className="relative z-10 flex min-h-[440px] flex-col items-center justify-center">
        <p className={`mb-5 text-sm font-bold uppercase ${visual.accent}`}>
          Chuva de motivos
        </p>
        <h2 className="max-w-3xl font-display slide-title-safe">
          Algumas razões pelas quais você é inesquecível.
        </h2>
      </div>
    </div>
  );
}

function PlacesSlide({ places, visual }: { places: GiftPlace[]; visual: ThemeVisual }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Mapa afetivo
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Lugares que guardam a gente.
      </h2>
      <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {places.map((place, index) => (
          <motion.div
            key={`${place.name}-${index}`}
            className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur-xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-pink-500 text-white shadow-glow">
              <MapPin size={20} aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold">{place.name || "Lugar especial"}</h3>
            <p className={`mt-3 text-sm leading-6 ${visual.muted}`}>{place.note}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PhotoSlide({
  photo,
  index,
  total,
  visual,
  onInteract,
  experienceStyle
}: {
  photo: GiftPhoto;
  index: number;
  total: number;
  visual: ThemeVisual;
  onInteract: () => void;
  experienceStyle: ExperienceStyle;
}) {
  const [answerVisible, setAnswerVisible] = useState(false);
  const usePolaroid = photo.polaroid || experienceStyle === "scrapbook";
  const filterClass =
    photo.filter === "bw"
      ? "grayscale contrast-110"
      : photo.filter === "film"
        ? "sepia contrast-110 saturate-125"
        : photo.filter === "soft"
          ? "brightness-110 saturate-125"
          : "";
  const positionClass =
    photo.captionPosition === "center"
      ? "inset-0 flex items-center px-5 sm:px-12"
      : photo.captionPosition === "top"
        ? "inset-x-0 top-0 px-5 pt-36 sm:px-12 sm:pt-40"
        : "inset-x-0 bottom-0 px-5 pb-32 sm:px-12";

  return (
    <div className="absolute inset-0">
      {usePolaroid ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/36 p-8">
          <motion.div
            className="w-full max-w-2xl bg-white p-4 pb-16 shadow-2xl"
            initial={{ scale: 0.92, rotate: index % 2 === 0 ? -8 : 8 }}
            animate={{ scale: 1.02, rotate: index % 2 === 0 ? -2 : 2 }}
            transition={{ duration: experienceStyle === "cinema" ? 11 : 8.5, ease: "easeOut" }}
          >
            <img
              src={photo.url}
              alt={`Memória ${index + 1}`}
              className={`aspect-[4/3] w-full bg-slate-100 object-contain ${filterClass}`}
            />
          </motion.div>
        </div>
      ) : (
        <motion.img
          key={photo.url}
          src={photo.url}
          alt={`Memória ${index + 1}`}
          className={`ken-burns h-full w-full bg-black object-contain p-3 sm:p-8 ${filterClass}`}
          initial={{ scale: 1.01, x: index % 2 === 0 ? -8 : 8 }}
          animate={{ scale: 1.08, x: index % 2 === 0 ? 8 : -8 }}
          transition={{ duration: experienceStyle === "cinema" ? 11 : 8.5, ease: "easeOut" }}
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-t ${visual.overlay}`} />
      <div className={`absolute ${positionClass}`}>
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.75 }}
        >
          {photo.captionPosition === "hidden" ? null : (
            <>
              <p className="mb-4 text-sm font-bold uppercase text-pink-100">
                Memória {index + 1} de {total}
                {photo.memoryDate ? ` • ${formatDate(photo.memoryDate)}` : ""}
                {photo.location ? ` • ${photo.location}` : ""}
              </p>
              <h2 className="font-display slide-title-safe text-white">
                {photo.caption || "Um instante que ficou."}
              </h2>
            </>
          )}
          {photo.quizQuestion ? (
            <div className="mt-6 max-w-2xl rounded-2xl border border-white/14 bg-black/32 p-4 text-white backdrop-blur-xl">
              <p className="text-sm font-bold uppercase text-pink-100">Você lembra?</p>
              <p className="mt-2 text-lg leading-7">{photo.quizQuestion}</p>
              <button
                type="button"
                onClick={() => {
                  onInteract();
                  setAnswerVisible((value) => !value);
                }}
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950"
              >
                {answerVisible ? "Guardar resposta" : "Revelar resposta"}
              </button>
              {answerVisible && photo.quizAnswer ? (
                <p className="mt-4 text-pink-100">{photo.quizAnswer}</p>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}

function VideoSlide({
  video,
  visual,
  onPlay,
  onPause,
  onEnded
}: {
  video: GiftVideo;
  visual: ThemeVisual;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div
        data-no-slide-drag="true"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        className="overflow-hidden rounded-2xl border border-white/14 bg-black/40 p-3 shadow-violet backdrop-blur-xl"
      >
        <video
          data-no-slide-drag="true"
          src={video.url}
          controls
          playsInline
          preload="metadata"
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          className="aspect-video w-full touch-manipulation rounded-xl bg-black object-contain"
        />
      </div>
      <div>
        <p className={`mb-4 text-sm font-bold uppercase ${visual.accent}`}>Vídeo</p>
        <h2 className="font-display slide-title-safe">
          {video.caption || "Um pedacinho vivo da nossa história."}
        </h2>
        <p className={`mt-6 text-lg leading-8 ${visual.muted}`}>
          Dê play quando quiser ficar mais um pouco nessa memória.
        </p>
      </div>
    </div>
  );
}

function ScratchSlide({ gift, visual }: { gift: GiftData; visual: ThemeVisual }) {
  const [reveal, setReveal] = useState(0);
  const message =
    gift.finalSignature ||
    `Eu escolheria viver tudo de novo, se no final o caminho ainda me levasse até ${gift.recipientName}.`;

  function revealMore(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.buttons === 0 && event.pointerType !== "touch") {
      return;
    }

    setReveal((value) => Math.min(100, value + 8));
  }

  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className={`mb-5 text-sm font-bold uppercase ${visual.accent}`}>
        Raspadinha de sentimento
      </p>
      <h2 className="font-display slide-title-safe">
        Passe o dedo para revelar.
      </h2>
      <div
        data-no-slide-drag="true"
        onPointerDown={revealMore}
        onPointerMove={revealMore}
        className="relative mx-auto mt-9 min-h-72 max-w-3xl touch-none overflow-hidden rounded-2xl border border-white/14 bg-white/10 p-8 shadow-glow backdrop-blur-xl"
      >
        <p className="flex min-h-44 items-center justify-center font-display text-3xl leading-snug sm:text-5xl">
          {message}
        </p>
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(236,72,153,0.96),rgba(139,92,246,0.96))] text-white"
          animate={{ clipPath: `inset(0 ${reveal}% 0 0)` }}
          transition={{ duration: 0.2 }}
        >
          <Sparkles size={36} aria-hidden="true" />
        </motion.div>
      </div>
    </div>
  );
}

function CapsuleSlide({ gift, visual }: { gift: GiftData; visual: ThemeVisual }) {
  const remaining = daysUntil(gift.capsuleDate);
  const unlocked = !gift.capsuleDate || remaining <= 0;

  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className={`mb-5 text-sm font-bold uppercase ${visual.accent}`}>
        Cápsula do tempo
      </p>
      <h2 className="font-display slide-title-safe">
        {unlocked ? "A carta do futuro abriu." : "Tem uma carta esperando o dia certo."}
      </h2>
      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/14 bg-white/10 p-6 shadow-violet backdrop-blur-xl">
        {unlocked ? (
          <p className={`whitespace-pre-wrap text-xl leading-8 ${visual.muted}`}>
            {gift.capsuleMessage ||
              "Quando você voltar aqui, que esse amor ainda encontre um jeito bonito de te abraçar."}
          </p>
        ) : (
          <>
            <p className="font-display text-6xl">{remaining}</p>
            <p className={`mt-3 text-lg leading-7 ${visual.muted}`}>
              dias até {formatDate(gift.capsuleDate)}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function MessageSlide({
  gift,
  active,
  visual
}: {
  gift: GiftData;
  active: boolean;
  visual: ThemeVisual;
}) {
  function saveLetter() {
    const content = `${gift.recipientName},\n\n${gift.message}\n\n${gift.finalSignature || gift.creatorName}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carta-${gift.slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className={`mb-6 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Uma mensagem só para você
      </p>
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-white/14 bg-white/[0.92] p-6 text-slate-950 shadow-violet sm:p-10"
        initial={{ rotateX: 8, y: 26, opacity: 0 }}
        animate={{ rotateX: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,53,15,0.06)_1px,transparent_1px)] bg-[length:100%_2.1rem]" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border border-rose-200/60" />
        <TypingText
          text={gift.message}
          active={active}
          className="relative whitespace-pre-wrap break-words text-center font-display text-3xl leading-snug text-slate-950 sm:text-5xl"
        />
        <p className="relative mt-8 text-right font-display text-2xl text-rose-700">
          {gift.finalSignature || gift.creatorName}
        </p>
        <button
          type="button"
          onClick={saveLetter}
          className="relative mx-auto mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-glow hover:bg-slate-800"
        >
          <Download size={16} aria-hidden="true" />
          Guardar essa carta
        </button>
      </motion.div>
    </div>
  );
}

function PromisesSlide({ promises, visual }: { promises: string[]; visual: ThemeVisual }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Promessas
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Coisas que eu quero continuar fazendo por nós.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {promises.slice(0, 6).map((promise, index) => (
          <motion.div
            key={`${promise}-${index}`}
            className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur-xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <Heart size={22} className="mb-5 text-pink-200" fill="currentColor" aria-hidden="true" />
            <p className={`text-lg leading-8 ${visual.muted}`}>{promise}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AlbumSlide({ gift, visual }: { gift: GiftData; visual: ThemeVisual }) {
  const photos = gift.photos.slice(0, 10);
  const [selected, setSelected] = useState(0);
  const current = photos[selected];

  function move(offset: number) {
    setSelected((index) => {
      if (!photos.length) {
        return 0;
      }

      return (index + offset + photos.length) % photos.length;
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className={`mb-5 text-center text-sm font-bold uppercase ${visual.accent}`}>
        Álbum final
      </p>
      <h2 className="mx-auto max-w-4xl text-center font-display slide-title-safe">
        Tudo isso também é um jeito de dizer amor.
      </h2>
      <div className="mt-9 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/24 p-3 shadow-violet backdrop-blur-xl">
          {current ? (
            <>
              <motion.img
                key={current.pathname}
                src={current.url}
                alt={current.caption || "Foto do álbum"}
                className="mx-auto max-h-[46svh] w-auto max-w-full rounded-xl object-contain sm:max-h-[56vh]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              />
              <div className="mt-4 flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10"
                  aria-label="Foto anterior"
                  title="Foto anterior"
                >
                  <ChevronLeft size={19} aria-hidden="true" />
                </button>
                <p className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-center text-sm font-semibold leading-6 ${visual.muted}`}>
                  {current.caption || `Memória ${selected + 1}`}
                </p>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10"
                  aria-label="Próxima foto"
                  title="Próxima foto"
                >
                  <ChevronRight size={19} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <Images size={36} className="mb-4 text-pink-100" aria-hidden="true" />
              <p className="text-lg font-bold">Álbum vazio</p>
            </div>
          )}
        </div>
        <div className="grid max-h-[52vh] grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-white/12 bg-white/10 p-2 backdrop-blur-xl lg:grid-cols-2">
          {photos.map((photo, index) => (
            <button
              key={photo.pathname}
              type="button"
              onClick={() => setSelected(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border ${
                selected === index ? "border-pink-200" : "border-white/10"
              }`}
            >
              <img
                src={photo.url}
                alt=""
                className="h-full w-full bg-black/30 object-contain p-1 transition duration-500 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndingSlide({
  gift,
  reasons,
  mediaEmbedUrl,
  mediaUrl,
  hasAudio,
  onReplay,
  onOpenMusic,
  onPrintInvite,
  onPrintQr,
  onPrintCoupons,
  onPrintLetter,
  onPrintPackage,
  onGoTo,
  visual
}: {
  gift: GiftData;
  reasons: string[];
  mediaEmbedUrl: string | null;
  mediaUrl?: string;
  hasAudio: boolean;
  onReplay: () => void;
  onOpenMusic: () => void;
  onPrintInvite: () => void;
  onPrintQr: () => void;
  onPrintCoupons: () => void;
  onPrintLetter: () => void;
  onPrintPackage: () => void;
  onGoTo: (type: Slide["type"]) => void;
  visual: ThemeVisual;
}) {
  const [randomMemory, setRandomMemory] = useState<GiftPhoto | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [reaction, setReaction] = useState("amei");
  const [senderName, setSenderName] = useState("");
  const [reactionMessage, setReactionMessage] = useState("");
  const [reactionStatus, setReactionStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  function showRandomMemory() {
    if (!gift.photos.length) {
      return;
    }

    setRandomMemory(gift.photos[Math.floor(Math.random() * gift.photos.length)]);
  }

  async function copyGiftLink() {
    if (!shareUrl || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareGiftLink() {
    if (!shareUrl) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: `Presente para ${gift.recipientName}`,
        text: gift.finalSignature || "Guarde este presente comigo.",
        url: shareUrl
      });
      return;
    }

    await copyGiftLink();
  }

  function sendByWhatsApp() {
    if (!shareUrl) {
      return;
    }

    const message = `Abre esse presente que fiz para você: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function sendReaction() {
    setReactionStatus("sending");

    if (gift.slug === "preview") {
      window.setTimeout(() => setReactionStatus("sent"), 350);
      return;
    }

    const response = await fetch(`/api/presente/${gift.slug}/reactions`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        reaction,
        senderName,
        message: reactionMessage
      })
    });

    if (!response.ok) {
      setReactionStatus("error");
      return;
    }

    setReactionStatus("sent");
  }

  const handleQrReady = useCallback((dataUrl: string) => {
    setQrUrl(dataUrl);
  }, []);

  function downloadQrCode() {
    if (!qrUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `presente-${gift.slug}-qr.png`;
    link.click();
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div>
        <p className={`mb-5 text-sm font-bold uppercase ${visual.accent}`}>Final</p>
        <h2 className="break-words font-display slide-title-safe">
          {gift.recipientName}, este presente continua quando você quiser.
        </h2>
        <p className={`mt-6 max-w-2xl text-lg leading-8 ${visual.muted}`}>
          {gift.finalSignature || reasons[0] || "Obrigado por existir nesse pedaço bonito da minha vida."}
        </p>
        <div className="mt-8 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
          <p className="mb-3 text-xs font-bold uppercase text-pink-100">Acoes principais</p>
          <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-slate-950 shadow-glow transition hover:bg-pink-100"
          >
            <RotateCcw size={17} aria-hidden="true" />
            Ver de novo
          </button>
          <button
            type="button"
            onClick={showRandomMemory}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Sparkles size={17} aria-hidden="true" />
            Mais uma lembrança
          </button>
          <button
            type="button"
            onClick={shareGiftLink}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Share2 size={17} aria-hidden="true" />
            Compartilhar
          </button>
          <button
            type="button"
            onClick={sendByWhatsApp}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Share2 size={17} aria-hidden="true" />
            WhatsApp
          </button>
          {mediaEmbedUrl || hasAudio ? (
            <button
              type="button"
              onClick={onOpenMusic}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/16 sm:col-span-2"
            >
              <Volume2 size={17} aria-hidden="true" />
              Abrir trilha
            </button>
          ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
          <p className="mb-3 text-xs font-bold uppercase text-pink-100">Guardar e imprimir</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={copyGiftLink}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Copy size={17} aria-hidden="true" />
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <button
            type="button"
            onClick={downloadQrCode}
            disabled={!qrUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16 disabled:opacity-45"
          >
            <Download size={17} aria-hidden="true" />
            Baixar QR
          </button>
          <button
            type="button"
            onClick={onPrintQr}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <QrCode size={17} aria-hidden="true" />
            QR impresso
          </button>
          <button
            type="button"
            onClick={onPrintInvite}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Printer size={17} aria-hidden="true" />
            Convite
          </button>
          <button
            type="button"
            onClick={onPrintCoupons}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <Ticket size={17} aria-hidden="true" />
            Cupons
          </button>
          <button
            type="button"
            onClick={onPrintLetter}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
          >
            <BookOpen size={17} aria-hidden="true" />
            Carta
          </button>
          <button
            type="button"
            onClick={onPrintPackage}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-pink-200/30 bg-pink-500/18 px-4 text-sm font-bold text-pink-100 transition hover:bg-pink-500/25"
          >
            <ClipboardCheck size={17} aria-hidden="true" />
            Pacote
          </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { label: "Rever carta", type: "message" as const },
            { label: "Abrir álbum", type: "album" as const },
            { label: "Ver fotos", type: "photo" as const }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onGoTo(item.type)}
              className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-bold text-pink-100 hover:bg-white/16"
            >
              {item.label}
            </button>
          ))}
        </div>
        {randomMemory ? (
          <motion.div
            className="mt-6 flex max-w-xl gap-4 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <img
              src={randomMemory.url}
              alt=""
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div>
              <p className="font-bold text-white">{randomMemory.caption || "Uma lembrança"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {randomMemory.location || randomMemory.filename}
              </p>
            </div>
          </motion.div>
        ) : null}
        <div className="mt-6 max-w-2xl rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircleHeart size={20} className="text-pink-200" aria-hidden="true" />
            <p className="text-sm font-bold uppercase text-pink-100">Responder ao presente</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["amei", "Amei"],
              ["chorei", "Chorei"],
              ["replay", "Replay"],
              ["sorriso", "Sorri"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setReaction(value)}
                className={`h-10 rounded-lg border text-sm font-bold transition ${
                  reaction === value
                    ? "border-pink-200 bg-white text-slate-950"
                    : "border-white/12 bg-white/10 text-white hover:bg-white/16"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <input
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
              maxLength={80}
              className="h-11 rounded-lg border border-white/12 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-pink-200"
              placeholder="Seu nome"
            />
            <input
              value={reactionMessage}
              onChange={(event) => setReactionMessage(event.target.value)}
              maxLength={600}
              className="h-11 rounded-lg border border-white/12 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-pink-200"
              placeholder="Mensagem rápida para quem criou"
            />
          </div>
          <button
            type="button"
            onClick={sendReaction}
            disabled={reactionStatus === "sending" || reactionStatus === "sent"}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 shadow-glow transition hover:bg-pink-100 disabled:opacity-60"
          >
            {reactionStatus === "sent"
              ? "Resposta enviada"
              : reactionStatus === "sending"
                ? "Enviando..."
                : "Enviar reação"}
          </button>
          {reactionStatus === "error" ? (
            <p className="mt-2 text-sm font-semibold text-pink-100">
              Não consegui enviar agora. Tente novamente em instantes.
            </p>
          ) : null}
          {reactionStatus === "sent" ? (
            <p className="mt-2 rounded-lg border border-pink-200/20 bg-pink-500/12 px-3 py-2 text-sm font-semibold leading-6 text-pink-100">
              Sua resposta foi guardada. Agora esse presente também tem um pedacinho seu.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/14 bg-black/24 p-3 shadow-violet backdrop-blur-xl">
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/8 px-6 text-center">
            <Volume2 size={34} className="mb-4 text-pink-200" aria-hidden="true" />
            <p className="text-lg font-bold text-white">Nossa trilha sonora</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {mediaEmbedUrl || hasAudio
                ? "A trilha continua no player pequeno da tela."
                : "A trilha sonora fica guardada aqui."}
            </p>
            {mediaEmbedUrl || hasAudio ? (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenMusic}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-slate-950 shadow-glow transition hover:bg-pink-100"
                >
                  <Volume2 size={16} aria-hidden="true" />
                  Abrir trilha
                </button>
                {mediaUrl ? (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/16"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Abrir no app
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
          <GiftQrCode onReady={handleQrReady} />
          <div>
            <p className="text-sm font-bold uppercase text-pink-100">Guardar este link</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Abra pelo QR Code quando quiser rever esta lembrança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
