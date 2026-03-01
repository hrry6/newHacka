import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, transactions } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from transactions
    const txContext = transactions && transactions.length > 0
      ? `\n\nBerikut adalah data transaksi yang sedang dimonitor:\n${JSON.stringify(transactions, null, 2)}`
      : "";

    const systemPrompt = `Kamu adalah AI analis transaksi keuangan untuk platform monitoring Paylabs. 
Kamu membantu tim fraud detection dan analis keuangan menganalisis data transaksi.

Kemampuan analisis kamu meliputi:
- Deteksi transaksi mencurigakan (circular transaction, split transaction, layering, dsb)
- Analisis pola pembayaran berdasarkan paymentType (CreditCard, DebitCard, QRIS, VirtualAccount, Ewallet, BankTransfer)
- Identifikasi anomali berdasarkan amount, waktu (X-TIMESTAMP), dan frekuensi
- Memberikan ringkasan statistik dan insight dari data transaksi
- Menjelaskan field Paylabs API: merchantTradeNo, requestId, paymentType, amount, productName, X-TIMESTAMP

Jawab dalam Bahasa Indonesia. Gunakan format yang rapi dengan poin-poin bila diperlukan.${txContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit tercapai, coba lagi beberapa saat." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit AI habis. Tambah kredit di pengaturan workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Gagal menghubungi AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("transaction-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
