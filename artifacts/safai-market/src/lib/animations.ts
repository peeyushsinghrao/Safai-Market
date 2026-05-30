export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

export const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.15 } },
};

export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
};

export const cartBadgeVariants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 20 } },
};

export const successVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1, opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 15, delay: 0.1 }
  },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};
