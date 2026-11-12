import { getSettings } from "@/lib/data";
import { dataWarnings, getHomepage, loadHomepageData } from "@/lib/homepage";
import { normalizeLayout, planQueries, type NormalizedBlock } from "@/lib/homepage-plan";
import { getPreviewUser, previewHref } from "@/lib/preview";
import { HomePreviewNotes } from "./HomePreviewNotes";
import { HomepageView } from "./HomepageView";

/**
 * Pratinjau: tautan blok ke beranda ("/", "/#jangkar") diarahkan ke /pratinjau/beranda,
 * karena "/" di host admin dialihkan ke /admin. Tidak dipakai untuk pengunjung.
 */
const withPreviewLinks = (block: NormalizedBlock): NormalizedBlock => {
  if (block.blockType === "orderSteps" && block.linkHref) return { ...block, linkHref: previewHref(block.linkHref) };
  if (block.blockType === "callToAction" && block.buttonHref) {
    return { ...block, buttonHref: previewHref(block.buttonHref) };
  }
  return block;
};

/**
 * Isi Beranda, dipakai `/` dan `/pratinjau/beranda`. Pengunjung melihat versi tayang (atau
 * susunan bawaan); admin yang mempratinjau melihat draf terakhir beserta catatannya.
 */
export async function HomePageContent() {
  const [settings, homepage] = await Promise.all([getSettings(), getHomepage()]);
  const { blocks, warnings } = normalizeLayout(homepage.layout);
  const data = await loadHomepageData(planQueries(blocks));
  const previewUser = await getPreviewUser();

  return (
    <>
      {previewUser ? (
        <HomePreviewNotes status={homepage.status} warnings={[...warnings, ...dataWarnings(blocks, data)]} />
      ) : null}
      <HomepageView
        blocks={previewUser ? blocks.map(withPreviewLinks) : blocks}
        data={data}
        publisherName={settings.publisherName}
      />
    </>
  );
}
