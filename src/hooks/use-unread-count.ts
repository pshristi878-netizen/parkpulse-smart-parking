import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadCount() {
  const { data = 0 } = useQuery({
    queryKey: ["unread_notifications_count"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.user.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 15000,
  });
  return data;
}
