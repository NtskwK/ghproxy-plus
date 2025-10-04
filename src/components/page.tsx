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
import { getRepoReleases, getRepoTags } from "@/lib/ghApi";
import { CheckFormSchema, GetAssetsFormSchema } from "./lib";
import Combobox from "./combobox";
import { GhRelease } from "@/lib/ghResponse";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface ApiResponse {
  message: string;
}

type CheckFormValues = z.infer<typeof CheckFormSchema>;
type GetAssetsFormValues = z.infer<typeof GetAssetsFormSchema>;

export default function HelloPage() {
  const [message, setMessage] = useState("Loading...");
  const [submitResult, setSubmitResult] = useState<string>("");
  const [tag, setTag] = useState("");
  const [tagList, setTagList] = useState([
    { label: "None", releaseId: "None" },
  ]);
  const [releases, setReleases] = useState<GhRelease[]>([]);
  const [asset, setAsset] = useState("");
  const [assetList, setAssetList] = useState([
    { label: "None", value: "None" },
  ]);

  const checkForm = useForm<CheckFormValues>({
    resolver: zodResolver(CheckFormSchema),
    defaultValues: {
      repoUrl: "",
    },
  });

  const getAssetsForm = useForm<GetAssetsFormValues>({
    resolver: zodResolver(GetAssetsFormSchema),
    mode: "onChange",
    defaultValues: {
      user: "placeholder",
      repo: "placeholder",
      tag: "None",
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

  useEffect(() => {
    if (tag === "None" || tag === "") {
      setAssetList([{ label: "None", value: "None" }]);
      return;
    }

    const release = releases.find((release) => release.id.toString() === tag);
    if (release) {
      const assets = release.assets.map((asset) => ({
        label: asset.name,
        value: asset.browser_download_url,
      }));
      setAssetList(assets);
      setAsset(assets[0]?.value || "");
    }
  }, [tag]);

  const onSubmitGetReleases = async (values: CheckFormValues) => {
    const repo = extractRepoFromURL(values.repoUrl);
    if (!repo) {
      setSubmitResult("❌ Invalid GitHub repo URL.");
      return;
    }

    getRepoReleases(repo.owner, repo.repo)
      .then((releases) => {
        if (releases.length === 0) {
          setSubmitResult("❌ No releases found in the repo.");
          setTagList([{ label: "None", releaseId: "None" }]);
          setAssetList([{ label: "None", value: "None" }]);
          return;
        }
        const tagNames = releases.map((release) => ({
          label: release.name,
          releaseId: release.id.toString(),
        }));
        tagNames[0].label += " (latest)";
        setTagList(tagNames.slice(0, 5)); // Show only first 5 tags
        setTag(tagNames[0].releaseId);
        setReleases(releases);

        setSubmitResult("");
      })
      .catch((error) => {
        setSubmitResult(`❌ Error fetching tags: ${error}`);
        setTagList([{ label: "None", releaseId: "None" }]);
        setAssetList([{ label: "None", value: "None" }]);
        setReleases([]);
      });
  };

  const handleDownload = async () => {
    if (!asset) {
      setSubmitResult("❌ No asset selected.");
      return;
    }

    console.log("Downloading asset from URL:", asset);
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6 flex flex-col items-center justify-center gap-6 space-y-4">
        <div className="w-[80%] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl space-y-10">
          {submitResult && (
            <Alert variant="destructive">
              <CheckCircle2Icon />
              <AlertTitle>Fail to fetch releases</AlertTitle>
              <AlertDescription>{submitResult}</AlertDescription>
            </Alert>
          )}

          <Form {...checkForm}>
            <form
              onSubmit={checkForm.handleSubmit(onSubmitGetReleases)}
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

          <div className="flex flex-col gap-2 space-y-8">
            <Combobox
              getter={{ value: tag }}
              options={tagList.map((tag) => ({
                label: tag.label,
                value: tag.releaseId,
              }))}
              setter={setTag}
              defaultValue="Select tag"
            />
            <Combobox
              getter={{ value: asset }}
              options={assetList}
              setter={setAsset}
              defaultValue="Select download asset"
            />
            <Button onClick={handleDownload}>Download</Button>
          </div>
        </div>
      </main>
    </>
  );
}
