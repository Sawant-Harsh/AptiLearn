import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Search, Youtube } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ytSearchUrl } from '../utils/courseUtils';
import { Skeleton } from './ui';

let ytPromise;
function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => { ytPromise = null; reject(new Error('yt')); };
      document.head.appendChild(tag);
    });
  }
  return ytPromise;
}

/** Real YouTube lesson video; changes with the lesson and reports when it finishes. */
export default function VideoPlayer({ course, lesson, lessonNumber, onEnded }) {
  const { api } = useApp();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fallbackIframe, setFallbackIframe] = useState(false);
  const host = useRef(null);
  const player = useRef(null);
  const endedCb = useRef(onEnded);
  endedCb.current = onEnded;

  useEffect(() => {
    let live = true;
    setLoading(true); setVideo(null);
    api(`/api/videos?courseId=${course.id}&lessonId=${lesson.id}`).then((v) => live && setVideo(v)).catch(() => live && setVideo({ videoId: null })).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [api, course.id, lesson.id]);

  useEffect(() => {
    if (!video?.videoId) return undefined;
    let cancelled = false;
    setFallbackIframe(false);
    loadYT().then((YT) => {
      if (cancelled || !host.current) return;
      host.current.innerHTML = '<div></div>';
      player.current = new YT.Player(host.current.firstChild, {
        videoId: video.videoId, width: '100%', height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onStateChange: (e) => { if (e.data === 0) endedCb.current?.(); } },
      });
    }).catch(() => !cancelled && setFallbackIframe(true));
    return () => { cancelled = true; try { player.current?.destroy(); } catch { /* ignore */ } player.current = null; };
  }, [video?.videoId]);

  const query = `${course.name} ${lesson.title}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-navy text-white shadow-card">
      <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-300">
        <span>{lesson.moduleTitle} &middot; Lesson {lessonNumber}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-medium"><Youtube size={13} /> Video lesson</span>
      </div>
      <div className="relative aspect-video w-full bg-black">
        {loading && <Skeleton className="absolute inset-0 !rounded-none opacity-30" />}
        {!loading && video?.videoId && !fallbackIframe && <div ref={host} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />}
        {!loading && video?.videoId && fallbackIframe && <iframe title={lesson.title} className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0`} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
        {!loading && !video?.videoId && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Youtube size={24} /></span>
              <p className="mt-3 font-bold">{lesson.title}</p>
              <p className="mt-1 text-sm text-slate-300">An embedded video isn't set up for this lesson yet. Watch the best videos for this topic on YouTube.</p>
              <a href={ytSearchUrl(`${query} tutorial`)} target="_blank" rel="noreferrer" className="btn btn-primary mt-4"><Search size={16} /> Search on YouTube</a>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-slate-300">
        <span className="min-w-0 truncate">{video?.title ? `${video.title}${video.channel ? ` - ${video.channel}` : ''}` : 'Pick a lesson from the syllabus to change the video.'}</span>
        <span className="flex gap-3">
          {video?.videoId && <a className="inline-flex items-center gap-1 font-semibold hover:text-white" href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Open on YouTube</a>}
          <a className="inline-flex items-center gap-1 font-semibold hover:text-white" href={ytSearchUrl(`${query} tutorial`)} target="_blank" rel="noreferrer"><Search size={12} /> More videos</a>
        </span>
      </div>
    </div>
  );
}
