import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  emoji: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

// Served from public/resume.pdf — toolbar/navpanes hidden for a cleaner
// view-only embed (still viewable/savable via browser dev tools, just not
// front-and-center).
const RESUME_URL = "/resume.pdf#toolbar=0&navpanes=0&scrollbar=0";

const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "About Me", emoji: "👋" },
  { id: "experience", label: "Experience", emoji: "💼" },
  { id: "projects", label: "Projects", emoji: "🚀" },
  { id: "skills", label: "Skills", emoji: "⚡" },
  { id: "education", label: "Education", emoji: "🎓" },
  { id: "contact", label: "Contact", emoji: "✉️" },
];

const TYPEWRITER_PHRASES = [
  "Full-Stack Developer",
  "Laravel Developer",
  "CS Student",
  "Deep Learning Enthusiast",
];

const EXPERIENCE = [
  {
    company: "MYT SoftDev Solutions",
    role: "Software Engineer Intern",
    dates: "2026",
    accent: "magenta",
    description:
      "Developed backend features for a full-stack logistics ERP (CodeIgniter 4 + React) serving a trucking business, including contract route management modules. Designed and documented the database layer, authoring an ERD and a full data dictionary covering 23 tables, and managed schema migrations and database export/import workflows across local and shared hosting environments.",
  },
];

const EDUCATION = [
  {
    company: "University of the Philippines Tacloban College",
    role: "BS Computer Science",
    dates: "2023 – Present",
    accent: "magenta",
    description:
      "DOST-SEI Scholar. Relevant coursework: Data Structures and Algorithms, Machine Learning, Artificial Intelligence, Computer Vision, Software Engineering, Linear Algebra, Probability and Statistics, Research in Computer Science.",
  },
  {
    company: "Philippine Science High School",
    role: "High School",
    dates: "2017 – 2023",
    accent: "cyan",
    description:
      "Relevant coursework: Computer Science, Calculus, Statistics, Physics, Research I–III, Capstone Research Project.",
  },
];

// github links point at the profile by default — replace with per-repo URLs
// (https://github.com/giangelo19/REPO_NAME) once you have them.
const PROJECTS = [
  {
    title: "MantaNet",
    description:
      "Undergraduate thesis. A CNN-based multi-task framework that jointly performs object detection and semantic segmentation on deep-sea imagery using a multicolor space input representation. Built a shared backbone with dual task-specific heads and demonstrated measurable gains over single-task baselines.",
    tags: ["PyTorch", "Computer Vision", "Deep Learning"],
    github: "https://github.com/giangelo19",
    demo: null,
    icon: "🐙",
    imgAlt: "Deep-sea detection thesis",
  },
  {
    title: "Hilongos Service Management System (HL-SMS)",
    description:
      "React-based web portal for the Municipality of Hilongos covering resident-facing service booking and internal staff workflows across 12 municipal offices. Designed a no-account, multi-step booking flow with reference-code tracking and a typo-tolerant fuzzy search engine.",
    tags: ["React 19", "Vite", "Tailwind CSS", "React Router", "TanStack Query"],
    github: "https://github.com/giangelo19",
    demo: null,
    icon: "🏛️",
    imgAlt: "Municipal service management portal",
  },
  {
    title: "General Laboratory Item Management System",
    description:
      "Java-based desktop application for managing laboratory equipment and materials at UP Tacloban. Streamlined inventory tracking across multiple lab departments with a database architecture for equipment categorization and availability monitoring.",
    tags: ["Java", "Desktop App", "Database Design"],
    github: "https://github.com/giangelo19",
    demo: null,
    icon: "🔬",
    imgAlt: "Laboratory item management system",
  },
  {
    title: "CoachTzy",
    description:
      "Full-stack web app for competitive team management with draft simulation and performance analytics. Implemented secure authentication, a responsive multi-page dashboard, and a database architecture for players, teams, and match data.",
    tags: ["Supabase", "JavaScript", "Full-Stack"],
    github: "https://github.com/giangelo19",
    demo: null,
    icon: "🏆",
    imgAlt: "Team management and analytics",
  },
  {
    title: "Snek n Laderz",
    description:
      "Java-based desktop board game with custom graphics rendering and interactive gameplay. Architected a scalable multi-player framework with animated movement, custom board rendering, dice mechanics, and win detection logic.",
    tags: ["Java Swing", "OOP", "Multithreading"],
    github: "https://github.com/giangelo19",
    demo: null,
    icon: "🐍",
    imgAlt: "Snakes and ladders desktop game",
  },
];

