import { useState, useEffect, useRef } from "react";

// ─── Static Course Data (replace with API fetch as needed) ───────────────────
const ALL_COURSES = [
  {
    id: 1, title: "Full-Stack Web Development Bootcamp", instructor: "Angela Yu",
    category: "Development", level: "Beginner", rating: 4.8, reviews: 182400,
    price: 1299, originalPrice: 5999, duration: "63h", students: 820000,
    tags: ["HTML", "CSS", "React", "Node.js", "MongoDB"],
    badge: "Bestseller", platform: "Udemy",
    color: "#FF6B35", emoji: "💻",
    description: "Build 16+ projects and master full-stack development from scratch.",
    link: "https://udemy.com",
  },
  {
    id: 2, title: "Machine Learning", instructor: "Andrew Ng",
    category: "AI & ML", level: "Intermediate", rating: 4.9, reviews: 98200,
    price: 999, originalPrice: 4999, duration: "44h", students: 340000,
    tags: ["Python", "TensorFlow", "Scikit-learn", "Deep Learning"],
    badge: "Top Rated", platform: "Coursera",
    color: "#6C63FF", emoji: "🤖",
    description: "The most complete ML course — theory + hands-on projects.",
    link: "https://coursera.org",
  },
  {
    id: 3, title: "UI/UX Design Masterclass", instructor: "Gary Simon",
    category: "Design", level: "Beginner", rating: 4.7, reviews: 54100,
    price: 799, originalPrice: 3999, duration: "28h", students: 210000,
    tags: ["Figma", "Prototyping", "User Research", "Design Systems"],
    badge: "Hot", platform: "Udemy",
    color: "#FF4D94", emoji: "🎨",
    description: "Design beautiful, user-centered interfaces with Figma.",
    link: "https://udemy.com",
  },
  {
    id: 4, title: "AWS Certified Solutions Architect", instructor: "Stéphane Maarek",
    category: "Cloud & DevOps", level: "Intermediate", rating: 4.8, reviews: 76000,
    price: 1499, originalPrice: 6999, duration: "52h", students: 480000,
    tags: ["AWS", "Cloud", "DevOps", "Infrastructure"],
    badge: "Bestseller", platform: "Udemy",
    color: "#F7A800", emoji: "☁️",
    description: "Pass the AWS SAA-C03 exam and master cloud architecture.",
    link: "https://udemy.com",
  },
  {
    id: 5, title: "Data Science & Python Bootcamp", instructor: "Jose Portilla",
    category: "Data Science", level: "Beginner", rating: 4.6, reviews: 112000,
    price: 999, originalPrice: 4499, duration: "36h", students: 560000,
    tags: ["Python", "Pandas", "NumPy", "Matplotlib", "SQL"],
    badge: null, platform: "Udemy",
    color: "#00BFA6", emoji: "📊",
    description: "Go from zero to hero in Python for data analysis and visualization.",
    link: "https://udemy.com",
  },
  {
    id: 6, title: "Ethical Hacking & Cybersecurity", instructor: "Zaid Al-Quraishi",
    category: "Cybersecurity", level: "Intermediate", rating: 4.7, reviews: 89300,
    price: 1199, originalPrice: 5499, duration: "48h", students: 390000,
    tags: ["Kali Linux", "Penetration Testing", "Networking", "Python"],
    badge: "Hot", platform: "Udemy",
    color: "#22C55E", emoji: "🔐",
    description: "Learn ethical hacking, penetration testing, and security tools.",
    link: "https://udemy.com",
  },
  {
    id: 7, title: "iOS & Swift Development", instructor: "Dr. Angela Yu",
    category: "Mobile", level: "Beginner", rating: 4.8, reviews: 63400,
    price: 1099, originalPrice: 4999, duration: "55h", students: 260000,
    tags: ["Swift", "SwiftUI", "Xcode", "iOS"],
    badge: "Top Rated", platform: "Udemy",
    color: "#FF3B3B", emoji: "📱",
    description: "Build 25+ apps and publish them to the App Store.",
    link: "https://udemy.com",
  },
  {
    id: 8, title: "Blockchain & Web3 Development", instructor: "Patrick Collins",
    category: "Blockchain", level: "Advanced", rating: 4.9, reviews: 31200,
    price: 0, originalPrice: 0, duration: "32h", students: 140000,
    tags: ["Solidity", "Ethereum", "Web3.js", "DeFi", "NFTs"],
    badge: "Free", platform: "FreeCodeCamp",
    color: "#A855F7", emoji: "⛓️",
    description: "Master smart contracts, DeFi, and decentralized applications.",
    link: "https://freecodecamp.org",
  },
  {
    id: 9, title: "Digital Marketing Masterclass", instructor: "Brad Merrill",
    category: "Marketing", level: "Beginner", rating: 4.5, reviews: 47800,
    price: 699, originalPrice: 2999, duration: "23h", students: 195000,
    tags: ["SEO", "Social Media", "Google Ads", "Email Marketing"],
    badge: null, platform: "Udemy",
    color: "#F97316", emoji: "📣",
    description: "Master digital marketing strategy, SEO, and paid advertising.",
    link: "https://udemy.com",
  },
  {
    id: 10, title: "React & Redux Complete Guide", instructor: "Maximilian Schwarzmüller",
    category: "Development", level: "Intermediate", rating: 4.7, reviews: 94000,
    price: 899, originalPrice: 4199, duration: "40h", students: 420000,
    tags: ["React", "Redux", "Hooks", "Next.js", "TypeScript"],
    badge: "Bestseller", platform: "Udemy",
    color: "#38BDF8", emoji: "⚛️",
    description: "Deep dive into React with real-world apps and modern patterns.",
    link: "https://udemy.com",
  },
  {
    id: 11, title: "Excel & Power BI for Business", instructor: "Kyle Pew",
    category: "Business & Finance", level: "Beginner", rating: 4.6, reviews: 52300,
    price: 599, originalPrice: 2499, duration: "18h", students: 310000,
    tags: ["Excel", "Power BI", "Data Analysis", "Dashboards"],
    badge: null, platform: "Udemy",
    color: "#10B981", emoji: "📈",
    description: "Transform raw data into powerful business insights and reports.",
    link: "https://udemy.com",
  },
  {
    id: 12, title: "Photography Masterclass", instructor: "Phil Ebiner",
    category: "Photography", level: "Beginner", rating: 4.6, reviews: 38900,
    price: 499, originalPrice: 1999, duration: "22h", students: 175000,
    tags: ["DSLR", "Composition", "Lightroom", "Portrait", "Landscape"],
    badge: null, platform: "Udemy",
    color: "#EC4899", emoji: "📷",
    description: "Go from auto to manual mode and take stunning professional photos.",
    link: "https://udemy.com",
  },
];

