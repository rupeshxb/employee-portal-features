import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
