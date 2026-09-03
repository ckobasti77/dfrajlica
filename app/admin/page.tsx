import type { Metadata } from "next";
import AdminPanel from "./AdminPanel";
import { adminStrings } from "@/components/booking/strings";

export const metadata: Metadata = {
  title: adminStrings.title,
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminPanel />;
}
