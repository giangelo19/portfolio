Build a personal developer portfolio website: single page, smooth-scroll anchor
navigation, dark neon aesthetic.

=== VISUAL STYLE ===

Background: near-black (#0d0d0d–#111). Soft ambient radial glows bleeding in from the
corners — blue and violet blooms, low opacity, very diffuse. Dark everywhere else.

Signature accent: a cyan → blue → violet → magenta gradient (roughly #22d3ee → #3b82f6
→ #8b5cf6 → #d946ef). Use it for the name headline as a left-to-right gradient text
fill, for primary buttons, and for card accent bars.

Typography: heavy bold geometric sans for headings (very large, tight), regular weight
sans for body. High contrast — pure white headings on near-black.

NAVBAR: a floating pill, fully rounded, dark translucent with a faint border, centered
near the top and detached from the page edges. Each link has a small emoji icon before
its label (👋 About Me, 💼 Experience, 🚀 Projects, ⚡ Skills, 📊 Education, 📷 Contact).
The active link gets a subtly magenta-tinted pill background and magenta text.
Logo on the far left: a monogram in a small box with an underline, plus a lowercase
handle next to it.

BUTTONS: full pill shape, magenta→cyan gradient fill, bold text, trailing arrow icon.

CARDS: dark charcoal panels, ~16px corner radius, thin subtle border, and a thick
vertical accent bar down the left edge — alternating magenta and cyan between cards.
Inside: centered bold white title, then a colored subtitle on the left (magenta or cyan,
matching the accent bar) with a small dark pill "chip" on the right holding the date in
italics, then body text below.

SECTION HEADINGS: centered, bold, white, large, with generous space above and below.
Sections are widely spaced — lots of vertical breathing room.

EXTRAS: a floating circular magenta scroll-to-top button fixed at the bottom right.
Subtle fade/slide-up animation as each section enters the viewport.

=== SECTIONS ===

1. HERO
Small line: "Hi! My name is"
Then the name, huge, in the gradient text fill: "Gian Angelo Tongzon"
Then a subtitle in bold white, using a typewriter effect that cycles:
  Full-Stack Developer / Laravel Developer / CS Student / Deep Learning Enthusiast
Below: a gradient pill button "View Resume →"
Social icons underneath: GitHub, LinkedIn, email.

2. ABOUT ME
Short bio in a card:
  "I'm a fourth-year BS Computer Science student at the University of the Philippines
  Tacloban College, based in the Philippines. I work part-time as a full-stack web
  developer, mostly building Laravel and PHP applications with MySQL, JavaScript, and
  Tailwind CSS. I'm also working on a computer vision thesis using PyTorch and
  Detectron2."

3. EXPERIENCE
Stacked cards, most recent first, alternating magenta/cyan accent bars.
  - Part-Time Full-Stack Web Developer — Freelance / TATS-Solutions
    Role subtitle: "Full Stack Developer (Laravel / PHP)" | date chip: [DATES]
    Building web applications for clients, primarily on Laravel with MySQL and
    Tailwind CSS.
  - MYT SoftDev Solutions
    Role subtitle: "Software Development Intern" | date chip: [DATES]
    Worked on full-stack web development, including a CodeIgniter 4 + React logistics
    ERP for a trucking business.

4. PROJECTS
Card grid, 3 across on desktop, 1 on mobile. Each: screenshot placeholder, title,
2–3 sentence description, tech-stack tags as small pills, GitHub link, optional demo link.
  - MantaNet — Undergraduate thesis. Multi-task computer vision model for deep-sea
    organism detection and segmentation. PyTorch, Detectron2.
  - Logistics ERP — Full-stack ERP for a trucking business covering dispatch, billing,
    and revenue reporting. CodeIgniter 4, React, MySQL.
  - BiteSpot — Food discovery web app built with a student team; owned the frontend
    AJAX layer. Laravel, JavaScript.
  - HL-SMS — React frontend for a municipal services booking portal backed by a
    Laravel API.
  - Freedom Board — Laravel application refactor focused on authentication and
    security hardening.
  - Expense Tracker — Personal mobile expense tracking app. [in progress]

5. SKILLS
Icon tiles in a grid, grouped under three small labeled rows. Tiles glow faintly
in the accent gradient on hover.
  Languages & Frameworks: PHP, Laravel, JavaScript, React, Python, MySQL,
    Tailwind CSS, Vite
  ML / Data: PyTorch, Detectron2
  Tools: Git, GitHub, VS Code, XAMPP, Postman

6. EDUCATION
Cards in the same style as Experience.
  - University of the Philippines Tacloban College
    "BS Computer Science" | date chip: [YEAR] – Present
    Fourth year. Coursework includes Data Communication and Networking, Discrete
    Mathematics, and Data Structures and Algorithms.

7. CONTACT
Short invitation line, a gradient email button, and social links. No contact form.

8. FOOTER
Name, current year, social icons.

=== BEHAVIOR ===
- Mobile-first responsive; navbar collapses to a hamburger that opens the same pill
  styling as a dropdown.
- Active nav link updates based on scroll position.
- Placeholder images throughout — I'll swap in real screenshots later.