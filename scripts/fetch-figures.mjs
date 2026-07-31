/**
 * Fetch high-quality, freely-licensed images from Wikimedia Commons to populate
 * the lesson figure placeholders. Downloads into public/figures/<id>.<ext> and
 * generates src/data/figureDefaults.ts with attribution metadata.
 *
 * Usage: node scripts/fetch-figures.mjs [--only id1,id2] [--skip-existing]
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public", "figures");
const MANIFEST = path.resolve("src", "data", "figureDefaults.ts");
const REPORT = path.resolve("scripts", "fetch-figures-report.json");
const WIDTH = 1400;
const UA = "ITSS-LMS-figure-fetcher/1.0 (educational LMS; contact: local dev)";

/** id -> list of candidate Commons file titles (tried in order). */
const FIGURES = {
  // ---- What is a computer ----
  "hardware-collage": ["Personal computer, exploded 6.svg", "Personal computer, exploded 5, unlabeled.svg", "Inside and Rear of Computer.jpg"],
  "software-stack": ["Operating system placement.svg", "Operating system placement (software).svg"],
  // ---- Pioneers ----
  "babbage-portrait": ["Charles Babbage - 1860.jpg", "Charles Babbage 1860.jpg", "PortraitOfCharlesBabbage.jpg"],
  "difference-engine": ["Difference engine.JPG", "Babbage Difference Engine.jpg", "LondonScienceMuseumsReplicaDifferenceEngine.jpg"],
  "ada-lovelace": ["Ada Lovelace portrait.jpg", "Ada lovelace.jpg", "Ada Byron daguerreotype by Antoine Claudet 1843 or 1850.jpg"],
  "jacquard-loom": ["Jacquard.loom.full.view.jpg", "A Jacquard loom showing information punchcards, National Museum of Scotland.jpg"],
  "hollerith-machine": ["HollerithMachine.CHM.jpg", "Hollerith census machine.CHM.jpg", "Hollerith Punched Card Machine.jpg"],
  // ---- Human computers & war ----
  "human-computers": ["Human computers - Dryden.jpg", "Computers working in 1949.jpg", "Harvard Computers at work.jpg"],
  "katherine-johnson": ["Katherine Johnson 1983.jpg", "Katherine Johnson at NASA, in 1966.jpg"],
  "bletchley-bombe": ["Bombe-rebuild.jpg", "Bletchley Park Bombe4.jpg", "Wartime picture of a Bletchley Park Bombe.jpg"],
  "colossus": ["Colossus.jpg", "ColossusRebuild 11.jpg"],
  "eniac": ["Eniac.jpg", "ENIAC Penn1.jpg", "Classic shot of the ENIAC.jpg"],
  "eniac-programmers": ["Two women operating ENIAC (full resolution).jpg", "Two women operating ENIAC.gif", "Reprogramming ENIAC.png"],
  "grace-hopper": ["Commodore Grace M. Hopper, USN (covered).jpg", "Grace Hopper and UNIVAC.jpg"],
  "first-bug": ["First Computer Bug, 1945.jpg", "H96566k.jpg"],
  // ---- Generations of hardware ----
  "vacuum-tubes": ["Elektronenroehren-auswahl.jpg", "Vacuum tubes!.jpg", "RCA 808 Power Vacuum Tube.jpg"],
  "first-transistor": ["Replica-of-first-transistor.jpg", "First transistor (replica).jpg"],
  "integrated-circuit": ["Silicon chip 3d.png", "Integrated circuit on microchip.jpg", "Diode, transistor & FET & IC.jpg", "EPROM Microchip SuperMacro.jpg"],
  "intel-4004": ["Intel C4004.jpg", "Intel 4004.jpg", "Intel C4004 (2295119162).jpg"],
  "altair-8800": ["Altair 8800 Computer.jpg", "Altair 8800, Smithsonian Museum.jpg", "MITS Altair 8800 Front Panel.jpg"],
  "apple-ii-ibm-pc": ["Apple II typical configuration 1977.png", "Apple II IMG 4212.jpg", "IBM PC 5150.jpg", "Ibm px xt color.jpg"],
  "iphone-2007": ["IPhone First Generation 8GB (3677961514).jpg", "IPhone 1st Gen.svg", "Original iPhone docked.jpg"],
  "moores-law-chart": ["Moore's Law Transistor Count 1970-2020.png", "Moores law (1970-2011).PNG"],
  // ---- Software history ----
  "punched-tape-code": ["FortranCardPROJ039.agr.jpg", "PaperTapes-5and8Hole.jpg", "Punched card program deck.agr.jpg"],
  "unix-pdp11": ["Ken Thompson (sitting) and Dennis Ritchie at PDP-11 (2876612463).jpg", "Ken n dennis.jpg"],
  "msdos-screen": ["FreeDOS Beta 9 pre-release5 (command line interface) on Bochs sshot20040912.png", "StartingMsdos.png", "MS-DOS-Icon.png"],
  "mac-1984": ["Macintosh 128k transparency.png", "Macintosh 128k No1.jpg", "Apple Macintosh Plus, Musée Bolo, EPFL, Lausanne.jpg"],
  "windows95-launch": ["Disquetes y CD-ROM de instalacion de Windows 95.jpg", "Windows 95 & Microsoft Plus CD Room de instalación.jpg"],
  "linux-tux": ["Tux.svg", "Tux.png"],
  "www-berners-lee": ["First Web Server.jpg", "NeXTcube first webserver.JPG", "Tim Berners-Lee 2012.jpg"],
  "ai-chat-llm": ["ChatGPT-Beispiel.png", "search:ChatGPT screenshot conversation", "search:AI chatbot screenshot"],
  // ---- Motherboard & CPU ----
  "motherboard-labelled": ["Acer E360 Socket 939 motherboard by Foxconn.svg", "Motherboard diagram.svg", "ASRock K7VT4A Pro Mainboard Labeled English.svg"],
  "cpu-top-bottom": ["Intel CPU Core i7 6700K Skylake perspective.jpg", "AMD Ryzen 7 1800X (27052268977).jpg", "Intel core i7 970 top IMGP5961 wp.jpg"],
  "cpu-in-socket": ["LGA 775 CPU Socket.jpg", "Asus P5PL2 - Socket 775-93717.jpg"],
  "cpu-cooler-paste": ["Applying thermal paste onto CPU.jpg", "Thermal paste application on CPU.jpg", "AMD heatsink and fan.jpg", "Thermal compound.jpg"],
  "cmos-battery": ["CMOS battery on motherboard.jpg", "search:CR2032 motherboard CMOS", "search:BIOS battery motherboard"],
  // ---- RAM ----
  "ddr-dimm": ["Swissbit 2GB PC2-5300U-555.jpg", "DDR4 SDRAM module.jpg", "RAM DDR4 Kingston HyperX Fury 4x4GB (25876047190).jpg"],
  "dimm-vs-sodimm": ["Desktop DDR Memory Comparison.svg", "DDR3 DIMM and SO-DIMM.jpg", "SO-DIMM- und DIMM-RAM-Speichermodule.jpg"],
  "ram-install": ["DDR and SDRAM at ESC P4VMM2 motherboard.JPG", "search:DDR4 DIMM motherboard slots"],
  "ecc-server-ram": ["MT36JSF1G72PZ-1G9K1HE.jpg", "search:registered ECC DIMM server memory module"],
  // ---- Storage ----
  "hdd-open": ["Laptop-hard-drive-exposed.jpg", "Hard disk head crash.jpg", "Open hard-drive.jpg"],
  "ssd-vs-hdd": ["SSD vs HDD.JPG", "Disassembled HDD and SSD.JPG", "HDD SSD comparison.jpg"],
  "m2-nvme": ["Samsung 970 EVO Plus (47881372152).jpg", "search:M.2 NVMe SSD", "search:M.2 SSD motherboard"],
  "sata-cables": ["SATA Data Cable.jpg", "Serial ATA cables.jpg", "SATA cables.jpg", "Sata-cable.jpg"],
  "raid-diagram": ["RAID 10.svg", "RAID 5.svg", "RAID 01.svg"],
  "lto-tape": ["LTO2-cart-purple.jpg", "LTO Ultrium 4 tape cartridge.jpg", "IBM TS3500 tape library.jpg", "StorageTek Powderhorn tape library.jpg"],
  // ---- Ports & connectors ----
  "rear-io-panel": ["ASUS P5Q-EM back panel.jpg", "Back Panel Connectors PCChips M925LR Motherboard.jpg"],
  "usb-connector-types": ["USB connectors.JPG", "Usb connectors.JPG", "USB 2.0 and 3.0 connectors.png", "Types-usb th1.svg"],
  "video-connectors": ["Lifesaver kit for presenters, mini displayport to vga, hdmi, and dvi adapters (9201274040).jpg", "Raspberry PI to monitor connectors.jpg"],
  "rj45-rj11": ["8P8C modular plugs.JPG", "8P8C modular plug (2).JPG"],
  "usbc-dock": ["USB-C docking station.jpg", "Laptop docking station.jpg", "Notebook-Dockingstation.jpg", "Dell WD15 dock.jpg"],
  // ---- Power, GPU, cooling ----
  "psu-connectors": ["PSU-Open1.jpg", "Modular power supply cables.jpg", "ATX power supply connectors.jpg", "Computer power supply unit.jpg"],
  "gpu-card": ["search:GeForce GTX graphics card", "search:Radeon graphics card PCIe", "search:graphics card GPU"],
  "pcie-slots": ["PCIExpress.jpg", "PCI und PCIe Slots.jpg", "PCIe slots on motherboard.jpg"],
  "aio-cooler": ["AIO liquid cooler.jpg", "Corsair H100i liquid CPU cooler.jpg", "All-in-one liquid cooling.jpg", "Wasserkühlung Corsair H80i GT.jpg"],
  "dusty-pc": ["Dusty CPU cooler.jpg", "Dust in computer.jpg", "Dusty heatsink.jpg", "Computer dust.jpg"],
  "desktop-ups": ["UPS - uninterruptible power supply.jpg", "APC Back-UPS.jpg", "Uninterruptible power supply.jpg", "USV Anlage.jpg"],
  // ---- Displays & printers ----
  "monitor-panels": ["Dell LCD monitor.jpg", "Computer monitor.jpg"],
  "laser-printer-cutaway": ["Laser printer diagram.svg", "Laser printer-Writing.svg", "Laserprinter workings.svg"],
  "toner-drum": ["Toner cartridge.jpg", "Laser printer toner cartridge.jpg", "HP LaserJet toner cartridge.jpg", "Tonerkartusche.jpg"],
  "inkjet-printhead": ["Printer head, ink tray, and control panel.JPG", "Ink-jet cartridges.jpg", "Canon PG-810 CL-811 ink cartridge.JPG"],
  "thermal-receipt": ["search:thermal receipt printer POS", "search:Epson receipt printer"],
  "dot-matrix": ["Epson MX-80.jpg", "EPSON DOT MATRIX PRINTER LQ-90KP.jpg"],
  "printer-3d": ["3D printer in action.jpg", "FDM 3D printer printing.jpg", "Prusa i3 MK3 3D printer.jpg", "MakerBot Replicator 2.jpg"],
  "office-mfp": ["search:Xerox multifunction printer office", "search:office photocopier multifunction"],
  // ---- Networking hardware ----
  "nic-card": ["Network card.jpg", "Ethernet NIC card.jpg", "Intel Pro 1000 GT PCI network card.jpg", "Netzwerkkarte PCIe.jpg"],
  "managed-switch": ["19-inch rackmount Ethernet switches and patch panels.jpg", "Network core (14072854771).jpg"],
  "router-firewall": ["search:Cisco ASA firewall", "search:FortiGate firewall appliance", "search:network firewall rack"],
  "wifi-ap": ["Wireless access point.jpg", "Cisco Aironet access point.jpg", "Ubiquiti UniFi AP.jpg", "WLAN Access Point an Decke.jpg"],
  "patch-panel": ["Ethernet Patch Panel 20171121 130458.jpg", "19-inch rackmount Ethernet switches and patch panels.jpg"],
  "cat6-rj45": ["Ethernet RJ45 connector p1160054.jpg", "RJ-45 Ethernet socket and plug.jpg", "Cat 6 cable with RJ45 plug.jpg"],
  "fibre-sfp": ["SFP transceivers.jpg", "SFP modules.jpg", "Fibre optic SFP transceiver.jpg", "XFP-Transceiver.jpg"],
  "onts-fibre": ["GPONxVND.jpg", "search:optical network terminal GPON"],
  // ---- Data centres ----
  "datacentre-aisle": ["BalticServers data center.jpg", "Data center aisle.jpg", "Google Data Center, The Dalles.jpg"],
  "rack-42u": ["19-inch rack rails and equipment.jpg", "Server rack.jpg", "Datacenter telecom rack.jpg", "Rack001.jpg"],
  "rack-server-1u": ["1U rack server.jpg", "Rack mounted server.jpg", "Dell PowerEdge R610.jpg", "HP ProLiant DL360 G7.jpg"],
  "blade-chassis": ["Blade server chassis.jpg", "HP BladeSystem c7000.jpg", "IBM BladeCenter.jpg", "Bladecenter-front.jpg"],
  "san-array": ["Storage area network array.jpg", "SAN storage array.jpg", "NetApp storage array.jpg", "EMC VNX storage.jpg", "IBM System Storage.jpg"],
  "ups-room": ["search:data center battery room", "search:UPS batteries data center", "search:datacenter uninterruptible power supply room"],
  "diesel-generator": ["Emergency diesel generator.jpg", "Backup diesel generator.jpg", "Standby generator.jpg", "Notstromaggregat.jpg"],
  "hot-cold-aisle": ["search:cold aisle containment", "search:data center aisle containment", "search:server room cooling aisle"],
  "rack-pdu": ["Rack PDU.jpg", "Power distribution unit.jpg", "PDU in server rack.jpg", "Steckdosenleiste Serverschrank.jpg"],
  "hyperscale-aerial": ["Google data center aerial.jpg", "Data center aerial view.jpg", "Microsoft data center.jpg", "Council Bluffs Google data center.jpg"],
  "cloud-regions-map": ["search:cloud computing diagram", "search:data centers world map", "search:content delivery network map"],
  "hypervisor-diagram": ["Hyperviseur.png", "Hypervisor types.svg", "Type 1 and Type 2 hypervisor.svg", "Virtualization diagram.svg"],
  "gpu-cluster": ["GPU computing cluster.jpg", "Nvidia DGX systems.jpg", "Supercomputer GPU nodes.jpg", "Summit supercomputer.jpg"],
  "liquid-cooled-rack": ["Liquid cooled server rack.jpg", "Immersion cooling.jpg", "Data center liquid cooling.jpg", "Direct liquid cooling server.jpg"],
  "undersea-cable-map": ["Submarine cable map umap.png", "World map of submarine cables.png", "Submarine cables around the world.png"],
  "cable-landing": ["Submarine cable landing.jpg", "Undersea cable being laid.jpg", "Submarine communications cable cross section.jpg", "Cable landing station.jpg"],
  // ---- Operating systems ----
  "os-family": ["Unix history-simple.svg", "search:Unix history timeline diagram", "search:operating system family tree"],
  "task-manager": ["Htop 3.0.1 screenshot.png", "Htop.png", "search:htop screenshot", "search:Windows Task Manager"],
  "device-manager": ["ReactOS 0.4.14 device manager screenshot.png", "ReactOS 0.3.1 - Device Manager.png"],
  "linux-server-terminal": ["Linux command-line. Bash. GNOME Terminal. screenshot.png", "Bash screenshot.png", "Ubuntu server terminal.png"],
  "licence-diagram": ["Software Categories.svg", "Software-categories.svg", "search:free software proprietary categories diagram"],
  "post-screen": ["BIOS POST screen.jpg", "POST screen.png", "American Megatrends BIOS POST.jpg", "PC POST boot screen.jpg"],
  "uefi-setup": ["search:UEFI BIOS setup utility screen", "search:BIOS setup screen", "search:American Megatrends BIOS"],
  "boot-sequence-diagram": ["GNU GRUB components.svg", "search:GRUB boot menu screenshot", "search:Linux boot process diagram"],
  "bsod": ["Bsodwindows10.png", "Blue Screen of Death (Windows 10).png", "Windows 10 BSOD.png", "BSoD in Windows 8.png"],
  "timeline-poster": ["Pc timeline.webp", "search:history of computers timeline poster"],
};

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg ? (onlyArg.includes("=") ? onlyArg.split("=")[1] : args[args.indexOf(onlyArg) + 1]).split(",") : null;
const skipExisting = args.includes("--skip-existing");

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;
const MIN_GAP = 1200; // ms between requests to stay under rate limits

