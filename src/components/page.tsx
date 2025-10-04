"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { extractRepoFromURL } from "@/lib/utils";
import { getRepoTags } from "@/lib/ghApi";
import { CheckFormSchema, GetAssetsFormSchema } from "./lib";
import Combobox from "./combobox";

interface ApiResponse {
  message: string;
}

type CheckFormValues = z.infer<typeof CheckFormSchema>;
type GetAssetsFormValues = z.infer<typeof GetAssetsFormSchema>;

export default function HelloPage() {
  const [message, setMessage] = useState("Loading...");
  const [submitResult, setSubmitResult] = useState<string>("");
  const [tagList, setTagList] = useState([{ label: "None", value: "None" }]);

  const checkForm = useForm<CheckFormValues>({
    resolver: zodResolver(CheckFormSchema),
    defaultValues: {
      repoUrl: "",
    },
  });

  const getAssetsForm = useForm<GetAssetsFormValues>({
    resolver: zodResolver(GetAssetsFormSchema),
    defaultValues: {
      user: "",
      repo: "",
      tag: "",
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

  const onSubmitCheck = async (values: CheckFormValues) => {
    setSubmitResult(`Checking repo: ${values.repoUrl}`);
    const repo = extractRepoFromURL(values.repoUrl);
    if (!repo) {
      setSubmitResult("❌ Invalid GitHub repo URL.");
      return;
    }

    getRepoTags(repo.owner, repo.repo)
      .then((tags) => {
        if (tags.length === 0) {
          setSubmitResult("❌ No tags found in the repo.");
          return;
        }
        const tagNames = tags.map((tag) => ({
          label: tag.name,
          value: tag.name,
        }));
        tagNames[0].label += " (latest)";
        setTagList(tagNames.slice(0, 5)); // Show only first 5 tags

        console.log("Fetched tags:", tags);
      })
      .catch((error) => {
        setSubmitResult(`❌ Error fetching tags: ${error}`);
      });
  };

  const onSubmitDownload = async () => {
    console.log("Downloading...");
  };

  const setTag = (value: string) => {
    getAssetsForm.setValue("tag", value);
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-xl space-y-4">
          <Form {...checkForm}>
            <form
              onSubmit={checkForm.handleSubmit(onSubmitCheck)}
              className="space-y-4"
            >
              <FormField
                control={checkForm.control}
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
                        disabled={checkForm.formState.isSubmitting}
                      >
                        {checkForm.formState.isSubmitting
                          ? "Checking..."
                          : "Check"}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <Form {...getAssetsForm}>
          <form
            onSubmit={getAssetsForm.handleSubmit(onSubmitDownload)}
            className="space-y-6 flex flex-col items-center justify-center"
          >
            <FormField
              control={getAssetsForm.control}
              name="tag"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tag</FormLabel>
                  <Combobox field={field} options={tagList} setter={setTag} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Search</Button>
          </form>
        </Form>
      </main>
    </>
  );
}
