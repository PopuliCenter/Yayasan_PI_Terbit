import { selectShelf, selectTopics, type HomepageData, type NormalizedBlock } from "@/lib/homepage-plan";
import { BookShelfSection, LatestBooksSection } from "./BookSections";
import { HeroSection } from "./HeroSection";
import { CallToActionSection, NewsSection, OrderStepsSection, TextSection, TopicsSection } from "./InfoSections";

type Props = {
  blocks: readonly NormalizedBlock[];
  data: HomepageData;
  /** Nama penerbit resmi dari Pengaturan Situs (pengganti {penerbit}). */
  publisherName: string;
};

/**
 * Merender susunan Beranda yang sudah dinormalisasi. Tidak ada kueri di sini: setiap
 * bagian hanya memotong data dari loadHomepageData().
 */
export function HomepageView({ blocks, data, publisherName }: Props) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.blockType) {
          case "hero":
            return <HeroSection key={block.key} block={block} data={data} publisherName={publisherName} />;
          case "latestBooks":
            return <LatestBooksSection key={block.key} block={block} books={data.latest.slice(0, block.limit)} />;
          case "bookShelf": {
            const { books, category } = selectShelf(block, data);
            return <BookShelfSection key={block.key} block={block} books={books} category={category} />;
          }
          case "topics":
            return <TopicsSection key={block.key} block={block} categories={selectTopics(block, data).categories} />;
          case "orderSteps":
            return <OrderStepsSection key={block.key} block={block} />;
          case "callToAction":
            return <CallToActionSection key={block.key} block={block} />;
          case "news":
            return <NewsSection key={block.key} block={block} posts={data.posts.slice(0, block.limit)} />;
          case "textSection":
            return <TextSection key={block.key} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
