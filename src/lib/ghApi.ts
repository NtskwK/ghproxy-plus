import { GhRelease, GhReleaseAssets, GhTag } from "./ghResponse";

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

const getRepoReleases = async (
  owner: string,
  repo: string
): Promise<GhRelease[]> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = (await response.json()) as GhRelease[];
    return data;
  } catch (error) {
    console.error("Error fetching releases data:", error);
    throw error;
  }
};

export { getRepoTags, getRepoReleases };
