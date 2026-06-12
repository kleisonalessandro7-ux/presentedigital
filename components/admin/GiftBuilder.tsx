"use client";

import type { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clapperboard,
  ClipboardCheck,
  Clock,
  Copy,
  CopyPlus,
  Download,
  Eye,
  Gift,
  Heart,
  ImagePlus,
  Link as LinkIcon,
  ListPlus,
  LogOut,
  MapPin,
  MessageCircleHeart,
  Mic,
  MoveDown,
  MoveUp,
  Music2,
  Palette,
  PencilLine,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Ticket,
  Trash2,
  UploadCloud,
  UserRound,
  Video,
  Wand2,
  X
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { giftThemes } from "@/lib/themes";
import { getMediaEmbedUrl } from "@/lib/media";
import type {
  DraftGift,
  ExperienceStyle,
  GiftAsset,
  GiftCoupon,
  GiftData,
  GiftIndexItem,
  GiftMessageChapter,
  GiftPhoto,
  GiftPlace,
  GiftTimelineEvent,
  GiftTheme,
  GiftVideo
} from "@/lib/types";
import { ensureSlug, sanitizeFilename, shortId } from "@/lib/slug";

type GiftBuilderProps = {
  initialGifts: GiftIndexItem[];
  blobConfigured: boolean;
  storageError?: string;
  currentUserEmail?: string;
};

type DeliveryGift = {
  slug: string;
  url: string;
  recipientName: string;
};

const steps = [
  { title: "Nomes", icon: UserRound },
  { title: "Datas", icon: CalendarDays },
  { title: "Fotos", icon: ImagePlus },
  { title: "Palavras", icon: PencilLine },
  { title: "Som", icon: Music2 },
  { title: "Mundo", icon: Sparkles },
  { title: "Preview", icon: Wand2 }
];

const initialDraft: DraftGift = {
  slug: "presente",
  creatorName: "",
  recipientName: "",
  recipientNickname: "",
  specialDate: "",
  openingHint: "",
  photos: [],
  message: "",
  mediaUrl: "",
  videos: [],
  theme: "romantic-dark",
  experienceStyle: "classic",
  primaryColor: "#ec4899",
  coverPhotoPathname: "",
  ogTitle: "",
  ogDescription: "",
  reasons: ["Seu jeito de transformar dias comuns em lembranças"],
  promises: ["Prometo escolher você também nos dias simples"],
  hiddenMessages: ["Procure por mim entre as estrelas"],
  places: [{ name: "", note: "" }],
  insideJokes: [""],
  timelineEvents: [
    {
      title: "Quando tudo começou",
      date: "",
      description: "O dia em que uma história bonita começou a nascer."
    }
  ],
  coupons: [
    {
      title: "Vale abraço demorado",
      description: "Para usar quando o mundo pedir um pouco mais de carinho."
    }
  ],
  messageChapters: [
    {
      title: "Como tudo começou",
      body: "Tem começos que a gente só entende depois, quando percebe que a vida mudou de lugar."
    }
  ],
  firstLoveMoment: "",
  favoriteMoment: "",
  untoldThing: "",
  surpriseQuestion: "",
  surpriseAnswer: "",
  capsuleDate: "",
  capsuleMessage: "",
  finalSignature: "",
  secretWord: "",
  slideDurations: {
    welcome: 7,
    counter: 7,
    personal: 8,
    timeline: 9,
    constellation: 8,
    reasons: 8,
    coupons: 10,
    places: 8,
    photo: 9,
    video: 12,
    scratch: 11,
    capsule: 9,
    chapters: 13,
    message: 15,
    promises: 9,
    album: 10,
    ending: 12
  }
};

const draftStorageKey = "presente-digital-draft";

const templates: Record<
  string,
  {
    label: string;
    description: string;
    patch: Partial<DraftGift>;
  }
> = {
  namoro: {
    label: "Namoro",
    description: "Romântico, íntimo e cheio de memórias.",
    patch: {
      experienceStyle: "cinema",
      openingHint: "Respire fundo. Tem um pedaço da nossa história aqui.",
      message:
        "Eu queria encontrar um jeito bonito de te lembrar que amar você continua sendo uma das partes mais felizes da minha vida.",
      reasons: [
        "você faz o simples parecer especial",
        "eu gosto de quem sou quando estou com você",
        "nossas memórias me encontram nos dias comuns"
      ],
      promises: [
        "Prometo cuidar dos nossos detalhes.",
        "Prometo escolher você nos dias fáceis e nos difíceis.",
        "Prometo fazer do amor uma presença diária."
      ],
      coupons: [
        { title: "Vale encontro surpresa", description: "Eu escolho o lugar, você só precisa ir comigo." },
        { title: "Vale abraço demorado", description: "Para qualquer dia em que o coração pedir colo." }
      ],
      messageChapters: [
        { title: "Como começou", body: "Aos poucos, você foi virando parte dos meus planos sem pedir licença." },
        { title: "O que ficou", body: "Ficou seu jeito, nossas conversas e a vontade de viver mais capítulos." }
      ],
      finalSignature: "Com todo meu amor, hoje e sempre."
    }
  },
  aniversario: {
    label: "Aniversário",
    description: "Celebra a pessoa e tudo que ela é.",
    patch: {
      experienceStyle: "scrapbook",
      openingHint: "Hoje o mundo merece parar um pouco para celebrar você.",
      message:
        "Que este novo ciclo te encontre com carinho, leveza e a certeza de que você é profundamente amado.",
      reasons: [
        "sua presença ilumina qualquer lugar",
        "você merece ser celebrado todos os dias",
        "o mundo fica melhor com você nele"
      ],
      coupons: [
        { title: "Vale dia do seu jeito", description: "Você escolhe o plano e eu cuido do carinho." },
        { title: "Vale sobremesa favorita", description: "Para adoçar ainda mais esse novo ciclo." }
      ],
      finalSignature: "Feliz vida. Feliz você."
    }
  },
  soPorque: {
    label: "Só porque te amo",
    description: "Leve, espontâneo e perfeito para surpreender sem data.",
    patch: {
      experienceStyle: "scrapbook",
      theme: "neon-heart",
      openingHint: "Não precisa ser data especial para lembrar que você é especial.",
      message:
        "Eu quis te entregar um carinho fora de hora, só para te lembrar que você aparece bonito nos meus pensamentos.",
      reasons: [
        "você melhora dias comuns",
        "seu jeito fica comigo depois que você vai",
        "amar você também mora nos pequenos detalhes"
      ],
      coupons: [
        { title: "Vale surpresa fora de data", description: "Para receber carinho quando menos esperar." },
        { title: "Vale passeio simples", description: "Um lugar qualquer, desde que seja com você." }
      ],
      finalSignature: "Só porque sim. Só porque você."
    }
  },
  primeiroAno: {
    label: "Aniversário de namoro",
    description: "Linha do tempo, memória e promessa de próximos anos.",
    patch: {
      experienceStyle: "cinema",
      theme: "starry-sky",
      openingHint: "Um ano cabe em datas, mas também cabe em estrelas.",
      message:
        "Hoje eu olho para tudo que a gente viveu e sinto vontade de agradecer por cada detalhe que nos trouxe até aqui.",
      timelineEvents: [
        { title: "Nosso começo", description: "O primeiro capítulo de uma história que virou casa.", date: "" },
        { title: "O que ficou", description: "As risadas, as conversas e a vontade de continuar.", date: "" }
      ],
      promises: [
        "Prometo fazer dos próximos anos um lugar bonito para nós dois.",
        "Prometo lembrar do nosso começo quando a vida correr demais."
      ],
      finalSignature: "Feliz nosso tempo. Que venham muitos outros."
    }
  },
  reconciliacao: {
    label: "Reconciliação",
    description: "Sincero, delicado e focado em recomeço.",
    patch: {
      experienceStyle: "classic",
      theme: "vintage-letter",
      openingHint: "Algumas palavras precisam chegar com calma.",
      message:
        "Eu queria abrir um espaço de cuidado entre nós. Não para apagar o que aconteceu, mas para dizer que ainda existe carinho, escuta e vontade de fazer melhor.",
      promises: [
        "Prometo ouvir com mais presença.",
        "Prometo cuidar melhor do que machuca.",
        "Prometo reconstruir com atitudes, não só palavras."
      ],
      finalSignature: "Com respeito, carinho e vontade de recomeçar."
    }
  },
  casamento: {
    label: "Casamento",
    description: "Mais solene, elegante e eterno.",
    patch: {
      experienceStyle: "cinema",
      openingHint: "Uma carta para o começo de todos os nossos próximos capítulos.",
      message:
        "Entre todas as versões possíveis da vida, a minha favorita é aquela em que caminho ao seu lado.",
      promises: [
        "Prometo construir casa também nos dias difíceis.",
        "Prometo ouvir você com presença.",
        "Prometo renovar meu sim nos detalhes."
      ],
      finalSignature: "Meu sim continua aqui."
    }
  },
  desculpas: {
    label: "Pedido de desculpas",
    description: "Cuidadoso, sincero e sem exagero.",
    patch: {
      experienceStyle: "classic",
      theme: "minimal",
      openingHint: "Abri este espaço para falar com carinho e verdade.",
      message:
        "Eu sinto muito. Mais do que explicar, eu queria te encontrar com respeito, cuidado e vontade real de fazer melhor.",
      promises: [
        "Prometo escutar antes de responder.",
        "Prometo cuidar melhor do que é sensível para você.",
        "Prometo transformar palavras em atitudes."
      ],
      finalSignature: "Com carinho, presença e vontade de recomeçar."
    }
  },
  saudade: {
    label: "Saudade",
    description: "Para distância, viagem ou reencontro.",
    patch: {
      experienceStyle: "cinema",
      openingHint: "A distância não coube no que eu queria te dizer.",
      message:
        "A saudade tem me lembrado, todos os dias, que tem gente que fica perto mesmo quando está longe.",
      reasons: [
        "sua falta aparece nos detalhes",
        "eu guardo nossos momentos como abrigo",
        "voltar para você é uma das minhas ideias favoritas"
      ],
      finalSignature: "Até o próximo abraço."
    }
  },
  pedidoNamoro: {
    label: "Pedido de namoro",
    description: "Surpresa com pergunta final e clima de filme.",
    patch: {
      experienceStyle: "cinema",
      openingHint: "Tem uma pergunta esperando no final desta carta.",
      message:
        "Eu fui juntando sinais, risadas e saudades até perceber que meu lugar favorito é perto de você.",
      reasons: [
        "você deixa meus dias mais leves",
        "eu sinto vontade de dividir planos com você",
        "meu sorriso chega antes quando penso em nós"
      ],
      coupons: [
        { title: "Vale nosso primeiro encontro oficial", description: "Com direito a lugar escolhido com carinho." },
        { title: "Vale playlist só nossa", description: "Para começar essa fase com trilha sonora." }
      ],
      messageChapters: [
        { title: "Antes de perguntar", body: "Eu queria te mostrar um pouco do que você virou dentro de mim." },
        { title: "A pergunta", body: "Quer viver essa história comigo, de mãos dadas e coração aberto?" }
      ],
      surpriseQuestion: "Qual resposta meu coração está torcendo para ouvir?",
      surpriseAnswer: "sim",
      finalSignature: "Com frio na barriga e muito carinho."
    }
  },
  diaDosNamorados: {
    label: "Dia dos namorados",
    description: "Romântico, intenso e pronto para enviar.",
    patch: {
      experienceStyle: "scrapbook",
      openingHint: "Hoje é sobre nós, sobre amor e sobre tudo que ainda vem.",
      message:
        "Feliz dia dos namorados. Que este presente seja um jeito pequeno de guardar um amor que ocupa tanto espaço bonito em mim.",
      reasons: [
        "amar você tem gosto de casa",
        "nossas memórias cabem nos meus dias favoritos",
        "você é meu detalhe preferido"
      ],
      coupons: [
        { title: "Vale jantar a dois", description: "Sem pressa, sem celular, só nós." },
        { title: "Vale filme agarradinho", description: "Você escolhe o filme, eu escolho ficar perto." },
        { title: "Vale surpresa fora de data", description: "Porque amor não precisa esperar calendário." }
      ],
      finalSignature: "Feliz nosso dia. Ainda escolheria você."
    }
  },
  noivado: {
    label: "Noivado",
    description: "Elegante, profundo e com promessa de futuro.",
    patch: {
      experienceStyle: "cinema",
      openingHint: "Uma carta para o nosso futuro lembrar deste começo.",
      message:
        "Que a vida nos encontre construindo um amor que tenha abrigo, riso, respeito e vontade de permanecer.",
      promises: [
        "Prometo construir futuro sem esquecer dos detalhes.",
        "Prometo cuidar da nossa casa antes mesmo dela existir.",
        "Prometo renovar meu sim nas pequenas escolhas."
      ],
      messageChapters: [
        { title: "O que somos", body: "Somos escolha, cuidado e uma vontade bonita de continuar." },
        { title: "O que vem", body: "Que o futuro tenha nosso jeito, nossos planos e nosso amor como endereço." }
      ],
      finalSignature: "Para todos os próximos capítulos."
    }
  },
  pedidoCasamento: {
    label: "Pedido de casamento",
    description: "Elegante, emocionante e com clima de grande pergunta.",
    patch: {
      experienceStyle: "cinema",
      theme: "luxury-gold",
      openingHint: "Tem uma pergunta que eu quero guardar para sempre.",
      message:
        "Eu pensei em muitos jeitos de dizer isso, mas todos terminavam no mesmo lugar: eu quero construir a vida ao seu lado.",
      reasons: [
        "você é meu plano favorito",
        "o futuro parece mais bonito com você",
        "meu sim já mora em mim faz tempo"
      ],
      messageChapters: [
        { title: "Antes da pergunta", body: "Eu queria te lembrar de tudo que me fez chegar até aqui." },
        { title: "A pergunta", body: "Quer casar comigo?" }
      ],
      surpriseQuestion: "Qual palavra muda tudo hoje?",
      surpriseAnswer: "sim",
      finalSignature: "Com amor, coragem e um futuro inteiro."
    }
  },
  simples: {
    label: "Surpresa elegante",
    description: "Minimalista, rápida e bonita.",
    patch: {
      experienceStyle: "classic",
      theme: "minimal",
      openingHint: "Uma lembrança simples, mas feita com verdade.",
      message:
        "Eu só queria te lembrar, de um jeito bonito, que você importa muito para mim.",
      reasons: [
        "sua presença deixa tudo mais leve",
        "você merece carinho até nos dias comuns",
        "tem beleza no jeito como você existe"
      ],
      finalSignature: "Com carinho."
    }
  }
};

const suggestions = {
  opening: [
    "Respire fundo. Tem um pedaço meu aqui dentro.",
    "Toque devagar. Essa carta foi feita para você.",
    "Antes de abrir: lembre que você é muito amado."
  ],
  message: [
    "Tem coisas em você que deixam a vida mais bonita sem fazer esforço.",
    "Eu queria guardar nossas memórias em algum lugar que pudesse respirar.",
    "Se eu pudesse repetir um caminho, escolheria de novo aquele que me trouxe até você."
  ],
  personal: [
    "Foi quando percebi que estar com você parecia voltar para casa.",
    "Meu momento favorito é aquele em que a gente esquece o mundo por alguns minutos.",
    "Nunca te falei o quanto admiro a calma que você traz para a minha vida."
  ],
  final: [
    "Com todo meu amor, hoje e sempre.",
    "Ainda escolheria você.",
    "Que este presente te abrace quando eu não estiver perto."
  ]
};

const phraseLibrary = [
  {
    title: "Frases fofas",
    target: "message",
    items: [
      "Você tem esse jeito raro de transformar qualquer lugar em casa.",
      "Tem carinho seu até nos detalhes que você nem percebe.",
      "Eu gosto da vida quando ela está acontecendo perto de você."
    ]
  },
  {
    title: "Frases intensas",
    target: "message",
    items: [
      "Se a vida me desse mil caminhos, eu ainda procuraria aquele que termina em você.",
      "Meu amor por você mora nas coisas grandes e nos detalhes quase invisíveis.",
      "Você virou parte da minha forma de imaginar o futuro."
    ]
  },
  {
    title: "Saudade",
    target: "message",
    items: [
      "A saudade me lembra que tem presença que continua mesmo de longe.",
      "Tem dias em que eu só queria encurtar o caminho até o seu abraço.",
      "Mesmo longe, você continua sendo meu pensamento mais bonito."
    ]
  },
  {
    title: "Motivos",
    target: "reasons",
    items: [
      "seu sorriso muda o clima do meu dia",
      "você me faz sentir escolhido",
      "nossas conversas continuam comigo depois que acabam"
    ]
  },
  {
    title: "Promessas",
    target: "promises",
    items: [
      "Prometo cuidar do que é sensível para você.",
      "Prometo fazer dos dias comuns um lugar de carinho.",
      "Prometo continuar escolhendo nós dois nos detalhes."
    ]
  },
  {
    title: "Mensagens secretas",
    target: "hiddenMessages",
    items: [
      "Você é meu pensamento favorito.",
      "Tem um eu te amo escondido aqui.",
      "Ainda quero viver muitos começos com você."
    ]
  }
];

function formatDate(date: string) {
  if (!date) {
    return "Data especial";
  }

  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatDateTime(date: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function makeAssetPath(kind: "photos" | "audio" | "videos", slug: string, file: File) {
  return `${kind}/${ensureSlug(slug)}/${Date.now()}-${shortId()}-${sanitizeFilename(file.name)}`;
}

function stepComplete(step: number, draft: DraftGift) {
  if (step === 0) return Boolean(draft.creatorName.trim() && draft.recipientName.trim());
  if (step === 1) return Boolean(draft.specialDate);
  if (step === 2) return draft.photos.length > 0;
  if (step === 3) return Boolean(draft.message.trim());
  return true;
}

function emptyTextListValue(items: string[]) {
  return [...items, ""];
}

function TextListEditor({
  title,
  description,
  items,
  placeholder,
  onChange,
  max = 12
}: {
  title: string;
  description: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
  max?: number;
}) {
  const visibleItems = items.length ? items : [""];

  function update(index: number, value: string) {
    const next = [...visibleItems];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(visibleItems.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="space-y-3">
        {visibleItems.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={item}
              onChange={(event) => update(index, event.target.value)}
              className="admin-input h-11 px-3"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
              aria-label="Remover"
              title="Remover"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(emptyTextListValue(visibleItems).slice(0, max))}
        disabled={visibleItems.length >= max}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
      >
        <Plus size={15} aria-hidden="true" />
        Adicionar
      </button>
    </div>
  );
}

function SuggestionButtons({
  items,
  onPick
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-pink-100 hover:bg-white/10"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TimelineEditor({
  items,
  onChange
}: {
  items: GiftTimelineEvent[];
  onChange: (items: GiftTimelineEvent[]) => void;
}) {
  const visibleItems = items.length
    ? items
    : [{ title: "", date: "", description: "" }];

  function update(index: number, patch: Partial<GiftTimelineEvent>) {
    onChange(
      visibleItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center gap-3">
        <ListPlus size={20} className="text-pink-200" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-bold text-white">Linha do tempo</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Eventos marcantes que aparecem como uma trilha da história.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {visibleItems.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 md:grid-cols-[170px_1fr_44px]">
            <input
              type="date"
              value={item.date || ""}
              onChange={(event) => update(index, { date: event.target.value })}
              className="admin-input h-11 px-3"
            />
            <div className="grid gap-3">
              <input
                value={item.title}
                onChange={(event) => update(index, { title: event.target.value })}
                className="admin-input h-11 px-3"
                placeholder="Ex.: Primeiro encontro"
              />
              <input
                value={item.description}
                onChange={(event) => update(index, { description: event.target.value })}
                className="admin-input h-11 px-3"
                placeholder="O que esse momento significa"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onChange(visibleItems.filter((_, currentIndex) => currentIndex !== index))
              }
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
              aria-label="Remover evento"
              title="Remover evento"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...visibleItems, { title: "", date: "", description: "" }].slice(0, 12))
        }
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
      >
        <Plus size={15} aria-hidden="true" />
        Adicionar evento
      </button>
    </div>
  );
}

function CouponEditor({
  items,
  onChange
}: {
  items: GiftCoupon[];
  onChange: (items: GiftCoupon[]) => void;
}) {
  const visibleItems = items.length ? items : [{ title: "", description: "" }];

  function update(index: number, patch: Partial<GiftCoupon>) {
    onChange(
      visibleItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center gap-3">
        <Ticket size={20} className="text-pink-200" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-bold text-white">Cupons românticos</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Vales que aparecem como cartões destacáveis no presente.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleItems.map((item, index) => (
          <div key={index} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex gap-2">
              <input
                value={item.title}
                onChange={(event) => update(index, { title: event.target.value })}
                className="admin-input h-11 px-3"
                placeholder="Ex.: Vale jantar"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(visibleItems.filter((_, currentIndex) => currentIndex !== index))
                }
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
                aria-label="Remover cupom"
                title="Remover cupom"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={item.description}
              onChange={(event) => update(index, { description: event.target.value })}
              className="admin-input mt-3 min-h-20 px-3 py-3"
              placeholder="Descrição do vale"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...visibleItems, { title: "", description: "" }].slice(0, 12))}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
      >
        <Plus size={15} aria-hidden="true" />
        Adicionar cupom
      </button>
    </div>
  );
}

