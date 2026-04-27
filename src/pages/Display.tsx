import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSlot, getDayOfWeek, DAY_NAMES, buildDaySlots } from "@/lib/schedule";
import { Coffee, Sun, BookOpen, MapPin, User, Clock, Sparkles } from "lucide-react";

type SessionRow = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_temporary: boolean;
  temporary_date: string | null;
  classes: { name: string };
  subjects: { name: string };
  teachers: { name: string };
  classrooms: { name: string };
};

type Announcement = { id: string; image_url: string; expires_at: string | null };

const POLL_MS = 5000;

const Display = () => {
  const [now, setNow] = useState(new Date());
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annIdx, setAnnIdx] = useState(0);

  const slot = getCurrentSlot(now);
  const dow = getDayOfWeek(now);
  const todayIso = now.toISOString().slice(0, 10);

  // Tick clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll data
  useEffect(() => {
    const fetchAll = async () => {
      const [c, s, a] = await Promise.all([
        supabase.from("classes").select("id,name").order("name"),
        supabase
          .from("timetable_sessions")
          .select("*, classes(name), subjects(name), teachers(name), classrooms(name)")
          .eq("day_of_week", dow),
        supabase
          .from("announcements")
          .select("*")
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order("created_at", { ascending: false }),
      ]);
      if (c.data) setClasses(c.data);
      if (s.data) setSessions(s.data as any);
      if (a.data) setAnnouncements(a.data);
    };
    fetchAll();
    const i = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(i);
  }, [dow]);

  // Slideshow
  useEffect(() => {
    if (announcements.length < 2) return;
    const t = setInterval(() => setAnnIdx((i) => (i + 1) % announcements.length), 6000);
    return () => clearInterval(t);
  }, [announcements.length]);

  const findSessionForClass = (classId: string): SessionRow | null => {
    if (!slot || slot.type !== "session") return null;
    // Prefer temporary override for today, else regular
    const matches = sessions.filter(
      (s) =>
        s.class_id === classId &&
        s.start_time.startsWith(slot.start) &&
        s.end_time.startsWith(slot.end)
    );
    const temp = matches.find((s) => s.is_temporary && s.temporary_date === todayIso);
    if (temp) return temp;
    return matches.find((s) => !s.is_temporary) ?? null;
  };

  const isBreak = slot?.type === "break";
  const todaySlots = buildDaySlots();

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 gradient-card border border-border rounded-2xl px-6 py-4 shadow-card-soft">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl gradient-hero glow flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">School Timetable</h1>
            <p className="text-sm text-muted-foreground">{DAY_NAMES[dow]} • {now.toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl lg:text-5xl font-bold text-gradient tabular-nums">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {slot && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" />
              Period {slot.start}–{slot.end}
            </div>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: timetable */}
        <main>
          {!slot && (
            <BreakBanner icon={<Sun className="h-12 w-12" />} title="Outside school hours" subtitle="Sessions run 08:10 – 17:00" />
          )}
          {isBreak && (
            <BreakBanner
              icon={<Coffee className="h-12 w-12" />}
              title={slot.label!}
              subtitle={`Resumes at ${slot.end}`}
            />
          )}
          {slot?.type === "session" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Current Sessions</h2>
                <span className="text-sm text-muted-foreground">{classes.length} classes</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  const sess = findSessionForClass(cls.id);
                  return <SessionCard key={cls.id} className_={cls.name} session={sess} />;
                })}
                {classes.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-12">
                    No classes configured yet. Admin can add them in the dashboard.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Today's schedule strip */}
          <div className="mt-8 gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3">Today's schedule</h3>
            <div className="flex flex-wrap gap-2">
              {todaySlots.map((s, i) => {
                const active = slot && s.start === slot.start && s.end === slot.end;
                return (
                  <div
                    key={i}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium tabular-nums border transition-all ${
                      active
                        ? "gradient-hero text-primary-foreground border-transparent glow"
                        : s.type === "break"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {s.start}–{s.end} {s.type === "break" ? "☕" : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right: announcements */}
        <aside className="gradient-card border border-border rounded-2xl p-5 shadow-card-soft flex flex-col">
          <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Announcements
          </h3>
          <div className="flex-1 relative rounded-xl overflow-hidden bg-secondary min-h-[400px]">
            {announcements.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center p-6">
                No announcements yet.
              </div>
            ) : (
              announcements.map((a, i) => (
                <img
                  key={a.id}
                  src={a.image_url}
                  alt="Announcement"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    i === annIdx ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))
            )}
          </div>
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {announcements.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === annIdx ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const BreakBanner = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <div className="gradient-card border border-warning/30 rounded-2xl p-12 text-center animate-fade-in shadow-elevated">
    <div className="inline-flex h-20 w-20 rounded-2xl bg-warning/10 text-warning items-center justify-center mb-6">
      {icon}
    </div>
    <h2 className="font-display text-4xl lg:text-5xl font-bold mb-3">{title}</h2>
    <p className="text-lg text-muted-foreground">{subtitle}</p>
  </div>
);

const SessionCard = ({ className_, session }: { className_: string; session: SessionRow | null }) => {
  if (!session) {
    return (
      <div className="gradient-card border border-border rounded-2xl p-5 opacity-60">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Class</div>
        <div className="font-display text-2xl font-bold mb-3">{className_}</div>
        <div className="text-sm text-muted-foreground italic">No session scheduled</div>
      </div>
    );
  }
  return (
    <div className="gradient-card border border-border rounded-2xl p-5 shadow-card-soft hover:shadow-elevated transition-all relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Class</div>
          <div className="font-display text-2xl font-bold">{className_}</div>
        </div>
        {session.is_temporary && (
          <span className="px-2 py-1 rounded-md bg-warning/15 text-warning text-xs font-semibold border border-warning/30">
            TEMPORARY
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-4 w-4 text-primary" />
          {session.subjects.name}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          {session.teachers.name}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {session.classrooms.name}
        </div>
      </div>
    </div>
  );
};

export default Display;
