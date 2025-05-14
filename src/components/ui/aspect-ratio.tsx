
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { motion } from "framer-motion"

const AspectRatio = AspectRatioPrimitive.Root

// Animated version of AspectRatio
const AnimatedAspectRatio = motion(AspectRatioPrimitive.Root)

export { AspectRatio, AnimatedAspectRatio }
