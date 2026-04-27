import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Monitor, Shield, Zap, Clock, Megaphone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <div className="h-9 w-9 rounded-xl gradient-hero glow flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          ScheduleBoard
        </div>
        <div className="flex gap-3">
          <Link to="/display"><Button variant="ghost">Live Display</Button></Link>
          <Link to="/auth"><Button>Admin Login</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-20 md:py-32 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground mb-8">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          Real-time school timetable system
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Every class. <span className="text-gradient">Every minute.</span><br />
          On every screen.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          A modern digital timetable display for schools. Manage sessions and announcements
          from one dashboard — every hallway screen updates instantly.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/display">
            <Button size="lg" className="gradient-hero glow text-primary-foreground border-0 hover:opacity-90 h-12 px-8">
              <Monitor className="mr-2 h-5 w-5" /> View Live Display
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="h-12 px-8">
              <Shield className="mr-2 h-5 w-5" /> Admin Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: "40-min auto slots", desc: "Sessions from 8:10–17:00. Breaks at 10:10, 12:25 and 15:30 are auto-handled." },
            { icon: Zap, title: "Live updates", desc: "Display screens refresh every 5 seconds — no manual reload, ever." },
            { icon: Megaphone, title: "Image announcements", desc: "Upload posters that cycle in a sidebar slideshow with smooth transitions." },
          ].map((f) => (
            <div key={f.title} className="gradient-card border border-border rounded-2xl p-8 shadow-card-soft hover:shadow-elevated transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container py-10 text-center text-sm text-muted-foreground">
        Built for schools • Runs on any browser kiosk
      </footer>
    </div>
  );
};

export default Index;
