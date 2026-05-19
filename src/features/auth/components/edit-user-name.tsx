"use client";

import EditableInput from "@/components/ui/editable-input";
import { FormField } from "@/components/ui/form-field";
import { authClient } from "@/lib/convex/auth-client";
import { toast } from "sonner";
import { updateUserName } from "../actions/account";
import { userNameSchema } from "../validation";

export function EditUserName() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSave = async (nextName: string) => {
    const currentName = (user?.name ?? "").trim();
    if (nextName === currentName) return;

    const result = await updateUserName(nextName);
    if (result.error) {
      throw new Error(result.error.message ?? "Failed to update name");
    }

    toast.success("Name updated");
  };

  const validate = (nextName: string) => {
    const parsed = userNameSchema.safeParse({ name: nextName });
    if (!parsed.success) {
      return parsed.error.issues[0]?.message ?? "Invalid name";
    }
    return null;
  };

  return (
    <FormField id="userName" label="Name">
      {() => (
        <EditableInput
          id="userName"
          value={user?.name ?? ""}
          onSave={handleSave}
          validate={validate}
          onError={(error) => {
            toast.error("Failed to update name", {
              description:
                error instanceof Error ? error.message : "Unknown error",
            });
          }}
          autoComplete="off"
          trimOnSave
          aria-label="Name"
          wrapperClassName="sm:min-w-[240px] max-w-64"
        />
      )}
    </FormField>
  );
}
