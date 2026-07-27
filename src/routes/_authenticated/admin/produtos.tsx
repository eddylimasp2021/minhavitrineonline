import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, Loader2, ExternalLink, Copy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uniqueSlug } from "@/lib/slug";
import { formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  head: () => ({ meta: [{ title: "Meus Produtos — NeonFlow Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  hashtags: string[];
  whatsapp: string | null;
  published: boolean;
};

function AdminProducts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto removido");
      qc.invalidateQueries({ queryKey: ["admin-products", user?.id] });
    },
  });

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black">Meus Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie, edite e publique sua vitrine. IA gera título, descrição e hashtags a partir da foto.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 font-semibold text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.isLoading && <p className="text-muted-foreground">Carregando…</p>}
        {q.data?.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-neon-cyan" />
            <p className="mt-3 text-muted-foreground">Nenhum produto ainda. Crie o primeiro com IA.</p>
          </div>
        )}
        {q.data?.map((p) => (
          <article key={p.id} className="rounded-3xl border border-white/10 glass overflow-hidden">
            {p.image_url && (
              <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.category ?? "—"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${p.published ? "bg-neon-green/20 text-neon-green" : "bg-white/10 text-muted-foreground"}`}>
                  {p.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <p className="mt-2 font-display text-lg text-neon-cyan">{formatBRL(Number(p.price))}</p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/v/$slug"
                  params={{ slug: p.slug }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-neon-cyan/50"
                >
                  <ExternalLink className="h-3 w-3" /> Ver vitrine
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/v/${p.slug}`);
                    toast.success("Link copiado");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-neon-cyan/50"
                >
                  <Copy className="h-3 w-3" /> Link
                </button>
                <button
                  onClick={() => del.mutate(p.id)}
                  className="ml-auto rounded-lg border border-white/10 p-1.5 text-neon-magenta hover:border-neon-magenta/50"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {open && (
        <ProductForm
          onClose={() => setOpen(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["admin-products", user?.id] });
            setOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}

function ProductForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [price, setPrice] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hint, setHint] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  async function onFile(f: File) {
    // Normalize to JPEG (max 1600px) so Gemini accepts HEIC/webp/large photos.
    try {
      const origUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("read fail"));
        r.readAsDataURL(f);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Formato de imagem não suportado pelo navegador (tente JPG/PNG)"));
        i.src = origUrl;
      });
      const MAX = 1600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas indisponível");
      ctx.drawImage(img, 0, 0, w, h);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const blob = await (await fetch(jpegDataUrl)).blob();
      const jpegFile = new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      setFile(jpegFile);
      setImageDataUrl(jpegDataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ler imagem");
    }
  }

  async function generate() {
    if (!imageDataUrl && !hint) {
      toast.error("Envie uma foto ou escreva uma dica");
      return;
    }
    setAiBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Faça login para usar a IA");
      const res = await fetch("/api/generate-product-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageDataUrl, hint }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Falha IA");
      setTitle(j.title ?? "");
      setDescription(j.description ?? "");
      setCategory(j.category ?? "");
      setHashtags((j.hashtags ?? []).join(" "));
      toast.success("Conteúdo gerado por IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro IA");
    } finally {
      setAiBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaveBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        image_url = signed?.signedUrl ?? null;
      }
      const slug = uniqueSlug(title);
      const tags = hashtags
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean);
      const { error } = await supabase.from("products").insert({
        owner_id: user.id,
        slug,
        title,
        description,
        category,
        hashtags: tags,
        price: Number(price) || 0,
        whatsapp,
        image_url,
        published: true,
      });
      if (error) throw error;
      toast.success("Produto criado");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-lg" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 glass-strong p-6"
      >
        <h2 className="font-display text-xl font-bold">Novo produto</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Envie uma foto e clique em "Gerar com IA" para preencher tudo automaticamente.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
          <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5 hover:border-neon-cyan/50">
            {imageDataUrl ? (
              <img src={imageDataUrl} className="h-full w-full object-cover" alt="preview" />
            ) : (
              <span className="text-center text-xs text-muted-foreground">
                Clique para enviar foto
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>

          <div className="space-y-2">
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Dica opcional (ex.: tênis running masculino azul)"
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm focus:border-neon-cyan/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={generate}
              disabled={aiBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neon-purple/40 bg-neon-purple/10 px-4 text-sm font-semibold text-neon-purple hover:bg-neon-purple/20 disabled:opacity-60"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar com IA
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço (R$)" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (55119...)" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={3} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm focus:border-neon-cyan/60 focus:outline-none" />
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtag1 #hashtag2" className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saveBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {saveBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar produto
          </button>
        </div>
      </form>
    </div>
  );
}
