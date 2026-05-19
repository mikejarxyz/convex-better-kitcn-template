"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "../../../convex/_generated/api";

export default function AppDashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const things = useQuery(api.things.listMine, isAuthenticated ? {} : "skip");
  const createThing = useMutation(api.things.create);
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) return;

    setPending(true);
    try {
      await createThing({ label: label.trim() });
      setLabel("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create item.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A protected starter view backed by a user-scoped Convex query.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Starter data</CardTitle>
          <CardDescription>
            Create an item to verify authenticated Convex reads and writes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form noValidate onSubmit={onSubmit}>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="thing-label">Label</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="thing-label"
                    value={label}
                    disabled={pending}
                    placeholder="Example project"
                    onChange={(event) => setLabel(event.target.value)}
                  />
                  <Button type="submit" disabled={pending || !label.trim()}>
                    <PlusIcon data-icon="inline-start" />
                    Add
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>

          <div className="rounded-2xl border">
            {things === undefined ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : things.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No items yet.</div>
            ) : (
              <ul className="divide-y">
                {things.map((thing) => (
                  <li key={thing._id} className="p-3 text-sm">
                    {thing.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
