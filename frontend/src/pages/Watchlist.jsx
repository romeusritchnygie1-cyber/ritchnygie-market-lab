import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import WatchlistGrid from "@/components/WatchlistGrid";
import Mag7Heatmap from "@/components/Mag7Heatmap";
import IndicatorsPanel from "@/components/IndicatorsPanel";

export default function Watchlist() {
    return (
        <div className="min-h-screen" data-testid="watchlist-page">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="mb-6">
                    <div className="rtl-eyebrow">Watchlist</div>
                    <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                        Macro Watchlist
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <section className="lg:col-span-12">
                        <Mag7Heatmap />
                    </section>
                    <section className="lg:col-span-12">
                        <WatchlistGrid />
                    </section>
                    <section className="lg:col-span-12">
                        <IndicatorsPanel />
                    </section>
                </div>
            </main>
        </div>
    );
}
