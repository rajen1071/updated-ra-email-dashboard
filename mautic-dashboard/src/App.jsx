import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import EmailByCategory from "./pages/EmailByCategory";
import FormSubmissions from "./pages/FormSubmissions";
import NurtureEmails from "./pages/NurtureEmails";
import NewsletterBlog from "./pages/NewsletterBlog";
import Deliverability from "./pages/Deliverability";
import Contacts from "./pages/Contacts";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-surface min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/email-by-category" element={<EmailByCategory />} />
            <Route path="/form-submissions" element={<FormSubmissions />} />
            <Route path="/nurture-emails" element={<NurtureEmails />} />
            <Route path="/newsletter-blog" element={<NewsletterBlog />} />
            <Route path="/deliverability" element={<Deliverability />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
