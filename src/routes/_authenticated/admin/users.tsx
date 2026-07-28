import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin — ParkPulse" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsers,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type UserRole = {
  user_id: string;
  role: string;
};

function AdminUsers() {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id,role");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isAdmin }) => {
      toast.success(isAdmin ? "Admin role removed" : "Admin role granted");
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const isAdmin = (userId: string) =>
    roles.some((r) => r.user_id === userId && r.role === "admin");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Users & Roles</h2>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and admin access
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
          {profiles.length} total users
        </span>
        <span className="rounded-full bg-warning/10 px-3 py-1 text-warning font-medium">
          {roles.filter((r) => r.role === "admin").length} admins
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const admin = isAdmin(p.id);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-accent p-1.5">
                          {admin ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">
                          {p.full_name || "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${admin ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          toggleAdmin.mutate({ userId: p.id, isAdmin: admin })
                        }
                        disabled={toggleAdmin.isPending}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          admin
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {admin ? "Remove Admin" : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}