function ChapterEditor({
  items,
  onChange
}: {
  items: GiftMessageChapter[];
  onChange: (items: GiftMessageChapter[]) => void;
}) {
  const visibleItems = items.length ? items : [{ title: "", body: "" }];

  function update(index: number, patch: Partial<GiftMessageChapter>) {
    onChange(
      visibleItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center gap-3">
        <BookOpen size={20} className="text-pink-200" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-bold text-white">Carta em capítulos</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Blocos de texto que aparecem antes da carta principal.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {visibleItems.map((item, index) => (
          <div key={index} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex gap-2">
              <input
                value={item.title}
                onChange={(event) => update(index, { title: event.target.value })}
                className="admin-input h-11 px-3"
                placeholder="Título do capítulo"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(visibleItems.filter((_, currentIndex) => currentIndex !== index))
                }
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
                aria-label="Remover capítulo"
                title="Remover capítulo"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={item.body}
              onChange={(event) => update(index, { body: event.target.value })}
              className="admin-input mt-3 min-h-28 px-3 py-3"
              placeholder="Texto deste capítulo"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...visibleItems, { title: "", body: "" }].slice(0, 8))}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
      >
        <Plus size={15} aria-hidden="true" />
        Adicionar capítulo
      </button>
    </div>
  );
}

