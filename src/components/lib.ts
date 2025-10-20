import z from "zod";

export const CheckFormSchema = z.object({
    repoUrl: z
        .string()
        .refine((url) => {
            // 预处理：如果没有协议头，临时添加https://用于验证
            const urlWithProtocol =
                url.startsWith("http://") || url.startsWith("https://")
                    ? url
                    : `https://${url}`;

            // 验证是否为有效的URL格式
            try {
                new URL(urlWithProtocol);
                return true;
            } catch {
                return false;
            }
        }, "Invalid URL format!")
        .refine((url) => {
            return url.includes("github.com");
        }, "Please enter a GitHub repo URL!")
        .transform((url) => {
            return url.startsWith("http://") || url.startsWith("https://")
                ? url
                : `https://${url}`;
        }),
});

export const GetAssetsFormSchema = z.object({
    user: z.string().min(1, "User is required"),
    repo: z.string().min(1, "Repo is required"),
    tag: z.string().min(1, "Tag is required"),
});
