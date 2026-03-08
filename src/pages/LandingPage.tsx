import { Sparkles, MessageSquare, Mic, TrendingUp, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: MessageSquare,
    title: "Chat Assistant",
    description: "AI-powered chat that answers product questions, handles support, and guides customers to purchase.",
  },
  {
    icon: Mic,
    title: "Voice AI Agent",
    description: "Natural voice conversations that feel human. Your AI agent speaks with customers in real-time.",
  },
  {
    icon: TrendingUp,
    title: "Smart Upselling",
    description: "Automatically suggests relevant products and premium alternatives to boost average order value.",
  },
];

const steps = [
  { number: "01", title: "Upload Your Catalog", description: "Drop your product docs, CSVs, or PDFs. We extract and learn everything." },
  { number: "02", title: "Customize Your Agent", description: "Set your brand tone, agent name, and voice. Make it feel like your team." },
  { number: "03", title: "Go Live Instantly", description: "Embed a single script tag. Your AI agent is live on your store in seconds." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-bold text-foreground">ShopMind AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        </div>
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Sales Agents for eCommerce
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
            <span className="text-gradient">Your Store Gets Its Own</span>
            <br />
            <span className="text-foreground">AI Sales Team</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your product catalog and instantly deploy an intelligent AI agent that handles chat, voice, upselling, and customer support — 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/register">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything Your Store Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              One platform. Three powerful AI capabilities. Zero coding required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-8 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Live in 3 Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-5">
                  <span className="font-heading text-xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/50">
        <div className="container text-center">
          <div className="glass-card rounded-2xl p-12 md:p-16 max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Boost Your Sales?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join stores already using ShopMind AI to convert more visitors into buyers.
              </p>
              <Button variant="hero" size="lg" className="text-base px-10 py-6" asChild>
                <Link to="/register">
                  Start Free Today
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-heading font-semibold">ShopMind AI</span>
          </div>
          <p>© {new Date().getFullYear()} ShopMind AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
