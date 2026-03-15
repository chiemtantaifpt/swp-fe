import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService, Notification } from "@/services/notification";
import { formatDate } from "@/lib/utils";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Get unread count
  const { data: unreadCount, isLoading: unreadLoading, error: unreadError } = useQuery({
    queryKey: ["notificationUnreadCount"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
    onSuccess: (data) => {
      console.log("Unread count:", data);
    },
    onError: (error) => {
      console.error("Unread count error:", error);
    }
  });

  // Get notifications
  const { data: notifications, isLoading, error: notificationsError } = useQuery({
    queryKey: ["notifications", { pageNumber: 1, pageSize: 20 }],
    queryFn: () => notificationService.getAll({ PageNumber: 1, PageSize: 20 }),
    enabled: open, // Only fetch when dropdown is open
    onSuccess: (data) => {
      console.log("Notifications:", data);
    },
    onError: (error) => {
      console.error("Notifications error:", error);
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => {
      console.log("Marking as read:", id);
      return notificationService.markAsRead(id);
    },
    onSuccess: (data, id) => {
      console.log("Mark as read success:", id);
    },
    onError: (err, id) => {
      console.error("Mark as read error:", id, err);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      console.log("Marking all as read");
      return notificationService.markAllAsRead();
    },
    onSuccess: () => {
      console.log("Mark all as read success");
    },
    onError: (error) => {
      console.error("Mark all as read error:", error);
    },
  });

  const handleMarkAsRead = (id: string) => {
    // Optimistic update
    queryClient.setQueryData(["notifications", { pageNumber: 1, pageSize: 20 }], (old: any) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: old.items.map((notification: Notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      };
    });

    setMarkingIds(prev => new Set(prev).add(id));
    markAsReadMutation.mutate(id, {
      onSettled: () => {
        setMarkingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        // Invalidate to ensure data is fresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
      }
    });
  };

  const handleMarkAllAsRead = () => {
    // Optimistic update
    queryClient.setQueryData(["notifications", { pageNumber: 1, pageSize: 20 }], (old: any) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: old.items.map((notification: Notification) => ({ ...notification, isRead: true }))
      };
    });

    markAllAsReadMutation.mutate(undefined, {
      onSettled: () => {
        // Invalidate to ensure data is fresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
      }
    });
  };

  const hasUnread = (unreadCount?.count ?? 0) > 0;
  const hasNotifications = notifications?.items?.length > 0;
  
  // Calculate total unread from both API and local data
  const totalUnread = Math.max(
    unreadCount?.count ?? 0,
    notifications?.items?.filter(n => !n.isRead).length ?? 0
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {!unreadLoading && totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {totalUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Đọc tất cả
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : notifications?.items?.length ? (
            <div className="space-y-1">
              {notifications.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  isMarking={markingIds.has(notification.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Không có thông báo nào
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMarking: boolean;
}

function NotificationItem({ notification, onMarkAsRead, isMarking }: NotificationItemProps) {
  return (
    <div className={`p-3 border-b border-border last:border-b-0 ${!notification.isRead ? "bg-muted/50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-tight">{notification.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
          <p className="text-xs text-muted-foreground">{formatDate(notification.createdTime)}</p>
        </div>
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
            disabled={isMarking}
            className="h-6 w-6 p-0 shrink-0"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}