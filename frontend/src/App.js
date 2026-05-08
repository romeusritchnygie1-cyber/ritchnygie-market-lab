import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Watchlist from "@/pages/Watchlist";
import News from "@/pages/News";
import Calendar from "@/pages/Calendar";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <div className="App rtl-root">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/calendar" element={<Calendar />} />
                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </div>
    );
}

export default App;