const CATEGORIES = ["All", "Development", "AI & ML", "Design", "Cloud & DevOps", "Data Science", "Cybersecurity", "Mobile", "Blockchain", "Marketing", "Business & Finance", "Photography"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const SORTS = ["Most Popular", "Top Rated", "Price: Low to High", "Price: High to Low", "Newest"];

function Stars({ rating }) {
  return (
    <span style={{ color: "#FFD60A", fontSize: "13px", letterSpacing: "-1px" }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: "#999", marginLeft: "4px", fontSize: "12px" }}>{rating}</span>
    </span>
  );
}

function BadgePill({ label, color }) {
  const colors = {
    "Bestseller": { bg: "#FFD60A", text: "#000" },
    "Top Rated": { bg: "#6C63FF", text: "#fff" },
    "Hot": { bg: "#FF3B3B", text: "#fff" },
    "Free": { bg: "#00C896", text: "#000" },
  };
  const c = colors[label] || { bg: "#444", text: "#fff" };
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
  );
}

function CourseCard({ course, onEnroll, enrolled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0f0f0f",
        border: `1px solid ${hovered ? course.color + "55" : "#1e1e1e"}`,
        borderRadius: "14px", overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 16px 48px ${course.color}22` : "none",
        cursor: "default",
      }}
    >
      {/* Card Top */}
      <div style={{
        height: "140px", background: `linear-gradient(135deg, ${course.color}22, ${course.color}08)`,
        borderBottom: `1px solid ${course.color}22`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px", position: "relative", overflow: "hidden",
      }}>
        <span style={{ fontSize: "52px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>{course.emoji}</span>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: course.color, fontSize: "12px", fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
            {course.platform}
          </div>
          <div style={{
            background: "#111", border: `1px solid ${course.color}44`, borderRadius: "6px",
            padding: "2px 8px", color: "#aaa", fontSize: "11px",
          }}>
            {course.duration} • {course.level}
          </div>
        </div>
        {/* Decorative ring */}
        <div style={{
          position: "absolute", width: "120px", height: "120px", borderRadius: "50%",
          border: `1px solid ${course.color}18`, top: "-20px", left: "30px",
          pointerEvents: "none",
        }} />
        {course.badge && (
          <div style={{ position: "absolute", top: "10px", left: "10px" }}>
            <BadgePill label={course.badge} />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <p style={{ margin: "0 0 4px", color: "#666", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {course.category}
          </p>
          <h3 style={{
            margin: 0, color: "#f0f0f0", fontSize: "15px", fontWeight: 700,
            fontFamily: "'Outfit', sans-serif", lineHeight: 1.4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {course.title}
          </h3>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: "12px" }}>by {course.instructor}</p>
        </div>

        <p style={{ margin: 0, color: "#666", fontSize: "12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {course.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Stars rating={course.rating} />
          <span style={{ color: "#555", fontSize: "11px" }}>({(course.reviews / 1000).toFixed(0)}k reviews)</span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {course.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>
              {tag}
            </span>
          ))}
          {course.tags.length > 3 && <span style={{ color: "#555", fontSize: "10px", padding: "2px 4px" }}>+{course.tags.length - 3}</span>}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ color: "#f0f0f0", fontWeight: 800, fontSize: "18px", fontFamily: "'Outfit', sans-serif" }}>
              {course.price === 0 ? "Free" : `₹${course.price.toLocaleString()}`}
            </span>
            {course.originalPrice > 0 && (
              <span style={{ color: "#444", fontSize: "12px", textDecoration: "line-through", marginLeft: "6px" }}>
                ₹{course.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <span style={{ color: "#555", fontSize: "11px" }}>{(course.students / 1000).toFixed(0)}k students</span>
        </div>

        <button
          onClick={() => onEnroll(course)}
          style={{
            padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer",
            background: enrolled ? "#1a2a1a" : `linear-gradient(135deg, ${course.color}, ${course.color}cc)`,
            color: enrolled ? "#00C896" : "#fff",
            fontWeight: 700, fontSize: "13px", fontFamily: "'Outfit', sans-serif",
            transition: "all 0.2s",
            border: enrolled ? "1px solid #00C89644" : "none",
          }}
        >
          {enrolled ? "✓ Enrolled" : course.price === 0 ? "Enroll Free" : "Enroll Now"}
        </button>
      </div>
    </div>
  );
}

function NeedQuiz({ onResult }) {
  const questions = [
    { q: "What's your main goal?", options: ["Get a job / switch career", "Freelancing", "Build my own product", "Upskill at work"] },
    { q: "What's your background?", options: ["Complete beginner", "Some coding knowledge", "Designer / creative", "Working professional"] },
    { q: "How much time can you invest weekly?", options: ["< 5 hours", "5–10 hours", "10–20 hours", "20+ hours"] },
  ];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  function pick(option) {
    const next = [...answers, option];
    if (step < questions.length - 1) { setAnswers(next); setStep(s => s + 1); }
    else {
      // Simple recommendation logic
      const a = next[0];
      let cats = [];
      if (a.includes("job") || a.includes("career")) cats = ["Development", "Data Science", "Cloud & DevOps"];
      else if (a.includes("Freelancing")) cats = ["Design", "Development", "Marketing"];
      else if (a.includes("product")) cats = ["Development", "AI & ML", "Blockchain"];
      else cats = ["Business & Finance", "Marketing", "Data Science"];
      onResult(cats);
    }
  }

  const current = questions[step];

  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "28px", maxWidth: "540px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {questions.map((_, i) => (
          <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= step ? "#6C63FF" : "#1e1e1e", transition: "background 0.3s" }} />
        ))}
      </div>
      <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Question {step + 1} of {questions.length}
      </p>
      <h3 style={{ color: "#f0f0f0", fontFamily: "'Outfit', sans-serif", fontSize: "20px", margin: "0 0 20px" }}>{current.q}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {current.options.map(opt => (
          <button key={opt} onClick={() => pick(opt)} style={{
            padding: "12px 16px", borderRadius: "10px", border: "1px solid #2a2a2a",
            background: "#151515", color: "#ccc", fontSize: "14px", cursor: "pointer",
            textAlign: "left", transition: "all 0.15s", fontFamily: "'Outfit', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6C63FF"; e.currentTarget.style.color = "#f0f0f0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All Levels");
  const [activeSort, setActiveSort] = useState("Most Popular");
  const [search, setSearch] = useState("");
  const [enrolled, setEnrolled] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showEnrollToast, setShowEnrollToast] = useState(null);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const toastTimeout = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  function handleEnroll(course) {
    setEnrolled(prev => {
      const next = new Set(prev);
      if (next.has(course.id)) next.delete(course.id);
      else next.add(course.id);
      return next;
    });
    if (!enrolled.has(course.id)) {
      setShowEnrollToast(course.title);
      clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setShowEnrollToast(null), 3000);
      window.open(course.link, "_blank");
    }
  }

  function handleQuizResult(cats) {
    setQuizResult(cats);
    setActiveCategory("All");
    setShowQuiz(false);
  }

  // Filter + Sort
  let filtered = ALL_COURSES.filter(c => {
    const inCat = activeCategory === "All" || c.category === activeCategory;
    const inLevel = activeLevel === "All Levels" || c.level === activeLevel;
    const inSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const inFree = !showFreeOnly || c.price === 0;
    const inQuiz = !quizResult || quizResult.includes(c.category);
    return inCat && inLevel && inSearch && inFree && inQuiz;
  });

  filtered = [...filtered].sort((a, b) => {
    if (activeSort === "Most Popular") return b.students - a.students;
    if (activeSort === "Top Rated") return b.rating - a.rating;
    if (activeSort === "Price: Low to High") return a.price - b.price;
    if (activeSort === "Price: High to Low") return b.price - a.price;
    return 0;
  });

  const stats = [
    { value: "12+", label: "Categories" },
    { value: "3.2M+", label: "Students" },
    { value: "₹499", label: "Starting at" },
    { value: "4.7★", label: "Avg Rating" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "'Outfit', sans-serif" }}>
      {/* Toast */}
      {showEnrollToast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#0f2a1a", border: "1px solid #00C89666", borderRadius: "12px",
          padding: "14px 20px", color: "#00C896", fontWeight: 700, fontSize: "14px",
          maxWidth: "320px", animation: "slideIn 0.3s ease",
          boxShadow: "0 8px 32px rgba(0,200,150,0.2)",
        }}>
          ✓ Enrolled! Opening {showEnrollToast.slice(0, 30)}...
        </div>
      )}

      {/* Hero */}
      <div style={{
        background: "linear-gradient(180deg, #0d0d0d 0%, #080808 100%)",
        borderBottom: "1px solid #1a1a1a", padding: "60px 24px 40px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-60px", left: "20%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, #6C63FF18, transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-40px", right: "15%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, #FF6B3518, transparent)", pointerEvents: "none" }} />

        <span style={{ background: "#6C63FF18", border: "1px solid #6C63FF44", color: "#6C63FF", fontSize: "12px", fontWeight: 700, padding: "4px 14px", borderRadius: "99px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          🎓 Top Courses Marketplace
        </span>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, margin: "16px 0 12px", lineHeight: 1.1 }}>
          Learn anything.<br />
          <span style={{ background: "linear-gradient(90deg, #6C63FF, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Build everything.
          </span>
        </h1>
        <p style={{ color: "#666", fontSize: "16px", maxWidth: "500px", margin: "0 auto 28px", lineHeight: 1.6 }}>
          Curated best-in-market courses across tech, design, business and more. Find the perfect course for your goals.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", marginBottom: "28px" }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f0", fontWeight: 800, fontSize: "22px" }}>{s.value}</div>
              <div style={{ color: "#555", fontSize: "12px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", maxWidth: "400px", flex: "1 1 280px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search courses, skills, instructors..."
              style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px 14px 12px 40px", color: "#f0f0f0", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button onClick={() => { setShowQuiz(true); setQuizResult(null); }} style={{
            padding: "12px 20px", borderRadius: "10px", border: "1px solid #6C63FF44",
            background: "#6C63FF18", color: "#6C63FF", fontWeight: 700, fontSize: "14px", cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}>
            🎯 Find My Course
          </button>
        </div>

        {quizResult && (
          <div style={{ marginTop: "16px", color: "#6C63FF", fontSize: "13px" }}>
            Showing recommendations for: <strong>{quizResult.join(", ")}</strong>
            <button onClick={() => setQuizResult(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", marginLeft: "8px", fontSize: "13px" }}>✕ Clear</button>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={e => e.target === e.currentTarget && setShowQuiz(false)}>
          <div style={{ width: "100%", maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", color: "#f0f0f0" }}>🎯 Find Your Perfect Course</h2>
              <button onClick={() => setShowQuiz(false)} style={{ background: "none", border: "none", color: "#666", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>
            <NeedQuiz onResult={handleQuizResult} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #111", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 50 }}>
        {/* Category scroll */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "12px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: `1px solid ${activeCategory === cat ? "#6C63FF" : "#1e1e1e"}`,
              background: activeCategory === cat ? "#6C63FF18" : "transparent",
              color: activeCategory === cat ? "#6C63FF" : "#666",
              transition: "all 0.15s", fontFamily: "'Outfit', sans-serif",
            }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <select value={activeLevel} onChange={e => setActiveLevel(e.target.value)} style={selectStyle}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={activeSort} onChange={e => setActiveSort(e.target.value)} style={selectStyle}>
            {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowFreeOnly(f => !f)} style={{
            padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
            border: `1px solid ${showFreeOnly ? "#00C896" : "#1e1e1e"}`,
            background: showFreeOnly ? "#00C89618" : "transparent",
            color: showFreeOnly ? "#00C896" : "#666", fontFamily: "'Outfit', sans-serif",
          }}>
            Free Only
          </button>
          <span style={{ color: "#444", fontSize: "13px", marginLeft: "auto" }}>
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Enrolled Banner */}
      {enrolled.size > 0 && (
        <div style={{ background: "#0f1a0f", borderBottom: "1px solid #00C89622", padding: "10px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#00C896", fontWeight: 700, fontSize: "14px" }}>✓ {enrolled.size} course{enrolled.size > 1 ? "s" : ""} enrolled</span>
          <span style={{ color: "#555", fontSize: "13px" }}>Your learning journey has begun!</span>
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: "28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "18px" }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🎓</div>
            <h3 style={{ color: "#444", fontFamily: "'Outfit', sans-serif", margin: 0 }}>No courses found</h3>
            <p style={{ color: "#333", fontSize: "14px" }}>Try a different category or search term.</p>
          </div>
        ) : (
          filtered.map((course, i) => (
            <div key={course.id} style={{ animation: `fadeUp 0.4s ease both`, animationDelay: `${i * 40}ms` }}>
              <CourseCard course={course} onEnroll={handleEnroll} enrolled={enrolled.has(course.id)} />
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
        select option { background: #111; color: #f0f0f0; }
      `}</style>
    </div>
  );
}

const selectStyle = {
  background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px",
  padding: "8px 12px", color: "#aaa", fontSize: "13px", outline: "none",
  fontFamily: "'Outfit', sans-serif", cursor: "pointer",
};