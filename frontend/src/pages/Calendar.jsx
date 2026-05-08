import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import EconomicCalendar from "@/components/EconomicCalendar";
import MacroPanel from "@/components/MacroPanel";

export default function Calendar() {
    return (
        <div className="min-h-screen" data-testid="calendar-page">
            <Header />
            <TickerStrip />
            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="mb-6">
                    <div className="rtl-eyebrow">Risk Calendar</div>
                    <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                        Economic Calendar &amp; Macro
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <section className="lg:col-span-12">
                        <MacroPanel />
                    </section>
                    <section className="lg:col-span-12">
                        <EconomicCalendar />
                    </section>
                </div>
            </main>
        </div>
    );
}
