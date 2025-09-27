import BubbleMenu from "../Animations/BubbleMenu";
import React from "react";

type SettingsMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // only render when open

  const items = [
    {
      label: "home",
      href: "#",
      rotation: -8,
      hoverStyles: { bgColor: "#3b82f6", textColor: "#fff" },
    },
    {
      label: "about",
      href: "#",
      rotation: 8,
      hoverStyles: { bgColor: "#10b981", textColor: "#fff" },
    },
    {
      label: "projects",
      href: "#",
      rotation: 8,
      hoverStyles: { bgColor: "#f59e0b", textColor: "#fff" },
    },
    {
      label: "blog",
      href: "#",
      rotation: 8,
      hoverStyles: { bgColor: "#ef4444", textColor: "#fff" },
    },
    {
      label: "contact",
      href: "#",
      rotation: -8,
      hoverStyles: { bgColor: "#8b5cf6", textColor: "#fff" },
    },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
      onClick={onClose} // close if user clicks outside
    >
      <div
        className="w-[60%] h-[50%] bg-black rounded-2xl shadow-lg flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <BubbleMenu
          logo={<span style={{ fontWeight: 700 }}>RB</span>}
          items={items}
          menuAriaLabel="Toggle navigation"
          menuBg="#ffffff"
          menuContentColor="#111111"
          useFixedPosition={false}
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
        />
      </div>
    </div>
  );
};

export default SettingsMenu;
