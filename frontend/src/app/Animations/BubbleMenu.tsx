"use client";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Settings } from "lucide-react";
import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  rotation?: number;
  hoverStyles?: {
    bgColor?: string;
    textColor?: string;
  };
  onClick?: () => void;
};

export type BubbleMenuProps = {
  logo: ReactNode | string;
  onMenuClick?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
  menuAriaLabel?: string;
  menuBg?: string;
  menuContentColor?: string;
  useFixedPosition?: boolean;
  items?: MenuItem[];
  animationEase?: string;
  animationDuration?: number;
  staggerDelay?: number;
};

const DEFAULT_ITEMS: MenuItem[] = [
  {
    label: "home",
    href: "#",
    ariaLabel: "Home",
    rotation: -8,
    hoverStyles: { bgColor: "#3b82f6", textColor: "#ffffff" },
  },
  {
    label: "about",
    href: "#",
    ariaLabel: "About",
    rotation: 8,
    hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
  },
  {
    label: "projects",
    href: "#",
    ariaLabel: "Projects",
    rotation: 8,
    hoverStyles: { bgColor: "#f59e0b", textColor: "#ffffff" },
  },
  {
    label: "blog",
    href: "#",
    ariaLabel: "Blog",
    rotation: 8,
    hoverStyles: { bgColor: "#ef4444", textColor: "#ffffff" },
  },
  {
    label: "contact",
    href: "#",
    ariaLabel: "Contact",
    rotation: -8,
    hoverStyles: { bgColor: "#8b5cf6", textColor: "#ffffff" },
  },
];

