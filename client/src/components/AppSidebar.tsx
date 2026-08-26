import { useState } from "react";
import { BarChart3, BookOpen, CalendarDays, ChevronLeft, ChevronRight, FileText, Flower2, Home, Leaf, Menu, Settings, ShieldCheck, Users, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = "overview" | "schools" | "users" | "projects" | "measurements" | "calendar" | "photos" | "reports";

type AppSidebarProps = {
  role: string;
  active: Section;
  onNavigate: (section: Section) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  workspaces?: Array<{ workspace: { id: number; name: string; slug: string } }>;
  selectedWorkspaceId?: number;
  onWorkspaceChange?: (id?: number) => void;
};

const items: Array<{ id: Section; label: string; icon: typeof Home; roles: string[] }> = [
  { id: "overview", label: "Visão geral", icon: Home, roles: ["global_admin", "professor", "student"] },
  { id: "schools", label: "Escolas", icon: Flower2, roles: ["global_admin"] },
  { id: "users", label: "Usuários", icon: Users, roles: ["global_admin", "professor"] },
  { id: "projects", label: "Projetos", icon: Leaf, roles: ["global_admin", "professor", "student"] },
  { id: "measurements", label: "Medições", icon: BarChart3, roles: ["global_admin", "professor", "student"] },
  { id: "calendar", label: "Calendário", icon: CalendarDays, roles: ["global_admin", "professor", "student"] },
  { id: "photos", label: "Diário fotográfico", icon: FileText, roles: ["global_admin", "professor", "student"] },
  { id: "reports", label: "Relatórios", icon: BarChart3, roles: ["global_admin", "professor"] },
];

export function AppSidebar({ role, active, onNavigate, onCollapsedChange, workspaces = [], selectedWorkspaceId, onWorkspaceChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = items.filter(item => item.roles.includes(role));
  const navigate = (section: Section) => { onNavigate(section); setMobileOpen(false); };
  const content = <div className="flex h-full flex-col bg-[#173d32] text-white">
    <div className={cn("flex h-20 items-center border-b border-white/10 px-4", collapsed ? "justify-center" : "justify-between")}>
      {!collapsed && <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d5ed8c] text-[#173d32]"><Leaf className="h-5 w-5" /></div><div><p className="font-semibold">Horta científica</p><p className="text-xs text-[#b9d1bd]">Painel UFNT</p></div></div>}
      {collapsed && <Leaf className="h-5 w-5 text-[#d5ed8c]" />}
      <button className="hidden rounded-lg p-2 text-[#b9d1bd] hover:bg-white/10 lg:block" onClick={() => { const next = !collapsed; setCollapsed(next); onCollapsedChange?.(next); }} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}</button>
    </div>
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">{visibleItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition", active === item.id ? "bg-[#d5ed8c] font-medium text-[#173d32]" : "text-[#d8e6d9] hover:bg-white/10", collapsed && "justify-center px-2")} title={collapsed ? item.label : undefined}><Icon className="h-5 w-5 shrink-0" />{!collapsed && <span>{item.label}</span>}</button>; })}</nav>
    <div className="border-t border-white/10 p-3"><div className={cn("rounded-2xl bg-white/10", collapsed ? "p-2" : "p-3")}><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8e6d9]"><ChevronsUpDown className="h-4 w-4 text-[#d5ed8c]" />{!collapsed && <span>Workspace atual</span>}</div>{!collapsed ? <select aria-label="Selecionar workspace" className="h-9 w-full rounded-lg border border-white/15 bg-[#214b3e] px-2 text-xs text-white outline-none" value={selectedWorkspaceId ?? "global"} onChange={e => onWorkspaceChange?.(e.target.value === "global" ? undefined : Number(e.target.value))}><option value="global">Administração geral</option>{workspaces.map(item => <option key={item.workspace.id} value={item.workspace.id}>{item.workspace.name}</option>)}</select> : <button className="w-full rounded-lg p-2 text-[#d5ed8c] hover:bg-white/10" title="Trocar workspace" onClick={() => onWorkspaceChange?.(undefined)}><ShieldCheck className="mx-auto h-5 w-5" /></button>}</div></div>{!collapsed && <div className="border-t border-white/10 p-4"><div className="rounded-2xl bg-white/10 p-3 text-xs leading-5 text-[#d8e6d9]"><ShieldCheck className="mb-2 h-4 w-4 text-[#d5ed8c]" /><p>{role === "global_admin" ? "Acesso master a todas as escolas." : role === "professor" ? "Gestão da sua escola." : "Registros do seu projeto."}</p></div></div>}
  </div>;
  return <>
    <button className="fixed left-4 top-4 z-40 rounded-xl bg-[#173d32] p-3 text-[#d5ed8c] shadow-lg lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
    <aside className={cn("fixed inset-y-0 left-0 z-30 hidden transition-all duration-200 lg:block", collapsed ? "w-[76px]" : "w-64")}>{content}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" /><aside className="relative h-full w-72 shadow-2xl">{content}<button className="absolute right-3 top-5 rounded-lg p-2 text-[#b9d1bd] hover:bg-white/10" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button></aside></div>}
  </>;
}

export type { Section };
