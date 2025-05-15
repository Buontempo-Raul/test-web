// src/components/home/Presentation/Presentation.js
import React, { useEffect } from 'react';
import './Presentation.css';

const Presentation = () => {
  useEffect(() => {
    // Load GSAP from CDN if animation needs to be supported in browsers without native CSS animation timeline
    if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
      const loadGSAP = async () => {
        try {
          // Load gsap and ScrollTrigger from CDN
          const gsapUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/gsap.min.js';
          const scrollTriggerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/ScrollTrigger.min.js';
          
          // Load GSAP first
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = gsapUrl;
            script.onload = resolve;
            document.head.appendChild(script);
          });
          
          // Then load ScrollTrigger
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = scrollTriggerUrl;
            script.onload = resolve;
            document.head.appendChild(script);
          });
          
          // Initialize animation
          initAnimation();
        } catch (error) {
          console.error('Failed to load GSAP:', error);
        }
      };
      
      loadGSAP();
    }
    
    // Set initial values for CSS variables
    const root = document.documentElement;
    root.style.setProperty('--start', 0);
    root.style.setProperty('--hue', 0);
    root.style.setProperty('--end', 360);
    
    // Set data attributes
    root.dataset.theme = 'dark';
    root.dataset.syncScrollbar = 'true';
    root.dataset.animate = 'true';
    root.dataset.snap = 'true';
    
    // Initialize GSAP animation if needed
    function initAnimation() {
      if (!window.gsap) return;
      
      window.gsap.registerPlugin(window.ScrollTrigger);
      
      const items = window.gsap.utils.toArray('ul li');
      
      window.gsap.set(items, { opacity: (i) => (i !== 0 ? 0.2 : 1) });
      
      const dimmer = window.gsap
        .timeline()
        .to(items.slice(1), {
          opacity: 1,
          stagger: 0.5,
        })
        .to(
          items.slice(0, items.length - 1),
          {
            opacity: 0.2,
            stagger: 0.5,
          },
          0
        );
      
      const dimmerScrub = window.ScrollTrigger.create({
        trigger: items[0],
        endTrigger: items[items.length - 1],
        start: 'center center',
        end: 'center center',
        animation: dimmer,
        scrub: 0.2,
      });
      
      // Register scrollbar changer
      const scroller = window.gsap.timeline().fromTo(
        document.documentElement,
        {
          '--hue': 0,
        },
        {
          '--hue': 360,
          ease: 'none',
        }
      );
      
      const scrollerScrub = window.ScrollTrigger.create({
        trigger: items[0],
        endTrigger: items[items.length - 1],
        start: 'center center',
        end: 'center center',
        animation: scroller,
        scrub: 0.2,
      });
      
      window.gsap.fromTo(
        document.documentElement,
        {
          '--chroma': 0,
        },
        {
          '--chroma': 0.3,
          ease: 'none',
          scrollTrigger: {
            scrub: 0.2,
            trigger: items[0],
            start: 'center center+=40',
            end: 'center center',
          },
        }
      );
      
      window.gsap.fromTo(
        document.documentElement,
        {
          '--chroma': 0.3,
        },
        {
          '--chroma': 0,
          ease: 'none',
          scrollTrigger: {
            scrub: 0.2,
            trigger: items[items.length - 2],
            start: 'center center',
            end: 'center center-=40',
          },
        }
      );
    }
    
    // Cleanup function
    return () => {
      // Reset data attributes
      const root = document.documentElement;
      root.removeAttribute('data-theme');
      root.removeAttribute('data-sync-scrollbar');
      root.removeAttribute('data-animate');
      root.removeAttribute('data-snap');
      root.removeAttribute('data-debug');
      
      // Remove CSS variables
      root.style.removeProperty('--start');
      root.style.removeProperty('--hue');
      root.style.removeProperty('--end');
      root.style.removeProperty('--chroma');
    };
  }, []);

  return (
    <div className="presentation-wrapper">
      <header>
        <h1 className="fluid">Uncreated<br />art.</h1>
      </header>
      <main>
        <section className="content fluid">
          <h2>
            <span aria-hidden="true">create&nbsp;</span>
            <span className="sr-only">create anything.</span>
          </h2>
          <ul aria-hidden="true" style={{ '--count': 22 }}>
            <li style={{ '--i': 0 }}>art.</li>
            <li style={{ '--i': 1 }}>fashion.</li>
            <li style={{ '--i': 2 }}>designs.</li>
            <li style={{ '--i': 3 }}>beauty.</li>
            <li style={{ '--i': 4 }}>videos.</li>
            <li style={{ '--i': 5 }}>photos.</li>
            <li style={{ '--i': 6 }}>paintings.</li>
            <li style={{ '--i': 7 }}>jewelry.</li>
            <li style={{ '--i': 8 }}>crafts.</li>
            <li style={{ '--i': 9 }}>digital art.</li>
            <li style={{ '--i': 10 }}>sculptures.</li>
            <li style={{ '--i': 11 }}>graphics.</li>
            <li style={{ '--i': 12 }}>clothing.</li>
            <li style={{ '--i': 13 }}>posters.</li>
            <li style={{ '--i': 14 }}>accessories.</li>
            <li style={{ '--i': 15 }}>illustrations.</li>
            <li style={{ '--i': 16 }}>animations.</li>
            <li style={{ '--i': 17 }}>murals.</li>
            <li style={{ '--i': 18 }}>concepts.</li>
            <li style={{ '--i': 19 }}>collectibles.</li>
            <li style={{ '--i': 20 }}>masterpieces.</li>
            <li style={{ '--i': 21 }}>anything.</li>
          </ul>
        </section>
        <section>
          <h2 className="fluid">showcase.</h2>
        </section>
      </main>
    </div>
  );
};

export default Presentation;