export default function BubbleMenu({
  logo,
  onMenuClick,
  className,
  style,
  menuAriaLabel = "Toggle menu",
  menuBg = "#fff",
  menuContentColor = "#111",
  useFixedPosition = false,
  items,
  animationEase = "back.out(1.5)",
  animationDuration = 0.5,
  staggerDelay = 0.12,
}: BubbleMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLAnchorElement[]>([]);
  const labelRefs = useRef<HTMLSpanElement[]>([]);

  const menuItems = items?.length ? items : DEFAULT_ITEMS;

  const containerClassName = [
    "bubble-menu",
    useFixedPosition ? "fixed" : "absolute",
    "left-0 right-2 top-2",
    "flex items-center justify-between",
    "gap-4 px-8",
    "pointer-events-none",
    "z-[1001]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleToggle = () => {
    const nextState = !isMenuOpen;
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    onMenuClick?.(nextState);
  };

  // GSAP animation logic
  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!overlay || !bubbles.length) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: "flex" });
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(labels, { y: 24, autoAlpha: 0 });

      bubbles.forEach((bubble, i) => {
        const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);
        const tl = gsap.timeline({ delay });
        tl.to(bubble, {
          scale: 1,
          duration: animationDuration,
          ease: animationEase,
        });
        if (labels[i]) {
          tl.to(
            labels[i],
            {
              y: 0,
              autoAlpha: 1,
              duration: animationDuration,
              ease: "power3.out",
            },
            "-=" + animationDuration * 0.9
          );
        }
      });
    } else if (showOverlay) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, {
        y: 24,
        autoAlpha: 0,
        duration: 0.2,
        ease: "power3.in",
      });
      gsap.to(bubbles, {
        scale: 0,
        duration: 0.2,
        ease: "power3.in",
        onComplete: () => {
          gsap.set(overlay, { display: "none" });
          setShowOverlay(false);
        },
      });
    }
  }, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay]);

  // Handle rotation responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (isMenuOpen) {
        const bubbles = bubblesRef.current.filter(Boolean);
        const isDesktop = window.innerWidth >= 900;
        bubbles.forEach((bubble, i) => {
          const item = menuItems[i];
          if (bubble && item) {
            const rotation = isDesktop ? item.rotation ?? 0 : 0;
            gsap.set(bubble, { rotation });
          }
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen, menuItems]);

  return (
    <>
      {/* Tailwind overrides */}
      <style>{`
        .bubble-menu-items .pill-list .pill-col:nth-child(4):nth-last-child(2) {
          margin-left: calc(100% / 6);
        }
        .bubble-menu-items .pill-list .pill-col:nth-child(4):last-child {
          margin-left: calc(100% / 3);
        }
        @media (min-width: 900px) {
          .bubble-menu-items .pill-link {
            transform: rotate(var(--item-rot));
          }
          .bubble-menu-items .pill-link:hover {
            transform: rotate(var(--item-rot)) scale(1.06);
            background: var(--hover-bg) !important;
            color: var(--hover-color) !important;
          }
          .bubble-menu-items .pill-link:active {
            transform: rotate(var(--item-rot)) scale(.94);
          }
        }
        @media (max-width: 899px) {
          .bubble-menu-items {
            padding-top: 120px;
            align-items: flex-start;
          }
          .bubble-menu-items .pill-list {
            row-gap: 16px;
          }
          .bubble-menu-items .pill-col {
            flex: 0 0 100% !important;
            margin-left: 0 !important;
          }
          .bubble-menu-items .pill-link {
            font-size: clamp(1.2rem, 3vw, 4rem);
            padding: clamp(1rem, 2vw, 2rem) 0;
            min-height: 80px !important;
          }
          .bubble-menu-items .pill-link:hover {
            transform: scale(1.06);
            background: var(--hover-bg);
            color: var(--hover-color);
          }
          .bubble-menu-items .pill-link:active {
            transform: scale(.94);
          }
        }
      `}</style>

      <nav
        className={[containerClassName, "justify-end pr-[35px] pt-[6px]"].join(
          " "
        )}
        style={style}
        aria-label="Main navigation"
      >
        {/* Toggle Button (Settings icon) */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={menuAriaLabel}
          aria-pressed={isMenuOpen}
          className="bubble toggle-bubble menu-btn inline-flex items-center justify-center rounded-full bg-white shadow-md pointer-events-auto w-8 h-8 md:w-8 md:h-8 border-0 cursor-pointer p-0"
          style={{ background: menuBg }}
        >
          <Settings
            className={`size-7 md:size-7 transition-transform duration-300 ${
              isMenuOpen ? "rotate-90" : "rotate-0"
            }`}
            style={{ color: menuContentColor }}
          />
        </button>
      </nav>

      {/* Overlay Menu */}
      {showOverlay && (
        <div
          ref={overlayRef}
          className={[
            "bubble-menu-items",
            useFixedPosition ? "fixed" : "absolute",
            "inset-0 flex items-center justify-center",
            "pointer-events-none z-[1000]",
          ].join(" ")}
          aria-hidden={!isMenuOpen}
          style={{
            backdropFilter: "blur(25px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="menu-window relative flex flex-col items-center justify-center p-8 pointer-events-auto"
            style={{
              width: "50%",
              height: "550px",
              borderRadius: "12px",
            }}
          >
            <ul
              className="pill-list list-none m-0 px-6 w-full h-full flex flex-wrap gap-x-0 gap-y-1"
              role="menu"
              aria-label="Menu links"
            >
              {menuItems.map((item, idx) => (
                <li
                  key={idx}
                  role="none"
                  className="pill-col flex justify-center items-stretch [flex:0_0_calc(100%/3)] box-border"
                >
                  <Link
                    role="menuitem"
                    href={item.href}
                    aria-label={item.ariaLabel || item.label}
                    className="pill-link w-full rounded-[999px] no-underline bg-white text-inherit shadow-md flex items-center justify-center relative transition-[background,color] duration-300 ease-in-out box-border whitespace-nowrap overflow-hidden"
                    style={
                      {
                        ["--item-rot"]: `${item.rotation ?? 0}deg`,
                        ["--pill-bg"]: menuBg,
                        ["--pill-color"]: menuContentColor,
                        ["--hover-bg"]: item.hoverStyles?.bgColor || "#f3f4f6",
                        ["--hover-color"]:
                          item.hoverStyles?.textColor || menuContentColor,
                        background: "var(--pill-bg)",
                        color: "var(--pill-color)",
                        minHeight: "var(--pill-min-h, 100px)", // reduced height
                        padding: "clamp(0.8rem, 2vw, 3rem) 0", // less padding
                        fontSize: "clamp(1rem, 2.5vw, 2rem)", // smaller font

                        fontWeight: 400,
                        lineHeight: 0,
                        willChange: "transform",
                      } as CSSProperties
                    }
                    ref={(el) => {
                      if (el) bubblesRef.current[idx] = el;
                    }}
                    onClick={(e) => {
                      e.preventDefault(); // prevent default Next.js navigation if using a function
                      if (
                        "onClick" in item &&
                        typeof (item as { onClick?: () => void }).onClick ===
                          "function"
                      ) {
                        item.onClick?.();
                      } else {
                        window.location.href = item.href; // fallback to regular navigation
                      }
                      setIsMenuOpen(false); // optionally close the menu after click
                      setShowOverlay(false);
                    }}
                  >
                    <span
                      className="pill-label inline-block"
                      style={{
                        willChange: "transform, opacity",
                        height: "1.2em",
                        lineHeight: 1.2,
                      }}
                      ref={(el) => {
                        if (el) labelRefs.current[idx] = el;
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
