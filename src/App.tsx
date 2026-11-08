import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

// Served from public/resume.pdf — toolbar/navpanes hidden for a cleaner
// view-only embed (still viewable/savable via browser dev tools, just not
// front-and-center).
const RESUME_URL = "/resume.pdf#toolbar=0&navpanes=0&scrollbar=0";

const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

// Built once. Passing `NAV_ITEMS.map(...)` inline makes a new array every
// render, which re-subscribes every observer that depends on it.
const SECTION_IDS = NAV_ITEMS.map((n) => n.id);

// A section becomes current once its top crosses this line, as a fraction of
// the viewport height. The nav highlight and the sounding-line ticks both use
// it, so a tick lights at the same moment its nav item does.
const ACTIVE_LINE = 0.35;

// `figures` lists exact substrings of `description` that get set in mono and
// carry the accent — the one place colour is allowed outside the sounding line.
const EXPERIENCE = [
  {
    company: "MYT SoftDev Solutions",
    role: "Software Engineer Intern",
    dates: "2026",
    figures: ["23 tables"],
    description:
      "Developed backend features for a full-stack logistics ERP (CodeIgniter 4 + React) serving a trucking business, including contract route management modules. Designed and documented the database layer, authoring an ERD and a full data dictionary covering 23 tables, and managed schema migrations and database export/import workflows across local and shared hosting environments.",
  },
];

const EDUCATION = [
  {
    company: "University of the Philippines Tacloban College",
    role: "BS Computer Science",
    dates: "2023 – Present",
    figures: ["DOST-SEI Scholar"],
    description:
      "DOST-SEI Scholar. Relevant coursework: Data Structures and Algorithms, Machine Learning, Artificial Intelligence, Computer Vision, Software Engineering, Linear Algebra, Probability and Statistics, Research in Computer Science.",
  },
  {
    company: "Philippine Science High School",
    role: "High School",
    dates: "2017 – 2023",
    figures: [],
    description:
      "Relevant coursework: Computer Science, Calculus, Statistics, Physics, Research I–III, Capstone Research Project.",
  },
];

// The GitHub links point at the profile, not per-project repos — the label says
// so. Replace with https://github.com/giangelo19/REPO_NAME and relabel once the
// repositories are public.
const PROJECTS = [
  {
    title: "MantaNet",
    description:
      "Undergraduate thesis. A CNN-based multi-task framework that jointly performs object detection and semantic segmentation on deep-sea imagery using a multicolor space input representation. Built a shared backbone with dual task-specific heads and demonstrated measurable gains over single-task baselines.",
    figures: [],
    tags: ["PyTorch", "Computer Vision", "Deep Learning"],
    github: "https://github.com/giangelo19",
    demo: null,
  },
  {
    title: "Hilongos Service Management System (HL-SMS)",
    description:
      "React-based web portal for the Municipality of Hilongos covering resident-facing service booking and internal staff workflows across 12 municipal offices. Designed a no-account, multi-step booking flow with reference-code tracking and a typo-tolerant fuzzy search engine.",
    figures: ["12 municipal offices"],
    tags: ["React 19", "Vite", "Tailwind CSS", "React Router", "TanStack Query"],
    github: "https://github.com/giangelo19",
    demo: null,
  },
  {
    title: "General Laboratory Item Management System",
    description:
      "Java-based desktop application for managing laboratory equipment and materials at UP Tacloban. Streamlined inventory tracking across multiple lab departments with a database architecture for equipment categorization and availability monitoring.",
    figures: [],
    tags: ["Java", "Desktop App", "Database Design"],
    github: "https://github.com/giangelo19",
    demo: null,
  },
  {
    title: "CoachTzy",
    description:
      "Full-stack web app for competitive team management with draft simulation and performance analytics. Implemented secure authentication, a responsive multi-page dashboard, and a database architecture for players, teams, and match data.",
    figures: [],
    tags: ["Supabase", "JavaScript", "Full-Stack"],
    github: "https://github.com/giangelo19",
    demo: null,
  },
  {
    title: "Snek n Laderz",
    description:
      "Java-based desktop board game with custom graphics rendering and interactive gameplay. Architected a scalable multi-player framework with animated movement, custom board rendering, dice mechanics, and win detection logic.",
    figures: [],
    tags: ["Java Swing", "OOP", "Multithreading"],
    github: "https://github.com/giangelo19",
    demo: null,
  },
];

