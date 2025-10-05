"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { extractRepoFromURL } from "@/lib/utils";
import { getRepoReleases } from "@/lib/ghApi";
import { CheckFormSchema } from "./lib";
import Combobox from "./combobox";
import { GhRelease } from "@/lib/ghResponse";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getDownloadAsset } from "@/lib/searchPkg";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import MarkdownRenderer from "./markdownRenderer";

type CheckFormValues = z.infer<typeof CheckFormSchema>;

export default function HelloPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [apiDocumentation, setApiDocumentation] = useState("");

  useEffect(() => {
    fetch("/api.md")
      .then((res) => res.text())
      .then(setApiDocumentation)
      .catch(() => setApiDocumentation("文档加载失败"));
  }, []);

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
    // don't use resolver here to avoid packup error
    defaultValues: {
      repoUrl: "",
    },
  });

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const keyword = searchParams.get("keyword") || "";

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const url = searchParams.get("repo");
    if (url) {
      checkForm.setValue("repoUrl", url);
    }
  }, [searchParams, checkForm]);

  useEffect(() => {
    if (tag === "None" || tag === "") {
      setAssetList([{ label: "None", value: "None" }]);
      return;
    }

    console.log("Processing tag:", tag);
    const release = releases.find((release) => release.id.toString() === tag);
    if (release) {
      const assets = release.assets.map((asset) => ({
        label: asset.name,
        value: asset.browser_download_url,
      }));
      setAssetList(assets);
      setAsset(assets[0]?.value || "");

      const downloadAsset = getDownloadAsset(release.assets, ua, keyword);
      console.debug("downloadAsset", downloadAsset);
      if (downloadAsset) {
        setAsset(downloadAsset.browser_download_url);
      }
    }
  }, [tag, releases, ua, keyword]);

  useEffect(() => {
    if (tag && tag !== "None" && tag !== "" && releases.length > 0) {
      const release = releases.find((release) => release.id.toString() === tag);
      if (release && release.assets.length > 0) {
        const downloadAsset = getDownloadAsset(release.assets, ua, keyword);
        if (downloadAsset) {
          setAsset(downloadAsset.browser_download_url);
          console.debug(
            "Auto-selected asset based on keyword:",
            downloadAsset.name
          );
        }
      }
    }
  }, [keyword, ua, tag, releases]);

  const onSubmitGetReleases = async (values: CheckFormValues) => {
    const repo = extractRepoFromURL(values.repoUrl);
    if (!repo) {
      setAssetList([{ label: "None", value: "None" }]);
      setTagList([{ label: "None", releaseId: "None" }]);
      setReleases([]);
      setSubmitResult("❌ Invalid GitHub repo URL.");
      return;
    }

    const repoKey = `${repo.owner}/${repo.repo}`;

    const cached = sessionStorage.getItem(repoKey);
    if (cached) {
      const releases = JSON.parse(cached) as GhRelease[];
      const tagNames = releases.map((release) => ({
        label: release.name,
        releaseId: release.id.toString(),
      }));
      tagNames[0].label += " (latest)";
      setTagList(tagNames.slice(0, 5)); // Show only first 5 tags
      setTag(tagNames[0].releaseId);
      setReleases(releases);
      updateSearchParams("repo", values.repoUrl);
      setSubmitResult("");
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
        updateSearchParams("repo", values.repoUrl);
        setSubmitResult("");

        sessionStorage.setItem(repoKey, JSON.stringify(releases));
      })
      .catch((error) => {
        setSubmitResult(`❌ Error fetching tags: ${error}`);
        setTagList([{ label: "None", releaseId: "None" }]);
        setAssetList([{ label: "None", value: "None" }]);
        setReleases([]);
      });
  };

  const generateDownloadUrl = () => {
    if (!asset) {
      setSubmitResult("❌ No asset selected.");
      return;
    }

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    const baseUrl = `${protocol}//${hostname}${port ? ":" + port : ""}`;
    const url = baseUrl + "/api/ghproxy/" + asset;
    console.log("Generated URL: ", url);
    return url;
  };

  const handleDownload = () => {
    const url = generateDownloadUrl();
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyDownloadUrl = async () => {
    const url = generateDownloadUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast(url, {
      description: "URL has been copied to clipboard!",
      action: {
        label: "I got it",
        onClick: () => console.log("Click I got it!"),
      },
    });
  };

  return (
    <>
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
          <Button onClick={handleCopyDownloadUrl}>Generate Download URL</Button>

          <Drawer>
            <DrawerTrigger>API Documentation</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>API of ghproxy-plus</DrawerTitle>
                <MarkdownRenderer content={apiDocumentation} />
              </DrawerHeader>
              <DrawerFooter></DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </>
  );
}
