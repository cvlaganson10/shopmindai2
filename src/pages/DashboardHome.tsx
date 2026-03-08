const DashboardHome = () => {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Welcome back! 👋</h2>
        <p className="text-muted-foreground">Your AI agent is ready. Upload a product catalog to get started.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Conversations", value: "0", change: "+0%" },
          { label: "Messages Today", value: "0", change: "+0%" },
          { label: "Documents Uploaded", value: "0", change: "" },
          { label: "Upsell Events", value: "0", change: "+0%" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
            {stat.change && <p className="text-xs text-success mt-1">{stat.change}</p>}
          </div>
        ))}
      </div>

      {/* Setup checklist */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Setup Checklist</h3>
        <div className="space-y-3">
          {[
            { label: "Create your store", done: false },
            { label: "Upload a product catalog", done: false },
            { label: "Set your agent name", done: false },
            { label: "Copy your embed code", done: false },
            { label: "Test your chat agent", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.done ? "border-success bg-success" : "border-muted-foreground"}`}>
                {item.done && <span className="text-success-foreground text-xs">✓</span>}
              </div>
              <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
