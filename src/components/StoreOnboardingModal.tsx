import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const industries = ["General", "Fashion", "Electronics", "Food & Beverage", "Beauty", "Sports", "Home & Garden", "Other"];
const tones = ["Friendly", "Professional", "Casual", "Luxury"];

const StoreOnboardingModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [storeName, setStoreName] = useState("");
  const [industry, setIndustry] = useState("general");
  const [agentName, setAgentName] = useState("Alex");
  const [brandTone, setBrandTone] = useState("friendly");
  const { createStore } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    try {
      await createStore.mutateAsync({
        store_name: storeName,
        industry: industry.toLowerCase(),
        agent_name: agentName,
        brand_tone: brandTone.toLowerCase(),
      });
      toast.success("Store created successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create store");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="font-heading">Let's set up your store</DialogTitle>
          </div>
          <DialogDescription>Configure your AI agent and start selling smarter.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Store Name *</Label>
            <Input placeholder="My Awesome Store" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input placeholder="Alex" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Brand Tone</Label>
            <Select value={brandTone} onValueChange={setBrandTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={createStore.isPending}>
            {createStore.isPending ? "Creating..." : "Create Store"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StoreOnboardingModal;
