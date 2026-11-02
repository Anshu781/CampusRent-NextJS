import AdminDashboard from "./AdminDashboard";

export const metadata = {
  title: "CampusRent Admin | Intermediary & Inventory Desk",
  description: "CampusRent Admin Console for verifying buyer/rental requests, contacting customers, and managing database listings.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