async function politeFetch(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = lastRequest + MIN_GAP - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after")) || 10 * (attempt + 1);
      console.log(`    429 — backing off ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      continue;
    }
    return res;
  }
  throw new Error("rate limited (429) after retries");
}

async function api(params) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", origin: "*", ...params });
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function imageInfoFor(title) {
  const data = await api({
    action: "query",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: String(WIDTH),
  });
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.imageinfo?.length) return null;
  return page.imageinfo[0];
}

async function download(info, id) {
  const url = info.thumburl || info.url;
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  const ext = ct.includes("png") ? "png" : ct.includes("gif") ? "gif" : ct.includes("svg") ? "svg" : ct.includes("webp") ? "webp" : "jpg";
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(OUT_DIR, file), buf);
  return { file, bytes: buf.length };
}

function metaOf(info, title) {
  const em = info.extmetadata || {};
  return {
    title,
    author: stripHtml(em.Artist?.value) || "Unknown",
    license: stripHtml(em.LicenseShortName?.value) || "See source",
    sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`,
  };
}

/** Search Commons for a file when none of the curated candidates exist. */
async function searchCommons(query) {
  const data = await api({
    action: "query",
    list: "search",
    srsearch: `${query} filetype:bitmap|drawing`,
    srnamespace: "6",
    srlimit: "5",
  });
  return (data?.query?.search ?? []).map((r) => r.title.replace(/^File:/, ""));
}

