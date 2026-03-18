import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  username: (data) => {
    if (typeof data.username !== "string" || !data.username.trim()) {
      throw new Error("Display name is required.");
    }
    return data.username.trim();
  },
});