function mergeDraft(patch: Partial<DraftGift>) {
  return {
    ...initialDraft,
    ...patch,
    photos: patch.photos || [],
    videos: patch.videos || [],
    reasons: patch.reasons?.length ? patch.reasons : initialDraft.reasons,
    promises: patch.promises?.length ? patch.promises : initialDraft.promises,
    hiddenMessages: patch.hiddenMessages?.length
      ? patch.hiddenMessages
      : initialDraft.hiddenMessages,
    places: patch.places?.length ? patch.places : initialDraft.places,
    insideJokes: patch.insideJokes?.length ? patch.insideJokes : initialDraft.insideJokes,
    timelineEvents: patch.timelineEvents?.length
      ? patch.timelineEvents
      : initialDraft.timelineEvents,
    coupons: patch.coupons?.length ? patch.coupons : initialDraft.coupons,
    messageChapters: patch.messageChapters?.length
      ? patch.messageChapters
      : initialDraft.messageChapters,
    slideDurations: {
      ...initialDraft.slideDurations,
      ...(patch.slideDurations || {})
    }
  } satisfies DraftGift;
}

function giftToDraft(gift: Partial<GiftData> & Partial<DraftGift> & { slug?: string }) {
  return mergeDraft({
    ...gift,
    slug: gift.slug || `presente-${shortId()}`,
    mediaUrl: gift.mediaUrl || "",
    openingHint: gift.openingHint || "",
    recipientNickname: gift.recipientNickname || "",
    coverPhotoPathname: gift.coverPhotoPathname || gift.photos?.[0]?.pathname || "",
    capsuleDate: gift.capsuleDate || "",
    capsuleMessage: gift.capsuleMessage || "",
    finalSignature: gift.finalSignature || "",
    secretWord: "",
    ogTitle: gift.ogTitle || "",
    ogDescription: gift.ogDescription || "",
    experienceStyle: gift.experienceStyle || "classic",
    firstLoveMoment: gift.firstLoveMoment || "",
    favoriteMoment: gift.favoriteMoment || "",
    untoldThing: gift.untoldThing || "",
    surpriseQuestion: gift.surpriseQuestion || "",
    surpriseAnswer: ""
  });
}

