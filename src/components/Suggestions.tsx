import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export function SuggestionButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { tr } = useI18n();
  async function send() {
    if (!message.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.from("suggestions").insert({ user_id: userId, message: message.trim() });
    setBusy(false);
    if (error) { toast.error(tr("تعذّر إرسال الاقتراح")); return; }
    toast.success(tr("تم إرسال الاقتراح")); setMessage(""); setOpen(false);
  }
  return <>
    <Button variant="ghost" size="icon" className="size-10 shrink-0" aria-label={tr("اقتراح")} title={tr("اقتراح")} onClick={() => setOpen(true)}><Lightbulb className="size-5" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{tr("إرسال اقتراح")}</DialogTitle></DialogHeader>
      <Textarea aria-label={tr("الاقتراح")} maxLength={2000} rows={5} value={message} onChange={e => setMessage(e.target.value)} />
      <Button className="h-11" disabled={busy || !message.trim()} onClick={send}>{busy && <Loader2 className="size-4 animate-spin" />}{tr("إرسال")}</Button>
    </DialogContent></Dialog>
  </>;
}

export function SuggestionsPanel() {
  const { tr, lang } = useI18n();
  const qc = useQueryClient();
  const [showStudents, setShowStudents] = useState(false);
  const suggestions = useQuery({ queryKey: ["admin-suggestions"], queryFn: async () => {
    const { data, error } = await supabase.from("suggestions").select("id,message,created_at,user_id,profiles(full_name)").order("created_at", { ascending: false });
    if (error) throw error; return data;
  }});
  const students = useQuery({ queryKey: ["admin-users"], enabled: showStudents, queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_list_users_full");
    if (error) throw error; return data;
  }});
  async function remove(id: string) {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) { toast.error(tr("تعذّر الحذف")); return; }
    qc.invalidateQueries({ queryKey: ["admin-suggestions"] });
  }
  return <section className="space-y-4 pt-3">
    <label className="flex items-center gap-3 text-sm"><Switch checked={showStudents} onCheckedChange={setShowStudents} />{tr("عرض جميع التلاميذ المسجلين")}</label>
    {showStudents && <ul className="divide-y border-y">{students.data?.map(u => <li key={u.id} className="py-3 flex flex-wrap gap-2"><span>{u.full_name || tr("بدون اسم")}</span><span className="text-muted-foreground text-sm" dir="ltr">{u.email}</span>{u.roles.includes("hidden") && <span className="text-primary text-sm">{tr("مخفي")}</span>}</li>)}</ul>}
    {suggestions.isLoading && <Loader2 className="animate-spin size-5" />}
    {suggestions.isError && <p role="alert">{tr("تعذّر تحميل الاقتراحات")}</p>}
    {suggestions.data?.length === 0 && <p className="py-8 text-center text-muted-foreground">{tr("لا توجد اقتراحات بعد.")}</p>}
    <ul className="space-y-3">{suggestions.data?.map(s => <li key={s.id} className="border rounded-lg bg-card p-4 flex gap-3">
      <div className="min-w-0 flex-1"><p className="font-bold">{s.profiles?.full_name || tr("تلميذ")}</p><time className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString(lang)}</time><p className="whitespace-pre-wrap break-words mt-2">{s.message}</p></div>
      <Button variant="ghost" size="icon" aria-label={tr("حذف")} onClick={() => remove(s.id)}><Trash2 className="size-4" /></Button>
    </li>)}</ul>
  </section>;
}