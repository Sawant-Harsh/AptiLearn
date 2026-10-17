import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/format';

export default function ChatAssistant() {
  const { api, chatContext } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([{ from: 'bot', text: "Hi, I'm AptiBot. Ask me anything: your lessons, a tricky concept, code, maths, or something completely different." }]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    const history = [...msgs, { from: 'me', text: message }];
    setMsgs(history);
    setInput('');
    setBusy(true);
    try {
      const messages = history.filter((m) => !m.error).slice(-10).map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text }));
      const d = await api('/api/ai/chat', { method: 'POST', body: { messages, context: chatContext || undefined } });
      setMsgs((m) => [...m, { from: 'bot', text: d.reply }]);
    } catch (err) {
      setMsgs((m) => [...m, { from: 'bot', text: err.message, error: true }]);
    } finally { setBusy(false); }
  };

  const chip = (kind) => {
    if (kind === 'summary') {
      if (chatContext?.lesson) return send(`Summarize the key points of the lesson "${chatContext.lesson}" from the course "${chatContext.course}".`);
      setInput('Summarize the topic: '); inputRef.current?.focus(); return undefined;
    }
    setInput(kind === 'concept' ? 'Explain  in simple terms with an example' : 'I have a doubt: ');
    setTimeout(() => { inputRef.current?.focus(); if (kind === 'concept') inputRef.current?.setSelectionRange(8, 8); }, 0);
    return undefined;
  };

  return (
    <>
      {open && (
        <section aria-label="AptiBot study assistant" className="pop-in fixed bottom-24 right-4 z-50 flex h-[min(580px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop sm:right-6">
          <header className="flex items-center gap-3 bg-navy px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600"><Bot size={18} /></span>
            <div className="flex-1 leading-tight"><p className="text-sm font-bold">AptiBot</p><p className="text-xs text-slate-300">Your AI learning companion</p></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"><X size={18} /></button>
          </header>
          {chatContext?.lesson && <div className="border-b border-slate-100 bg-brand-50 px-4 py-2 text-xs text-brand-800">Current lesson: <span className="font-semibold">{chatContext.lesson}</span></div>}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed', m.from === 'me' ? 'rounded-br-md bg-brand-600 text-white' : m.error ? 'rounded-bl-md bg-red-50 text-red-700' : 'rounded-bl-md bg-slate-100 text-navy')}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="flex"><div className="typing flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3"><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /></div></div>}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {[['summary', 'Summarize this video'], ['concept', 'Explain a concept'], ['doubt', 'Resolve a doubt instantly']].map(([k, l]) => (
              <button key={k} onClick={() => chip(k)} disabled={busy} className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50">{l}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="input" aria-label="Message AptiBot" />
            <button type="submit" disabled={!input.trim() || busy} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"><Send size={16} /></button>
          </form>
          <p className="pb-2 text-center text-[11px] text-slate-400">AI can make mistakes. Check key details.</p>
        </section>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close AI study assistant' : 'Open AI study assistant'} aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700 sm:right-6">
        {open ? <X size={18} /> : <Sparkles size={18} />}<span>{open ? 'Close' : 'Ask AI'}</span>
      </button>
    </>
  );
}
