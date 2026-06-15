import { useState } from "react";
import { Users, Crown, ShieldAlert, BadgeInfo, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";

type MemberRole = "owner" | "admin" | "staff";

interface Member {
  id: string;
  name: string;
  role: MemberRole;
  phone: string;
  isCurrentUser?: boolean;
}

const DEFAULT_MEMBERS: Member[] = [
  {
    id: "m-1",
    name: "Anil (Owner)", // In a real app this would be from auth/local storage
    role: "owner",
    phone: "+91 98765 43210",
    isCurrentUser: true,
  },
  {
    id: "m-2",
    name: "Ramesh (Cashier)",
    role: "staff",
    phone: "+91 87654 32109",
  },
  {
    id: "m-3",
    name: "Suresh (Manager)",
    role: "admin",
    phone: "+91 76543 21098",
  },
];

const ROLE_CONFIG = {
  owner: { label: "Owner", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Crown },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ShieldAlert },
  staff: { label: "Staff", color: "bg-gray-100 text-gray-700 border-gray-200", icon: BadgeInfo },
};

export default function MembersPage() {
  const { toast } = useToast();
  const [members] = useState<Member[]>(DEFAULT_MEMBERS);

  const handleInvite = () => {
    toast({
      title: "Premium Feature",
      description: "Invitation links require premium plan",
      variant: "default", // You could use a custom variant if you had one, but default is fine
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Shop Members" subtitle="Manage team access" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">
        <FormCard title="Team Members">
          <div className="space-y-3">
            {members.map(member => {
              const roleCfg = ROLE_CONFIG[member.role];
              const Icon = roleCfg.icon;

              return (
                <div key={member.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-[14px]">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                          {member.name}
                          {member.isCurrentUser && (
                            <span className="text-[11px] text-slate-400 font-medium">(You)</span>
                          )}
                        </p>
                        <p className="text-[12px] font-medium text-slate-500 mt-0.5">{member.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", roleCfg.color)}>
                      <Icon className="w-3 h-3" />
                      {roleCfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform" onClick={handleInvite}>
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Member
            </Button>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
