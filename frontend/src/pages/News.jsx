import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import NewsFeed from "@/components/NewsFeed";

export default function News() {
    return (
        <div className="min-h-screen" data-testid="news-page">
            <Header />
            <TickerStrip />
            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="mb-6">
                    <div className="rtl-eyebrow">Market Intel</div>
                    <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                        News &amp; Institutional Signals
                    </h1>
                    <p className="mt-2 txt-sec text-sm max-w-2xl font-body">
                        Aggregated headlines from major institutions (Goldman Sachs, Morgan Stanley,
                        Bank of America), macro indicators, and tech leaders. Filter by category to focus
                        on what moves your edge.
                    </p>
                </div>

                <NewsFeed limit={50} />
            </main>
        </div>
    );
}
