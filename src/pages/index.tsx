"use client";
import { CheckCircle2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type * as z from "zod";
import apiDocumentationUrl from "@/assets/api.md";
import Combobox from "@/components/combobox";
import type { CheckFormSchema } from "@/components/lib";
import MarkdownRenderer from "@/components/markdownRenderer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRepoReleases, getSourceCode } from "@/lib/ghApi";
import type { GhRelease } from "@/lib/ghResponse";
import { getDownloadAsset } from "@/lib/searchPkg";
import { extractRepoFromURL } from "@/lib/utils";

type CheckFormValues = z.infer<typeof CheckFormSchema>;

export default function Homepage() {
  const [searchParams, _] = useSearchParams();
  const navigate = useNavigate();

  const [apiDocumentation, setApiDocumentation] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitInfo] = useState("");
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
    navigate(`?${params.toString()}`);
  };

  useEffect(() => {
    fetch(apiDocumentationUrl)
      .then((res) => res.text())
      .then(setApiDocumentation)
      .catch(() => setApiDocumentation("文档加载失败"));
  }, []);

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
    const release = releases.find(
      (release) => release.id.toString() === tag,
    );
    if (release) {
      const sourceCodeAssets = getSourceCode(
        extractRepoFromURL(checkForm.getValues("repoUrl"))?.owner || "",
        extractRepoFromURL(checkForm.getValues("repoUrl"))?.repo || "",
        release.tag_name,
      );
      release.assets = [...release.assets, ...sourceCodeAssets];
      console.debug("Source code assets:", sourceCodeAssets);

      console.debug("Release assets:", release.assets);

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
  }, [tag, releases, ua, keyword, checkForm]);

  useEffect(() => {
    if (tag && tag !== "None" && tag !== "" && releases.length > 0) {
      const release = releases.find(
        (release) => release.id.toString() === tag,
      );
      if (release && release.assets.length > 0) {
        const downloadAsset = getDownloadAsset(
          release.assets,
          ua,
          keyword,
        );
        if (downloadAsset) {
          setAsset(downloadAsset.browser_download_url);
          console.debug(
            "Auto-selected asset based on keyword:",
            downloadAsset.name,
          );
        }
      }
    }
  }, [keyword, ua, tag, releases]);

  const resetAssetAndTag = () => {
    setTag("");
    setAsset("");
    setTagList([{ label: "None", releaseId: "None" }]);
    setAssetList([{ label: "None", value: "None" }]);
    setReleases([]);
  };

  const onSubmitGetReleases = async (values: CheckFormValues) => {
    setLoading(true);
    const repo = extractRepoFromURL(values.repoUrl);
    if (!repo) {
      setSubmitInfo("❌ Invalid GitHub repo URL.");
      resetAssetAndTag();
      setLoading(false);
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
      setSubmitInfo("");
      setLoading(false);
      return;
    }

    getRepoReleases(repo.owner, repo.repo)
      .then((releases) => {
        if (releases.length === 0) {
          setSubmitInfo("❌ No releases found in the repo.");
          resetAssetAndTag();
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
        setSubmitInfo("");

        sessionStorage.setItem(repoKey, JSON.stringify(releases));
      })
      .catch((error) => {
        setSubmitInfo(`❌ Error fetching tags: ${error}`);
        resetAssetAndTag();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const generateDownloadUrl = () => {
    if (!asset || asset === "None") {
      setSubmitInfo("❌ No asset selected.");
      return;
    }

    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/ghproxy/${asset}`;
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
    toast("Done!", {
      description: "The URL has been copied to clipboard.",
      action: {
        label: "get it",
        onClick: () => console.log("Click get it!"),
      },
    });
  };

  return (
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Checking..." : "Check"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="flex flex-col gap-2 space-y-8">
        <div className="space-y-2">
          <Label>Tag</Label>
          <Combobox
            getter={{ value: tag }}
            options={tagList.map((tag) => ({
              label: tag.label,
              value: tag.releaseId,
            }))}
            setter={setTag}
            defaultValue="Select tag"
          />
        </div>
        <div className="space-y-2">
          <Label>Asset</Label>
          <Combobox
            getter={{ value: asset }}
            options={assetList}
            setter={setAsset}
            defaultValue="Select download asset"
          />
        </div>
        <Button
          onClick={handleDownload}
          disabled={!asset || asset === "None" || loading}
        >
          Download
        </Button>
        <Button
          onClick={handleCopyDownloadUrl}
          disabled={!asset || asset === "None" || loading}
        >
          Generate Download URL
        </Button>

        <Drawer>
          <DrawerTrigger>
            <p className="text-blue-500 underline cursor-pointer">
              API Documentation
            </p>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>API of ghproxy-plus</DrawerTitle>
            </DrawerHeader>
            {/* ui shit */}
            {/* In HTML, <div> cannot be a descendant of <p>. This will cause a hydration error. */}
            {/* <DrawerDescription> */}
            <div className="m-5">
              <MarkdownRenderer content={apiDocumentation} />
            </div>
            {/* </DrawerDescription> */}
            <DrawerFooter></DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
