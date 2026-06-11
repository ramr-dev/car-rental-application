import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Tag,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { offerService } from "@/lib/api/offer.service";
import type { Offer, OfferBadgeColor } from "@/lib/types/offer.types";

export const Route = createFileRoute("/admin/offers")({ component: AdminOffers });

// ─── Zod form schema ──────────────────────────────────────────────────────

const offerFormSchema = z.object({
  title:           z.string().min(2, "Title must be at least 2 characters").max(120),
  description:     z.string().max(500),
  discountPercent: z.coerce.number().min(0.01, "Must be > 0").max(100, "Max 100%"),
  minDays:         z.coerce.number().int().min(1, "Must be at least 1"),
  maxDays:         z.string().optional(), // empty string = no upper limit
  badgeColor:      z.enum(["primary", "success", "warning", "destructive"]),
  isActive:        z.boolean(),
});

type OfferFormVals = z.infer<typeof offerFormSchema>;

const BADGE_MAP: Record<OfferBadgeColor, string> = {
  primary:     "bg-primary/10 text-primary border-primary/30",
  success:     "bg-success/10 text-success border-success/30",
  warning:     "bg-warning/10 text-warning border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function durationLabel(min: number, max: number | null) {
  if (max === null) return `${min}+ days`;
  if (min === max) return `${min} days`;
  return `${min}–${max} days`;
}

// ─── Offer form dialog ────────────────────────────────────────────────────

function OfferFormDialog({
  open,
  onClose,
  defaultValues,
  onSubmit,
  isPending,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  defaultValues?: OfferFormVals;
  onSubmit: (vals: OfferFormVals) => void;
  isPending: boolean;
  mode: "create" | "edit";
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<OfferFormVals>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      discountPercent: 10,
      minDays: 3,
      maxDays: "",
      badgeColor: "primary",
      isActive: true,
    },
  });

  const badgeColor = watch("badgeColor");

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {mode === "create" ? "Add New Offer" : "Edit Offer"}
          </DialogTitle>
          <DialogDescription>
            Configure the discount details and duration requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label>Offer Title *</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Weekly Deal"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1 resize-none"
              rows={2}
              placeholder="Short description shown to customers…"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Discount (%)*</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                className="mt-1"
                {...register("discountPercent")}
              />
              {errors.discountPercent && (
                <p className="mt-1 text-xs text-destructive">{errors.discountPercent.message}</p>
              )}
            </div>

            <div>
              <Label>Min. Days *</Label>
              <Input
                type="number"
                min="1"
                className="mt-1"
                {...register("minDays")}
              />
              {errors.minDays && (
                <p className="mt-1 text-xs text-destructive">{errors.minDays.message}</p>
              )}
            </div>

            <div>
              <Label>Max. Days</Label>
              <Input
                type="number"
                min="1"
                className="mt-1"
                placeholder="No limit"
                {...register("maxDays")}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">Leave blank for no upper limit</p>
            </div>
          </div>

          <div>
            <Label>Badge Color</Label>
            <Select
              value={badgeColor}
              onValueChange={(v) =>
                setValue("badgeColor", v as OfferBadgeColor, { shouldValidate: true })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["primary", "success", "warning", "destructive"] as const).map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="capitalize">{c}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : mode === "create" ? "Create Offer" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

function AdminOffers() {
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: offerService.listAll,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: (vals: OfferFormVals) =>
      offerService.create({
        title:           vals.title,
        description:     vals.description ?? "",
        discountPercent: vals.discountPercent,
        minDays:         vals.minDays,
        maxDays:         vals.maxDays && vals.maxDays !== "" ? Number(vals.maxDays) : null,
        isActive:        vals.isActive,
        badgeColor:      vals.badgeColor,
      }),
    onSuccess: (o) => {
      toast.success(`"${o.title}" offer created.`);
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      setIsAddOpen(false);
    },
    onError: () => toast.error("Failed to create offer. Please try again."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, vals }: { id: number; vals: OfferFormVals }) =>
      offerService.update(id, {
        title:           vals.title,
        description:     vals.description ?? "",
        discountPercent: vals.discountPercent,
        minDays:         vals.minDays,
        maxDays:         vals.maxDays && vals.maxDays !== "" ? Number(vals.maxDays) : null,
        isActive:        vals.isActive,
        badgeColor:      vals.badgeColor,
      }),
    onSuccess: (o) => {
      toast.success(`"${o.title}" updated.`);
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      setEditingOffer(null);
    },
    onError: () => toast.error("Failed to update offer."),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => offerService.toggleActive(id),
    onSuccess: (o) => {
      toast.success(`"${o.title}" ${o.isActive ? "activated" : "deactivated"}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: () => toast.error("Failed to update offer status."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => offerService.delete(id),
    onSuccess: () => {
      toast.success("Offer deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: () => toast.error("Failed to delete offer."),
  });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Offers & Discounts</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage duration-based discount offers shown to customers.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Offer
        </Button>
      </div>

      {/* Table */}
      <Card className="mt-8 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No offers yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first discount offer to display it to customers.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add First Offer
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const color = offer.badgeColor as OfferBadgeColor;
                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.title}</p>
                        {offer.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border font-bold ${BADGE_MAP[color] ?? BADGE_MAP.primary}`}
                      >
                        {offer.discountPercent}% OFF
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {durationLabel(offer.minDays, offer.maxDays)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          offer.isActive
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border text-muted-foreground"
                        }
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={offer.isActive ? "Deactivate" : "Activate"}
                          disabled={toggleMut.isPending}
                          onClick={() => toggleMut.mutate(offer.id)}
                        >
                          {offer.isActive ? (
                            <ToggleRight className="h-4 w-4 text-success" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => setEditingOffer(offer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                          disabled={deleteMut.isPending}
                          onClick={() => deleteMut.mutate(offer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create dialog */}
      <OfferFormDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(vals) => createMut.mutate(vals)}
        isPending={createMut.isPending}
        mode="create"
      />

      {/* Edit dialog */}
      {editingOffer && (
        <OfferFormDialog
          open={!!editingOffer}
          onClose={() => setEditingOffer(null)}
          mode="edit"
          defaultValues={{
            title:           editingOffer.title,
            description:     editingOffer.description,
            discountPercent: editingOffer.discountPercent,
            minDays:         editingOffer.minDays,
            maxDays:         editingOffer.maxDays !== null ? String(editingOffer.maxDays) : "",
            badgeColor:      editingOffer.badgeColor,
            isActive:        editingOffer.isActive,
          }}
          onSubmit={(vals) => updateMut.mutate({ id: editingOffer.id, vals })}
          isPending={updateMut.isPending}
        />
      )}
    </div>
  );
}
