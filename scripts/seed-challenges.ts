/**
 * Challenge Seeding Script
 * 
 * This script populates the Firestore database with sample challenges.
 * Run with: npm run seed
 * 
 * IMPORTANT: This script requires Firebase Admin credentials.
 * Make sure to set the environment variables before running.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

// Flag hashing function (must match the one in security.ts)
function hashFlag(flag: string): string {
  const salt = process.env.FLAG_HASH_SALT;
  if (!salt) {
    throw new Error("FLAG_HASH_SALT environment variable is not set");
  }
  const normalizedFlag = flag.trim().toLowerCase();
  return crypto
    .createHash("sha256")
    .update(salt + normalizedFlag)
    .digest("hex");
}

// Sample challenges data
const challenges = [
  // Web Exploitation
  {
    title: "Hidden in Plain Sight",
    description: `Welcome to your first web challenge!

The flag is hidden somewhere on this page. Can you find it?

Hint: Sometimes the most obvious place is the last place you look.

Target: https://ctf-challenge-1.example.com`,
    category: "web",
    difficulty: "easy",
    points: 100,
    flag: "ctf{html_source_is_your_friend}",
    hints: [
      "Have you tried viewing the page source?",
      "Comments in HTML are not visible but still present",
    ],
    attachments: [],
  },
  {
    title: "Cookie Monster",
    description: `The admin panel seems secure, but maybe the authentication is not as robust as it looks.

Can you gain access to the admin dashboard?

Target: https://ctf-challenge-2.example.com`,
    category: "web",
    difficulty: "medium",
    points: 250,
    flag: "ctf{cookies_can_be_modified}",
    hints: [
      "Check the cookies stored by the application",
      "What happens if you change the isAdmin value?",
    ],
    attachments: [],
  },
  {
    title: "SQL Inception",
    description: `A simple login form protects the flag. But does it really?

The developer assured us the login was secure. Prove them wrong.

Target: https://ctf-challenge-3.example.com`,
    category: "web",
    difficulty: "medium",
    points: 250,
    flag: "ctf{union_select_flag_from_secrets}",
    hints: [
      "Classic SQL injection might work here",
      "Try: ' OR 1=1 --",
    ],
    attachments: [],
  },
  {
    title: "XSS Playground",
    description: `This feedback form seems to accept all input. Maybe too much?

Submit some creative feedback and see what happens.

Target: https://ctf-challenge-4.example.com`,
    category: "web",
    difficulty: "hard",
    points: 500,
    flag: "ctf{reflected_xss_is_dangerous}",
    hints: [
      "Try injecting some JavaScript",
      "The flag might be in a cookie that requires DOM access",
    ],
    attachments: [],
  },

  // Cryptography
  {
    title: "ROT13 Rookie",
    description: `We intercepted this encrypted message:

pgs{ebgngr_zr_onol_bar_zber_gvzr}

Can you decrypt it?`,
    category: "crypto",
    difficulty: "easy",
    points: 100,
    flag: "ctf{rotate_me_baby_one_more_time}",
    hints: [
      "ROT13 is a simple substitution cipher",
      "Each letter is replaced by the letter 13 positions after it",
    ],
    attachments: [],
  },
  {
    title: "Base64 Basics",
    description: `This message seems to be encoded, not encrypted:

Y3Rme2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0=

Decode it to find the flag.`,
    category: "crypto",
    difficulty: "easy",
    points: 100,
    flag: "ctf{base64_is_not_encryption}",
    hints: [
      "Base64 is an encoding scheme, not encryption",
      "The = at the end is a hint about the encoding",
    ],
    attachments: [],
  },
  {
    title: "RSA Weakling",
    description: `We found an RSA public key with some suspicious parameters:

n = 323
e = 5
c = 245

The modulus seems small. Can you recover the message?`,
    category: "crypto",
    difficulty: "hard",
    points: 500,
    flag: "ctf{small_n_is_weak}",
    hints: [
      "323 is small enough to factor by hand",
      "323 = 17 * 19",
    ],
    attachments: [],
  },

  // Forensics
  {
    title: "Hidden Pixels",
    description: `This image contains more than meets the eye.

Download the file and examine it carefully.`,
    category: "forensics",
    difficulty: "easy",
    points: 100,
    flag: "ctf{steganography_101}",
    hints: [
      "Try tools like steghide or zsteg",
      "Sometimes the flag is hidden in the least significant bits",
    ],
    attachments: [
      {
        name: "hidden.png",
        url: "/challenges/forensics/hidden.png",
        type: "image/png",
        size: 15360,
      },
    ],
  },
  {
    title: "Memory Lane",
    description: `A memory dump from a compromised system was captured.

Analyze the dump and find the flag hidden in the browser history.`,
    category: "forensics",
    difficulty: "hard",
    points: 500,
    flag: "ctf{volatility_is_your_friend}",
    hints: [
      "Use Volatility framework to analyze the dump",
      "Check browser processes and their memory",
    ],
    attachments: [
      {
        name: "memory.dmp",
        url: "/challenges/forensics/memory.dmp",
        type: "application/octet-stream",
        size: 524288000,
      },
    ],
  },

  // Reverse Engineering
  {
    title: "String Theory",
    description: `This binary contains the flag, but it is not that easy to run.

Analyze the binary and extract the flag.`,
    category: "reverse",
    difficulty: "easy",
    points: 100,
    flag: "ctf{strings_command_ftw}",
    hints: [
      "Sometimes the simplest approach works",
      "Try: strings binary | grep ctf",
    ],
    attachments: [
      {
        name: "crackme1",
        url: "/challenges/reverse/crackme1",
        type: "application/x-executable",
        size: 8192,
      },
    ],
  },
  {
    title: "Assembly Puzzle",
    description: `The following assembly code implements a key verification algorithm.
Figure out what input will make it print "Correct!".

mov eax, [input]
xor eax, 0x1337
cmp eax, 0xDEAD
je correct
jmp wrong`,
    category: "reverse",
    difficulty: "medium",
    points: 250,
    flag: "ctf{xor_for_the_win}",
    hints: [
      "XOR is reversible: if a XOR b = c, then c XOR b = a",
      "Calculate: 0xDEAD XOR 0x1337",
    ],
    attachments: [],
  },

  // Binary Exploitation
  {
    title: "Buffer Overflow 101",
    description: `This program has a classic buffer overflow vulnerability.

Can you exploit it to call the secret function?

nc ctf.example.com 9001`,
    category: "pwn",
    difficulty: "medium",
    points: 250,
    flag: "ctf{smashing_the_stack_for_fun}",
    hints: [
      "The buffer is 64 bytes, try overflowing it",
      "Find the address of the secret function",
    ],
    attachments: [
      {
        name: "vuln.c",
        url: "/challenges/pwn/vuln.c",
        type: "text/x-c",
        size: 512,
      },
      {
        name: "vuln",
        url: "/challenges/pwn/vuln",
        type: "application/x-executable",
        size: 16384,
      },
    ],
  },

  // OSINT
  {
    title: "Social Stalker",
    description: `Our target is a hacker known as "CyberPhantom42".

Find their real email address hidden in their online profiles.

Start here: https://twitter.com/CyberPhantom42`,
    category: "osint",
    difficulty: "easy",
    points: 100,
    flag: "ctf{social_media_reveals_all}",
    hints: [
      "Check all linked profiles and bios",
      "Sometimes email addresses are hidden in unusual places",
    ],
    attachments: [],
  },

  // Miscellaneous
  {
    title: "QR Quest",
    description: `This QR code seems corrupted, but maybe it can still be decoded?

Fix the QR code and scan it.`,
    category: "misc",
    difficulty: "easy",
    points: 100,
    flag: "ctf{qr_error_correction_rocks}",
    hints: [
      "QR codes have built-in error correction",
      "Try reconstructing the timing patterns",
    ],
    attachments: [
      {
        name: "broken_qr.png",
        url: "/challenges/misc/broken_qr.png",
        type: "image/png",
        size: 4096,
      },
    ],
  },
  {
    title: "Network Detective",
    description: `Analyze this packet capture and find the flag transmitted in plaintext.`,
    category: "misc",
    difficulty: "medium",
    points: 250,
    flag: "ctf{wireshark_is_essential}",
    hints: [
      "Use Wireshark to analyze the pcap",
      "Look for HTTP or FTP traffic",
    ],
    attachments: [
      {
        name: "capture.pcap",
        url: "/challenges/misc/capture.pcap",
        type: "application/vnd.tcpdump.pcap",
        size: 102400,
      },
    ],
  },
];

async function seedChallenges() {
  console.log("Starting challenge seeding...");

  const batch = db.batch();
  const challengesRef = db.collection("challenges");

  for (const challenge of challenges) {
    const docRef = challengesRef.doc();
    
    batch.set(docRef, {
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      flagHash: hashFlag(challenge.flag),
      hints: challenge.hints,
      attachments: challenge.attachments,
      solveCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      author: "CTF Admin",
    });

    console.log(`  Added: ${challenge.title} (${challenge.category})`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${challenges.length} challenges!`);
}

// Run the seed function
seedChallenges()
  .then(() => {
    console.log("Seeding completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding challenges:", error);
    process.exit(1);
  });
