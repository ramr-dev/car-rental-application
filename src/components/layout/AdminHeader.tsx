import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Car,
  CheckCheck,
  ChevronDown,
  CreditCard,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { notificationService } from "@/lib/api/notification.service";
import type { AdminNotification } from "@/lib/types/notification.types";

// ─── Notification Bell ────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function NotificationItem({
  n,
  onRead,
}: {
  n: AdminNotification;
  onRead: (id: number) => void;
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (!n.isRead) onRead(n.id);
    navigate({ to: "/admin/bookings" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
        n.isRead ? "" : "bg-primary/5"
      }`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15">
        <CreditCard className="h-4 w-4 text-success" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{n.title}</p>
          {!n.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {n.body}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {timeAgo(n.createdAt)}
        </p>
      </div>
    </button>
  );
}

function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: notificationService.list,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markOneMut = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-elevated"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="font-display font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={markAllMut.isPending}
              onClick={() => markAllMut.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              You'll see alerts here when bookings are confirmed.
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onRead={(id) => markOneMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Admin Header ─────────────────────────────────────────────────────────

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Brand */}
        <Link to="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Car className="h-5 w-5" />
          </span>
          <div className="hidden sm:block">
            <p className="font-display text-base font-bold leading-none">
              DriveLux
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Panel
            </p>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <Badge className="hidden sm:flex bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
            Master Admin
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          <NotificationBell />

          {/* Admin user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-full"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/profile"
                  className="flex items-center gap-2"
                >
                  <UserCircle className="h-4 w-4" /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