const SKILLS = [
  {
    group: "Languages and frameworks",
    items: ["PHP", "Laravel", "JavaScript", "React", "Python", "MySQL", "Tailwind CSS", "Vite"],
  },
  {
    group: "ML and data",
    items: ["PyTorch"],
  },
  {
    group: "Tools",
    items: ["Git", "GitHub", "VS Code", "XAMPP", "Postman"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

/** Splits `text` on each entry in `figures` and sets those runs in mono accent. */
function withFigures(text: string, figures: string[]) {
  if (figures.length === 0) return text;

  let parts: (string | { figure: string })[] = [text];

  for (const figure of figures) {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part];
      const segments = part.split(figure);
      if (segments.length === 1) return [part];
      return segments.flatMap((segment, i) =>
        i === 0 ? [segment] : [{ figure }, segment]
      );
    });
  }

  return parts.map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <span key={i} className="figure">
        {part.figure}
      </span>
    )
  );
}

/** Position in a staggered reveal. Read by `.reveal` in index.css. */
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Small seeded PRNG (mulberry32), so the contour chart is the same every load. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Nested depth contours around one seamount, as SVG path strings.
 *
 * Every ring shares the same low-frequency wobble, plus a second wobble whose
 * strength grows with distance from the peak — so outer contours read rougher,
 * as real terrain does. Both wobbles are bounded so a ring's radius always grows
 * with its index: contours never cross, as on a real survey chart.
 */
function buildContours() {
  const random = seededRandom(19);
  const harmonics = (count: number, amp: number) =>
    Array.from({ length: count }, (_, k) => ({
      freq: k + 2,
      amp: (amp * random()) / (k + 1),
      phase: random() * Math.PI * 2,
    }));

  const base = harmonics(3, 0.12);
  const rough = harmonics(4, 0.12);
  const wobble = (hs: typeof base, angle: number) =>
    hs.reduce((sum, h) => sum + h.amp * Math.sin(h.freq * angle + h.phase), 0);

  const cx = 1150;
  const cy = 470;
  const rMin = 36;
  const rMax = 900;
  const step = 30;
  const points = 64;

  const rings: string[] = [];
  for (let r = rMin; r <= rMax; r += step) {
    const pts: [number, number][] = [];
    for (let k = 0; k < points; k++) {
      const a = (k / points) * Math.PI * 2;
      const rr = r * (1 + wobble(base, a) + (r / rMax) * wobble(rough, a));
      // Flattened vertically so the chart sits wide across the hero.
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.62]);
    }

    // Closed Catmull-Rom spline through the points, as cubic Béziers.
    const at = (k: number) => pts[(k + points) % points];
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let k = 0; k < points; k++) {
      const [p0, p1, p2, p3] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    rings.push(`${d}Z`);
  }
  return rings;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * The section the reader is in: the last one whose top has crossed
 * ACTIVE_LINE. Null on the hero, before any section has arrived.
 *
 * One measurement per frame, in document order, so exactly one section is
 * current at a time — rather than six observers racing, where whichever fired
 * last won and nothing ever cleared.
 */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }

      // The last section can be too short to ever reach the line. Once the
      // page can't scroll further, it is the one being read.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && ids.length > 0) current = ids[ids.length - 1];

      setActive((prev) => (prev === current ? prev : current));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
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

/**
 * Signature detail: a sounding line down the left edge. The fill tracks reading
 * progress, so the page reads as finite, and a tick marks each section, lighting
 * once you reach it. Desktop only — there is no room for it beside phone content.
 *
 * It owns its scroll listener so the rest of the page never re-renders on
 * scroll: the fill moves by writing `transform` directly, and the component
 * itself only re-renders when a tick changes state.
 */
