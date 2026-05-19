import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          A placeholder route for app-level configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template settings</CardTitle>
          <CardDescription>
            Replace this card with project-specific controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No settings are configured yet.
        </CardContent>
      </Card>
    </>
  );
}
