import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { DateRangeProvider, useDateRange } from "./context/DateRangeContext";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import EmailByCategory from "./pages/EmailByCategory";
import FormSubmissions from "./pages/FormSubmissions";
import FormSubmitters from "./pages/FormSubmitters";
import NurtureEmails from "./pages/NurtureEmails";
import NewsletterBlog from "./pages/NewsletterBlog";
import Deliverability from "./pages/Deliverability";
import Contacts from "./pages/Contacts";
import BouncedContacts from "./pages/BouncedContacts";
import { prefetch } from "./hooks/useApiData";

// Every section's data, loaded in the background on startup so switching
// sections is instant, for the date range currently selected.
const SECTION_ENDPOINTS = [
  "/api/dashboard-summary",
  "/api/categories",
  "/api/form-submissions",
  "/api/nurture-emails",
  "/api/newsletter-blog",
  "/api/deliverability",
  "/api/bounced-contacts?type=all&page=1",
];

function Layout() {
  // Refetches for the new range whenever the date filter changes.
  const { withRange } = useDateRange();
  const { pathname } = useLocation();
  useEffect(() => prefetch(SECTION_ENDPOINTS.map(withRange)), [withRange]);

  return (
    <div className="flex bg-surface min-h-screen">
      <Sidebar />
      <main id="page-content" className="flex-1 min-w-0">
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/email-by-category" element={<EmailByCategory />} />
            <Route path="/form-submissions" element={<FormSubmissions />} />
            <Route path="/form-submissions/:formId" element={<FormSubmitters />} />
            <Route path="/nurture-emails" element={<NurtureEmails />} />
            <Route path="/newsletter-blog" element={<NewsletterBlog />} />
            <Route path="/deliverability" element={<Deliverability />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/bounced-contacts" element={<BouncedContacts />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DateRangeProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </DateRangeProvider>
    </ThemeProvider>
  );
}
