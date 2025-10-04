"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface ApiResponse {
  message: string;
}

const formSchema = z.object({
  repoUrl: z
    .url("Invalid URL!")
    .refine(
      (url) => url.includes("github.com"),
      "Please enter a GitHub repo URL!"
    ),
});

type FormValues = z.infer<typeof formSchema>;

export default function HelloPage() {
  const [message, setMessage] = useState("Loading...");
  const [submitResult, setSubmitResult] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/hello");
      const { message } = (await res.json()) as ApiResponse;
      setMessage(message);
    };
    fetchData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitResult(`Checking repo: ${values.repoUrl}`);

    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitResult(`✅ Successful inspection: ${values.repoUrl}`);
    } catch (error) {
      setSubmitResult(`❌ Inspection failed: ${error}`);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-xl space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="repoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub repo URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="https://github.com/username/repo"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? "Checking..." : "Check"}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">API消息: {message}</p>
            {submitResult && (
              <p className="text-sm font-medium">{submitResult}</p>
            )}
          </div>
        </div>

        {/* Demo Alert */}
        <div className="w-full max-w-xl">
          <Alert>
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>成功！你的更改已保存</AlertTitle>
            <AlertDescription>
              这是一个带有图标、标题和描述的提示框。现在使用了React Hook
              Form进行表单验证。
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </>
  );
}
