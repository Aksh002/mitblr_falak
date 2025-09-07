import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AdminManage from "@/components/admin/AdminManage";
import { getRoleForEmail } from "@/lib/actions/adminAggregations";
import { PageBackground } from "../_clusterPages/clusterPages";

// Ensure this page is always dynamic to avoid caching stale redirects
export const dynamic = "force-dynamic";

export default async function AdminManagePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? undefined;
  const roleRes = email ? await getRoleForEmail(email) : { ok: true as const, data: undefined };
  const role = roleRes.ok ? roleRes.data : undefined;
  // If no role, show a friendly message instead of hard redirect to avoid loops
  return (
    <>
      {/* Match profile page background */}
      <PageBackground cluster="cultural" />
      {!email ? (
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 text-center text-white/90">
          <h1 className="text-2xl font-semibold mb-2">Sign in required</h1>
          <p className="text-white/70">Please sign in to access the admin panel.</p>
          <div className="mt-6">
            <Link href="/api/auth/signin" className="inline-block px-4 py-2 rounded bg-white text-black">Sign in</Link>
          </div>
        </div>
      ) : role ? (
        <AdminManage role={role} />
      ) : (
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 text-center text-white/90">
          <h1 className="text-2xl font-semibold mb-2">Access restricted</h1>
          <p className="text-white/70">Your account doesn&apos;t have admin access. If this is a mistake, contact a super admin.</p>
        </div>
      )}
    </>
  );
}

