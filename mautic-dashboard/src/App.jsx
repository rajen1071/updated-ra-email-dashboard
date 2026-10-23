import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import EmailByCategory from "./pages/EmailByCategory";
import FormSubmissions from "./pages/FormSubmissions";
import FormSubmitters from "./pages/FormSubmitters";
import NurtureEmails from "./pages/NurtureEmails";
import NewsletterBlog from "./pages/NewsletterBlog";
import Deliverability from "./pages/Deliverability";
import Contacts from "./pages/Contacts";
import { prefetch } from "./hooks/useApiData";

// Every section's data, loaded in the background on startup so switching
// sections is instant. (The dashboard's date-range chart loads itself.)
const SECTION_ENDPOINTS = [
  "/api/dashboard-summary",
  "/api/categories",
  "/api/form-submissions",
  "/api/nurture-emails",
  "/api/newsletter-blog",
  "/api/deliverability",
];

export default function App() {
  useEffect(() => prefetch(SECTION_ENDPOINTS), []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex bg-surface min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/email-by-category" element={<EmailByCategory />} />
              <Route path="/form-submissions" element={<FormSubmissions />} />
              <Route path="/form-submissions/:formId" element={<FormSubmitters />} />
              <Route path="/nurture-emails" element={<NurtureEmails />} />
              <Route path="/newsletter-blog" element={<NewsletterBlog />} />
              <Route path="/deliverability" element={<Deliverability />} />
              <Route path="/contacts" element={<Contacts />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
