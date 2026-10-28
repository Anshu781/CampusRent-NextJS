import "./globals.css";

export const metadata = {
  title: "CampusRent — Borrow more. Spend less.",
  description: "A student-to-student rental marketplace for IIT Patna. Rent useful campus essentials without buying them new.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
