import z from "zod";

export const CheckFormSchema = z.object({
  repoUrl: z
    .url("Invalid URL!")
    .refine(
      (url) => url.includes("github.com"),
      "Please enter a GitHub repo URL!"
    ),
});

export const GetAssetsFormSchema = z.object({
  user: z.string().min(1, "User is required"),
  repo: z.string().min(1, "Repo is required"),
  tag: z.string().min(1, "Tag is required"),
});
