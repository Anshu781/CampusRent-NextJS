
"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, Search, SlidersHorizontal, MapPin,
  ShieldCheck, Heart, Zap, Menu, X, PackageCheck, Coffee, Sparkles
} from "lucide-react";
import SmoothScroll from "./SmoothScroll";

const rawItems = [
  ["Electric kettle","Appliances",25,"🫖","peach","Aarav","Kalam","B","1.5L · auto shut-off"],
  ["Steam iron","Appliances",20,"👔","lavender","Mehak","Aryabhatta","C","Quick heat · easy to use"],
  ["Scientific calculator","Study",15,"🧮","mint","Rishabh","CV Raman","","Exam-week friendly"],
  ["Cycle","Mobility",60,"🚲","blue","Sana","Kalam","D","Lock included"],
  ["Desk lamp","Study",12,"💡","yellow","Kabir","Aryabhatta","A","Warm + cool light"],
  ["Bluetooth speaker","Electronics",35,"🔊","pink","Ira","Ashima","","Portable · great sound"],
  ["Extension board","Appliances",10,"🔌","mint","Dev","Married Accommodation","","4 sockets · 2m cable"],
  ["Badminton set","Sports",30,"🏸","peach","Ananya","Kalam","A","2 rackets + shuttle"],
  ["Laptop stand","Electronics",20,"💻","blue","Ishaan","Kalam","B","Adjustable height"],
  ["Study table","Furniture",45,"🪑","yellow","Riya","Aryabhatta","B","Compact study desk"],
  ["Office chair","Furniture",40,"💺","lavender","Arjun","CV Raman","","Comfortable seat"],
  ["Room fan","Appliances",30,"🌀","mint","Diya","Kalam","C","Portable table fan"],
  ["Mini refrigerator","Appliances",100,"🧊","blue","Nikhil","Aryabhatta","D","Compact fridge"],
  ["Power bank","Electronics",20,"🔋","yellow","Aditi","Kalam","A","10000 mAh"],
  ["USB-C charger","Electronics",15,"🔌","peach","Rahul","CV Raman","","Fast charging"],
  ["HDMI cable","Electronics",8,"🖥️","lavender","Simran","Kalam","B","2 metre cable"],
  ["Computer mouse","Electronics",10,"🖱️","mint","Yash","Aryabhatta","A","Wireless mouse"],
  ["Keyboard","Electronics",15,"⌨️","blue","Pooja","Kalam","D","USB keyboard"],
  ["Headphones","Electronics",25,"🎧","pink","Aditya","Ashima","","Over-ear headphones"],
  ["Webcam","Electronics",20,"📷","yellow","Neha","CV Raman","","Online classes"],
  ["Backpack","Accessories",15,"🎒","peach","Karan","Kalam","A","Spacious backpack"],
  ["Rain umbrella","Accessories",8,"☂️","lavender","Tanya","Aryabhatta","C","Full-size umbrella"],
  ["Yoga mat","Sports",12,"🧘","mint","Manav","Kalam","B","Non-slip mat"],
  ["Cricket kit","Sports",50,"🏏","blue","Ishita","CV Raman","","Bat and ball"],
  ["Football","Sports",20,"⚽","yellow","Varun","Kalam","C","Standard football"],
  ["Basketball","Sports",25,"🏀","peach","Kriti","Aryabhatta","D","Outdoor basketball"],
  ["Badminton racket","Sports",15,"🏸","lavender","Aman","Kalam","B","Single racket"],
  ["Chess board","Sports",10,"♟️","mint","Mira","CV Raman","","Wooden chess set"],
  ["Novel collection","Books",12,"📚","blue","Sahil","Kalam","D","Fiction and classics"],
  ["Engineering textbook","Books",20,"📖","yellow","Naina","Aryabhatta","A","Semester study material"],
  ["Drawing kit","Study",15,"🎨","pink","Om","Kalam","C","Pencils and colours"],
  ["Whiteboard","Study",18,"📝","mint","Sara","CV Raman","","Includes markers"],
  ["Tripod","Electronics",25,"📱","peach","Rohan","Kalam","A","Phone tripod"],
  ["Ring light","Electronics",20,"💡","lavender","Anvi","Aryabhatta","B","Adjustable brightness"],
  ["Induction cooktop","Appliances",50,"🍳","yellow","Vivek","Ashima","","Portable cooktop"],
  ["Sandwich maker","Appliances",25,"🥪","mint","Isha","Kalam","D","Non-stick plates"],
  ["Pressure cooker","Appliances",20,"🍲","peach","Harsh","Aryabhatta","C","Small family size"],
  ["Storage boxes","Home",10,"📦","blue","Ayesha","CV Raman","","Set of three"],
  ["Bedsheet set","Home",15,"🛏️","pink","Parth","Kalam","B","Bedsheet and pillow covers"],
  ["Electric screwdriver","Tools",20,"🪛","yellow","Kush","Aryabhatta","D","Basic repair kit"]
].map((x, i) => ({
  id: i + 1,
  name: x[0],
  category: x[1],
  price: x[2],
  period: "day",
  emoji: x[3],
  color: x[4],
  owner: x[5],
  hostel: x[6],
  block: x[7],
  rating: "4.8",
  note: x[8]
}));