function SoundingLine({ sectionIds }: { sectionIds: string[] }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<number[]>([]);
  const [ticks, setTicks] = useState<number[]>([]);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    let frame = 0;

    const scrollable = () => document.documentElement.scrollHeight - window.innerHeight;

    // A section's tick sits at the progress where its top crosses ACTIVE_LINE —
    // the same moment useActiveSection makes it current.
    const measure = () => {
      const max = scrollable();
      const next =
        max <= 0
          ? []
          : sectionIds
              .map((id) => document.getElementById(id))
              .filter((el): el is HTMLElement => el !== null)
              .map((el) => {
                const top = el.getBoundingClientRect().top + window.scrollY;
                return Math.min(1, Math.max(0, (top - window.innerHeight * ACTIVE_LINE) / max));
              });
      ticksRef.current = next;
      setTicks(next);
    };

    const update = () => {
      frame = 0;
      const max = scrollable();
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      const count = ticksRef.current.filter((t) => progress >= t).length;
      setLit((prev) => (prev === count ? prev : count));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Re-measure whenever layout shifts — web fonts landing, the window resizing.
    const resize = new ResizeObserver(() => {
      measure();
      update();
    });
    resize.observe(document.body);

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      resize.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionIds]);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block"
      style={{
        position: "fixed",
        left: 24,
        top: 0,
        bottom: 0,
        width: 1,
        background: "var(--border)",
        zIndex: 60,
      }}
    >
      <div ref={fillRef} className="sounding-fill" />
      {ticks.map((t, i) => (
        <span
          key={i}
          className="sounding-tick"
          data-lit={i < lit ? "" : undefined}
          style={{ top: `${t * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * The hero's one bright element: a bathymetric chart of a seamount, drawn in
 * hairlines, with every fifth contour stronger (as index contours are on a real
 * chart) and one in the accent. Pauses its drift while the hero is off screen.
 */
function ContourField() {
  const rings = useMemo(buildContours, []);
  const fieldRef = useRef<HTMLDivElement>(null);
  const ACCENT_RING = 10;

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      el.classList.toggle("contour-paused", !entry.isIntersecting);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={fieldRef} className="contour-field" aria-hidden="true">
      <svg
        className="contour-drift"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        {rings.map((d, i) => {
          const accent = i === ACCENT_RING;
          const index = i % 5 === 0;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={1}
              stroke={accent ? "var(--accent)" : "var(--text-primary)"}
              strokeOpacity={accent ? 0.55 : index ? 0.14 : 0.07}
            />
          );
        })}
      </svg>
    </div>
  );
}

function PrimaryButton({
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
      className="inline-flex items-center justify-center px-5 transition-colors"
      style={{
        height: 44,
        borderRadius: "var(--radius-control)",
        background: "var(--text-primary)",
        color: "var(--background)",
        fontSize: 15,
        fontWeight: 500,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
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
    background: "var(--raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-control)",
    padding: "10px 12px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
  };

  // Clear a stale result as soon as the visitor starts correcting the form.
  const touched = () => {
    if (status === "error" || status === "success") setStatus("idle");
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
    <form onSubmit={handleSend} className="flex flex-col gap-5 text-left">
      <div>
        <label htmlFor="contact-email" style={labelStyle}>
          Your email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={fromEmail}
          onChange={(e) => {
            setFromEmail(e.target.value);
            touched();
          }}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="contact-subject" style={labelStyle}>
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            touched();
          }}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="contact-message" style={labelStyle}>
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            touched();
          }}
          rows={5}
          required
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center px-5 transition-colors"
          style={{
            height: 44,
            borderRadius: "var(--radius-control)",
            background: "var(--text-primary)",
            color: "var(--background)",
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            border: "none",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
          }}
        >
          {status === "sending" ? "Sending" : "Send message"}
        </button>

        <div role="status" aria-live="polite" style={{ fontSize: 13 }}>
          {status === "success" && (
            <span style={{ color: "var(--positive)" }}>Sent — thanks for reaching out</span>
          )}
          {status === "error" && (
            <span style={{ color: "var(--negative)" }}>
              Could not send — email{" "}
              <a
                href={GMAIL_COMPOSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--negative)", textDecoration: "underline" }}
              >
                {CONTACT_EMAIL}
              </a>{" "}
              directly
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

function ResumePage({ onBack }: { onBack: (e?: React.MouseEvent) => void }) {
  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* ── Navbar (matches main page) ── */}
      <nav
        style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, width: "min(1100px, 95vw)",
        }}
      >
        <div
          style={{
            background: "rgba(11,13,20,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-panel)",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/classic/"
            onClick={onBack}
            className="flex items-center gap-2 px-3 transition-colors"
            style={{
              height: 32,
              borderRadius: 8,
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Back to portfolio
          </a>
          <span className="meta px-3" style={{ fontSize: 12 }}>
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
              borderRadius: "var(--radius-card)", overflow: "hidden",
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
      className="reveal text-center mb-12"
      style={{
        ...stagger(0),
        fontSize: 28,
        fontWeight: 500,
        color: "var(--text-primary)",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h2>
  );
}

function ExperienceCard({
  company,
  role,
  dates,
  figures,
  description,
}: {
  company: string;
  role: string;
  dates: string;
  figures: string[];
  description: string;
}) {
  return (
    <div
      className="p-6"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
        <h3 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
          {company}
        </h3>
        <span className="meta" style={{ fontSize: 12 }}>
          {dates}
        </span>
      </div>
      <p className="mb-4" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
        {role}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: "66ch" }}>
        {withFigures(description, figures)}
      </p>
    </div>
  );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[0] }) {
  return (
    <div
      className="flex flex-col h-full p-5 transition-colors hover:bg-white/[0.02]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <h3 className="mb-2" style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
        {project.title}
      </h3>
      <p
        className="mb-4 flex-1"
        style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}
      >
        {withFigures(project.description, project.figures)}
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {project.tags.map((t) => (
          <span
            key={t}
            className="meta px-2 py-1"
            style={{
              fontSize: 11,
              /* secondary, not muted: muted is only 4.34:1 on the raised surface */
              color: "var(--text-secondary)",
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 transition-colors hover:bg-white/5"
          style={{
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          GitHub profile
        </a>
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 transition-colors"
            style={{
              height: 32,
              borderRadius: 8,
              background: "var(--text-primary)",
              color: "var(--background)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Live demo
          </a>
        )}
      </div>
    </div>
  );
}

function SkillTile({ label }: { label: string }) {
  return (
    <span
      className="meta inline-flex items-center px-3 transition-colors hover:bg-white/5"
      style={{
        height: 32,
        fontSize: 13,
        /* secondary, not muted: muted is only 4.34:1 on the raised surface */
        color: "var(--text-secondary)",
        background: "var(--raised)",
        border: "1px solid var(--border)",
        borderRadius: 8,
      }}
    >
      {label}
    </span>
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
  const active = useActiveSection(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [page, setPage] = useState<"home" | "resume">(() =>
    typeof window !== "undefined" && window.location.pathname === "/classic/resume" ? "resume" : "home"
  );

  useEffect(() => {
    const onPopState = () => {
      setPage(window.location.pathname === "/classic/resume" ? "resume" : "home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Both values only flip at a threshold, so React skips the re-render on
    // every other scroll event. Reading progress lives in SoundingLine.
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTop(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
  };

  const goToResume = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", "/classic/resume");
    setPage("resume");
    window.scrollTo(0, 0);
  };

  const goHome = (e?: React.MouseEvent) => {
    e?.preventDefault();
    window.history.pushState({}, "", "/classic/");
    setPage("home");
    window.scrollTo(0, 0);
  };

  if (page === "resume") {
    return <ResumePage onBack={goHome} />;
  }

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "0 12px",
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: isActive ? "1px solid var(--border)" : "1px solid transparent",
    transition: "background-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)",
    background: isActive ? "var(--raised)" : "transparent",
    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
  });

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <SoundingLine sectionIds={SECTION_IDS} />

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, width: "min(1100px, 95vw)",
        }}
      >
        <div
          style={{
            background: scrolled ? "rgba(11,13,20,0.92)" : "rgba(17,20,28,0.72)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-panel)",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "background-color var(--dur-enter) var(--ease)",
          }}
        >
          {/* Logo — the handle, set in mono. No tile, no gradient. */}
          <span className="meta px-2" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            @giangelo19
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                aria-current={active === item.id ? "true" : undefined}
                style={navItemStyle(active === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block", width: 20, height: 2,
                  background: "var(--text-secondary)", borderRadius: 2,
                  transition: "transform var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease)",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                  transform:
                    menuOpen
                      ? i === 0
                        ? "rotate(45deg) translate(3px, 3px)"
                        : i === 2
                          ? "rotate(-45deg) translate(3px, -3px)"
                          : "none"
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
              background: "rgba(17,20,28,0.96)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-panel)",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                aria-current={active === item.id ? "true" : undefined}
                style={{
                  ...navItemStyle(active === item.id),
                  height: 40,
                  fontSize: 14,
                  justifyContent: "flex-start",
                  textAlign: "left",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center text-center px-4"
          style={{ paddingTop: 96 }}
        >
          <ContourField />

          <div className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
            <h1
              style={{
                fontSize: "clamp(2rem, 6vw, 4.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 20,
              }}
            >
              Gian Angelo Tongzon
            </h1>
            <p
              className="mb-10"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                color: "var(--text-secondary)",
                maxWidth: "40ch",
              }}
            >
              Full-stack developer and computer vision researcher
            </p>
            <PrimaryButton href="/classic/resume" onClick={goToResume}>
              View resume
            </PrimaryButton>
          </div>
        </section>

        {/* ── About ── */}
        <FadeSection id="about" className="py-20 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>About</SectionHeading>
            <div
              className="reveal p-8"
              style={{
                ...stagger(1),
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  maxWidth: "66ch",
                }}
              >
                I'm a fourth-year BS Computer Science student at the University of the Philippines
                Tacloban College, based in the Philippines. I work part-time as a full-stack web
                developer, mostly building Laravel and PHP applications with MySQL, JavaScript, and
                Tailwind CSS. I'm also working on a computer vision thesis using PyTorch.
              </p>
            </div>
          </div>
        </FadeSection>

        {/* ── Experience ── */}
        <FadeSection id="experience" className="py-20 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>Experience</SectionHeading>
            <div className="flex flex-col gap-4">
              {EXPERIENCE.map((exp, i) => (
                <div key={exp.company} className="reveal" style={stagger(i + 1)}>
                  <ExperienceCard {...exp} />
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Projects ── */}
        <FadeSection id="projects" className="py-28 px-4">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SectionHeading>Projects</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PROJECTS.map((p, i) => (
                <div key={p.title} className="reveal" style={stagger(i + 1)}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Skills ── */}
        <FadeSection id="skills" className="py-20 px-4">
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SectionHeading>Skills</SectionHeading>
            <div className="flex flex-col gap-8">
              {SKILLS.map((group, i) => (
                <div key={group.group} className="reveal" style={stagger(i + 1)}>
                  <p
                    className="mb-3"
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}
                  >
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-2">
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
        <FadeSection id="education" className="py-20 px-4">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <SectionHeading>Education</SectionHeading>
            <div className="flex flex-col gap-4">
              {EDUCATION.map((edu, i) => (
                <div key={edu.company} className="reveal" style={stagger(i + 1)}>
                  <ExperienceCard {...edu} />
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Contact ── */}
        <FadeSection id="contact" className="py-28 px-4">
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <SectionHeading>Contact</SectionHeading>
            <p
              className="reveal text-center mb-10"
              style={{ ...stagger(1), fontSize: 15, color: "var(--text-secondary)" }}
            >
              Email me directly or use the form below
            </p>
            <div className="reveal" style={stagger(2)}>
              <ContactForm />
            </div>
            <div className="reveal flex items-center justify-center gap-6 mt-10" style={stagger(3)}>
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
                  className="transition-colors"
                  style={{ fontSize: 14, color: "var(--text-secondary)" }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── Footer ── */}
        <footer
          className="py-10 px-4 text-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="meta" style={{ fontSize: 12 }}>
            Gian Angelo Tongzon · © {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-colors hover:bg-white/5"
          style={{
            width: 44, height: 44,
            borderRadius: 22,
            background: "var(--raised)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          aria-label="Scroll to top"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}