export function GiftBuilder({
  initialGifts,
  blobConfigured,
  storageError,
  currentUserEmail
}: GiftBuilderProps) {
  const [draft, setDraft] = useState<DraftGift>(() => ({
    ...initialDraft,
    slug: `presente-${shortId()}`
  }));
  const [step, setStep] = useState(0);
  const [slugSuffix] = useState(() => shortId());
  const [gifts] = useState(initialGifts);
  const [editingSlug, setEditingSlug] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deliveryGift, setDeliveryGift] = useState<DeliveryGift | null>(null);
  const [deliveryQrUrl, setDeliveryQrUrl] = useState("");
  const mediaPreviewUrl = useMemo(() => getMediaEmbedUrl(draft.mediaUrl), [draft.mediaUrl]);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(draftStorageKey);

      if (savedDraft) {
        setDraft(giftToDraft(JSON.parse(savedDraft) as DraftGift));
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady || editingSlug) {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setLastSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  }, [draft, draftReady, editingSlug]);

  useEffect(() => {
    if (editingSlug || draft.photos.length > 0 || draft.audio || draft.videos.length > 0) {
      return;
    }

    setDraft((current) => ({
      ...current,
      slug: `${ensureSlug(current.recipientName || "presente")}-${slugSuffix}`
    }));
  }, [draft.recipientName, draft.photos.length, draft.audio, draft.videos.length, editingSlug, slugSuffix]);

  useEffect(() => {
    let active = true;

    if (!deliveryGift) {
      setDeliveryQrUrl("");
      return;
    }

    QRCode.toDataURL(`${window.location.origin}${deliveryGift.url}`, {
      margin: 1,
      width: 360,
      color: {
        dark: "#4c102f",
        light: "#ffffff"
      }
    })
      .then((dataUrl) => {
        if (active) {
          setDeliveryQrUrl(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setDeliveryQrUrl("");
        }
      });

    return () => {
      active = false;
    };
  }, [deliveryGift]);

  const canAdvance = stepComplete(step, draft);
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function updateDraft<K extends keyof DraftGift>(key: K, value: DraftGift[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updatePhoto(index: number, patch: Partial<GiftPhoto>) {
    setDraft((current) => ({
      ...current,
      photos: current.photos.map((photo, currentIndex) =>
        currentIndex === index ? { ...photo, ...patch } : photo
      )
    }));
  }

  function updatePlace(index: number, patch: Partial<GiftPlace>) {
    const places = draft.places.length ? draft.places : [{ name: "", note: "" }];
    updateDraft(
      "places",
      places.map((place, currentIndex) =>
        currentIndex === index ? { ...place, ...patch } : place
      )
    );
  }

  function addPhrase(target: string, value: string) {
    if (target === "reasons") {
      updateDraft("reasons", [...draft.reasons.filter(Boolean), value].slice(0, 30));
      return;
    }

    if (target === "promises") {
      updateDraft("promises", [...draft.promises.filter(Boolean), value].slice(0, 12));
      return;
    }

    if (target === "hiddenMessages") {
      updateDraft("hiddenMessages", [...draft.hiddenMessages.filter(Boolean), value].slice(0, 12));
      return;
    }

    updateDraft("message", [draft.message, value].filter(Boolean).join("\n\n"));
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function uploadToVercelBlob(files: File[]) {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const blob = (await upload(makeAssetPath("photos", draft.slug, file), file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          clientPayload: JSON.stringify({ slug: draft.slug, kind: "photos" })
        })) as PutBlobResult;

        return {
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          contentType: file.type
        } satisfies GiftPhoto;
      })
    );

    return uploaded;
  }

  async function uploadToLocalFallback(files: File[]) {
    const formData = new FormData();
    formData.append("slug", draft.slug);
    formData.append("kind", "photos");
    files.forEach((file) => formData.append("photos", file));

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => ({}))) as {
      photos?: GiftPhoto[];
      error?: string;
    };

    if (!response.ok || !payload.photos) {
      throw new Error(payload.error || "Não foi possível enviar as fotos.");
    }

    return payload.photos;
  }

  async function uploadAudioToVercelBlob(file: File) {
    const blob = (await upload(makeAssetPath("audio", draft.slug, file), file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      clientPayload: JSON.stringify({ slug: draft.slug, kind: "audio" })
    })) as PutBlobResult;

    return {
      url: blob.url,
      pathname: blob.pathname,
      filename: file.name,
      contentType: file.type
    } satisfies GiftAsset;
  }

  async function uploadAudioToLocalFallback(file: File) {
    const formData = new FormData();
    formData.append("slug", draft.slug);
    formData.append("kind", "audio");
    formData.append("audio", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => ({}))) as {
      audio?: GiftAsset;
      error?: string;
    };

    if (!response.ok || !payload.audio) {
      throw new Error(payload.error || "Não foi possível enviar o áudio.");
    }

    return payload.audio;
  }

  async function uploadVideosToVercelBlob(files: File[]) {
    return Promise.all(
      files.map(async (file) => {
        const blob = (await upload(makeAssetPath("videos", draft.slug, file), file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          clientPayload: JSON.stringify({ slug: draft.slug, kind: "videos" })
        })) as PutBlobResult;

        return {
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          contentType: file.type,
          caption: ""
        } satisfies GiftVideo;
      })
    );
  }

  async function uploadVideosToLocalFallback(files: File[]) {
    const formData = new FormData();
    formData.append("slug", draft.slug);
    formData.append("kind", "videos");
    files.forEach((file) => formData.append("videos", file));

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => ({}))) as {
      videos?: GiftVideo[];
      error?: string;
    };

    if (!response.ok || !payload.videos) {
      throw new Error(payload.error || "Não foi possível enviar os vídeos.");
    }

    return payload.videos;
  }

  async function handlePhotosChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) {
      return;
    }

    const remaining = 10 - draft.photos.length;

    if (remaining <= 0) {
      setError("O limite é de 10 fotos por presente.");
      return;
    }

    const files = selected.slice(0, remaining);
    setError("");
    setUploading(true);

    try {
      const uploaded = blobConfigured
        ? await uploadToVercelBlob(files)
        : await uploadToLocalFallback(files);

      setDraft((current) => ({
        ...current,
        photos: [...current.photos, ...uploaded].slice(0, 10),
        coverPhotoPathname: current.coverPhotoPathname || uploaded[0]?.pathname || ""
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Não foi possível enviar as fotos."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleAudioChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setUploadingAudio(true);

    try {
      const audio = blobConfigured
        ? await uploadAudioToVercelBlob(file)
        : await uploadAudioToLocalFallback(file);

      updateDraft("audio", audio);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Não foi possível enviar o áudio."
      );
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleVideosChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) {
      return;
    }

    const remaining = 3 - draft.videos.length;

    if (remaining <= 0) {
      setError("O limite é de 3 vídeos curtos por presente.");
      return;
    }

    const files = selected.slice(0, remaining);
    setError("");
    setUploadingVideos(true);

    try {
      const videos = blobConfigured
        ? await uploadVideosToVercelBlob(files)
        : await uploadVideosToLocalFallback(files);

      setDraft((current) => ({
        ...current,
        videos: [...current.videos, ...videos].slice(0, 3)
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Não foi possível enviar os vídeos."
      );
    } finally {
      setUploadingVideos(false);
    }
  }

  function removePhoto(pathname: string) {
    setDraft((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.pathname !== pathname)
    }));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= draft.photos.length) {
      return;
    }

    setDraft((current) => {
      const photos = [...current.photos];
      const [photo] = photos.splice(index, 1);
      photos.splice(target, 0, photo);

      return {
        ...current,
        photos
      };
    });
  }

  function updateVideo(index: number, patch: Partial<GiftVideo>) {
    setDraft((current) => ({
      ...current,
      videos: current.videos.map((video, currentIndex) =>
        currentIndex === index ? { ...video, ...patch } : video
      )
    }));
  }

  function removeVideo(pathname: string) {
    setDraft((current) => ({
      ...current,
      videos: current.videos.filter((video) => video.pathname !== pathname)
    }));
  }

  function resetDraft() {
    setEditingSlug("");
    setDeliveryGift(null);
    setStep(0);
    setDraft({
      ...initialDraft,
      slug: `presente-${shortId()}`
    });
    window.localStorage.removeItem(draftStorageKey);
  }

  function applyTemplate(key: string) {
    const template = templates[key];

    if (!template) {
      return;
    }

    setDraft((current) => mergeDraft({ ...current, ...template.patch }));
  }

  async function loadGift(slug: string, mode: "edit" | "duplicate") {
    setError("");
    const response = await fetch(`/api/admin/gifts/${slug}`);
    const payload = (await response.json().catch(() => ({}))) as {
      gift?: GiftData;
      error?: string;
    };

    if (!response.ok || !payload.gift) {
      setError(payload.error || "Não foi possível carregar o presente.");
      return;
    }

    const loaded = giftToDraft(payload.gift);

    if (mode === "duplicate") {
      setEditingSlug("");
      setDraft({
        ...loaded,
        slug: `${ensureSlug(loaded.recipientName || "presente")}-${shortId()}`
      });
    } else {
      setEditingSlug(payload.gift.slug);
      setDraft(loaded);
    }

    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openRecipientPreview() {
    window.localStorage.setItem("gift-preview", JSON.stringify(draft));
    window.open("/presente/preview", "_blank", "noopener,noreferrer");
  }

  function updateDuration(key: keyof DraftGift["slideDurations"], value: number) {
    updateDraft("slideDurations", {
      ...draft.slideDurations,
      [key]: value
    });
  }

  async function handleGenerateGift() {
    setSaving(true);
    setError("");

    const response = await fetch(
      editingSlug ? `/api/admin/gifts/${editingSlug}` : "/api/admin/gifts",
      {
      method: editingSlug ? "PUT" : "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(draft)
    });

    const payload = (await response.json().catch(() => ({}))) as {
      gift?: GiftData;
      url?: string;
      error?: string;
    };

    if (!response.ok || !payload.url) {
      setError(payload.error || "Não foi possível gerar o presente.");
      setSaving(false);
      return;
    }

    window.localStorage.removeItem(draftStorageKey);
    const savedGift = payload.gift;
    const savedSlug = savedGift?.slug || payload.url.split("/").filter(Boolean).pop() || draft.slug;

    if (savedGift) {
      setDraft(giftToDraft(savedGift));
    }

    setEditingSlug(savedSlug);
    setSaving(false);
    setDeliveryGift({
      slug: savedSlug,
      url: payload.url,
      recipientName: savedGift?.recipientName || draft.recipientName
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyGiftLink(slug: string) {
    const url = `${window.location.origin}/presente/${slug}`;
    await navigator.clipboard.writeText(url);
  }

  async function copyDeliveryLink() {
    if (!deliveryGift) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${deliveryGift.url}`);
  }

  function sendDeliveryWhatsApp() {
    if (!deliveryGift) {
      return;
    }

    const url = `${window.location.origin}${deliveryGift.url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Abre esse presente que fiz para voce: ${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadDeliveryQr() {
    if (!deliveryGift || !deliveryQrUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = deliveryQrUrl;
    link.download = `qr-${deliveryGift.slug}.png`;
    link.click();
  }

  function downloadGiftBackup() {
    const exportedGift = {
      exportedAt: new Date().toISOString(),
      delivery: deliveryGift,
      draft
    };
    const blob = new Blob([JSON.stringify(exportedGift, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${deliveryGift?.slug || draft.slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const requiredReady = steps.slice(0, 4).every((_, index) => stepComplete(index, draft));
  const checklist = [
    { label: "Nomes", done: Boolean(draft.creatorName && draft.recipientName) },
    { label: "Data", done: Boolean(draft.specialDate) },
    { label: "Fotos", done: draft.photos.length > 0 },
    { label: "Mensagem", done: Boolean(draft.message.trim()) },
    { label: "Capa", done: Boolean(draft.coverPhotoPathname || draft.photos[0]) },
    { label: "Som", done: Boolean(draft.audio || draft.mediaUrl || draft.videos.length) },
    {
      label: "Extras",
      done: Boolean(
        draft.reasons.filter(Boolean).length ||
          draft.promises.filter(Boolean).length ||
          draft.timelineEvents.filter((event) => event.title || event.description).length ||
          draft.coupons.filter((coupon) => coupon.title || coupon.description).length
      )
    }
  ];
  const reviewItems = useMemo(
    () => [
      {
        label: "Fotos e capa",
        done: draft.photos.length > 0,
        detail: draft.photos.length
          ? `${draft.photos.length} foto${draft.photos.length === 1 ? "" : "s"} pronta${draft.photos.length === 1 ? "" : "s"}.`
          : "Adicione pelo menos uma foto para a experiencia ficar bonita."
      },
      {
        label: "Carta principal",
        done: draft.message.trim().length >= 40,
        detail:
          draft.message.trim().length >= 40
            ? "Mensagem com tamanho bom para emocionar."
            : "Escreva um pouco mais antes de enviar."
      },
      {
        label: "Trilha sonora",
        done: Boolean(draft.audio || draft.mediaUrl),
        detail: draft.audio
          ? "MP3 enviado. Esse e o modo mais confiavel no celular."
          : draft.mediaUrl
            ? "Link externo pronto. Spotify/YouTube podem pedir toque da pessoa."
            : "Sem som. Se quiser musica desde o comeco, envie um MP3."
      },
      {
        label: "Videos",
        done: draft.videos.length <= 3,
        detail: draft.videos.length
          ? "Teste os videos no preview pelo celular antes de mandar."
          : "Sem videos curtos adicionados."
      },
      {
        label: "Cupons",
        done: draft.coupons.some((coupon) => coupon.title.trim() || coupon.description.trim()),
        detail: "Os cupons ficam clicaveis na tela e prontos para imprimir."
      },
      {
        label: "Entrega em papel",
        done: Boolean(draft.recipientName && draft.creatorName),
        detail: "Depois de salvar, use QR grande, carta e pacote completo no painel de entrega."
      }
    ],
    [draft]
  );

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-pink-200">Presente Digital</p>
            <h1 className="font-display text-3xl text-white sm:text-4xl">Criar presente</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastSavedAt ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
                <Save size={14} aria-hidden="true" />
                Rascunho {lastSavedAt}
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
              {blobConfigured ? "Vercel Blob ativo" : "Modo local"}
            </span>
            {currentUserEmail ? (
              <span className="max-w-[220px] truncate rounded-full border border-pink-200/20 bg-pink-500/10 px-3 py-2 text-xs font-semibold text-pink-100">
                {currentUserEmail}
              </span>
            ) : null}
            <button
              type="button"
              onClick={openRecipientPreview}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <Eye size={16} aria-hidden="true" />
              Prévia
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Novo
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <LogOut size={16} aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>

        {storageError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-950/50 p-4 text-sm text-rose-100">
            <p className="font-bold text-white">A conexao com o armazenamento falhou.</p>
            <p className="mt-1">{storageError}</p>
            <p className="mt-2 text-rose-100/80">
              Confira as variaveis do Supabase e faca um novo deploy na Vercel.
            </p>
          </div>
        ) : null}

        {deliveryGift ? (
          <section className="rounded-2xl border border-pink-200/20 bg-gradient-to-br from-slate-950/80 via-pink-950/35 to-violet-950/50 p-5 shadow-violet backdrop-blur-xl">
            <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-white/10 bg-white/90 p-4 text-center text-slate-950">
                {deliveryQrUrl ? (
                  <img
                    src={deliveryQrUrl}
                    alt="QR Code do presente"
                    className="mx-auto h-44 w-44 rounded-xl bg-white"
                  />
                ) : (
                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl bg-slate-100">
                    <QrCode size={42} aria-hidden="true" />
                  </div>
                )}
                <p className="mt-3 text-xs font-black uppercase text-pink-700">
                  QR pronto para entregar
                </p>
                <p className="mt-1 break-all text-[11px] leading-4 text-slate-600">
                  {deliveryGift.url}
                </p>
              </div>

              <div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase text-pink-200">Entrega do presente</p>
                    <h2 className="mt-2 font-display text-3xl leading-tight text-white">
                      Presente de {deliveryGift.recipientName} pronto.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      O link, o QR Code, a carta e o pacote para entrega fisica ja estao aqui.
                    </p>
                  </div>
                  <span className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 text-xs font-black uppercase text-emerald-100">
                    Pronto para enviar
                  </span>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <Link
                    href={deliveryGift.url}
                    target="_blank"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-slate-950 shadow-glow hover:bg-pink-100"
                  >
                    <Eye size={16} aria-hidden="true" />
                    Testar presente
                  </Link>
                  <button
                    type="button"
                    onClick={copyDeliveryLink}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15"
                  >
                    <Copy size={16} aria-hidden="true" />
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={sendDeliveryWhatsApp}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15"
                  >
                    <MessageCircleHeart size={16} aria-hidden="true" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={downloadDeliveryQr}
                    disabled={!deliveryQrUrl}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
                  >
                    <Download size={16} aria-hidden="true" />
                    Baixar QR
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/16 p-4">
                  <p className="mb-3 text-xs font-black uppercase text-pink-100">
                    Modo entrega fisica
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=qr`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
                    >
                      <QrCode size={15} aria-hidden="true" />
                      QR grande
                    </Link>
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=carta&modelo=limpa`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
                    >
                      <BookOpen size={15} aria-hidden="true" />
                      Carta limpa
                    </Link>
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=carta&modelo=vintage`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
                    >
                      <BookOpen size={15} aria-hidden="true" />
                      Carta vintage
                    </Link>
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=carta&modelo=dobravel`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
                    >
                      <MoveDown size={15} aria-hidden="true" />
                      Carta dobravel
                    </Link>
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=cupons`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"
                    >
                      <Ticket size={15} aria-hidden="true" />
                      Cupons
                    </Link>
                    <Link
                      href={`/presente/${deliveryGift.slug}/imprimir?tipo=pacote`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-pink-200/30 bg-pink-500/18 px-3 text-xs font-bold text-pink-100 hover:bg-pink-500/25"
                    >
                      <ClipboardCheck size={15} aria-hidden="true" />
                      Pacote completo
                    </Link>
                    <button
                      type="button"
                      onClick={downloadGiftBackup}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15 sm:col-span-2"
                    >
                      <Download size={15} aria-hidden="true" />
                      Baixar backup JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/48 p-4 backdrop-blur-xl xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold uppercase text-pink-200">
                {editingSlug ? `Editando /presente/${editingSlug}` : "Modo presente perfeito"}
              </p>
              {editingSlug ? (
                <button
                  type="button"
                  onClick={() => loadGift(editingSlug, "duplicate")}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  <CopyPlus size={14} aria-hidden="true" />
                  Duplicar este
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-pink-300/50 hover:bg-pink-500/10"
                >
                  <span className="block text-sm font-bold text-white">{template.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    {template.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-pink-200">
              <ClipboardCheck size={16} aria-hidden="true" />
              Checklist
            </div>
            <div className="grid grid-cols-2 gap-2">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                    item.done
                      ? "bg-pink-500/18 text-pink-100"
                      : "bg-white/[0.04] text-slate-400"
                  }`}
                >
                  <Check size={13} aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-black uppercase text-slate-400">
                Revisao automatica
              </p>
              <div className="space-y-2">
                {reviewItems.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg border px-3 py-2 ${
                      item.done
                        ? "border-emerald-300/15 bg-emerald-400/8"
                        : "border-amber-300/20 bg-amber-400/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase">
                      <Check
                        size={13}
                        className={item.done ? "text-emerald-200" : "text-amber-200"}
                        aria-hidden="true"
                      />
                      <span className={item.done ? "text-emerald-100" : "text-amber-100"}>
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-slate-950/48 p-4 backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-auto">
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <nav className="space-y-2">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = index === step;
                const complete = index < step || stepComplete(index, draft);

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-white text-slate-950"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active
                          ? "bg-slate-950 text-white"
                          : complete
                            ? "bg-pink-500/20 text-pink-200"
                            : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {complete && !active ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <Icon size={16} aria-hidden="true" />
                      )}
                    </span>
                    {item.title}
                  </button>
                );
              })}
            </nav>

            {gifts.length ? (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">
                  Presentes criados
                </h2>
                <div className="space-y-2">
                  {gifts.slice(0, 8).map((gift) => (
                    <div
                      key={gift.slug}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-3"
                    >
                      <p className="truncate text-sm font-semibold text-white">
                        {gift.recipientName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {gift.photoCount} fotos · {formatDateTime(gift.createdAt)}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/presente/${gift.slug}`}
                          target="_blank"
                          className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-950"
                        >
                          Abrir
                        </Link>
                        <button
                          type="button"
                          onClick={() => copyGiftLink(gift.slug)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
                          aria-label="Copiar link"
                          title="Copiar link"
                        >
                          <Copy size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => loadGift(gift.slug, "edit")}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => loadGift(gift.slug, "duplicate")}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          Duplicar
                        </button>
                      </div>
                      <Link
                        href={`/admin/reacoes/${gift.slug}`}
                        className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-pink-200/20 bg-pink-500/10 text-xs font-bold text-pink-100 hover:bg-pink-500/15"
                      >
                        <MessageCircleHeart size={13} aria-hidden="true" />
                        Ver reações
                      </Link>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Link
                          href={`/presente/${gift.slug}/imprimir?tipo=convite`}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <QrCode size={13} aria-hidden="true" />
                          Convite
                        </Link>
                        <Link
                          href={`/presente/${gift.slug}/imprimir?tipo=qr`}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <QrCode size={13} aria-hidden="true" />
                          QR grande
                        </Link>
                        <Link
                          href={`/presente/${gift.slug}/imprimir?tipo=carta`}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <BookOpen size={13} aria-hidden="true" />
                          Carta
                        </Link>
                        <Link
                          href={`/presente/${gift.slug}/imprimir?tipo=cupons`}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <Printer size={13} aria-hidden="true" />
                          Cupons
                        </Link>
                        <Link
                          href={`/presente/${gift.slug}/imprimir?tipo=pacote`}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <ClipboardCheck size={13} aria-hidden="true" />
                          Pacote
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <section className="glass-panel rounded-2xl p-5 sm:p-7">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase text-pink-200">
                Etapa {step + 1} de {steps.length}
              </p>
              <h2 className="mt-2 font-display text-4xl text-white">{steps[step].title}</h2>
            </div>

            {step === 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label htmlFor="creatorName" className="admin-label">
                    Seu nome
                  </label>
                  <input
                    id="creatorName"
                    value={draft.creatorName}
                    onChange={(event) => updateDraft("creatorName", event.target.value)}
                    className="admin-input h-12 px-4"
                    placeholder="Ex.: Kleison"
                  />
                </div>
                <div>
                  <label htmlFor="recipientName" className="admin-label">
                    Nome do destinatário
                  </label>
                  <input
                    id="recipientName"
                    value={draft.recipientName}
                    onChange={(event) => updateDraft("recipientName", event.target.value)}
                    className="admin-input h-12 px-4"
                    placeholder="Ex.: Ana"
                  />
                </div>
                <div>
                  <label htmlFor="recipientNickname" className="admin-label">
                    Apelido carinhoso
                  </label>
                  <input
                    id="recipientNickname"
                    value={draft.recipientNickname}
                    onChange={(event) => updateDraft("recipientNickname", event.target.value)}
                    className="admin-input h-12 px-4"
                    placeholder="Ex.: meu amor"
                  />
                </div>
                <div>
                  <label htmlFor="secretWord" className="admin-label">
                    Palavra secreta opcional
                  </label>
                  <div className="relative">
                    <Shield
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="secretWord"
                      value={draft.secretWord}
                      onChange={(event) => updateDraft("secretWord", event.target.value)}
                      className="admin-input h-12 pl-11 pr-4"
                      placeholder="Ex.: nosso lugar"
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="openingHint" className="admin-label">
                    Frase antes de abrir a carta
                  </label>
                  <input
                    id="openingHint"
                    value={draft.openingHint}
                    onChange={(event) => updateDraft("openingHint", event.target.value)}
                    className="admin-input h-12 px-4"
                    placeholder="Ex.: Respire fundo. Tem um pedaço meu aqui dentro."
                  />
                  <SuggestionButtons
                    items={suggestions.opening}
                    onPick={(value) => updateDraft("openingHint", value)}
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-2">
                  <div className="mb-4 flex items-center gap-3">
                    <MessageCircleHeart size={20} className="text-pink-200" aria-hidden="true" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Pergunta surpresa</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Uma pergunta leve antes da carta abrir. Não substitui a palavra secreta.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <label htmlFor="surpriseQuestion" className="admin-label">
                        Pergunta
                      </label>
                      <input
                        id="surpriseQuestion"
                        value={draft.surpriseQuestion}
                        onChange={(event) => updateDraft("surpriseQuestion", event.target.value)}
                        className="admin-input h-12 px-4"
                        placeholder="Ex.: Qual nosso apelido?"
                      />
                    </div>
                    <div>
                      <label htmlFor="surpriseAnswer" className="admin-label">
                        Resposta esperada
                      </label>
                      <input
                        id="surpriseAnswer"
                        value={draft.surpriseAnswer}
                        onChange={(event) => updateDraft("surpriseAnswer", event.target.value)}
                        className="admin-input h-12 px-4"
                        placeholder="Ex.: mozão"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-2 lg:grid-cols-2">
                  <div>
                    <label htmlFor="ogTitle" className="admin-label">
                      Título da capa do link
                    </label>
                    <input
                      id="ogTitle"
                      value={draft.ogTitle}
                      onChange={(event) => updateDraft("ogTitle", event.target.value)}
                      className="admin-input h-12 px-4"
                      placeholder="Ex.: Um presente para meu amor"
                    />
                  </div>
                  <div>
                    <label htmlFor="ogDescription" className="admin-label">
                      Descrição da capa do link
                    </label>
                    <input
                      id="ogDescription"
                      value={draft.ogDescription}
                      onChange={(event) => updateDraft("ogDescription", event.target.value)}
                      className="admin-input h-12 px-4"
                      placeholder="Ex.: Abra quando estiver com calma"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label htmlFor="specialDate" className="admin-label">
                    Data especial
                  </label>
                  <input
                    id="specialDate"
                    type="date"
                    value={draft.specialDate}
                    onChange={(event) => updateDraft("specialDate", event.target.value)}
                    className="admin-input h-12 px-4"
                  />
                  <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                    {formatDate(draft.specialDate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Clock size={20} className="text-pink-200" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-white">Cápsula do tempo</h3>
                  </div>
                  <label htmlFor="capsuleDate" className="admin-label">
                    Data para revelar
                  </label>
                  <input
                    id="capsuleDate"
                    type="date"
                    value={draft.capsuleDate}
                    onChange={(event) => updateDraft("capsuleDate", event.target.value)}
                    className="admin-input h-12 px-4"
                  />
                  <label htmlFor="capsuleMessage" className="admin-label mt-4">
                    Mensagem futura
                  </label>
                  <textarea
                    id="capsuleMessage"
                    value={draft.capsuleMessage}
                    onChange={(event) => updateDraft("capsuleMessage", event.target.value)}
                    className="admin-input min-h-28 resize-y px-4 py-3"
                    placeholder="Uma carta para abrir em outro dia..."
                  />
                </div>
                <div className="lg:col-span-2">
                  <TimelineEditor
                    items={draft.timelineEvents}
                    onChange={(items) => updateDraft("timelineEvents", items)}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <label
                  htmlFor="photos"
                  className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-pink-300/40 bg-pink-500/8 px-6 py-10 text-center transition hover:bg-pink-500/12"
                >
                  <UploadCloud size={34} className="mb-4 text-pink-200" aria-hidden="true" />
                  <span className="text-lg font-bold text-white">
                    {uploading ? "Enviando fotos..." : "Selecionar fotos"}
                  </span>
                  <span className="mt-2 max-w-md text-sm text-slate-300">
                    Cada foto pode ganhar legenda, local, data e uma pergunta secreta.
                  </span>
                  <input
                    id="photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handlePhotosChange}
                    disabled={uploading || draft.photos.length >= 10}
                    className="sr-only"
                  />
                </label>

                {draft.photos.length ? (
                  <div className="mt-6 space-y-4">
                    {draft.photos.map((photo, index) => (
                      <div
                        key={photo.pathname}
                        className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[220px_minmax(0,1fr)]"
                      >
                        <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                          <img
                            src={photo.url}
                            alt={`Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => updateDraft("coverPhotoPathname", photo.pathname)}
                              className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-bold ${
                                draft.coverPhotoPathname === photo.pathname ||
                                (!draft.coverPhotoPathname && index === 0)
                                  ? "bg-pink-500 text-white"
                                  : "bg-slate-950/80 text-white hover:bg-white/20"
                              }`}
                            >
                              Capa
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.pathname)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/80 text-white transition hover:bg-rose-500"
                              aria-label="Remover foto"
                              title="Remover foto"
                            >
                              <X size={15} aria-hidden="true" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => movePhoto(index, -1)}
                              disabled={index === 0}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/80 text-white disabled:opacity-35"
                              aria-label="Mover para cima"
                              title="Mover para cima"
                            >
                              <MoveUp size={15} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhoto(index, 1)}
                              disabled={index === draft.photos.length - 1}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/80 text-white disabled:opacity-35"
                              aria-label="Mover para baixo"
                              title="Mover para baixo"
                            >
                              <MoveDown size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="admin-label" htmlFor={`caption-${index}`}>
                              Legenda da memória
                            </label>
                            <input
                              id={`caption-${index}`}
                              value={photo.caption || ""}
                              onChange={(event) =>
                                updatePhoto(index, { caption: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="Ex.: O dia em que tudo pareceu casa"
                            />
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`memoryDate-${index}`}>
                              Data da foto
                            </label>
                            <input
                              id={`memoryDate-${index}`}
                              type="date"
                              value={photo.memoryDate || ""}
                              onChange={(event) =>
                                updatePhoto(index, { memoryDate: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                            />
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`location-${index}`}>
                              Lugar
                            </label>
                            <input
                              id={`location-${index}`}
                              value={photo.location || ""}
                              onChange={(event) =>
                                updatePhoto(index, { location: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="Ex.: Gramado"
                            />
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`quizQuestion-${index}`}>
                              Pergunta romântica
                            </label>
                            <input
                              id={`quizQuestion-${index}`}
                              value={photo.quizQuestion || ""}
                              onChange={(event) =>
                                updatePhoto(index, { quizQuestion: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="Ex.: Você lembra o que aconteceu depois?"
                            />
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`quizAnswer-${index}`}>
                              Resposta revelada
                            </label>
                            <input
                              id={`quizAnswer-${index}`}
                              value={photo.quizAnswer || ""}
                              onChange={(event) =>
                                updatePhoto(index, { quizAnswer: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="Ex.: A gente riu até esquecer a hora"
                            />
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`captionPosition-${index}`}>
                              Posição da legenda
                            </label>
                            <select
                              id={`captionPosition-${index}`}
                              value={photo.captionPosition || "bottom"}
                              onChange={(event) =>
                                updatePhoto(index, {
                                  captionPosition: event.target.value as GiftPhoto["captionPosition"]
                                })
                              }
                              className="admin-input h-11 px-3"
                            >
                              <option value="bottom">Embaixo</option>
                              <option value="center">Centro</option>
                              <option value="top">Topo</option>
                              <option value="hidden">Discreta</option>
                            </select>
                          </div>
                          <div>
                            <label className="admin-label" htmlFor={`filter-${index}`}>
                              Filtro da foto
                            </label>
                            <select
                              id={`filter-${index}`}
                              value={photo.filter || "none"}
                              onChange={(event) =>
                                updatePhoto(index, {
                                  filter: event.target.value as GiftPhoto["filter"]
                                })
                              }
                              className="admin-input h-11 px-3"
                            >
                              <option value="none">Natural</option>
                              <option value="film">Filme</option>
                              <option value="bw">Preto e branco</option>
                              <option value="soft">Brilho suave</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold text-slate-200 md:col-span-2">
                            <input
                              type="checkbox"
                              checked={Boolean(photo.polaroid)}
                              onChange={(event) =>
                                updatePhoto(index, { polaroid: event.target.checked })
                              }
                              className="h-4 w-4 accent-pink-500"
                            />
                            Mostrar como polaroid em momentos especiais
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Video size={20} className="text-pink-200" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-white">Vídeos curtos</h3>
                  </div>
                  <label
                    htmlFor="videos"
                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-5 py-6 text-center hover:bg-white/[0.07]"
                  >
                    <UploadCloud size={28} className="mb-3 text-pink-200" aria-hidden="true" />
                    <span className="text-sm font-bold text-white">
                      {uploadingVideos ? "Enviando vídeos..." : "Adicionar vídeos"}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      Até 3 arquivos MP4, MOV ou WEBM
                    </span>
                    <input
                      id="videos"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                      multiple
                      onChange={handleVideosChange}
                      disabled={uploadingVideos || draft.videos.length >= 3}
                      className="sr-only"
                    />
                  </label>
                  {draft.videos.length ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      {draft.videos.map((video, index) => (
                        <div
                          key={video.pathname}
                          className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                        >
                          <video src={video.url} controls className="aspect-video w-full rounded-lg object-cover" />
                          <input
                            value={video.caption || ""}
                            onChange={(event) =>
                              updateVideo(index, { caption: event.target.value })
                            }
                            className="admin-input mt-3 h-10 px-3"
                            placeholder="Legenda do vídeo"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(video.pathname)}
                            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-slate-200 hover:bg-white/10"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="message" className="admin-label">
                    Mensagem principal
                  </label>
                  <textarea
                    id="message"
                    value={draft.message}
                    onChange={(event) => updateDraft("message", event.target.value)}
                    className="admin-input min-h-56 resize-y px-4 py-4 leading-7"
                    placeholder="Escreva algo que só essa pessoa entenderia..."
                  />
                  <SuggestionButtons
                    items={suggestions.message}
                    onPick={(value) => updateDraft("message", value)}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <BookOpen size={20} className="text-pink-200" aria-hidden="true" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Banco de frases</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Clique em uma frase para inserir na mensagem, motivos, promessas ou segredos.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {phraseLibrary.map((group) => (
                      <div key={group.title} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="mb-3 text-sm font-bold uppercase text-pink-100">
                          {group.title}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => addPhrase(group.target, item)}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs font-semibold leading-5 text-slate-100 hover:bg-white/10"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label htmlFor="firstLoveMoment" className="admin-label">
                      Quando percebi que te amava
                    </label>
                    <textarea
                      id="firstLoveMoment"
                      value={draft.firstLoveMoment}
                      onChange={(event) => updateDraft("firstLoveMoment", event.target.value)}
                      className="admin-input min-h-28 resize-y px-4 py-3"
                      placeholder="Conte esse instante..."
                    />
                  </div>
                  <div>
                    <label htmlFor="favoriteMoment" className="admin-label">
                      Meu momento favorito
                    </label>
                    <textarea
                      id="favoriteMoment"
                      value={draft.favoriteMoment}
                      onChange={(event) => updateDraft("favoriteMoment", event.target.value)}
                      className="admin-input min-h-28 resize-y px-4 py-3"
                      placeholder="Aquele momento que volta na memória..."
                    />
                  </div>
                  <div>
                    <label htmlFor="untoldThing" className="admin-label">
                      Uma coisa que nunca te falei
                    </label>
                    <textarea
                      id="untoldThing"
                      value={draft.untoldThing}
                      onChange={(event) => updateDraft("untoldThing", event.target.value)}
                      className="admin-input min-h-28 resize-y px-4 py-3"
                      placeholder="Algo sincero, simples e só de vocês..."
                    />
                  </div>
                </div>
                <SuggestionButtons
                  items={suggestions.personal}
                  onPick={(value) => {
                    if (!draft.firstLoveMoment) updateDraft("firstLoveMoment", value);
                    else if (!draft.favoriteMoment) updateDraft("favoriteMoment", value);
                    else updateDraft("untoldThing", value);
                  }}
                />

                <div className="grid gap-4 xl:grid-cols-4">
                  <TextListEditor
                    title="Chuva de motivos"
                    description="Frases curtas que caem no fundo da experiência."
                    items={draft.reasons}
                    placeholder="Um motivo para amar essa pessoa"
                    max={30}
                    onChange={(items) => updateDraft("reasons", items)}
                  />
                  <TextListEditor
                    title="Promessas"
                    description="Cards finais com promessas íntimas."
                    items={draft.promises}
                    placeholder="Prometo..."
                    max={12}
                    onChange={(items) => updateDraft("promises", items)}
                  />
                  <TextListEditor
                    title="Mensagens secretas"
                    description="Textos revelados em estrelas e corações."
                    items={draft.hiddenMessages}
                    placeholder="Uma frase escondida"
                    max={12}
                    onChange={(items) => updateDraft("hiddenMessages", items)}
                  />
                  <TextListEditor
                    title="Só nós entendemos"
                    description="Piadas internas, códigos e frases de vocês."
                    items={draft.insideJokes}
                    placeholder="Uma coisa que só vocês entendem"
                    max={12}
                    onChange={(items) => updateDraft("insideJokes", items)}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ChapterEditor
                    items={draft.messageChapters}
                    onChange={(items) => updateDraft("messageChapters", items)}
                  />
                  <CouponEditor
                    items={draft.coupons}
                    onChange={(items) => updateDraft("coupons", items)}
                  />
                </div>

                <div>
                  <label htmlFor="finalSignature" className="admin-label">
                    Assinatura final
                  </label>
                  <input
                    id="finalSignature"
                    value={draft.finalSignature}
                    onChange={(event) => updateDraft("finalSignature", event.target.value)}
                    className="admin-input h-12 px-4"
                    placeholder="Ex.: Com todo meu amor, hoje e sempre"
                  />
                  <SuggestionButtons
                    items={suggestions.final}
                    onPick={(value) => updateDraft("finalSignature", value)}
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label htmlFor="mediaUrl" className="admin-label">
                    Link do Spotify ou YouTube
                  </label>
                  <div className="relative">
                    <LinkIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="mediaUrl"
                      value={draft.mediaUrl}
                      onChange={(event) => updateDraft("mediaUrl", event.target.value)}
                      className="admin-input h-12 pl-11 pr-4"
                      placeholder="https://open.spotify.com/... ou https://youtube.com/..."
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    No celular, Spotify e YouTube podem pedir um toque no player.
                    Para tocar do começo com mais estabilidade, envie um MP3 no campo ao lado.
                  </p>
                  {mediaPreviewUrl ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-2">
                      <iframe
                        title="Teste da trilha"
                        src={mediaPreviewUrl}
                        className="h-32 w-full rounded-lg border-0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      />
                    </div>
                  ) : draft.mediaUrl ? (
                    <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
                      Não consegui reconhecer esse link. Use um link aberto do Spotify ou YouTube.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Mic size={20} className="text-pink-200" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-white">Áudio ou trilha pessoal</h3>
                  </div>
                  <label
                    htmlFor="audio"
                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-5 py-6 text-center hover:bg-white/[0.07]"
                  >
                    <UploadCloud size={28} className="mb-3 text-pink-200" aria-hidden="true" />
                    <span className="text-sm font-bold text-white">
                      {uploadingAudio ? "Enviando áudio..." : "Enviar uma mensagem de voz"}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      MP3, M4A, WAV, OGG ou WEBM
                    </span>
                    <input
                      id="audio"
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/ogg,audio/webm,audio/x-m4a"
                      onChange={handleAudioChange}
                      disabled={uploadingAudio}
                      className="sr-only"
                    />
                  </label>
                  {draft.audio ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white">
                          {draft.audio.filename}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateDraft("audio", undefined)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
                          aria-label="Remover áudio"
                          title="Remover áudio"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <audio src={draft.audio.url} controls className="mt-3 w-full" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {(Object.keys(giftThemes) as GiftTheme[]).map((themeKey) => {
                    const theme = giftThemes[themeKey];
                    const active = draft.theme === themeKey;

                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => updateDraft("theme", themeKey)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-pink-300 bg-pink-500/15 shadow-glow"
                            : "border-white/10 bg-white/[0.04] hover:border-white/30"
                        }`}
                      >
                        <div className="mb-4 flex gap-2">
                          {theme.swatches.map((color) => (
                            <span
                              key={color}
                              className="h-8 w-8 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="block text-lg font-bold text-white">{theme.label}</span>
                        <span className="mt-2 block text-sm leading-6 text-slate-300">
                          {theme.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Clapperboard size={20} className="text-pink-200" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-white">Modo de experiência</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {([
                      {
                        key: "classic",
                        label: "Clássico",
                        description: "Equilibrado, romântico e leve."
                      },
                      {
                        key: "scrapbook",
                        label: "Scrapbook",
                        description: "Colagem, polaroids e clima de álbum feito à mão."
                      },
                      {
                        key: "cinema",
                        label: "Cinema",
                        description: "Mais dramático, escuro e com transições lentas."
                      }
                    ] as Array<{ key: ExperienceStyle; label: string; description: string }>).map(
                      (style) => (
                        <button
                          key={style.key}
                          type="button"
                          onClick={() => updateDraft("experienceStyle", style.key)}
                          className={`rounded-xl border p-4 text-left transition ${
                            draft.experienceStyle === style.key
                              ? "border-pink-300 bg-pink-500/15 shadow-glow"
                              : "border-white/10 bg-slate-950/40 hover:bg-white/10"
                          }`}
                        >
                          <span className="block text-sm font-bold uppercase text-pink-100">
                            {style.label}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-slate-300">
                            {style.description}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <Palette size={20} className="text-pink-200" aria-hidden="true" />
                      <h3 className="text-lg font-bold text-white">Cor principal</h3>
                    </div>
                    <input
                      type="color"
                      value={draft.primaryColor}
                      onChange={(event) => updateDraft("primaryColor", event.target.value)}
                      className="h-12 w-full rounded-lg border border-white/10 bg-transparent"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <MapPin size={20} className="text-pink-200" aria-hidden="true" />
                      <h3 className="text-lg font-bold text-white">Mapa afetivo</h3>
                    </div>
                    <div className="space-y-3">
                      {(draft.places.length ? draft.places : [{ name: "", note: "" }]).map(
                        (place, index) => (
                          <div key={index} className="grid gap-3 md:grid-cols-[220px_1fr_44px]">
                            <input
                              value={place.name}
                              onChange={(event) =>
                                updatePlace(index, { name: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="Lugar"
                            />
                            <input
                              value={place.note}
                              onChange={(event) =>
                                updatePlace(index, { note: event.target.value })
                              }
                              className="admin-input h-11 px-3"
                              placeholder="O que esse lugar guarda"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(
                                  "places",
                                  draft.places.filter(
                                    (_, currentIndex) => currentIndex !== index
                                  )
                                )
                              }
                              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
                              aria-label="Remover lugar"
                              title="Remover lugar"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft("places", [...draft.places, { name: "", note: "" }])
                      }
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      <Plus size={15} aria-hidden="true" />
                      Adicionar lugar
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-lg font-bold text-white">Ritmo da experiência</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Defina quantos segundos cada tipo de capítulo fica na tela no modo automático.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["welcome", "Abertura"],
                      ["personal", "Íntimo"],
                      ["timeline", "Linha do tempo"],
                      ["coupons", "Cupons"],
                      ["photo", "Fotos"],
                      ["video", "Vídeos"],
                      ["chapters", "Capítulos"],
                      ["message", "Mensagem"],
                      ["album", "Álbum"],
                      ["ending", "Final"],
                      ["capsule", "Cápsula"]
                    ].map(([key, label]) => (
                      <label key={key} className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                        <span className="block text-sm font-bold text-white">{label}</span>
                        <input
                          type="range"
                          min={4}
                          max={30}
                          value={draft.slideDurations[key as keyof DraftGift["slideDurations"]] || 8}
                          onChange={(event) =>
                            updateDuration(
                              key as keyof DraftGift["slideDurations"],
                              Number(event.target.value)
                            )
                          }
                          className="mt-3 w-full accent-pink-500"
                        />
                        <span className="mt-1 block text-xs text-slate-400">
                          {draft.slideDurations[key as keyof DraftGift["slideDurations"]] || 8}s
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                  <div className="relative min-h-[520px] p-6 sm:p-10">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 25% 20%, ${draft.primaryColor}55, transparent 28rem), radial-gradient(circle at 78% 20%, rgba(139,92,246,0.28), transparent 30rem)`
                      }}
                    />
                    {draft.photos[0] ? (
                      <img
                        src={draft.photos[0].url}
                        alt="Preview"
                        className="absolute inset-0 h-full w-full object-cover opacity-35"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                    <div className="relative z-10 flex min-h-[440px] flex-col justify-end">
                      <p className="mb-4 text-sm font-semibold uppercase text-pink-200">
                        Carta selada para {draft.recipientName || "alguém especial"}
                      </p>
                      <h3 className="max-w-2xl font-display text-5xl text-white sm:text-6xl">
                        Com amor de {draft.creatorName || "você"}
                      </h3>
                      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">
                        {draft.message || "Sua mensagem aparecerá aqui com efeito de digitação."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="mb-4 text-xl font-bold text-white">Resumo</h3>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-slate-400">Link</dt>
                      <dd className="mt-1 break-all text-slate-100">/presente/{draft.slug}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Data</dt>
                      <dd className="mt-1 text-slate-100">{formatDate(draft.specialDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Fotos</dt>
                      <dd className="mt-1 text-slate-100">{draft.photos.length} de 10</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Extras</dt>
                      <dd className="mt-1 text-slate-100">
                        {draft.reasons.filter(Boolean).length} motivos,{" "}
                        {draft.promises.filter(Boolean).length} promessas,{" "}
                        {draft.timelineEvents.filter((event) => event.title || event.description).length} eventos,{" "}
                        {draft.coupons.filter((coupon) => coupon.title || coupon.description).length} cupons
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Modo</dt>
                      <dd className="mt-1 text-slate-100">
                        {draft.experienceStyle === "cinema"
                          ? "Cinema"
                          : draft.experienceStyle === "scrapbook"
                            ? "Scrapbook"
                            : "Clássico"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-bold uppercase text-pink-200">
                        Preview mobile
                      </h4>
                      <span className="text-xs font-semibold text-slate-400">
                        9:16
                      </span>
                    </div>
                    <div className="mx-auto max-w-[220px] rounded-[28px] border border-white/15 bg-black p-2 shadow-violet">
                      <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] bg-slate-950">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at 30% 20%, ${draft.primaryColor}66, transparent 8rem), radial-gradient(circle at 70% 12%, rgba(139,92,246,0.44), transparent 9rem), linear-gradient(145deg,#07050f,#16071b)`
                          }}
                        />
                        {draft.photos[0] ? (
                          <img
                            src={draft.photos[0].url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-32"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                        <div className="absolute inset-x-0 top-3 mx-auto h-1 w-14 rounded-full bg-white/25" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-xs font-bold uppercase text-pink-100">
                            Para {draft.recipientName || "alguém especial"}
                          </p>
                          <p className="mt-2 line-clamp-3 font-display text-2xl leading-tight text-white">
                            Com amor de {draft.creatorName || "você"}
                          </p>
                          <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-200">
                            {draft.message || "Sua mensagem aparecerá aqui com animação."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateGift}
                    disabled={saving || !requiredReady}
                    className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
                  >
                    <Heart size={17} aria-hidden="true" />
                    {saving ? "Salvando..." : editingSlug ? "Salvar presente" : "Gerar presente"}
                  </button>
                  <button
                    type="button"
                    onClick={openRecipientPreview}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    <Eye size={16} aria-hidden="true" />
                    Pré-visualizar como destinatário
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-6 rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Voltar
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                  disabled={!canAdvance}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-pink-100 disabled:opacity-40"
                >
                  Continuar
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <span className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-5 text-sm font-semibold text-slate-300">
                  Revise e gere
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
