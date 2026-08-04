/**
 * Figure defaults for the "HWSW2" Hardware & Software Illustrated Slide Deck lesson.
 * Images live in /public/HWSW/ (renamed to match slide headings). These entries are
 * merged with FIGURE_DEFAULTS at render time so each figure id resolves directly to
 * its slide image without requiring a staff upload.
 */
import type { FigureDefault } from "./figureDefaults";

/** URL-encode a file name but keep parentheses and commas readable. */
const src = (name: string) => "/HWSW/" + encodeURI(name);

const own = { author: "IT System Support (course materials)", license: "Course material", sourceUrl: "" };

export const HWSW_SLIDE_FIGURES: Record<string, FigureDefault> = {
  // Introduction
  "hwsw2-4-components": { src: src("The 4 Components of a Computer System.png"), ...own },
  "hwsw2-software-modules-overview": { src: src("Software Modules - The Programs That Power Your PC.png"), ...own },

  // The Motherboard
  "hwsw2-motherboard-components": { src: src("Motherboard Components.png"), ...own },
  "hwsw2-motherboard-cpu-socket": { src: src("Motherboard Components - CPU Socket.png"), ...own },
  "hwsw2-vrm": { src: src("VRM (Voltage Regulator Module) - The Power Behind Your CPU.png"), ...own },
  "hwsw2-bios-uefi": { src: src("BIOS-UEFI Chip - The Firmware That Starts Your PC.png"), ...own },
  "hwsw2-cmos-battery": { src: src("CMOS Battery - The Power Source for BIOS Settings.png"), ...own },

  // CPU
  "hwsw2-cpu": { src: src("CPU (Central Processing Unit).png"), ...own },
  "hwsw2-cpu-cache": { src: src("CPU Cache (L1, L2, L3).png"), ...own },
  "hwsw2-different-cpus-gpus": { src: src("Different CPUs and GPUs.png"), ...own },

  // Cooling
  "hwsw2-cpu-cooler-air": { src: src("CPU Cooler (Air Cooler).png"), ...own },
  "hwsw2-cpu-cooler-aio": { src: src("Liquid CPU Cooler (AIO).png"), ...own },
  "hwsw2-cooling-components": { src: src("Cooling and Thermal Components.png"), ...own },

  // Memory
  "hwsw2-memory-ram": { src: src("Memory (RAM).png"), ...own },
  "hwsw2-dimm-slots": { src: src("DIMM Slots (Dual In-Line Memory Module).png"), ...own },

  // Storage
  "hwsw2-storage-devices": { src: src("Storage Devices.png"), ...own },
  "hwsw2-storage-hardware": { src: src("Storage Hardware.png"), ...own },
  "hwsw2-ssd-nvme": { src: src("SSD (NVMe M.2).png"), ...own },
  "hwsw2-m2-slots": { src: src("M.2 Slots - High-Performance Storage.png"), ...own },
  "hwsw2-sata-ports": { src: src("SATA Ports - Connecting Storage Devices.png"), ...own },
  "hwsw2-data-units": { src: src("Data Units Explained - From 1 Kilobyte to Zettabytes.png"), ...own },
  "hwsw2-history-storage": { src: src("The History of Storage Devices.png"), ...own },
  "hwsw2-info-in-world": { src: src("How Much Information Do We Have in the World.png"), ...own },

  // Graphics & AI Hardware
  "hwsw2-gpu": { src: src("Graphics Processing Unit (GPU).png"), ...own },
  "hwsw2-graphics-ai-1": { src: src("Graphics and AI Hardware (1).png"), ...own },
  "hwsw2-graphics-ai-2": { src: src("Graphics and AI Hardware (2).png"), ...own },
  "hwsw2-modern-ai-pc": { src: src("Modern AI PC Hardware.png"), ...own },

  // Power Supply
  "hwsw2-psu": { src: src("Power Supply Unit (PSU).png"), ...own },
  "hwsw2-psu-convert": { src: src("How a PSU Converts and Delivers Power in a PC.png"), ...own },

  // Case, Ports & Expansion
  "hwsw2-case": { src: src("Computer Case (Chassis).png"), ...own },
  "hwsw2-rear-io": { src: src("Rear I-O Panel - Old vs Latest.png"), ...own },
  "hwsw2-new-ports": { src: src("New Ports and Connections.png"), ...own },
  "hwsw2-expansion-hw": { src: src("Expansion Hardware.png"), ...own },

  // Input & Peripherals
  "hwsw2-input-devices": { src: src("Input Devices.png"), ...own },
  "hwsw2-input-devices-extended": { src: src("Input Devices (Extended).png"), ...own },
  "hwsw2-peripheral-devices": { src: src("Peripheral Devices.png"), ...own },

  // Networking Hardware
  "hwsw2-networking-hw": { src: src("Networking Hardware 2026.png"), ...own },
  "hwsw2-networking-connectivity": { src: src("Networking and Connectivity.png"), ...own },

  // Operating Systems / System Software
  "hwsw2-os": { src: src("Operating Systems (System Software).png"), ...own },
  "hwsw2-os-components-1": { src: src("Operating System Components (1).png"), ...own },
  "hwsw2-os-components-2": { src: src("Operating System Components (2).png"), ...own },
  "hwsw2-kernel-registry-1": { src: src("Kernel vs Registry (Windows) (1).png"), ...own },
  "hwsw2-kernel-registry-2": { src: src("Kernel vs Registry (Windows) (2).png"), ...own },
  "hwsw2-use-registry": { src: src("When Would You Want to Use the Registry.png"), ...own },
  "hwsw2-firmware-low-level": { src: src("Firmware and Low-Level Software.png"), ...own },

  // Application Software
  "hwsw2-app-software": { src: src("Application Software.png"), ...own },
  "hwsw2-enterprise-software": { src: src("Enterprise and Business Software.png"), ...own },
  "hwsw2-web-software": { src: src("Web and Internet Software.png"), ...own },
  "hwsw2-multimedia-software": { src: src("Multimedia and Creative Software.png"), ...own },
  "hwsw2-database-software": { src: src("Database Software.png"), ...own },
  "hwsw2-programming-software": { src: src("Programming and Development Software.png"), ...own },
  "hwsw2-utility-software": { src: src("Utility Software.png"), ...own },

  // Cloud, Virtualization, Security & AI
  "hwsw2-cloud-1": { src: src("Cloud Computing Software (1).png"), ...own },
  "hwsw2-cloud-2": { src: src("Cloud Computing Software (2).png"), ...own },
  "hwsw2-virtualization": { src: src("Virtualization and Containers.png"), ...own },
  "hwsw2-networking-software": { src: src("Networking Software.png"), ...own },
  "hwsw2-cybersecurity": { src: src("Cybersecurity Software.png"), ...own },
  "hwsw2-ai-software": { src: src("AI Software.png"), ...own },
};
