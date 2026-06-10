"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export function PrintActions({ giftUrl }: { giftUrl: string }) {
  return (
    <div className="gift-print-toolbar">
      <Link href={giftUrl} className="gift-print-action secondary">
        <ArrowLeft size={17} aria-hidden="true" />
        Voltar ao presente
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="gift-print-action primary"
      >
        <Printer size={17} aria-hidden="true" />
        Imprimir
      </button>
    </div>
  );
}
