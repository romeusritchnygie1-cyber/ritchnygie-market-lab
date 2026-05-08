import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import HeroSPX from "@/components/HeroSPX";
import Mag7Heatmap from "@/components/Mag7Heatmap";
import RegimeCard from "@/components/RegimeCard";
import EconomicCalendar from "@/components/EconomicCalendar";
import NewsFeed from "@/components/NewsFeed";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import LondonSession from "@/components/LondonSession";
import MacroPanel from "@/components/MacroPanel";

export default function Dashboard() {
    return (
        <div className="min-h-screen" data-testid="dashboard">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-10">
                {/* Page eyebrow */}
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <div className="rtl-eyebrow">Macro Trading Intelligence</div>
                        <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                            Trading Terminal
                        </h1>
                    </div>
                    <div className="hidden md:block text-right">
                        <div className="rtl-eyebrow mb-1">Strategy</div>
                        <div className="text-sm txt-sec font-mono">Macro · CFD · London Session</div>
                    </div>
                </div>

                {/* 12-col control room grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Hero SPX CFD */}
                    <section className="lg:col-span-8">
                        <HeroSPX />
                    </section>

                    {/* Regime engine */}
                    <section className="lg:col-span-4">
                        <RegimeCard />
                    </section>

                    {/* Mag 7 heatmap */}
                    <section className="lg:col-span-8">
                        <Mag7Heatmap />
                    </section>

                    {/* London session */}
                    <section className="lg:col-span-4">
                        <LondonSession />
                    </section>

                    {/* Macro panel (FRED) */}
                    <section className="lg:col-span-12">
                        <MacroPanel />
                    </section>

                    {/* Indicators */}
                    <section className="lg:col-span-6">
                        <IndicatorsPanel />
                    </section>

                    {/* Economic calendar */}
                    <section className="lg:col-span-6">
                        <EconomicCalendar compact />
                    </section>

                    {/* News */}
                    <section className="lg:col-span-12">
                        <NewsFeed limit={12} />
                    </section>
                </div>

                <footer className="mt-12 pt-6 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-[10px] tracking-[0.22em] uppercase txt-mute font-headings">
                            Ritchnygie Trading Lab · Phase 1 · Macro Intelligence
                        </div>
                        <div className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                            Phase 2 · Journal · Backtest · Probability  ·  Phase 3 · AI Clarity Score · Trade Scanner
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
