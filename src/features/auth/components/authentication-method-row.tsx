"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { MoreVerticalIcon } from "lucide-react";
import { cloneElement, isValidElement } from "react";

export type MenuActionView<TAction> = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  action: TAction;
};

interface AuthenticationMethodRowProps<TAction> {
  icon: React.ReactElement;
  label: React.ReactNode;
  sublabel?: string;
  badge?: React.ReactNode;
  actions?: Array<MenuActionView<TAction>>;
  connectedDate?: string;
  onAction: (action: TAction) => void;
}

export function AuthenticationMethodRow<TAction>({
  icon,
  label,
  sublabel,
  badge,
  actions,
  connectedDate,
  onAction,
}: AuthenticationMethodRowProps<TAction>) {
  const styledIcon = isValidElement(icon)
    ? cloneElement(icon, {
        className: "size-5 text-muted-foreground",
      } as React.HTMLAttributes<HTMLElement>)
    : icon;

  const hasActions = !!actions?.length;

  return (
    <Item size="sm" className="hover:bg-muted/30 overflow-hidden flex-nowrap">
      <ItemMedia variant="icon" className="size-10 shrink-0 rounded-lg border bg-muted">
        {styledIcon}
      </ItemMedia>

      <ItemContent className="min-w-0 overflow-hidden">
        <ItemTitle className="min-w-0">
          <span className="truncate">{label}</span>
          {badge && <span className="hidden sm:inline-flex">{badge}</span>}
        </ItemTitle>
        {sublabel && (
          <ItemDescription className="truncate text-xs">
            {sublabel}
          </ItemDescription>
        )}
      </ItemContent>

      <ItemActions className="shrink-0">
        {connectedDate && (
          <span className="text-muted-foreground hidden text-xs whitespace-nowrap sm:block">
            Since {connectedDate}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasActions}
            >
              <MoreVerticalIcon className="size-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {actions!.map((a) => (
              <DropdownMenuItem
                key={a.key}
                disabled={a.disabled}
                variant={a.destructive ? "destructive" : "default"}
                onSelect={() => onAction(a.action)}
              >
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}
