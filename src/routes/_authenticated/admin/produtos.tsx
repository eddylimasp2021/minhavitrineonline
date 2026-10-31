import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ExternalLink,
  Copy,
  Download,
  Terminal,
  Laptop,
  Pencil,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackButton } from "@/components/layout/BackButton";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uniqueSlug } from "@/lib/slug";
import {
  formatBRL,
  PRODUCT_TYPES,
  SOFTWARE_PLATFORMS,
  LICENSE_TYPES,
  isDigitalType,
  defaultCtaLabel,
  generateSoftwareDeliveryMessage,
} from "@/lib/mock-data";

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
  product_type?: string | null;
  external_url?: string | null;
  cta_label?: string | null;
  software_version?: string | null;
  software_platform?: string | null;
  license_type?: string | null;
  demo_url?: string | null;
  download_url?: string | null;
  delivery_instructions?: string | null;
  system_requirements?: string | null;
};

function AdminProducts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(null);

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
      toast.success("Produto excluído com sucesso!");
      setDeletingProduct(null);
      qc.invalidateQueries({ queryKey: ["admin-products", user?.id] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir produto");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ published: !published })
        .eq("id", id);
      if (error) throw error;
      return !published;
    },
    onSuccess: (newStatus) => {
      toast.success(newStatus ? "Produto publicado na vitrine!" : "Produto alterado para rascunho");
      qc.invalidateQueries({ queryKey: ["admin-products", user?.id] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar status");
    },
  });

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <BackButton fallback="/admin" />
          <h1 className="mt-3 font-display text-3xl font-black">Meus Produtos & Softwares</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciamento completo (Criar, Editar, Publicar e Excluir) da sua vitrine de produtos e softwares.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setOpen(true);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta px-5 font-semibold text-background hover:opacity-90 transition-opacity"
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
        {q.data?.map((p) => {
          const isDigital = isDigitalType(p.product_type);
          return (
            <article key={p.id} className="rounded-3xl border border-white/10 glass overflow-hidden flex flex-col justify-between group">
              <div>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-white/5 flex items-center justify-center text-muted-foreground">
                    <Laptop className="h-10 w-10 opacity-40 text-neon-cyan" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-base">{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.category ?? "Geral"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => toggleStatus.mutate({ id: p.id, published: p.published })}
                        disabled={toggleStatus.isPending}
                        title="Clique para alternar entre Publicado e Rascunho"
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                          p.published
                            ? "bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                            : "bg-white/10 text-muted-foreground hover:bg-white/20"
                        }`}
                      >
                        {p.published ? "✓ Publicado" : "• Rascunho"}
                      </button>
                      {isDigital && (
                        <span className="rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-1.5 py-0.5 text-[10px] font-semibold text-neon-cyan">
                          {p.product_type === "software" ? "Software" : p.product_type === "app" ? "App" : "Digital"}
                          {p.software_version ? ` ${p.software_version}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {isDigital && p.software_platform && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Terminal className="h-3 w-3 text-neon-purple" />
                      <span className="truncate">{p.software_platform}</span>
                    </div>
                  )}

                  <p className="mt-2 font-display text-lg text-neon-cyan">{formatBRL(Number(p.price))}</p>
                </div>
              </div>

              <div className="p-4 pt-0">
                {isDigital && (
                  <div className="mb-3">
                    <button
                      onClick={() => {
                        const msg = generateSoftwareDeliveryMessage({
                          title: p.title,
                          slug: p.slug,
                          softwareVersion: p.software_version,
                          softwarePlatform: p.software_platform,
                          licenseType: p.license_type,
                          downloadUrl: p.download_url,
                          demoUrl: p.demo_url,
                          externalUrl: p.external_url,
                          deliveryInstructions: p.delivery_instructions,
                          systemRequirements: p.system_requirements,
                          whatsapp: p.whatsapp,
                        });
                        navigator.clipboard.writeText(msg);
                        toast.success("Kit de Entrega copiado! Cole no WhatsApp do comprador.");
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 py-2 text-xs font-semibold text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                      title="Copiar mensagem com link de download e instruções para enviar ao cliente"
                    >
                      <Download className="h-3.5 w-3.5" /> Copiar Kit de Entrega
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-2.5 py-1 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                    title="Editar informações do produto"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <Link
                    to="/v/$slug"
                    params={{ slug: p.slug }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-neon-cyan/50 text-muted-foreground hover:text-foreground"
                    title="Ver página pública na vitrine"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/v/${p.slug}`);
                      toast.success("Link copiado");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-neon-cyan/50 text-muted-foreground hover:text-foreground"
                    title="Copiar link da vitrine"
                  >
                    <Copy className="h-3 w-3" /> Link
                  </button>
                  <button
                    onClick={() => setDeletingProduct(p)}
                    className="ml-auto rounded-lg border border-white/10 p-1.5 text-neon-magenta hover:border-neon-magenta/50 hover:bg-neon-magenta/10 transition-colors"
                    title="Excluir produto"
                    aria-label="Excluir produto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Modal de Criação / Edição (CRUD) */}
      {open && (
        <ProductForm
          initialProduct={editingProduct}
          onClose={() => {
            setOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-products", user?.id] });
            setOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão (CRUD - Delete) */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-lg"
          onClick={() => setDeletingProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-neon-magenta/30 glass-strong p-6 text-center"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-neon-magenta/10 text-neon-magenta">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">Excluir Produto?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tem certeza que deseja remover <strong>"{deletingProduct.title}"</strong> da vitrine? Esta ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={del.isPending}
                onClick={() => del.mutate(deletingProduct.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-neon-magenta px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {del.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ProductForm({
  initialProduct,
  onClose,
  onSaved,
}: {
  initialProduct?: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const isEditing = !!initialProduct;

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(initialProduct?.image_url ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? (initialProduct?.product_type === "software" ? "Software" : ""));
  const [hashtags, setHashtags] = useState(
    initialProduct?.hashtags?.length
      ? initialProduct.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")
      : ""
  );
  const [price, setPrice] = useState(initialProduct?.price !== undefined ? String(initialProduct.price) : "");
  const [whatsapp, setWhatsapp] = useState(initialProduct?.whatsapp ?? "");
  const [productType, setProductType] = useState(initialProduct?.product_type ?? "software");
  const [externalUrl, setExternalUrl] = useState(initialProduct?.external_url ?? "");
  const [ctaLabel, setCtaLabel] = useState(initialProduct?.cta_label ?? "");
  const [softwareVersion, setSoftwareVersion] = useState(initialProduct?.software_version ?? "v1.0.0");
  const [softwarePlatform, setSoftwarePlatform] = useState<string>(
    initialProduct?.software_platform ?? SOFTWARE_PLATFORMS[0]
  );
  const [licenseType, setLicenseType] = useState(initialProduct?.license_type ?? "vitalicia");
  const [demoUrl, setDemoUrl] = useState(initialProduct?.demo_url ?? "");
  const [downloadUrl, setDownloadUrl] = useState(initialProduct?.download_url ?? "");
  const [deliveryInstructions, setDeliveryInstructions] = useState(initialProduct?.delivery_instructions ?? "");
  const [systemRequirements, setSystemRequirements] = useState(initialProduct?.system_requirements ?? "");
  const [published, setPublished] = useState(initialProduct?.published ?? true);
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
      setCategory(j.category ?? (isDigitalType(productType) ? "Software" : "Geral"));
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
      let image_url: string | null = initialProduct?.image_url ?? null;
      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        image_url = signed?.signedUrl ?? null;
      }

      const slug = initialProduct?.slug || uniqueSlug(title);
      const tags = hashtags
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean);
      const link = externalUrl.trim();
      const isDigital = isDigitalType(productType);

      if (isDigital && link && !/^https?:\/\//i.test(link)) {
        throw new Error("O link de acesso deve começar com https://");
      }
      if (isDigital && downloadUrl.trim() && !/^https?:\/\//i.test(downloadUrl.trim())) {
        throw new Error("O link de download deve começar com https://");
      }
      if (isDigital && demoUrl.trim() && !/^https?:\/\//i.test(demoUrl.trim())) {
        throw new Error("O link de demonstração deve começar com https://");
      }

      const payload = {
        title,
        description,
        category: category || (isDigital ? "Software" : "Geral"),
        hashtags: tags,
        price: Number(price) || 0,
        whatsapp,
        image_url,
        product_type: productType,
        external_url: isDigital && link ? link : null,
        cta_label: isDigital && ctaLabel.trim() ? ctaLabel.trim() : null,
        software_version: isDigital && softwareVersion.trim() ? softwareVersion.trim() : null,
        software_platform: isDigital && softwarePlatform.trim() ? softwarePlatform.trim() : null,
        license_type: isDigital ? licenseType : null,
        demo_url: isDigital && demoUrl.trim() ? demoUrl.trim() : null,
        download_url: isDigital && downloadUrl.trim() ? downloadUrl.trim() : null,
        delivery_instructions: isDigital && deliveryInstructions.trim() ? deliveryInstructions.trim() : null,
        system_requirements: isDigital && systemRequirements.trim() ? systemRequirements.trim() : null,
        published,
      };

      if (isEditing && initialProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initialProduct.id);
        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("products").insert({
          ...payload,
          owner_id: user.id,
          slug,
        });
        if (error) throw error;
        toast.success("Produto criado com sucesso!");
      }

      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaveBusy(false);
    }
  }

  const isDigital = isDigitalType(productType);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-lg" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 glass-strong p-6"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold">
              {isEditing ? "Editar Produto / Software" : "Novo Produto / Software"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEditing
                ? "Atualize as informações, preços, especificações de software ou links de download."
                : "Cadastre seu software, produto digital ou físico com dados completos de demonstração e entrega."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
          <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5 hover:border-neon-cyan/50 transition-colors relative group">
            {imageDataUrl ? (
              <>
                <img src={imageDataUrl} className="h-full w-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-neon-cyan transition-opacity font-medium">
                  Trocar imagem
                </div>
              </>
            ) : (
              <div className="text-center p-3 text-xs text-muted-foreground flex flex-col items-center gap-1">
                <Laptop className="h-6 w-6 opacity-40 text-neon-cyan" />
                <span>Enviar logo ou capa</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>

          <div className="space-y-2">
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Dica para IA (ex.: Sistema de controle de estoque em Delphi/C# para Windows)"
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
              {isEditing ? "Reescrever com IA" : "Gerar detalhes com IA"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do Software / Produto" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria (ex.: Automação, ERP, SaaS)" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço (R$)" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp Vendas (55119...)" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Produto</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status de Publicação</label>
            <select
              value={published ? "true" : "false"}
              onChange={(e) => setPublished(e.target.value === "true")}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none"
            >
              <option value="true" className="bg-background">Publicado na Vitrine</option>
              <option value="false" className="bg-background">Rascunho (Oculto)</option>
            </select>
          </div>
        </div>

        {isDigital && (
          <div className="mt-4 space-y-4 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-4">
            <div className="flex items-center gap-2 text-neon-cyan font-semibold text-sm">
              <Laptop className="h-4 w-4" /> Configurações Técnicas & Entrega do Software
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Plataforma</label>
                <select
                  value={softwarePlatform}
                  onChange={(e) => setSoftwarePlatform(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                >
                  {SOFTWARE_PLATFORMS.map((plat) => (
                    <option key={plat} value={plat} className="bg-background">{plat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Versão</label>
                <input
                  value={softwareVersion}
                  onChange={(e) => setSoftwareVersion(e.target.value)}
                  placeholder="ex.: v2.4.0"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de Licença</label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                >
                  {LICENSE_TYPES.map((lic) => (
                    <option key={lic.id} value={lic.id} className="bg-background">{lic.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Link de Download Oficial / Entrega</label>
                <input
                  type="url"
                  inputMode="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/... ou https://seusite.com/setup.exe"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Link de Demonstração / Teste Online</label>
                <input
                  type="url"
                  inputMode="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://demo.meusoftware.com ou vídeo do Youtube"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Link Externo / Acesso Direto</label>
                <input
                  type="url"
                  inputMode="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Texto do Botão na Vitrine (CTA)</label>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder={defaultCtaLabel(productType)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Requisitos Mínimos do Sistema</label>
              <input
                value={systemRequirements}
                onChange={(e) => setSystemRequirements(e.target.value)}
                placeholder="Ex.: Windows 10/11 (64-bits), 4GB de Memória RAM, 500MB de espaço em disco"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Instruções de Instalação e Ativação (Enviadas no Kit de Entrega)</label>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Ex.: 1. Descompacte o arquivo. 2. Execute o instalador 'Setup.exe' como Administrador. 3. Insira sua chave de licença."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs focus:border-neon-cyan/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição completa das funcionalidades do software" rows={3} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm focus:border-neon-cyan/60 focus:outline-none" />
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#software #automacao #sistema" className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:border-neon-cyan/60 focus:outline-none" />

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
            {isEditing ? "Salvar Alterações" : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
