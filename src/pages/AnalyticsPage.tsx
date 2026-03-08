import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { MessageSquare, Mic, BarChart3, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const ranges = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const COLORS = ["hsl(239, 84%, 67%)", "hsl(270, 84%, 67%)", "hsl(200, 84%, 67%)"];

const AnalyticsPage = () => {
  const { store } = useStore();
  const [rangeDays, setRangeDays] = useState(7);
  const startDate = startOfDay(subDays(new Date(), rangeDays)).toISOString();

  // Conversations count
  const { data: totalConversations = 0 } = useQuery({
    queryKey: ["analytics", "total-conv", store?.id, rangeDays],
    queryFn: async () => {
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .gte("created_at", startDate);
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: totalMessages = 0 } = useQuery({
    queryKey: ["analytics", "total-msgs", store?.id, rangeDays],
    queryFn: async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .gte("created_at", startDate);
      return count || 0;
    },
    enabled: !!store,
  });

  const { data: voiceSessions = 0 } = useQuery({
    queryKey: ["analytics", "voice", store?.id, rangeDays],
    queryFn: async () => {
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("channel", "voice")
        .gte("created_at", startDate);
      return count || 0;
    },
    enabled: !!store,
  });

  const avgMsgsPerConv = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0";

  // Conversations over time
  const { data: convOverTime = [] } = useQuery({
    queryKey: ["analytics", "conv-over-time", store?.id, rangeDays],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("channel, created_at")
        .eq("store_id", store!.id)
        .gte("created_at", startDate)
        .order("created_at");

      // Group by date
      const grouped: Record<string, { date: string; chat: number; voice: number }> = {};
      for (let i = 0; i < rangeDays; i++) {
        const d = format(subDays(new Date(), rangeDays - 1 - i), "MMM dd");
        grouped[d] = { date: d, chat: 0, voice: 0 };
      }
      data?.forEach((c) => {
        if (c.created_at) {
          const d = format(new Date(c.created_at), "MMM dd");
          if (grouped[d]) {
            if (c.channel === "voice") grouped[d].voice++;
            else grouped[d].chat++;
          }
        }
      });
      return Object.values(grouped);
    },
    enabled: !!store,
  });

  // Channel breakdown
  const { data: channelBreakdown = [] } = useQuery({
    queryKey: ["analytics", "channel-breakdown", store?.id, rangeDays],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("channel")
        .eq("store_id", store!.id)
        .gte("created_at", startDate);

      const counts: Record<string, number> = { chat: 0, voice: 0 };
      data?.forEach((c) => { counts[c.channel || "chat"]++; });
      return Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    },
    enabled: !!store,
  });

  // Sentiment
  const { data: sentimentData = [] } = useQuery({
    queryKey: ["analytics", "sentiment", store?.id, rangeDays],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("sentiment")
        .eq("store_id", store!.id)
        .gte("created_at", startDate);

      const counts: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
      data?.forEach((c) => { counts[c.sentiment || "neutral"]++; });
      return [
        { name: "Positive", value: counts.positive, fill: "hsl(142, 71%, 45%)" },
        { name: "Neutral", value: counts.neutral, fill: "hsl(240, 25%, 69%)" },
        { name: "Negative", value: counts.negative, fill: "hsl(0, 84%, 60%)" },
      ];
    },
    enabled: !!store,
  });

  const stats = [
    { label: "Total Conversations", value: totalConversations, icon: MessageSquare },
    { label: "Total Messages", value: totalMessages, icon: BarChart3 },
    { label: "Voice Sessions", value: voiceSessions, icon: Mic },
    { label: "Avg Msgs / Conv", value: avgMsgsPerConv, icon: TrendingUp },
  ];

  if (!store) {
    return <div className="text-center py-20 text-muted-foreground">Please create a store first.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex justify-end gap-1">
        {ranges.map((r) => (
          <button
            key={r.days}
            onClick={() => setRangeDays(r.days)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
              rangeDays === r.days ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Last {r.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5">
            <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Conversations Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={convOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 20%, 19%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(240, 25%, 69%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(240, 25%, 69%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(240, 17%, 12%)", border: "1px solid hsl(240, 20%, 19%)", borderRadius: 8, color: "hsl(240, 100%, 99%)" }}
              />
              <Line type="monotone" dataKey="chat" stroke="hsl(239, 84%, 67%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="voice" stroke="hsl(270, 84%, 67%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Channel Breakdown</h3>
          {channelBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={channelBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {channelBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span style={{ color: "hsl(240, 25%, 69%)", fontSize: 12 }}>{value}</span>} />
                <Tooltip contentStyle={{ background: "hsl(240, 17%, 12%)", border: "1px solid hsl(240, 20%, 19%)", borderRadius: 8, color: "hsl(240, 100%, 99%)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 20%, 19%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(240, 25%, 69%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(240, 25%, 69%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(240, 17%, 12%)", border: "1px solid hsl(240, 20%, 19%)", borderRadius: 8, color: "hsl(240, 100%, 99%)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {sentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Top Products Mentioned</h3>
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            No product mention data yet. Start conversations to see insights.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