const SKILLS = [
  {
    group: "Languages & Frameworks",
    items: ["PHP", "Laravel", "JavaScript", "React", "Python", "MySQL", "Tailwind CSS", "Vite"],
  },
  {
    group: "ML / Data",
    items: ["PyTorch"],
  },
  {
    group: "Tools",
    items: ["Git", "GitHub", "VS Code", "XAMPP", "Postman"],
  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useTypewriter(phrases: string[], speed = 80, pause = 1800) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx));
        setCharIdx((i) => i + 1);
        if (charIdx === current.length) {
          timeout = setTimeout(() => setDeleting(true), pause);
        }
      }, speed);
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx));
        setCharIdx((i) => i - 1);
        if (charIdx === 0) {
          setDeleting(false);
          setPhraseIdx((i) => (i + 1) % phrases.length);
        }
      }, speed / 2);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return displayed;
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState("about");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);

  return active;
}

function useFadeIn(ref: React.RefObject<Element | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("section-visible");
          el.classList.remove("section-hidden");
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GradientButton({
  children,
  href = "#",
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-base transition-transform hover:scale-105 active:scale-95"
      style={{ background: "linear-gradient(90deg, #d946ef, #8b5cf6, #22d3ee)", fontFamily: "var(--font-display)" }}
    >
      {children}
    </a>
  );
}

const CONTACT_EMAIL = "tongzongian@gmail.com";
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`;

// Get a free access key at https://web3forms.com/ (enter tongzongian@gmail.com
// as the recipient) and paste it here — submissions land straight in that inbox.
const WEB3FORMS_ACCESS_KEY = "b81a22e4-165c-4a92-8f12-b1fe9fc540ef";

type SendState = "idle" | "sending" | "success" | "error";

function ContactForm() {
  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SendState>("idle");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "white",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    outline: "none",
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: subject.trim() || "New message from portfolio site",
          message: message.trim(),
          email: fromEmail.trim(),
          to: CONTACT_EMAIL,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setFromEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSend} className="flex flex-col gap-4 text-left mb-8">
      <input
        type="email"
        placeholder="Your email"
        value={fromEmail}
        onChange={(e) => setFromEmail(e.target.value)}
        required
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        required
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-bold text-white text-base transition-transform hover:scale-105 active:scale-95 self-center"
        style={{
          background: "linear-gradient(90deg, #d946ef, #8b5cf6, #22d3ee)",
          fontFamily: "var(--font-display)",
          border: "none",
          cursor: status === "sending" ? "wait" : "pointer",
          opacity: status === "sending" ? 0.7 : 1,
        }}
      >
        {status === "sending" ? "Sending…" : "Send an Email →"}
      </button>
      {status === "success" && (
        <p className="text-sm text-center" style={{ color: "#22d3ee" }}>
          Message sent — thanks for reaching out!
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-center" style={{ color: "#d946ef" }}>
          Something went wrong. Please email {CONTACT_EMAIL} directly.
        </p>
      )}
    </form>
  );
}

function AmbientGlows() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div
        style={{
          position: "absolute", top: "-20%", left: "-15%",
          width: "60vw", height: "60vw",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "-20%", right: "-15%",
          width: "60vw", height: "60vw",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute", top: "40%", right: "-10%",
          width: "40vw", height: "40vw",
          background: "radial-gradient(ellipse, rgba(217,70,239,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

function ResumePage({ onBack }: { onBack: (e?: React.MouseEvent) => void }) {
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <AmbientGlows />

      {/* ── Navbar (matches main page) ── */}
      <nav
        style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, width: "min(1100px, 95vw)",
        }}
      >
        <div
          style={{
            background: "rgba(13,13,13,0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "9999px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            onClick={onBack}
            className="flex items-center gap-2 transition-colors hover:text-white"
            style={{ color: "#94a3b8", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600 }}
          >
            <div
              style={{
                width: 32, height: 32,
                background: "linear-gradient(135deg, #d946ef, #22d3ee)",
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13, color: "white",
              }}
            >
              GG
            </div>
            ← Back to Portfolio
          </a>
          <span
            className="px-3 py-1 rounded-full"
            style={{ background: "rgba(217,70,239,0.15)", color: "#d946ef", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)" }}
          >
            View only
          </span>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 900, padding: "24px 16px", paddingTop: 96 }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{
              borderRadius: 16, overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--card)",
              height: "calc(100vh - 140px)",
            }}
          >
            <iframe
              src={RESUME_URL}
              title="Resume"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-4xl md:text-5xl font-black text-center text-white mb-16"
      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
    >
      {children}
    </h2>
  );
}

function ExperienceCard({
  company,
  role,
  dates,
  accent,
  description,
}: (typeof EXPERIENCE)[0]) {
  const isM = accent === "magenta";
  const barColor = isM ? "#d946ef" : "#22d3ee";
  const subtitleColor = isM ? "#d946ef" : "#22d3ee";

  return (
    <div
      className="flex rounded-2xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="w-1 flex-shrink-0" style={{ background: barColor }} />
      <div className="p-6 flex-1">
        <h3
          className="text-xl font-bold text-white text-center mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {company}
        </h3>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="font-semibold text-sm" style={{ color: subtitleColor }}>
            {role}
          </span>
          <span
            className="text-xs italic px-3 py-1 rounded-full"
            style={{ background: "#1e1e1e", color: "#94a3b8", border: "1px solid var(--border)" }}
          >
            {dates}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[0] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="relative overflow-hidden h-44 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.12), rgba(34,211,238,0.12))" }}
      >
        <span style={{ fontSize: 56, lineHeight: 1 }} role="img" aria-label={project.imgAlt}>
          {project.icon}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="text-lg font-bold text-white mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {project.title}
        </h3>
        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#94a3b8" }}>
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: "#1e1e1e",
                color: "#22d3ee",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={project.github}
            className="text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:bg-white/10"
            style={{ border: "1px solid var(--border)", color: "#f1f5f9" }}
          >
            GitHub ↗
          </a>
          {project.demo && (
            <a
              href={project.demo}
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: "linear-gradient(90deg,#d946ef,#22d3ee)", color: "white" }}
            >
              Live Demo ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillTile({ label }: { label: string }) {
  return (
    <div
      className="px-4 py-2 rounded-xl text-sm font-semibold text-white text-center cursor-default transition-all duration-200 hover:scale-105"
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "var(--font-display)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 0 16px 2px rgba(217,70,239,0.35), 0 0 32px 4px rgba(34,211,238,0.15)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(217,70,239,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {label}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function FadeSection({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useFadeIn(ref as React.RefObject<Element>);

  return (
    <section
      id={id}
      ref={ref}
      className={`section-hidden ${className}`}
    >
      {children}
    </section>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const typewriter = useTypewriter(TYPEWRITER_PHRASES);
  const active = useActiveSection(NAV_ITEMS.map((n) => n.id));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [page, setPage] = useState<"home" | "resume">(() =>
    typeof window !== "undefined" && window.location.pathname === "/resume" ? "resume" : "home"
  );

  useEffect(() => {
    const onPopState = () => {
      setPage(window.location.pathname === "/resume" ? "resume" : "home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const goToResume = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", "/resume");
    setPage("resume");
    window.scrollTo(0, 0);
  };

  const goHome = (e?: React.MouseEvent) => {
    e?.preventDefault();
    window.history.pushState({}, "", "/");
    setPage("home");
    window.scrollTo(0, 0);
  };

  if (page === "resume") {
    return <ResumePage onBack={goHome} />;
  }

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <AmbientGlows />

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, width: "min(1100px, 95vw)",
        }}
      >
        <div
          style={{
            background: scrolled ? "rgba(13,13,13,0.9)" : "rgba(20,20,20,0.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "9999px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "background 0.3s",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32, height: 32,
                background: "linear-gradient(135deg, #d946ef, #22d3ee)",
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13, color: "white",
              }}
            >
              GG
            </div>
            <span
              style={{ color: "#94a3b8", fontSize: 13, fontFamily: "var(--font-body)" }}
            >
              @giangelo19
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s",
                  background: active === item.id ? "rgba(217,70,239,0.15)" : "transparent",
                  color: active === item.id ? "#d946ef" : "#94a3b8",
                }}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block", width: 20, height: 2,
                  background: "#94a3b8", borderRadius: 2,
                  transition: "all 0.2s",
                  transform:
                    menuOpen
                      ? i === 0
                        ? "rotate(45deg) translate(3px, 3px)"
                        : i === 2
                          ? "rotate(-45deg) translate(3px, -3px)"
                          : "scale(0)"
                      : "none",
                }}
              />
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              marginTop: 8,
              background: "rgba(20,20,20,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                  border: "none",
                  textAlign: "left",
                  background: active === item.id ? "rgba(217,70,239,0.15)" : "transparent",
                  color: active === item.id ? "#d946ef" : "#94a3b8",
                  transition: "all 0.2s",
                }}
              >
                <span className="mr-2">{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Hero ── */}
        <section
          className="min-h-screen flex flex-col items-center justify-center text-center px-4"
          style={{ paddingTop: 96 }}
        >
          <p
            className="text-base mb-3"
            style={{ color: "#94a3b8", fontFamily: "var(--font-body)" }}
          >
            Hi! My name is
          </p>
          <h1
            className="gradient-text font-black mb-4"
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-display)",
              paddingBottom: "0.05em",
            }}
          >
            Gian Angelo Tongzon
          </h1>
          <div
            className="text-xl md:text-2xl font-bold text-white mb-8 h-9 flex items-center justify-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {typewriter}
            <span className="cursor-blink ml-0.5" style={{ color: "#d946ef" }}>|</span>
          </div>
          <GradientButton href="/resume" onClick={goToResume}>View Resume →</GradientButton>
          {/* Social icons */}
          <div className="flex items-center gap-5 mt-8">
            {[
              { label: "GitHub", href: "https://github.com/giangelo19", icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              ) },
              { label: "LinkedIn", href: "https://linkedin.com/in/gian-angelo-tongzon-7b18562b2", icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              ) },
              { label: "Email", href: GMAIL_COMPOSE_URL, icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-.883.53-1.659 1.348-1.977L12 9.184 22.652 3.48C23.47 3.798 24 4.574 24 5.457z"/></svg>
              ) },
            ].map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition-colors hover:text-white"
                style={{ color: "#94a3b8" }}
              >
                {icon}
              </a>
            ))}
          </div>
        </section>

        {/* ── About Me ── */}
        <FadeSection id="about" className="py-28 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>👋 About Me</SectionHeading>
            <div
              className="rounded-2xl p-8 md:p-10"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: "#cbd5e1", fontFamily: "var(--font-body)" }}
              >
                I'm a fourth-year BS Computer Science student at the{" "}
                <span style={{ color: "#22d3ee", fontWeight: 600 }}>
                  University of the Philippines Tacloban College
                </span>
                , based in the Philippines. I work part-time as a full-stack web developer, mostly
                building{" "}
                <span style={{ color: "#d946ef", fontWeight: 600 }}>
                  Laravel and PHP applications
                </span>{" "}
                with MySQL, JavaScript, and Tailwind CSS. I'm also working on a{" "}
                <span style={{ color: "#8b5cf6", fontWeight: 600 }}>
                  computer vision thesis
                </span>{" "}
                using PyTorch.
              </p>
            </div>
          </div>
        </FadeSection>

        {/* ── Experience ── */}
        <FadeSection id="experience" className="py-28 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>💼 Experience</SectionHeading>
            <div className="flex flex-col gap-5">
              {EXPERIENCE.map((exp) => (
                <ExperienceCard key={exp.company} {...exp} />
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Projects ── */}
        <FadeSection id="projects" className="py-28 px-4">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SectionHeading>🚀 Projects</SectionHeading>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {PROJECTS.map((p) => (
                <ProjectCard key={p.title} project={p} />
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Skills ── */}
        <FadeSection id="skills" className="py-28 px-4">
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SectionHeading>⚡ Skills</SectionHeading>
            <div className="flex flex-col gap-10">
              {SKILLS.map((group) => (
                <div key={group.group}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}
                  >
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.items.map((item) => (
                      <SkillTile key={item} label={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Education ── */}
        <FadeSection id="education" className="py-28 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>🎓 Education</SectionHeading>
            <div className="flex flex-col gap-5">
              {EDUCATION.map((edu) => (
                <ExperienceCard key={edu.company} {...edu} />
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Contact ── */}
        <FadeSection id="contact" className="py-28 px-4">
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <SectionHeading>✉️ Contact</SectionHeading>
            <p className="text-base mb-8" style={{ color: "#94a3b8", fontFamily: "var(--font-body)" }}>
              Have a project in mind or just want to say hi? My inbox is open.
            </p>
            <ContactForm />
            <div className="flex items-center justify-center gap-5 mt-8">
              <a href="https://github.com/giangelo19" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold transition-colors hover:text-white" style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}>
                GitHub
              </a>
              <span style={{ color: "#333" }}>·</span>
              <a href="https://linkedin.com/in/gian-angelo-tongzon-7b18562b2" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold transition-colors hover:text-white" style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}>
                LinkedIn
              </a>
              <span style={{ color: "#333" }}>·</span>
              <a href={GMAIL_COMPOSE_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold transition-colors hover:text-white" style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}>
                Email
              </a>
            </div>
          </div>
        </FadeSection>

        {/* ── Footer ── */}
        <footer
          className="py-10 px-4 text-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-sm mb-3"
            style={{ color: "#555", fontFamily: "var(--font-display)" }}
          >
            <span className="gradient-text font-bold">Gian Angelo Tongzon</span>
            {"  "}·{"  "}© {new Date().getFullYear()}
          </p>
          <div className="flex items-center justify-center gap-4">
            {[
              { label: "GitHub", href: "https://github.com/giangelo19" },
              { label: "LinkedIn", href: "https://linkedin.com/in/gian-angelo-tongzon-7b18562b2" },
              { label: "Email", href: GMAIL_COMPOSE_URL },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-white"
                style={{ color: "#555", fontFamily: "var(--font-display)" }}
              >
                {label}
              </a>
            ))}
          </div>
        </footer>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95"
          style={{
            width: 48, height: 48,
            background: "linear-gradient(135deg, #d946ef, #8b5cf6)",
            boxShadow: "0 0 20px rgba(217,70,239,0.4)",
            border: "none", cursor: "pointer",
          }}
          aria-label="Scroll to top"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}
