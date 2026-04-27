import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, LogOut, Calendar, Monitor, Loader2, Upload } from "lucide-react";
import { buildDaySlots, DAY_NAMES } from "@/lib/schedule";

type Ref = { id: string; name: string };

const Admin = () => {
  const { session, isAdmin, loading } = useAuth();
  const [classes, setClasses] = useState<Ref[]>([]);
  const [teachers, setTeachers] = useState<Ref[]>([]);
  const [subjects, setSubjects] = useState<Ref[]>([]);
  const [classrooms, setClassrooms] = useState<Ref[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const refresh = async () => {
    const [c, t, su, cr, se, an] = await Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("teachers").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("classrooms").select("*").order("name"),
      supabase.from("timetable_sessions").select("*, classes(name), subjects(name), teachers(name), classrooms(name)").order("day_of_week").order("start_time"),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    ]);
    if (c.data) setClasses(c.data);
    if (t.data) setTeachers(t.data);
    if (su.data) setSubjects(su.data);
    if (cr.data) setClassrooms(cr.data);
    if (se.data) setSessions(se.data);
    if (an.data) setAnnouncements(an.data);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (!isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center container">
        <div className="gradient-card border border-border rounded-2xl p-8 text-center max-w-md">
          <h1 className="font-display text-2xl font-bold mb-2">Not authorized</h1>
          <p className="text-muted-foreground mb-6">Your account is signed in but does not have admin access.</p>
          <Button onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen container py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl gradient-hero glow flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/display"><Button variant="outline"><Monitor className="mr-2 h-4 w-4" />Open Display</Button></Link>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </div>
      </header>

      <Tabs defaultValue="sessions">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <SessionManager
            classes={classes} teachers={teachers} subjects={subjects} classrooms={classrooms}
            sessions={sessions} onChange={refresh}
          />
        </TabsContent>
        <TabsContent value="classes"><RefManager table="classes" items={classes} onChange={refresh} placeholder="e.g. Senior 1A" /></TabsContent>
        <TabsContent value="teachers"><RefManager table="teachers" items={teachers} onChange={refresh} placeholder="e.g. Ms. Uwase" /></TabsContent>
        <TabsContent value="subjects"><RefManager table="subjects" items={subjects} onChange={refresh} placeholder="e.g. Mathematics" /></TabsContent>
        <TabsContent value="classrooms"><RefManager table="classrooms" items={classrooms} onChange={refresh} placeholder="e.g. Room 12" /></TabsContent>
        <TabsContent value="announcements"><AnnouncementManager items={announcements} onChange={refresh} /></TabsContent>
      </Tabs>
    </div>
  );
};

const RefManager = ({ table, items, onChange, placeholder }: { table: "classes"|"teachers"|"subjects"|"classrooms"; items: Ref[]; onChange: () => void; placeholder: string }) => {
  const [name, setName] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from(table).insert({ name: name.trim() });
    if (error) return toast.error(error.message);
    toast.success("Added");
    setName(""); onChange();
  };
  const del = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };
  return (
    <div className="gradient-card border border-border rounded-2xl p-6">
      <div className="flex gap-2 mb-6">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-2.5">
            <span>{it.name}</span>
            <Button size="sm" variant="ghost" onClick={() => del(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nothing here yet.</p>}
      </div>
    </div>
  );
};

