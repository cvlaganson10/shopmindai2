import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Mail, Shield, UserPlus, Trash2, Loader2 } from "lucide-react";

const TeamPage = () => {
    const { user } = useAuth();
    const { store } = useStore();
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("staff");

    // For now, team members are just the owner
    // Full multi-user support would require a tenant_users table
    const { data: profile } = useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user!.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        // Placeholder — full implementation would send invitation email
        toast.info("Team invitations will be available in a future update");
        setInviteEmail("");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-heading font-bold">Team Members</h1>
                <p className="text-muted-foreground">Manage who can access your store dashboard</p>
            </div>

            {/* Current team */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" /> Current Team
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Owner row */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                        {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{profile?.full_name || "You"}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary">
                                    <Shield className="h-3 w-3 mr-1" /> Owner
                                </Badge>
                            </div>
                        </div>

                        {/* Placeholder for team members */}
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No other team members yet
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Invite */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" /> Invite Team Member
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="rounded-full">
                            <Mail className="h-4 w-4 mr-1" /> Invite
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-3">
                        Staff members can view conversations and knowledge base but cannot modify billing or agent settings.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamPage;
