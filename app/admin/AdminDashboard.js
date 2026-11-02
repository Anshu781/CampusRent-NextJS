"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  PackageCheck, ArrowLeft, Phone, MessageSquare, CheckCircle,
  XCircle, Clock, Trash2, Plus, RefreshCw, Eye, AlertCircle,
  Filter, Search, MapPin, ShieldCheck, Tag, ShoppingCart, KeyRound
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "inventory"
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [dbCounts, setDbCounts] = useState({});
  const [loading, setLoading] = useState(true);
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
    photo: "",
  });

  // Modal to convert verified request into listing
  const [convertModalRequest, setConvertModalRequest] = useState(null);

  function showToast(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4500);
  }

  // Fetch both requests and listings from DB
  async function loadData() {
    setLoading(true);
    try {
      const [reqRes, listRes] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/listings"),
      ]);

      const reqData = await reqRes.json();
      const listData = await listRes.json();

      if (reqRes.ok) setRequests(reqData.requests || []);
      if (listRes.ok) {
        setListings(listData.listings || []);
        setDbCounts(listData.counts || {});
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server. Please check MongoDB.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update request status (pending, contacted, verified, rejected)
  async function handleUpdateStatus(id, newStatus) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update request");

      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
      );
      showToast(`Request marked as "${newStatus}"!`);
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
      const res = await fetch(`/api/requests?id=${id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/listings?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove product");

      setListings((prev) => prev.filter((item) => item._id !== id));
      showToast(`"${name}" removed from database!`);
      // refresh count
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price) || 0,
          quantity: Number(newProduct.quantity) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not add product");

      showToast(`"${newProduct.name}" added to database listings!`);
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
    (sum, item) => sum + (item.quantity || 1),
    0
  );

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
          <button
            onClick={loadData}
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

          <span
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              background: "#dcfce7",
              color: "#166534",
              border: "1px solid #bbf7d0",
              padding: "5px 10px",
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            ● Admin Intervention Active
          </span>
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
              <ShieldCheck size={14} /> CAMPUS INTERMEDIARY WORKFLOW
            </div>
            <h2 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 800 }}>
              Buyer & Seller Verification Desk
            </h2>
            <p style={{ margin: 0, color: "#9ca899", fontSize: 13, maxWidth: 700, lineHeight: 1.5 }}>
              Direct peer payment is disabled. All buyers and renters submit their contact phone numbers here.
              Contact them directly to verify hostel details, inspect items, and approve them before publishing to active listings.
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
              DATABASE PRODUCTS
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {listings.length}
            </div>
            <span style={{ fontSize: 12, color: "#8a9688" }}>
              Unique catalog items in DB
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
              TOTAL INVENTORY UNITS
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "#166534" }}>
              {totalStockCount} units
            </div>
            <span style={{ fontSize: 12, color: "#8a9688" }}>
              Sum of counts across DB
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
            <Tag size={16} /> Database Listings & Inventory ({listings.length})
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
                          <option value="verified">Verify & Approve</option>
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

        {/* ================= TAB 2: INVENTORY & LISTINGS MANAGEMENT ================= */}
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
                      placeholder="e.g. Electric Kettle, Study Table..."
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
                    Owner / Verified Student Name
                    <input
                      placeholder="e.g. Campus Admin or Student Name"
                      value={newProduct.ownerName}
                      onChange={(e) => setNewProduct({ ...newProduct, ownerName: e.target.value })}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                    Emoji Icon
                    <input
                      placeholder="e.g. 🫖, 🚲, 💡, 🪑"
                      value={newProduct.emoji}
                      onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })}
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
                    {actionLoading ? "Saving..." : "Save Product to Database"}
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
                const countInDb = dbCounts[item.name.toLowerCase().trim()] || item.quantity || 1;

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
                            background: "#dcfce7",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "monospace",
                            fontWeight: 700,
                          }}
                        >
                          Count in DB: {countInDb}
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
                        By <b>{item.ownerName || "Campus Admin"}</b>
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
