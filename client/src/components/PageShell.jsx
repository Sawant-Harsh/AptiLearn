import Header from './Header';
import Footer from './Footer';
import ChatAssistant from './ChatAssistant';
import { useApp } from '../context/AppContext';

/** Header + content + footer; AptiBot floats on every signed-in page. */
export default function PageShell({ children, chat = true }) {
  const { user } = useApp();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <Footer />
      {user && chat && <ChatAssistant />}
    </div>
  );
}
