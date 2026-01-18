/**
 * Generate Challenge Resource Files
 * 
 * This script creates the actual files for challenges that require attachments.
 * Run with: npx tsx scripts/generate-challenge-files.ts
 */

import * as fs from "fs";
import * as path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

const PUBLIC_DIR = path.join(__dirname, "..", "public", "challenges");

// Ensure directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Challenge 1: Hidden Pixels (Forensics)
 * Creates a PNG image with the flag hidden in metadata and LSB
 */
async function createHiddenPixels() {
  console.log("Creating hidden.png...");
  
  const flag = "ctf{steganography_101}";
  const outputPath = path.join(PUBLIC_DIR, "forensics", "hidden.png");
  ensureDir(path.dirname(outputPath));

  // Create a simple image with hidden data
  // The flag will be hidden in:
  // 1. PNG metadata (tEXt chunk)
  // 2. Appended after the PNG data (strings will find it)
  
  const width = 400;
  const height = 300;
  
  // Create gradient background
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = Math.floor((x / width) * 100) + 20;     // R - dark blue gradient
      pixels[i + 1] = Math.floor((y / height) * 50) + 30; // G
      pixels[i + 2] = Math.floor(150 + Math.sin(x * 0.05) * 50); // B
      pixels[i + 3] = 255; // A
    }
  }

  // Create PNG with metadata containing the flag
  await sharp(pixels, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .withMetadata({
      exif: {
        IFD0: {
          Copyright: "CTF Challenge - Look deeper!",
          ImageDescription: flag,
        },
      },
    })
    .toFile(outputPath);

  // Also append the flag as a comment (findable with strings/hexdump)
  const fileContent = fs.readFileSync(outputPath);
  const hiddenComment = Buffer.from(`\n<!-- ${flag} -->\n`);
  fs.writeFileSync(outputPath, Buffer.concat([fileContent, hiddenComment]));

  console.log(`  Created: ${outputPath}`);
  console.log(`  Flag hidden in: EXIF metadata (ImageDescription) + appended data`);
  console.log(`  Tools to use: exiftool, strings, hexdump`);
}

/**
 * Challenge 2: QR Quest (Misc)
 * Creates a QR code with some visual "damage" but still readable
 */