const SessionManager = ({ classes, teachers, subjects, classrooms, sessions, onChange }: any) => {
  const slots = buildDaySlots().filter((s) => s.type === "session");
  const [form, setForm] = useState({
    class_id: "", subject_id: "", teacher_id: "", classroom_id: "",
    day_of_week: "1", slotIdx: "0", is_temporary: false, temporary_date: "",
  });

  const submit = async () => {
    const slot = slots[Number(form.slotIdx)];
    if (!form.class_id || !form.subject_id || !form.teacher_id || !form.classroom_id) {
      return toast.error("Fill all fields");
    }
    if (form.is_temporary && !form.temporary_date) return toast.error("Pick a date for temporary session");
    const { error } = await supabase.from("timetable_sessions").insert({
      class_id: form.class_id, subject_id: form.subject_id, teacher_id: form.teacher_id, classroom_id: form.classroom_id,
      day_of_week: Number(form.day_of_week),
      start_time: slot.start + ":00", end_time: slot.end + ":00",
      is_temporary: form.is_temporary,
      temporary_date: form.is_temporary ? form.temporary_date : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Session created");
    onChange();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("timetable_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  if (classes.length === 0 || subjects.length === 0 || teachers.length === 0 || classrooms.length === 0) {
    return (
      <div className="gradient-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Add at least one class, subject, teacher, and classroom first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="gradient-card border border-border rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-4">Create session</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <PickField label="Class" value={form.class_id} onChange={(v) => setForm({ ...form, class_id: v })} options={classes} />
          <PickField label="Subject" value={form.subject_id} onChange={(v) => setForm({ ...form, subject_id: v })} options={subjects} />
          <PickField label="Teacher" value={form.teacher_id} onChange={(v) => setForm({ ...form, teacher_id: v })} options={teachers} />
          <PickField label="Classroom" value={form.classroom_id} onChange={(v) => setForm({ ...form, classroom_id: v })} options={classrooms} />
          <div>
            <Label>Day</Label>
            <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7].map((d) => <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time slot (40 min)</Label>
            <Select value={form.slotIdx} onValueChange={(v) => setForm({ ...form, slotIdx: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {slots.map((s, i) => <SelectItem key={i} value={String(i)}>P{s.index} • {s.start}–{s.end}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Switch checked={form.is_temporary} onCheckedChange={(v) => setForm({ ...form, is_temporary: v })} id="temp" />
          <Label htmlFor="temp">Temporary (one day only)</Label>
          {form.is_temporary && (
            <Input type="date" className="w-auto" value={form.temporary_date} onChange={(e) => setForm({ ...form, temporary_date: e.target.value })} />
          )}
        </div>
        <Button onClick={submit} className="gradient-hero text-primary-foreground border-0"><Plus className="h-4 w-4 mr-1" />Add session</Button>
      </div>

      <div className="gradient-card border border-border rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-4">All sessions ({sessions.length})</h3>
        <div className="space-y-2">
          {sessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold">{DAY_NAMES[s.day_of_week]}</span>
                <span className="tabular-nums text-muted-foreground">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                <span>•</span>
                <span className="font-semibold">{s.classes.name}</span>
                <span>{s.subjects.name}</span>
                <span className="text-muted-foreground">{s.teachers.name}</span>
                <span className="text-muted-foreground">{s.classrooms.name}</span>
                {s.is_temporary && <span className="px-2 py-0.5 rounded bg-warning/15 text-warning text-xs">TEMP {s.temporary_date}</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No sessions yet.</p>}
        </div>
      </div>
    </div>
  );
};

const PickField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Ref[] }) => (
  <div>
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

const AnnouncementManager = ({ items, onChange }: any) => {
  const [uploading, setUploading] = useState(false);
  const [expires, setExpires] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("announcements").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("announcements").getPublicUrl(path);
    const { error } = await supabase.from("announcements").insert({
      image_url: pub.publicUrl, storage_path: path,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Announcement uploaded");
    setExpires(""); onChange();
  };

  const del = async (id: string, path: string | null) => {
    if (path) await supabase.storage.from("announcements").remove([path]);
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="gradient-card border border-border rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-4">Upload announcement</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <Label>Image file</Label>
            <Input type="file" accept="image/*" disabled={uploading}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
          <div>
            <Label>Expires (optional)</Label>
            <Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((a: any) => (
          <div key={a.id} className="gradient-card border border-border rounded-2xl overflow-hidden group relative">
            <img src={a.image_url} alt="" className="w-full h-48 object-cover" />
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {a.expires_at ? `Expires ${new Date(a.expires_at).toLocaleDateString()}` : "No expiry"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => del(a.id, a.storage_path)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-6">No announcements yet.</p>}
      </div>
    </div>
  );
};

export default Admin;
