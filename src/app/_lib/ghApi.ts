import { GhRelease, GhReleaseAssets, GhTag } from "./ghResponse";

const getRepoReleasesAssets = async (
  owner: string,
  repo: string,
  tag: string = "latest"
): Promise<GhReleaseAssets | null> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/${tag}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = (await response.json()) as GhRelease;
    return data.assets.length > 0 ? data.assets[0] : null;
  } catch (error) {
    console.error("Error fetching release data:", error);
    throw error;
  }
};

const getRepoTags = async (owner: string, repo: string): Promise<GhTag[]> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/tags`
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = (await response.json()) as GhTag[];
    return data;
  } catch (error) {
    console.error("Error fetching tags data:", error);
    throw error;
  }
};

export { getRepoReleasesAssets, getRepoTags };