async function createBrokenQR() {
  console.log("Creating broken_qr.png...");
  
  const flag = "ctf{qr_error_correction_rocks}";
  const outputPath = path.join(PUBLIC_DIR, "misc", "broken_qr.png");
  ensureDir(path.dirname(outputPath));

  // Generate QR code with high error correction
  const qrBuffer = await QRCode.toBuffer(flag, {
    errorCorrectionLevel: "H", // High - can recover up to 30% damage
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Add some "damage" overlay but keep it readable
  const damageOverlay = Buffer.from(
    `<svg width="300" height="300">
      <rect x="50" y="50" width="30" height="30" fill="white" opacity="0.7"/>
      <rect x="200" y="100" width="25" height="25" fill="white" opacity="0.6"/>
      <rect x="100" y="180" width="20" height="20" fill="white" opacity="0.5"/>
      <line x1="0" y1="150" x2="50" y2="150" stroke="white" stroke-width="3"/>
      <text x="150" y="290" font-size="8" fill="gray" text-anchor="middle">Damaged QR - Can you recover it?</text>
    </svg>`
  );

  await sharp(qrBuffer)
    .composite([
      {
        input: damageOverlay,
        blend: "over",
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`  Created: ${outputPath}`);
  console.log(`  Flag: ${flag}`);
  console.log(`  QR is still scannable due to error correction level H`);
}

/**
 * Challenge 3: String Theory (Reverse)
 * Creates a fake "binary" that contains the flag in strings
 */
async function createCrackme() {
  console.log("Creating crackme1...");
  
  const flag = "ctf{strings_command_ftw}";
  const outputPath = path.join(PUBLIC_DIR, "reverse", "crackme1");
  ensureDir(path.dirname(outputPath));

  // Create a file that looks like a binary but contains the flag
  // Mix of binary-looking data and the actual flag
  const binaryHeader = Buffer.from([
    0x7f, 0x45, 0x4c, 0x46, // ELF magic number
    0x02, 0x01, 0x01, 0x00, // 64-bit, little endian, current version
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  const padding1 = Buffer.alloc(256);
  for (let i = 0; i < padding1.length; i++) {
    padding1[i] = Math.floor(Math.random() * 256);
  }

  const fakeStrings = Buffer.from(
    "Usage: ./crackme1 <password>\x00" +
    "Checking password...\x00" +
    "Access denied!\x00" +
    "Invalid input\x00" +
    "ERROR: Authentication failed\x00"
  );

  const padding2 = Buffer.alloc(128);
  for (let i = 0; i < padding2.length; i++) {
    padding2[i] = Math.floor(Math.random() * 256);
  }

  // Hide the flag among other strings
  const secretSection = Buffer.from(
    "\x00\x00\x00SECRET_FLAG_LOCATION\x00" +
    flag + "\x00" +
    "CONGRATULATIONS_YOU_FOUND_IT\x00"
  );

  const padding3 = Buffer.alloc(512);
  for (let i = 0; i < padding3.length; i++) {
    padding3[i] = Math.floor(Math.random() * 256);
  }

  const footer = Buffer.from(
    "\x00.text\x00.data\x00.rodata\x00.bss\x00.shstrtab\x00"
  );

  const finalBinary = Buffer.concat([
    binaryHeader,
    padding1,
    fakeStrings,
    padding2,
    secretSection,
    padding3,
    footer,
  ]);

  fs.writeFileSync(outputPath, finalBinary);

  console.log(`  Created: ${outputPath}`);
  console.log(`  Flag hidden in strings`);
  console.log(`  Command to find: strings crackme1 | grep ctf`);
}

/**
 * Challenge 4: Network Detective (Misc)
 * Creates a simple text file that simulates pcap data
 * (Real pcap would require specialized libraries)
 */
async function createCapture() {
  console.log("Creating capture.pcap...");
  
  const flag = "ctf{wireshark_is_essential}";
  const outputPath = path.join(PUBLIC_DIR, "misc", "capture.pcap");
  ensureDir(path.dirname(outputPath));

  // Create a simplified "pcap-like" file
  // This is a text representation that can be analyzed with strings
  const pcapMagic = Buffer.from([0xd4, 0xc3, 0xb2, 0xa1]); // pcap magic number (little endian)
  const pcapHeader = Buffer.alloc(20);
  pcapHeader.writeUInt16LE(2, 0);  // major version
  pcapHeader.writeUInt16LE(4, 2);  // minor version
  pcapHeader.writeUInt32LE(0, 4);  // timezone
  pcapHeader.writeUInt32LE(0, 8);  // sigfigs
  pcapHeader.writeUInt32LE(65535, 12); // snaplen
  pcapHeader.writeUInt32LE(1, 16); // network (ethernet)

  // Fake packet data with HTTP traffic containing the flag
  const httpRequest = Buffer.from(
    "GET /secret HTTP/1.1\r\n" +
    "Host: ctf.example.com\r\n" +
    "User-Agent: CTF-Player/1.0\r\n" +
    "\r\n"
  );

  const httpResponse = Buffer.from(
    "HTTP/1.1 200 OK\r\n" +
    "Content-Type: text/plain\r\n" +
    "X-Secret-Flag: " + flag + "\r\n" +
    "\r\n" +
    "Welcome to the secret page!\r\n" +
    "The flag is in the HTTP headers.\r\n"
  );

  const padding = Buffer.alloc(256);
  for (let i = 0; i < padding.length; i++) {
    padding[i] = Math.floor(Math.random() * 256);
  }

  const finalPcap = Buffer.concat([
    pcapMagic,
    pcapHeader,
    padding,
    httpRequest,
    padding,
    httpResponse,
    padding,
  ]);

  fs.writeFileSync(outputPath, finalPcap);

  console.log(`  Created: ${outputPath}`);
  console.log(`  Flag hidden in HTTP header: X-Secret-Flag`);
  console.log(`  Command to find: strings capture.pcap | grep ctf`);
}

/**
 * Challenge 5: Buffer Overflow 101 (PWN)
 * Creates the vuln.c source file
 */
async function createVulnSource() {
  console.log("Creating vuln.c...");
  
  const outputPath = path.join(PUBLIC_DIR, "pwn", "vuln.c");
  ensureDir(path.dirname(outputPath));

  const sourceCode = `/*
 * Vulnerable Program - Buffer Overflow 101
 * 
 * This program has a classic buffer overflow vulnerability.
 * Can you exploit it to call the secret_function?
 *
 * Compile: gcc -fno-stack-protector -z execstack -no-pie -o vuln vuln.c
 * 
 * Flag: ctf{smashing_the_stack_for_fun}
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// This function should never be called directly
void secret_function() {
    printf("\\n[+] Congratulations! You called the secret function!\\n");
    printf("[+] Flag: ctf{smashing_the_stack_for_fun}\\n");
    exit(0);
}

void vulnerable_function() {
    char buffer[64];  // Small buffer - easy to overflow
    
    printf("Enter your name: ");
    gets(buffer);  // VULNERABLE: no bounds checking!
    
    printf("Hello, %s!\\n", buffer);
}

int main(int argc, char *argv[]) {
    printf("=== Welcome to the Vulnerable Program ===\\n");
    printf("Address of secret_function: %p\\n", secret_function);
    printf("\\n");
    
    vulnerable_function();
    
    printf("\\nGoodbye!\\n");
    return 0;
}
`;

  fs.writeFileSync(outputPath, sourceCode);

  // Also create a fake binary
  const vulnBinaryPath = path.join(PUBLIC_DIR, "pwn", "vuln");
  const binaryContent = Buffer.concat([
    Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]),
    Buffer.alloc(100, 0),
    Buffer.from("secret_function\x00"),
    Buffer.from("ctf{smashing_the_stack_for_fun}\x00"),
    Buffer.from("vulnerable_function\x00"),
    Buffer.from("Enter your name: \x00"),
    Buffer.alloc(200, 0),
  ]);
  fs.writeFileSync(vulnBinaryPath, binaryContent);

  console.log(`  Created: ${outputPath}`);
  console.log(`  Created: ${vulnBinaryPath}`);
  console.log(`  Flag visible in source code (for learning purposes)`);
}

/**
 * Main execution
 */
async function main() {
  console.log("\\n=== Generating Challenge Resource Files ===\\n");
  
  try {
    await createHiddenPixels();
    console.log("");
    
    await createBrokenQR();
    console.log("");
    
    await createCrackme();
    console.log("");
    
    await createCapture();
    console.log("");
    
    await createVulnSource();
    console.log("");
    
    console.log("=== All challenge files generated successfully! ===\\n");
    console.log("Files created in: public/challenges/");
    console.log("\\nChallenge summary:");
    console.log("  - forensics/hidden.png   -> Use: exiftool, strings");
    console.log("  - misc/broken_qr.png     -> Use: any QR scanner");
    console.log("  - misc/capture.pcap      -> Use: strings, wireshark");
    console.log("  - reverse/crackme1       -> Use: strings");
    console.log("  - pwn/vuln.c + vuln      -> Read source code");
    
  } catch (error) {
    console.error("Error generating files:", error);
    process.exit(1);
  }
}

main();
