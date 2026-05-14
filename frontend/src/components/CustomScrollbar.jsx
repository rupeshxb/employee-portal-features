import { useEffect, useRef, useState, useCallback } from 'react';
import '../style/CustomScrollbar.css';

const MIN_THUMB_HEIGHT = 32;

const CustomScrollbar = ({ children, className = '' }) => {
    const containerRef = useRef(null);
    const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });

    const measure = useCallback(() => {
        const c = containerRef.current;
        if (!c) return;
        const { clientHeight, scrollHeight, scrollTop } = c;
        if (scrollHeight <= clientHeight) {
            setThumb(prev => (prev.visible ? { height: 0, top: 0, visible: false } : prev));
            return;
        }
        const ratio = clientHeight / scrollHeight;
        const thumbHeight = Math.max(Math.round(ratio * clientHeight), MIN_THUMB_HEIGHT);
        const maxScroll = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - thumbHeight;
        const top = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * maxThumbTop) : 0;
        setThumb(prev => {
            if (prev.visible && prev.height === thumbHeight && prev.top === top) return prev;
            return { height: thumbHeight, top, visible: true };
        });
    }, []);

    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        measure();
        c.addEventListener('scroll', measure, { passive: true });
        const ro = new ResizeObserver(measure);
        ro.observe(c);
        Array.from(c.children).forEach(child => ro.observe(child));
        const mo = new MutationObserver(measure);
        mo.observe(c, { childList: true, subtree: true });
        return () => {
            c.removeEventListener('scroll', measure);
            ro.disconnect();
            mo.disconnect();
        };
    }, [measure]);

    const onThumbMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        const ratio = c.clientHeight / c.scrollHeight;
        const thumbHeight = Math.max(Math.round(ratio * c.clientHeight), MIN_THUMB_HEIGHT);
        const maxThumbTop = c.clientHeight - thumbHeight;
        const maxScroll = c.scrollHeight - c.clientHeight;
        const startY = e.clientY;
        const startScroll = c.scrollTop;

        const handleMove = (ev) => {
            const dy = ev.clientY - startY;
            const dragRatio = maxThumbTop > 0 ? dy / maxThumbTop : 0;
            c.scrollTop = Math.max(0, Math.min(maxScroll, startScroll + dragRatio * maxScroll));
        };
        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    const onTrackMouseDown = (e) => {
        if (e.target.classList.contains('cs-thumb')) return;
        const c = containerRef.current;
        if (!c) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const ratio = c.clientHeight / c.scrollHeight;
        const thumbHeight = Math.max(Math.round(ratio * c.clientHeight), MIN_THUMB_HEIGHT);
        const maxThumbTop = c.clientHeight - thumbHeight;
        const maxScroll = c.scrollHeight - c.clientHeight;
        const targetThumbTop = Math.max(0, Math.min(maxThumbTop, clickY - thumbHeight / 2));
        const scrollRatio = maxThumbTop > 0 ? targetThumbTop / maxThumbTop : 0;
        c.scrollTo({ top: scrollRatio * maxScroll, behavior: 'smooth' });
    };

    return (
        <div className={`cs-wrapper ${className}`}>
            <div ref={containerRef} className="cs-scroll-area">
                {children}
            </div>
            {thumb.visible && (
                <div className="cs-track" onMouseDown={onTrackMouseDown}>
                    <div
                        className="cs-thumb"
                        style={{
                            height: `${thumb.height}px`,
                            transform: `translateY(${thumb.top}px)`,
                        }}
                        onMouseDown={onThumbMouseDown}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomScrollbar;