// merge with any previous run so --skip-existing keeps earlier metadata
const results = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, "utf8")).results ?? {} : {};
const failures = [];

for (const [id, candidates] of Object.entries(FIGURES)) {
  if (only && !only.includes(id)) continue;
  if (skipExisting) {
    const existing = fs.readdirSync(OUT_DIR).find((f) => f.replace(/\.[a-z]+$/, "") === id);
    if (existing) {
      console.log(`= ${id} (exists: ${existing})`);
      continue;
    }
  }
  let done = false;
  // resolve candidates: plain entries are exact file titles; "search:query"
  // entries expand into the top Commons search results for that query
  let titles = [];
  for (const c of candidates) {
    if (c.startsWith("search:")) {
      try {
        const found = await searchCommons(c.slice(7));
        titles.push(...found.filter((t) => !titles.includes(t)));
      } catch {}
    } else if (!titles.includes(c)) {
      titles.push(c);
    }
  }
  for (const title of titles) {
    try {
      const info = await imageInfoFor(title);
      if (!info) continue;
      const { file, bytes } = await download(info, id);
      if (bytes < 15000) {
        fs.unlinkSync(path.join(OUT_DIR, file));
        console.log(`  ! ${id} candidate "${title}": too small (${bytes} B)`);
        continue;
      }
      results[id] = { ...metaOf(info, title), file, bytes };
      console.log(`✓ ${id} <- ${title} (${Math.round(bytes / 1024)} KB)`);
      done = true;
      break;
    } catch (e) {
      console.log(`  ! ${id} candidate "${title}": ${e.message}`);
    }
  }
  if (!done) {
    failures.push(id);
    console.log(`✗ ${id}: no candidate found`);
  }
}

fs.writeFileSync(REPORT, JSON.stringify({ results, failures }, null, 2));
console.log(`\nDone. ${Object.keys(results).length} downloaded, ${failures.length} failed.`);
if (failures.length) console.log("Failed:", failures.join(", "));
