import { Badge } from "@/components/ui/badge";

export default function LastUsedBadge() {
  return (
    <Badge className="absolute top-0 -translate-y-[50%] -right-2 z-100 w-fit! border-primary bg-primary text-[0.5rem] text-primary-foreground">
      Last Used
    </Badge>
  );
}
