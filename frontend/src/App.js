import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Watchlist from "@/pages/Watchlist";
import News from "@/pages/News";
import Calendar from "@/pages/Calendar";
import Journal from "@/pages/Journal";
import Lab from "@/pages/Lab";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <div className="App rtl-root">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/lab" element={<Lab />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/calendar" element={<Calendar />} />
                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" theme="dark" />
        </div>
    );
}

export default App;
