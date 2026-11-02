"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  PackageCheck, ArrowLeft, Phone, MessageSquare, CheckCircle,
  XCircle, Clock, Trash2, Plus, RefreshCw, Eye, AlertCircle,
  Filter, Search, MapPin, ShieldCheck, Tag, ShoppingCart, Lock,
  LogOut, KeyRound, UserCheck, Users, BadgeCheck, Check, Info
} from "lucide-react";

export default function AdminDashboard() {
  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "admin@campusrent.com",
    password: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard state
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "sellers" | "inventory"
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [dbCounts, setDbCounts] = useState({});
  const [fcfsSellers, setFcfsSellers] = useState({});
  const [selectedProduct, setSelectedProduct] = useState("Cycle");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState("");

  // Filters
  const [requestFilterMode, setRequestFilterMode] = useState("all");
  const [requestFilterStatus, setRequestFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal for previewing uploaded user photo
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // New Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Appliances",
    price: "",
    period: "day",
    quantity: 1,
    hostel: "Kalam",
    block: "A",
    room: "",
    note: "",
    emoji: "📦",
    ownerName: "Campus Admin",
    sellerName: "Student Seller",
    sellerPhone: "",
    photo: "",
  });

  const [convertModalRequest, setConvertModalRequest] = useState(null);

  function showToast(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4500);
  }

  // Check existing admin session in sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem("campusrent_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
    }
  }, []);

  // When admin is authenticated, load requests and inventory
  useEffect(() => {
    if (isAdminAuthenticated && adminToken) {
      loadData(adminToken);
    }
  }, [isAdminAuthenticated, adminToken]);

  // Handle Admin Login submission
  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid admin credentials.");
      }

      sessionStorage.setItem("campusrent_admin_token", data.token);
      setAdminToken(data.token);
      setIsAdminAuthenticated(true);
      showToast("Welcome to CampusRent Admin Console!");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  // Handle Admin Logout
  function handleAdminLogout() {
    sessionStorage.removeItem("campusrent_admin_token");
    setAdminToken("");
    setIsAdminAuthenticated(false);
    setRequests([]);
    setListings([]);
    setFcfsSellers({});
    showToast("Logged out of Admin Console.");
  }

  // Fetch both requests and listings from DB with admin authorization header
  async function loadData(token = adminToken) {
    setLoading(true);
    try {
      const [reqRes, listRes] = await Promise.all([
        fetch("/api/requests", {
          headers: {
            "x-admin-token": token,
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/listings"),
      ]);

      const reqData = await reqRes.json();
      const listData = await listRes.json();

      if (reqRes.status === 401) {
        handleAdminLogout();
        setLoginError("Your admin session expired. Please log in again.");
        return;
      }

      if (reqRes.ok) setRequests(reqData.requests || []);
      if (listRes.ok) {
        setListings(listData.listings || []);
        setDbCounts(listData.counts || {});
        setFcfsSellers(listData.fcfsSellers || {});
        const productNames = Object.keys(listData.fcfsSellers || {});
        if (productNames.length > 0 && !selectedProduct) {
          setSelectedProduct(productNames[0]);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server. Please check MongoDB.");
    } finally {
      setLoading(false);
    }
  }

  // Update request status (pending, contacted, verified, rejected)
  // Approving a BUY request automatically decreases product stock in DB!
  async function handleUpdateStatus(id, newStatus) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update request");

      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
      );

      showToast(`Request marked as "${newStatus}"! Dynamic DB stock updated.`);
      loadData();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Update seller listing status (available, lent, etc.)
  async function handleUpdateSellerListing(id, newStatus) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update listing");

      showToast(`Seller listing marked as ${newStatus}!`);
      loadData();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Delete a request
  async function handleDeleteRequest(id) {
    if (!confirm("Are you sure you want to delete this request record?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete request");

      setRequests((prev) => prev.filter((r) => r._id !== id));
      showToast("Request record deleted.");
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Delete a product from DB listings
  async function handleDeleteProduct(id, name) {
    if (!confirm(`Are you sure you want to remove "${name}" from database listings?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/listings?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove product");

      setListings((prev) => prev.filter((item) => item._id !== id));
      showToast(`"${name}" removed from database!`);
      loadData();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Add new product into DB listings
  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      showToast("Please provide a product name.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price) || 0,
          quantity: Number(newProduct.quantity) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not add product");

      showToast(`"${newProduct.name}" added to database and placed in FCFS queue!`);
      setShowAddForm(false);
      setNewProduct({
        name: "",
        category: "Appliances",
        price: "",
        period: "day",
        quantity: 1,
        hostel: "Kalam",
        block: "A",
        room: "",
        note: "",
        emoji: "📦",
        ownerName: "Campus Admin",
        sellerName: "Student Seller",
        sellerPhone: "",
        photo: "",
      });
      loadData();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Convert a verified request into a live database listing
  function openConvertModal(req) {
    setNewProduct({
      name: req.itemName,
      category: "Appliances",
      price: 25,
      period: "day",
      quantity: 1,
      hostel: req.hostel || "Kalam",
      block: req.block || "A",
      room: req.room || "",
      note: `Verified from user request (${req.phone})`,
      emoji: "📦",
      ownerName: req.userName || `Student (${req.hostel})`,
      sellerName: req.userName || `Student (${req.hostel})`,
      sellerPhone: req.phone || "",
      photo: req.photo || "",
    });
    setConvertModalRequest(req);
    setShowAddForm(true);
    setActiveTab("inventory");
  }

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesMode =
        requestFilterMode === "all" || r.mode === requestFilterMode;
      const matchesStatus =
        requestFilterStatus === "all" || r.status === requestFilterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.itemName?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.hostel?.toLowerCase().includes(q) ||
        r.room?.toLowerCase().includes(q) ||
        r.userName?.toLowerCase().includes(q);
      return matchesMode && matchesStatus && matchesSearch;
    });
  }, [requests, requestFilterMode, requestFilterStatus, searchQuery]);

  // Statistics
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const verifiedCount = requests.filter((r) => r.status === "verified").length;
  const totalStockCount = listings.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Available product types for FCFS sellers
  const availableProductTypes = Object.keys(fcfsSellers);

  // =========================================================================
  // VIEW 1: LOCKED ADMIN LOGIN SCREEN (When not authenticated)
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#17251f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'DM Sans', sans-serif",
          color: "#f5f6ef",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 54,
                height: 54,
                background: "#c8f169",
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                color: "#17251f",
              }}
            >
              <Lock size={26} strokeWidth={2.4} />
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>
              CampusRent Admin Portal
            </h1>
            <p style={{ margin: 0, color: "#9ca899", fontSize: 13 }}>
              Authorized campus administrator credentials required to access customer requests, FCFS seller contacts, and inventory controls.
            </p>
          </div>

          <form
            onSubmit={handleAdminLogin}
            style={{
              background: "#203028",
              border: "1px solid #2d4237",
              borderRadius: 12,
              padding: "28px 24px",
              boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
            }}
          >
            {loginError && (
              <div
                style={{
                  background: "#451a1a",
                  border: "1px solid #7f1d1d",
                  color: "#fca5a5",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
              </div>
            )}

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "#a5b4a2", marginBottom: 6 }}>
                ADMIN EMAIL
              </span>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="admin@campusrent.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#17251f",
                  border: "1px solid #334a3e",
                  borderRadius: 6,
                  padding: "10px 13px",
                  color: "#f5f6ef",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 22 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "#a5b4a2", marginBottom: 6 }}>
                ADMIN PASSWORD / KEY
              </span>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter admin password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#17251f",
                  border: "1px solid #334a3e",
                  borderRadius: 6,
                  padding: "10px 13px",
                  color: "#f5f6ef",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%",
                background: "#c8f169",
                color: "#17251f",
                border: 0,
                borderRadius: 6,
                padding: "12px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <KeyRound size={16} />
              {loginLoading ? "Verifying..." : "Unlock Admin Console"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link
              href="/"
              style={{
                fontSize: 12,
                color: "#9ca899",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={14} /> Return to Campus Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f5", color: "#17251f" }}>
      {/* Header */}
      <header
        style={{
          height: 75,
          padding: "0 5%",
          background: "rgba(247, 247, 241, 0.96)",
          borderBottom: "1px solid #e2e6dc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#3d4b3f",
              textDecoration: "none",
              background: "#e8ede2",
              padding: "7px 13px",
              borderRadius: 6,
            }}
          >
            <ArrowLeft size={16} /> Marketplace
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: "#c8f169",
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              <PackageCheck size={18} />
            </span>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              CampusRent <span style={{ color: "#74866e", fontWeight: 500 }}>Admin Console</span>
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 12,
              background: "#e2e8dc",
              color: "#283b27",
              padding: "5px 11px",
              borderRadius: 20,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <UserCheck size={14} /> Admin Authenticated
          </span>

          <button
            onClick={() => loadData()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#ffffff",
              border: "1px solid #d8dfd1",
              padding: "7px 13px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={handleAdminLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "7px 13px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "30px 20px 80px" }}>
        {/* Notice Banner */}
        <div
          style={{
            background: "#17251f",
            color: "#f5f6ef",
            borderRadius: 10,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: "0 8px 24px rgba(23, 37, 31, 0.08)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#c8f169",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: "monospace",
              }}
            >
              <ShieldCheck size={14} /> ADMIN INTERMEDIARY & FCFS DISPATCH DESK
            </div>
            <h2 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 800 }}>
              Campus Verification & Seller Contact Desk
            </h2>
            <p style={{ margin: 0, color: "#9ca899", fontSize: 13, maxWidth: 780, lineHeight: 1.5 }}>
              ⚡ <b>Dynamic Stock Tracking:</b> Approving a buyer request automatically decreases stock count in DB. Approving a rental product increases stock.
              <br />
              📋 <b>FCFS Seller Queue:</b> Look up the First-Come, First-Served queue of student sellers per listing (e.g. Cycle, Kettle), call the seller directly, and negotiate or arrange item pickup.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveTab("inventory");
              setShowAddForm(true);
            }}
            style={{
              background: "#c8f169",
              color: "#17251f",
              border: 0,
              borderRadius: 6,
              padding: "11px 18px",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Product to DB
          </button>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: 8,
              border: "1px solid #e1e7dc",
            }}
          >
            <span style={{ fontSize: 11, color: "#6e7b6d", fontWeight: 700, letterSpacing: 0.5 }}>
              TOTAL REQUESTS
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {requests.length}
            </div>
            <span style={{ fontSize: 12, color: "#8a9688" }}>
              Buyer + Rental submissions
            </span>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: 8,
              border: "1px solid #fcd34d",
              boxShadow: pendingCount > 0 ? "0 4px 14px rgba(245, 158, 11, 0.12)" : "none",
            }}
          >
            <span style={{ fontSize: 11, color: "#b45309", fontWeight: 700, letterSpacing: 0.5 }}>
              PENDING VERIFICATION
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "#d97706" }}>
              {pendingCount}
            </div>
            <span style={{ fontSize: 12, color: "#92400e" }}>
              Require admin phone contact
            </span>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: 8,
              border: "1px solid #e1e7dc",
            }}
          >
            <span style={{ fontSize: 11, color: "#6e7b6d", fontWeight: 700, letterSpacing: 0.5 }}>
              PRODUCT TYPES IN DB
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {availableProductTypes.length || listings.length}
            </div>
            <span style={{ fontSize: 12, color: "#8a9688" }}>
              Active product listings
            </span>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: 8,
              border: "1px solid #e1e7dc",
            }}
          >
            <span style={{ fontSize: 11, color: "#6e7b6d", fontWeight: 700, letterSpacing: 0.5 }}>
              REAL INVENTORY UNITS
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "#166534" }}>
              {totalStockCount} units
            </div>
            <span style={{ fontSize: 12, color: "#8a9688" }}>
              Strict database count
            </span>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "2px solid #e2e8dc",
            marginBottom: 24,
            paddingBottom: 4,
          }}
        >
          <button
            onClick={() => setActiveTab("requests")}
            style={{
              background: "transparent",
              border: 0,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              color: activeTab === "requests" ? "#17251f" : "#6f7d6e",
              borderBottom: activeTab === "requests" ? "3px solid #17251f" : "3px solid transparent",
              marginBottom: -6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShoppingCart size={16} /> Buyer & Rental Requests ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab("sellers")}
            style={{
              background: "transparent",
              border: 0,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              color: activeTab === "sellers" ? "#17251f" : "#6f7d6e",
              borderBottom: activeTab === "sellers" ? "3px solid #17251f" : "3px solid transparent",
              marginBottom: -6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Users size={16} /> FCFS Sellers Directory (Listing-Wise)
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              background: "transparent",
              border: 0,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              color: activeTab === "inventory" ? "#17251f" : "#6f7d6e",
              borderBottom: activeTab === "inventory" ? "3px solid #17251f" : "3px solid transparent",
              marginBottom: -6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Tag size={16} /> All Database Products ({listings.length})
          </button>
        </div>

        {/* ================= TAB 1: REQUESTS MANAGEMENT ================= */}
        {activeTab === "requests" && (
          <div>
            {/* Filter Bar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {/* Search */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#ffffff",
                    border: "1px solid #d8dfd1",
                    borderRadius: 6,
                    padding: "7px 12px",
                    width: 240,
                  }}
                >
                  <Search size={15} color="#8a9688" />
                  <input
                    placeholder="Search item, phone, hostel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 0, outline: 0, background: "transparent", fontSize: 12, width: "100%" }}
                  />
                </div>

                {/* Filter Mode */}
                <div style={{ display: "flex", gap: 4, background: "#e8ede2", padding: 3, borderRadius: 6 }}>
                  {["all", "rent", "buy"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setRequestFilterMode(m)}
                      style={{
                        border: 0,
                        background: requestFilterMode === m ? "#ffffff" : "transparent",
                        color: requestFilterMode === m ? "#17251f" : "#617060",
                        padding: "5px 12px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Filter Status */}
                <select
                  value={requestFilterStatus}
                  onChange={(e) => setRequestFilterStatus(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d8dfd1",
                    borderRadius: 6,
                    padding: "7px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Verification</option>
                  <option value="contacted">Customer Contacted</option>
                  <option value="verified">Verified / Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: "#6e7b6d" }}>
                Showing <b>{filteredRequests.length}</b> request(s)
              </div>
            </div>

            {/* Requests Table / Cards */}
            {filteredRequests.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  padding: "60px 20px",
                  borderRadius: 8,
                  textAlign: "center",
                  border: "1px dashed #cfd8ca",
                }}
              >
                <AlertCircle size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
                <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>No requests match your filter</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  When students request to rent or buy items on the marketplace, they will appear here with their contact details.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {filteredRequests.map((req) => {
                  const cleanPhone = (req.phone || "").replace(/\D/g, "");
                  const isRent = req.mode === "rent";

                  return (
                    <article
                      key={req._id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e1e7dc",
                        borderRadius: 8,
                        padding: "18px 20px",
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1.3fr 1.3fr 1fr",
                        gap: 20,
                        alignItems: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      }}
                    >
                      {/* Item Details */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 4,
                              background: isRent ? "#e0f2fe" : "#fef3c7",
                              color: isRent ? "#0369a1" : "#92400e",
                              textTransform: "uppercase",
                              fontFamily: "monospace",
                            }}
                          >
                            {req.mode}
                          </span>
                          <span style={{ fontSize: 11, color: "#8a9688", fontFamily: "monospace" }}>
                            ID: {req.itemId}
                          </span>
                        </div>

                        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
                          {req.itemName}
                        </h3>

                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Requested: {new Date(req.createdAt).toLocaleDateString()} at{" "}
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      {/* Requester & Location */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#17251f" }}>
                          {req.userName || "Campus Student"}
                        </div>
                        <div style={{ fontSize: 12, color: "#546253", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={13} /> Hostel {req.hostel} · Block {req.block || "A"} · Room {req.room}
                        </div>
                        {req.photo && (
                          <button
                            onClick={() => setPreviewPhoto(req.photo)}
                            style={{
                              marginTop: 8,
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 11,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={13} /> View Verification Photo
                          </button>
                        )}
                      </div>

                      {/* Contact Phone & Actions */}
                      <div>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                          MANDATORY CONTACT NUMBER:
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                          📞 {req.phone || "Not provided"}
                        </div>

                        {req.phone && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <a
                              href={`tel:${cleanPhone}`}
                              style={{
                                background: "#0284c7",
                                color: "#ffffff",
                                padding: "5px 10px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Phone size={12} /> Call
                            </a>

                            <a
                              href={`https://wa.me/91${cleanPhone}?text=Hi%2C%20this%20is%20CampusRent%20Admin%20regarding%20your%20request%20for%20${encodeURIComponent(req.itemName)}.`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: "#16a34a",
                                color: "#ffffff",
                                padding: "5px 10px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <MessageSquare size={12} /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Status & Action Buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Status Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 9px",
                              borderRadius: 20,
                              background:
                                req.status === "verified"
                                  ? "#dcfce7"
                                  : req.status === "contacted"
                                  ? "#dbeafe"
                                  : req.status === "rejected"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                req.status === "verified"
                                  ? "#166534"
                                  : req.status === "contacted"
                                  ? "#1e40af"
                                  : req.status === "rejected"
                                  ? "#991b1b"
                                  : "#92400e",
                            }}
                          >
                            ● {req.status?.toUpperCase() || "PENDING"}
                          </span>
                        </div>

                        {/* Status Select dropdown */}
                        <select
                          value={req.status || "pending"}
                          onChange={(e) => handleUpdateStatus(req._id, e.target.value)}
                          disabled={actionLoading}
                          style={{
                            fontSize: 11,
                            padding: "6px 8px",
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="contacted">Mark Contacted</option>
                          <option value="verified">Verify & Approve (Updates DB Stock)</option>
                          <option value="rejected">Mark Rejected</option>
                        </select>

                        {/* Add to Active Listings button (for verified rentals) */}
                        <button
                          onClick={() => openConvertModal(req)}
                          title="Add this verified item into public database listings"
                          style={{
                            background: "#e8ede2",
                            border: "1px solid #ccd8c5",
                            color: "#283b27",
                            padding: "6px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Plus size={13} /> Add to DB Listings
                        </button>

                        <button
                          onClick={() => handleDeleteRequest(req._id)}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "#ef4444",
                            fontSize: 11,
                            cursor: "pointer",
                            textAlign: "right",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 4,
                            padding: "2px 0",
                          }}
                        >
                          <Trash2 size={12} /> Delete record
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: FCFS SELLERS DIRECTORY (LISTING-WISE) ================= */}
        {activeTab === "sellers" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
                First-Come, First-Served (FCFS) Seller Contact Directory
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Select any listing below (e.g. <b>Cycle</b>, <b>Electric kettle</b>). You will see the exact queue of student sellers who offered that item in chronological order. Contact the #1 FCFS seller personally to ask for the product!
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
              {/* Left Column: Product Selection */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e1e7dc",
                  borderRadius: 8,
                  padding: "14px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#788476", padding: "4px 8px", letterSpacing: 0.5 }}>
                  SELECT PRODUCT CATEGORY
                </div>

                {availableProductTypes.map((prodName) => {
                  const sellers = fcfsSellers[prodName] || [];
                  const isSelected = selectedProduct.toLowerCase() === prodName.toLowerCase();

                  return (
                    <button
                      key={prodName}
                      onClick={() => setSelectedProduct(prodName)}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: isSelected ? "2px solid #17251f" : "1px solid #edf0e7",
                        background: isSelected ? "#e9f2e4" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#17251f" }}>
                          {prodName}
                        </div>
                        <div style={{ fontSize: 11, color: "#6e7b6d" }}>
                          {sellers.length} seller{sellers.length !== 1 ? "s" : ""} queued
                        </div>
                      </div>

                      <span
                        style={{
                          background: isSelected ? "#17251f" : "#edf0e7",
                          color: isSelected ? "#c8f169" : "#4b574a",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 7px",
                          borderRadius: 12,
                          fontFamily: "monospace",
                        }}
                      >
                        FCFS
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: FCFS Queue for Selected Product */}
              <div>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e1e7dc",
                    borderRadius: 8,
                    padding: "20px 22px",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      ACTIVE LENDER QUEUE
                    </span>
                    <h3 style={{ margin: "4px 0 2px", fontSize: 22, fontWeight: 800 }}>
                      {selectedProduct} Sellers ({ (fcfsSellers[selectedProduct] || []).length } in queue)
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      Sorted strictly by submission date (First-Come First-Served). Contact #1 seller first.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewProduct({
                        ...newProduct,
                        name: selectedProduct,
                      });
                      setShowAddForm(true);
                      setActiveTab("inventory");
                    }}
                    style={{
                      background: "#17251f",
                      color: "#c8f169",
                      border: 0,
                      borderRadius: 6,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add Seller for {selectedProduct}
                  </button>
                </div>

                {/* Queue list */}
                {(!fcfsSellers[selectedProduct] || fcfsSellers[selectedProduct].length === 0) ? (
                  <div style={{ background: "#ffffff", padding: 40, borderRadius: 8, textAlign: "center", border: "1px dashed #d1d8cb" }}>
                    <p style={{ margin: 0, color: "#64748b" }}>No sellers currently listed for {selectedProduct}.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {fcfsSellers[selectedProduct].map((seller, index) => {
                      const cleanPhone = (seller.sellerPhone || "").replace(/\D/g, "");
                      const isFirst = index === 0;

                      return (
                        <div
                          key={seller.id || index}
                          style={{
                            background: isFirst ? "#fafff5" : "#ffffff",
                            border: isFirst ? "2px solid #84cc16" : "1px solid #e1e7dc",
                            borderRadius: 8,
                            padding: "16px 20px",
                            display: "grid",
                            gridTemplateColumns: "70px 1.4fr 1.3fr 1.2fr",
                            gap: 16,
                            alignItems: "center",
                            boxShadow: isFirst ? "0 4px 14px rgba(132, 204, 22, 0.12)" : "none",
                          }}
                        >
                          {/* FCFS Rank */}
                          <div style={{ textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background: isFirst ? "#84cc16" : "#e8ede2",
                                color: isFirst ? "#ffffff" : "#243d26",
                                fontWeight: 800,
                                fontSize: 16,
                                lineHeight: "38px",
                              }}
                            >
                              #{index + 1}
                            </span>
                            <div style={{ fontSize: 9, fontWeight: 700, color: isFirst ? "#4d7c0f" : "#8a9688", marginTop: 4 }}>
                              {isFirst ? "TOP PRIORITY" : "FCFS QUEUE"}
                            </div>
                          </div>

                          {/* Seller Details */}
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#17251f" }}>
                              {seller.sellerName}
                            </div>
                            <div style={{ fontSize: 12, color: "#546253", marginTop: 2 }}>
                              📍 Hostel {seller.hostel} · Block {seller.block || "A"} {seller.room ? `· Room ${seller.room}` : ""}
                            </div>
                            <div style={{ fontSize: 11, color: "#788476", marginTop: 4 }}>
                              📝 Note: {seller.note || "Available for campus rental"}
                            </div>
                            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 4 }}>
                              ₹{seller.price}/{seller.period} · 💬 Open to Bargain
                            </div>
                          </div>

                          {/* Phone Contact */}
                          <div>
                            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 0.5 }}>
                              SELLER DIRECT CONTACT:
                            </span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                              📞 {seller.sellerPhone || "Contact via Student Directory"}
                            </div>

                            {seller.sellerPhone && (
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <a
                                  href={`tel:${cleanPhone}`}
                                  style={{
                                    background: "#0284c7",
                                    color: "#ffffff",
                                    padding: "5px 10px",
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Phone size={12} /> Call Seller
                                </a>

                                <a
                                  href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(seller.sellerName)}%2C%20this%20is%20CampusRent%20Admin.%20We%20have%20a%20student%20who%20wants%20to%20rent%20your%20${encodeURIComponent(selectedProduct)}.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    background: "#16a34a",
                                    color: "#ffffff",
                                    padding: "5px 10px",
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <MessageSquare size={12} /> WhatsApp
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 4,
                                background: seller.status === "lent" ? "#fef3c7" : "#dcfce7",
                                color: seller.status === "lent" ? "#92400e" : "#166534",
                                textAlign: "center",
                              }}
                            >
                              Status: {seller.status?.toUpperCase() || "AVAILABLE"}
                            </span>

                            {seller.status !== "lent" ? (
                              <button
                                onClick={() => handleUpdateSellerListing(seller.id, "lent")}
                                style={{
                                  background: "#17251f",
                                  color: "#c8f169",
                                  border: 0,
                                  padding: "7px 10px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                }}
                              >
                                <Check size={13} /> Lend From This Seller
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateSellerListing(seller.id, "available")}
                                style={{
                                  background: "#e8ede2",
                                  border: "1px solid #ccd8c5",
                                  color: "#283b27",
                                  padding: "7px 10px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Return / Mark Available
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ALL DATABASE PRODUCTS ================= */}
        {activeTab === "inventory" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                  Active Database Listings & Stock Counts
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Products stored in MongoDB. The stock counts shown here directly appear on each product card on the main marketplace.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: showAddForm ? "#e2e8dc" : "#17251f",
                  color: showAddForm ? "#17251f" : "#ffffff",
                  border: 0,
                  borderRadius: 6,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> {showAddForm ? "Close Form" : "Add New Product"}
              </button>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
              <form
                onSubmit={handleCreateProduct}
                style={{
                  background: "#ffffff",
                  border: "2px solid #c8f169",
                  borderRadius: 10,
                  padding: "24px 26px",
                  marginBottom: 24,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                    Add Rental / Buy Product to Database
                  </h3>
                  {convertModalRequest && (
                    <span style={{ fontSize: 12, color: "#166534", background: "#dcfce7", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                      Populated from Request: {convertModalRequest.itemName} ({convertModalRequest.phone})
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Product Name *
                    <input
                      required
                      placeholder="e.g. Cycle, Electric Kettle, Study Table..."
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Category *
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    >
                      {["Appliances", "Study", "Electronics", "Mobility", "Sports", "Furniture", "Books", "Accessories", "Home", "Tools"].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Price (₹) *
                    <input
                      type="number"
                      required
                      placeholder="25"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Quantity (Available Count in DB) *
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="1"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Seller Name *
                    <input
                      required
                      placeholder="e.g. Sana or Student Seller"
                      value={newProduct.sellerName}
                      onChange={(e) => setNewProduct({ ...newProduct, sellerName: e.target.value, ownerName: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Seller Phone Number *
                    <input
                      required
                      placeholder="e.g. 9876543210 (for FCFS lender queue)"
                      value={newProduct.sellerPhone}
                      onChange={(e) => setNewProduct({ ...newProduct, sellerPhone: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Hostel Location *
                    <select
                      value={newProduct.hostel}
                      onChange={(e) => setNewProduct({ ...newProduct, hostel: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    >
                      {["Kalam", "Aryabhatta", "CV Raman", "Married Accommodation", "Ashima", "Entire hostel"].map(
                        (h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Block
                    <input
                      placeholder="e.g. A, B, C..."
                      value={newProduct.block}
                      onChange={(e) => setNewProduct({ ...newProduct, block: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Room Number
                    <input
                      placeholder="e.g. 214"
                      value={newProduct.room}
                      onChange={(e) => setNewProduct({ ...newProduct, room: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Note / Condition Details
                    <input
                      placeholder="e.g. Excellent condition · tested working"
                      value={newProduct.note}
                      onChange={(e) => setNewProduct({ ...newProduct, note: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: "#17251f",
                      color: "#c8f169",
                      border: 0,
                      borderRadius: 6,
                      padding: "10px 22px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {actionLoading ? "Saving..." : "Save Product & Enter into FCFS Queue"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setConvertModalRequest(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "10px 18px",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Listings Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {listings.map((item) => {
                const countInDb = dbCounts[item.name.toLowerCase().trim()] || item.quantity || 0;

                return (
                  <div
                    key={item._id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e1e7dc",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: 32 }}>{item.emoji || "📦"}</span>
                        <span
                          style={{
                            background: countInDb > 0 ? "#dcfce7" : "#fee2e2",
                            color: countInDb > 0 ? "#166534" : "#991b1b",
                            border: `1px solid ${countInDb > 0 ? "#bbf7d0" : "#fecaca"}`,
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "monospace",
                            fontWeight: 700,
                          }}
                        >
                          {countInDb > 0 ? `Count in DB: ${countInDb}` : "Out of Stock"}
                        </span>
                      </div>

                      <h4 style={{ margin: "10px 0 4px", fontSize: 16, fontWeight: 800 }}>
                        {item.name}
                      </h4>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {item.category}
                      </div>

                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#526052" }}>
                        {item.note || "Standard campus listing"}
                      </p>

                      <div style={{ fontSize: 11, color: "#788476", marginTop: 8 }}>
                        📍 {item.hostel} {item.block ? `· Block ${item.block}` : ""} {item.room ? `· Room ${item.room}` : ""}
                      </div>

                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: "#17251f" }}>
                        ₹{item.price} <span style={{ fontSize: 11, fontWeight: 500, color: "#8a9688" }}>/ {item.period || "day"}</span>
                        <span style={{ fontSize: 11, color: "#059669", marginLeft: 8, fontWeight: 600 }}>💬 Negotiable</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid #edf0e7",
                        marginTop: 14,
                        paddingTop: 10,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#8a9688" }}>
                        Seller: <b>{item.sellerName || item.ownerName || "Student"}</b>
                        {item.sellerPhone && <div style={{ fontSize: 10, color: "#0284c7" }}>📞 {item.sellerPhone}</div>}
                      </span>

                      <button
                        onClick={() => handleDeleteProduct(item._id, item.name)}
                        disabled={actionLoading}
                        title="Remove product from database"
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#991b1b",
                          borderRadius: 4,
                          padding: "5px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal: View Uploaded Photo Preview */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 8,
              padding: 16,
              maxWidth: 520,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h4 style={{ margin: "0 0 12px", fontSize: 15 }}>Uploaded Verification Document / Item</h4>
            <img
              src={previewPhoto}
              alt="Verification attachment"
              style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 6, objectFit: "contain" }}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{
                marginTop: 14,
                background: "#17251f",
                color: "#ffffff",
                border: 0,
                borderRadius: 4,
                padding: "8px 18px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notice && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#17251f",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontSize: 13,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>● {notice}</span>
        </div>
      )}
    </div>
  );
}