const locations = [
  "All campus locations", "Kalam A", "Kalam B", "Kalam C", "Kalam D",
  "Aryabhatta A", "Aryabhatta B", "Aryabhatta C", "Aryabhatta D",
  "CV Raman", "Married Accommodation", "Ashima", "Entire hostel"
];

const categories = [
  "Everything", "Appliances", "Study", "Electronics", "Mobility",
  "Sports", "Furniture", "Books", "Accessories", "Home", "Tools"
];

const emptyListing = {
  name: "",
  category: "Appliances",
  price: "",
  hostel: "Kalam",
  block: "A",
  note: ""
};

const modalStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(8, 18, 32, 0.68)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16
};

const panelStyle = {
  width: "100%",
  maxWidth: 480,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  color: "#132238",
  borderRadius: 18,
  padding: 26,
  boxShadow: "0 24px 80px rgba(0,0,0,.25)"
};

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  marginTop: 6,
  marginBottom: 15,
  border: "1px solid #d9e0e8",
  borderRadius: 9,
  font: "inherit",
  background: "#fff",
  color: "#132238"
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 650
};

function locationLabel(item) {
  return [item.hostel, item.block].filter(Boolean).join(" · ");
}

export default function CampusRent() {
  const [items, setItems] = useState(rawItems);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Everything");
  const [location, setLocation] = useState("All campus locations");
  const [saved, setSaved] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "", email: "", password: ""
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [listingOpen, setListingOpen] = useState(false);
  const [listing, setListing] = useState(emptyListing);
  const [listingLoading, setListingLoading] = useState(false);

const [requestOpen, setRequestOpen] = useState(false);
const [requestItemData, setRequestItemData] = useState(null);
const [requestMode, setRequestMode] = useState("rent");
const [requestPhoto, setRequestPhoto] = useState(null);
const [requestHostel, setRequestHostel] = useState("Kalam");
const [requestBlock, setRequestBlock] = useState("A");
const [requestRoom, setRequestRoom] = useState("");
const [requestLoading, setRequestLoading] = useState(false);

  const filtered = useMemo(() => items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      `${item.name} ${item.category} ${item.hostel} ${item.block} ${item.note}`
        .toLowerCase().includes(q);

    const matchesCategory =
      category === "Everything" || item.category === category;

    const matchesLocation =
      location === "All campus locations" ||
      location === "Entire hostel" ||
      location === item.hostel ||
      location === `${item.hostel} ${item.block}`;

    return matchesSearch && matchesCategory && matchesLocation;
  }), [items, search, category, location]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  
function requestItem(item, mode = "rent") {
  if (!currentUser) {
    showNotice("Please log in to continue.");
    setAuthMode("login");
    setAuthOpen(true);
    return;
  }

  setRequestItemData(item);
  setRequestMode(mode);
  setRequestPhoto(null);
  setRequestHostel(item.hostel || "Kalam");
  setRequestBlock(item.block || "A");
  setRequestRoom("");
  setRequestOpen(true);
}


  async function submitAuth(e) {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const endpoint = authMode === "signup"
        ? "/api/auth/signup"
        : "/api/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (authMode === "signup") {
        showNotice("Account created! Please log in.");
        setAuthMode("login");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: ""
        });
      } else {
        setCurrentUser(data.user);
        setAuthOpen(false);
        setAuthForm({ name: "", email: "", password: "" });
        showNotice(`Welcome${data.user?.name ? `, ${data.user.name}` : ""}!`);
      }
    } catch (error) {
      showNotice(error.message || "Could not connect to the server.");
    } finally {
      setAuthLoading(false);
    }
  }

  
async function submitRequest(e) {
  e.preventDefault();

  if (!currentUser || !requestItemData) {
    showNotice("Please log in and select an item.");
    return;
  }

  if (requestMode === "rent" && !requestPhoto) {
    showNotice("Please upload one photo.");
    return;
  }

  setRequestLoading(true);

  try {
    const formData = new FormData();
    formData.append("itemId", String(requestItemData.id));
    formData.append("itemName", requestItemData.name);
    formData.append("mode", requestMode);
    formData.append("hostel", requestHostel);
    formData.append("block", requestBlock);
    formData.append("room", requestRoom.trim());
    formData.append("userId", String(currentUser.id));

    if (requestPhoto) {
      formData.append("photo", requestPhoto);
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not submit your request.");
    }

    setRequestOpen(false);
    showNotice(
      requestMode === "rent"
        ? "Rental request submitted!"
        : "Buy request submitted! Please complete payment using the QR code."
    );
  } catch (error) {
    showNotice(error.message || "Could not connect to the server.");
  } finally {
    setRequestLoading(false);
  }
}

  return (
    <>
      <SmoothScroll />

      <header className="site-header">
        <a className="brand" href="#home" aria-label="CampusRent home">
          <span className="brand-mark">
            <PackageCheck size={20} strokeWidth={2.4} />
          </span>
          <span>campus<span className="brand-light">rent</span><sup>®</sup></span>
        </a>

        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a href="#explore" onClick={() => setMenuOpen(false)}>Explore rentals</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#community" onClick={() => setMenuOpen(false)}>Our community</a>
        </nav>

        <div className="header-actions">
          <button className="saved-link" onClick={() =>
            showNotice(saved.length
              ? `${saved.length} item(s) saved for later.`
              : "Tap the heart on an item to save it.")
          }>
            <Heart size={16} /> Saved
            <span className="saved-count">{saved.length}</span>
          </button>

          {currentUser ? (
            <button
              className="button button-dark button-small"
              onClick={() => {
                setCurrentUser(null);
                showNotice("Logged out of this page.");
              }}
            >
              {currentUser.name || "Account"} · Log out
            </button>
          ) : (
            <button
              className="button button-dark button-small"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              Log in / Sign up <ArrowRight size={15} />
            </button>
          )}

          <button
            className="button button-dark button-small"
            onClick={() => {
              if (!currentUser) {
                setAuthMode("login");
                setAuthOpen(true);
                showNotice("Log in to list an item.");
              } else {
                setListingOpen(true);
              }
            }}
          >
            List an item <ArrowRight size={15} />
          </button>
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> MADE FOR CAMPUS LIFE
              <span className="eyebrow-line" />
            </div>

            <h1>Need it for a bit?<br /><span>Rent it.</span> <i>Easy.</i></h1>

            <p className="hero-desc">
              The campus sharing spot for the things you need, not the things
              you need to own. Borrow from your neighbours, save your money.
            </p>

            <div className="hero-buttons">
              <a href="#explore" className="button button-dark">
                Find your next thing <ArrowDownRight size={17} />
              </a>
              <a href="#how-it-works" className="text-link">
                How it works <ArrowRight size={15} />
              </a>
            </div>

            <div className="hero-proof">
              <div className="avatar-stack">
                <span>🧑🏽‍🎓</span><span>👩🏻‍🎓</span>
                <span>🧑🏻‍🎓</span><span>👩🏽‍🎓</span>
              </div>
              <div>
                <strong>Campus community, closer.</strong>
                <small>Student-to-student, right where you live.</small>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-topline">
              <span>THE SMARTER WAY TO STUDENT LIFE</span>
              <span>01 / 03</span>
            </div>
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="hero-sun"></div>
            <div className="hero-product kettle">
              <span>🫖</span><small>THE DAILY ESSENTIAL</small>
            </div>
            <div className="hero-product iron"><span>👔</span></div>
            <div className="hero-product lamp"><span>💡</span></div>
            <div className="floating-tag tag-one">
              <Zap size={14} fill="currentColor" /> Starting at ₹8/day
            </div>
            <div className="floating-tag tag-two">
              <MapPin size={14} /> Just around your hostel
            </div>
            <div className="art-bottom">
              <span>LESS BUYING. MORE LIVING.</span>
              <span className="art-arrow"><ArrowDownRight size={20} /></span>
            </div>
          </div>

          <div className="hero-index">
            <span>SCROLL TO EXPLORE</span><div className="scroll-line" />
          </div>
        </section>

        <section className="ticker" aria-label="CampusRent benefits">
          <div className="ticker-track">
            <span>
              Borrow locally <b>✳</b> Spend less <b>✳</b> Share more <b>✳</b>
              Live lighter <b>✳</b> Borrow locally <b>✳</b> Spend less
              <b>✳</b> Share more <b>✳</b> Live lighter <b>✳</b>
            </span>
          </div>
        </section>

        <section className="explore section-wrap" id="explore">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                THE GOOD STUFF <span className="eyebrow-line" />
              </div>
              <h2>Little things.<br /><span>Big difference.</span></h2>
            </div>
            <p>
              From a kettle for chai to a cycle for the weekend—find what you
              need from someone just down the corridor.
            </p>
          </div>

          <div className="search-bar">
            <Search size={19} />
            <input
              aria-label="Search items"
              placeholder="What are you looking for?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="location-select">
              <MapPin size={16} />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Filter by hostel or block"
              >
                {locations.map((loc) => <option key={loc}>{loc}</option>)}
              </select>
            </div>
            <button
              className="filter-button"
              onClick={() => {
                setCategory("Everything");
                setLocation("All campus locations");
                setSearch("");
              }}
            >
              <SlidersHorizontal size={16} /> Reset
            </button>
          </div>

          <div className="category-row" role="group" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
            <span className="result-count">
              {filtered.length} things to discover
            </span>
          </div>

          <div className="product-grid">
            {filtered.map((item, index) => (
              <article
                className="product-card"
                key={item.id}
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className={`product-visual ${item.color || "mint"}`}>
                  <span className="product-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    className={`heart-button ${saved.includes(item.id) ? "is-saved" : ""}`}
                    aria-label={saved.includes(item.id) ? "Remove saved item" : "Save item"}
                    onClick={() => toggleSaved(item.id)}
                  >
                    <Heart
                      size={17}
                      fill={saved.includes(item.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <span className="product-emoji" role="img" aria-label={item.name}>
                    {item.emoji || "📦"}
                  </span>
                  <span className="visual-caption">{item.category.toUpperCase()}</span>
                </div>

                <div className="product-info">
                  <div className="product-topline">
                    <span className="product-category">{item.category}</span>
                    <span className="rating">★ {item.rating || "New"}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p className="product-note">{item.note}</p>
                  <div className="product-location">
                    <MapPin size={13} /> {locationLabel(item)}
                  </div>
                  <div className="product-footer">
                    <div className="price">
                      ₹{item.price}<span> / {item.period || "day"}</span>
                    </div>
                    
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
  <button
    className="rent-button"
    onClick={() => requestItem(item, "rent")}
  >
    Rent item <ArrowRight size={15} />
  </button>

  <button
    className="rent-button"
    onClick={() => requestItem(item, "buy")}
  >
    Buy item <ArrowRight size={15} />
  </button>
</div>

                  </div>
                  <div className="owner-line">
                    <span className="owner-avatar">
                      {(item.owner || "U")[0]}
                    </span>
                    <span>Listed by <b>{item.owner || "Campus user"}</b></span>
                    <span className="verified">
                      <ShieldCheck size={13} /> campus listing
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={28} />
              <h3>No matches just yet</h3>
              <p>Try another search or reset your filters.</p>
            </div>
          )}

          <p className="demo-note">
            Initial listings are sample data. New listings will use the API once
            the backend is connected.
          </p>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-wrap how-inner">
            <div className="how-intro">
              <div className="eyebrow">
                NO FUSS, JUST GOOD STUFF <span className="eyebrow-line" />
              </div>
              <h2>Three steps.<br /><span>That's it.</span></h2>
              <p>Good things are already on campus. They just need to find you.</p>
              <a href="#explore" className="button button-dark">
                Start exploring <ArrowRight size={16} />
              </a>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-num">01</span>
                <div className="step-icon"><Search size={23} /></div>
                <div>
                  <h3>Find your thing</h3>
                  <p>Search by item, category, hostel or block. Your next useful thing might be two doors away.</p>
                </div>
                <ArrowDownRight className="step-arrow" size={21} />
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <div className="step-icon"><Coffee size={23} /></div>
                <div>
                  <h3>Connect & agree</h3>
                  <p>Coordinate with the student listing it, then agree on pickup, return and rental details.</p>
                </div>
                <ArrowDownRight className="step-arrow" size={21} />
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <div className="step-icon"><Sparkles size={23} /></div>
                <div>
                  <h3>Use it. Return it.</h3>
                  <p>Enjoy what you need, return it as agreed, and help someone else borrow smarter.</p>
                </div>
                <ArrowDownRight className="step-arrow" size={21} />
              </div>
            </div>
          </div>
        </section>

        <section className="community section-wrap" id="community">
          <div className="community-card">
            <div className="community-copy">
              <div className="eyebrow">GOOD FOR YOU. GOOD FOR CAMPUS.</div>
              <h2>Own less.<br /><span>Do more.</span></h2>
              <p>
                Why buy something you'll use twice? Keep useful things moving
                around campus—and keep a little more money in your pocket.
              </p>
              <button
                className="button button-light"
                onClick={() => {
                  if (currentUser) setListingOpen(true);
                  else {
                    setAuthMode("signup");
                    setAuthOpen(true);
                  }
                }}
              >
                Be part of it <ArrowRight size={16} />
              </button>
            </div>
            <div className="community-art">
              <div className="community-circle circle-a"></div>
              <div className="community-circle circle-b"></div>
              <div className="community-sticker sticker-a">SHARE<br />THE LOVE ✳</div>
              <div className="community-sticker sticker-b">USEFUL THINGS<br />LIVE LONGER</div>
              <span className="community-emoji e1">🪴</span>
              <span className="community-emoji e2">🎧</span>
              <span className="community-emoji e3">📚</span>
              <span className="community-emoji e4">☕</span>
            </div>
          </div>
        </section>

        <section className="list-section section-wrap" id="list-item">
          <div className="list-banner">
            <div>
              <div className="eyebrow">
                GOT SOMETHING LYING AROUND? <span className="eyebrow-line" />
              </div>
              <h2>Someone could<br />use <span>that.</span></h2>
            </div>
            <div className="list-action">
              <p>
                Give your rarely-used stuff a second life. List it for your
                campus neighbours and earn a little on the side.
              </p>
              <button
                className="button button-dark"
                onClick={() => {
                  if (currentUser) setListingOpen(true);
                  else {
                    setAuthMode("login");
                    setAuthOpen(true);
                    showNotice("Log in to create a listing.");
                  }
                }}
              >
                List your first item <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark"><PackageCheck size={20} /></span>
            <span>campus<span className="brand-light">rent</span><sup>®</sup></span>
          </a>
          <p>A little sharing goes a long way.<br />Made for campus, with love. ♡</p>
          <a href="#home" className="back-top">
            BACK TO TOP <ArrowDownRight size={15} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CampusRent. All rights reserved.</span>
          <span>Made with ♥ for the campus community</span>
          <span className="footer-note">CAMPUS RENTALS</span>
        </div>
      </footer>

      {authOpen && (
        <div style={modalStyle} onMouseDown={(e) => {
          if (e.target === e.currentTarget) setAuthOpen(false);
        }}>
          <section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: 12, letterSpacing: 1 }}>
                  CAMPUSRENT ACCOUNT
                </p>
                <h2 id="auth-title" style={{ margin: 0, fontSize: 25 }}>
                  {authMode === "signup" ? "Create an account" : "Welcome back"}
                </h2>
              </div>
              <button aria-label="Close" onClick={() => setAuthOpen(false)} style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                <X />
              </button>
            </div>

            <form onSubmit={submitAuth} style={{ marginTop: 24 }}>
              {authMode === "signup" && (
                <label style={labelStyle}>
                  Full name
                  <input
                    style={fieldStyle}
                    required
                    maxLength={80}
                    autoComplete="name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </label>
              )}

              <label style={labelStyle}>
                Email address
                <input
                  style={fieldStyle}
                  type="email"
                  required
                  autoComplete="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>

              <label style={labelStyle}>
                Password
                <input
                  style={fieldStyle}
                  type="password"
                  required
                  minLength={8}
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </label>

              <button
                className="button button-dark"
                type="submit"
                disabled={authLoading}
                style={{ width: "100%", justifyContent: "center", opacity: authLoading ? 0.7 : 1 }}
              >
                {authLoading ? "Please wait..." : authMode === "signup" ? "Create account" : "Log in"}
                <ArrowRight size={16} />
              </button>
            </form>

            <p style={{ marginBottom: 0, marginTop: 20, fontSize: 14, textAlign: "center" }}>
              {authMode === "signup" ? "Already have an account? " : "New to CampusRent? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signup" ? "login" : "signup");
                  setAuthForm({ name: "", email: authForm.email, password: "" });
                }}
                style={{ border: 0, padding: 0, background: "transparent", color: "#1769aa", cursor: "pointer", fontWeight: 700 }}
              >
                {authMode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>
          </section>
        </div>
      )}

     
      {requestOpen && requestItemData && (
        <div
          style={modalStyle}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRequestOpen(false);
          }}
        >
          <section
            style={panelStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-title"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: 12 }}>
                  CAMPUS ITEM REQUEST
                </p>
                <h2 id="request-title" style={{ margin: 0, fontSize: 25 }}>
                  {requestMode === "rent" ? "Rent item" : "Buy item"}
                </h2>
                <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                  {requestItemData.name}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setRequestOpen(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X />
              </button>
            </div>

            <form onSubmit={submitRequest} style={{ marginTop: 24 }}>
              {requestMode === "rent" && (
                <label style={labelStyle}>
                  Upload one photo *
                  <input
                    type="file"
                    accept="image/*"
                    required
                    style={fieldStyle}
                    onChange={(e) =>
                      setRequestPhoto(e.target.files?.[0] || null)
                    }
                  />
                </label>
              )}

              <label style={labelStyle}>
                Hostel *
                <select
                  required
                  style={fieldStyle}
                  value={requestHostel}
                  onChange={(e) => setRequestHostel(e.target.value)}
                >
                  {[
                    "Kalam",
                    "Aryabhatta",
                    "CV Raman",
                    "Married Accommodation",
                    "Ashima",
                    "Entire hostel",
                  ].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={labelStyle}>
                  Block *
                  <select
                    required
                    style={fieldStyle}
                    value={requestBlock}
                    onChange={(e) => setRequestBlock(e.target.value)}
                  >
                    {["A", "B", "C", "D", "N/A"].map((x) => (
                      <option key={x} value={x === "N/A" ? "" : x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Room number *
                  <input
                    required
                    style={fieldStyle}
                    value={requestRoom}
                    onChange={(e) => setRequestRoom(e.target.value)}
                    placeholder="e.g. 214"
                    maxLength={20}
                  />
                </label>
              </div>

              {requestMode === "buy" && (
                <div style={{ textAlign: "center", margin: "16px 0" }}>
                  <h3 style={{ marginBottom: 8 }}>Pay using PhonePe</h3>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    Scan this QR code with your payment app.
                  </p>
                  <img
                    src="/phonepe-qr.jpg"
                    alt="PhonePe payment QR code"
                    style={{
                      width: 240,
                      maxWidth: "100%",
                      height: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                    }}
                  />
                  <p style={{ color: "#64748b", fontSize: 12 }}>
                    Confirm the amount with the seller before paying.
                  </p>
                </div>
              )}

              <button
                className="button button-dark"
                type="submit"
                disabled={requestLoading}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: requestLoading ? 0.7 : 1,
                }}
              >
                {requestLoading
                  ? "Submitting..."
                  : requestMode === "rent"
                    ? "Submit rental request"
                    : "Submit buy request"}
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      )}

    </>
  );
}
