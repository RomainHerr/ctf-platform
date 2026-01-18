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

// Sample challenges data - ALL SOLVABLE without external servers
const challenges = [
  // Cryptography (3 challenges - all solvable)
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

The modulus seems small. Can you recover the message?

Hint: The plaintext message m satisfies c = m^e mod n`,
    category: "crypto",
    difficulty: "hard",
    points: 500,
    flag: "ctf{small_n_is_weak}",
    hints: [
      "323 is small enough to factor by hand",
      "323 = 17 * 19, now compute phi(n) = (p-1)(q-1)",
    ],
    attachments: [],
  },
  {
    title: "Hex Madness",
    description: `This message was encoded in hexadecimal:

6374667b6865785f69735f6a7573745f626173653136fD

Convert it back to ASCII to find the flag.`,
    category: "crypto",
    difficulty: "easy",
    points: 100,
    flag: "ctf{hex_is_just_base16}",
    hints: [
      "Each pair of hex digits represents one ASCII character",
      "Use an online hex to ASCII converter or Python",
    ],
    attachments: [],
  },

  // Forensics (1 challenge - solvable with generated file)
  {
    title: "Hidden Pixels",
    description: `This image contains more than meets the eye.

Download the file and examine it carefully. The flag might be hidden in the metadata or appended to the file.`,
    category: "forensics",
    difficulty: "easy",
    points: 100,
    flag: "ctf{steganography_101}",
    hints: [
      "Try using exiftool to view image metadata",
      "The strings command can reveal hidden text in binary files",
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

  // Reverse Engineering (2 challenges - all solvable)
  {
    title: "String Theory",
    description: `This binary contains the flag, but it is not that easy to run.

Analyze the binary and extract the flag using basic reverse engineering techniques.`,
    category: "reverse",
    difficulty: "easy",
    points: 100,
    flag: "ctf{strings_command_ftw}",
    hints: [
      "Sometimes the simplest approach works",
      "Try: strings crackme1 | grep ctf",
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
jmp wrong

What value of input makes eax equal to 0xDEAD after the XOR operation?`,
    category: "reverse",
    difficulty: "medium",
    points: 250,
    flag: "ctf{xor_for_the_win}",
    hints: [
      "XOR is reversible: if a XOR b = c, then c XOR b = a",
      "Calculate: 0xDEAD XOR 0x1337 = ?",
    ],
    attachments: [],
  },

  // Binary Exploitation (1 challenge - solvable by reading source)
  {
    title: "Buffer Overflow 101",
    description: `This program has a classic buffer overflow vulnerability.

Analyze the source code to understand the vulnerability. The flag is visible in the source - this challenge is about understanding WHY it is vulnerable.

Download vuln.c and explain how you would exploit it to call secret_function().`,
    category: "pwn",
    difficulty: "medium",
    points: 250,
    flag: "ctf{smashing_the_stack_for_fun}",
    hints: [
      "The buffer is 64 bytes, but gets() has no bounds checking",
      "Overflow the buffer to overwrite the return address",
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

  // Miscellaneous (2 challenges - all solvable)
  {
    title: "QR Quest",
    description: `This QR code seems slightly corrupted, but maybe it can still be decoded?

Download the image and try scanning it. QR codes have built-in error correction.`,
    category: "misc",
    difficulty: "easy",
    points: 100,
    flag: "ctf{qr_error_correction_rocks}",
    hints: [
      "QR codes have built-in error correction (up to 30% damage can be recovered)",
      "Try any QR code scanner app on your phone",
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
    description: `Analyze this packet capture and find the flag transmitted in plaintext.

The flag is hidden somewhere in the HTTP traffic. Use strings or a packet analyzer to find it.`,
    category: "misc",
    difficulty: "medium",
    points: 250,
    flag: "ctf{wireshark_is_essential}",
    hints: [
      "Use Wireshark or the strings command to analyze the pcap",
      "Look for HTTP headers - the flag might be in a custom header",
    ],
    attachments: [
      {
        name: "capture.pcap",
        url: "/challenges/misc/capture.pcap",
        type: "application/vnd.tcpdump.pcap",
        size: 102400,
      },
    ],
    isComingSoon: false,
  },
];

// Coming Soon challenges - displayed but not solvable
const comingSoonChallenges = [
  // Web - Advanced
  {
    title: "JWT Juggling",
    description: `A modern web application uses JWT for authentication. But the implementation has a critical flaw...

Can you forge a valid admin token without knowing the secret key?`,
    category: "web",
    difficulty: "expert",
    points: 1000,
    flag: "ctf{none_algorithm_bypass}",
    hints: [
      "Research JWT algorithm confusion attacks",
      "What happens when you change the algorithm to 'none'?",
    ],
    attachments: [],
  },
  {
    title: "GraphQL Introspection",
    description: `This API uses GraphQL. The developers thought they disabled introspection, but did they really?

Find the hidden mutation that reveals the flag.`,
    category: "web",
    difficulty: "expert",
    points: 1000,
    flag: "ctf{graphql_introspection_leak}",
    hints: [
      "Try different introspection queries",
      "Some implementations only block __schema but not __type",
    ],
    attachments: [],
  },

  // Crypto - Advanced
  {
    title: "Elliptic Curve Nightmare",
    description: `We intercepted an encrypted message using ECDSA. The implementation uses a custom curve with suspicious parameters.

n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
The private key was used with a biased nonce...`,
    category: "crypto",
    difficulty: "insane",
    points: 2000,
    flag: "ctf{lattice_attack_on_ecdsa}",
    hints: [
      "Research lattice attacks on ECDSA with biased nonces",
      "The Hidden Number Problem (HNP) might be relevant",
    ],
    attachments: [],
  },
  {
    title: "Homomorphic Heist",
    description: `A voting system uses homomorphic encryption to tally votes without revealing individual ballots.

But there is a subtle flaw in the zero-knowledge proof verification...`,
    category: "crypto",
    difficulty: "insane",
    points: 2000,
    flag: "ctf{zkp_soundness_error}",
    hints: [
      "Research soundness errors in zero-knowledge proofs",
      "The verifier accepts proofs too eagerly",
    ],
    attachments: [],
  },

  // PWN - Advanced
  {
    title: "Kernel Panic",
    description: `A custom Linux kernel module has a vulnerability. Exploit it to escalate privileges from user to root.

The module implements a character device at /dev/vuln.`,
    category: "pwn",
    difficulty: "insane",
    points: 2000,
    flag: "ctf{kernel_rop_chain_complete}",
    hints: [
      "Analyze the ioctl handler carefully",
      "You'll need to bypass SMEP and SMAP",
    ],
    attachments: [],
  },
  {
    title: "Heap Feng Shui",
    description: `A modern browser has a use-after-free vulnerability in its JavaScript engine.

Craft a JavaScript payload that achieves arbitrary code execution.`,
    category: "pwn",
    difficulty: "insane",
    points: 2000,
    flag: "ctf{browser_pwn_v8_sandbox_escape}",
    hints: [
      "You need to spray the heap strategically",
      "Type confusion might help with the initial primitive",
    ],
    attachments: [],
  },

  // Reverse - Advanced
  {
    title: "VM Escape",
    description: `This binary implements a custom virtual machine. The flag is protected by multiple layers of obfuscation.

The VM has its own instruction set and anti-debugging features.`,
    category: "reverse",
    difficulty: "expert",
    points: 1000,
    flag: "ctf{custom_vm_fully_reversed}",
    hints: [
      "Start by identifying the VM dispatcher",
      "Document each opcode before attempting to understand the logic",
    ],
    attachments: [],
  },
  {
    title: "Neural Network Backdoor",
    description: `This machine learning model has been trojaned. It behaves normally on most inputs, but there is a hidden trigger.

Find the trigger pattern that causes the model to output the flag.`,
    category: "reverse",
    difficulty: "insane",
    points: 2000,
    flag: "ctf{adversarial_trigger_found}",
    hints: [
      "Research neural network trojans and backdoors",
      "The trigger might be a specific pixel pattern",
    ],
    attachments: [],
  },

  // Forensics - Advanced
  {
    title: "Memory Corruption",
    description: `A memory dump from a compromised server. The attacker used a sophisticated rootkit that hides in kernel memory.

Find the hidden communication channel used for C2.`,
    category: "forensics",
    difficulty: "expert",
    points: 1000,
    flag: "ctf{kernel_rootkit_c2_channel}",
    hints: [
      "Look for hooked system calls",
      "The C2 channel might be hidden in network packets",
    ],
    attachments: [],
  },
  {
    title: "Blockchain Forensics",
    description: `Analyze this Ethereum smart contract transaction history. Millions were stolen through a reentrancy attack.

Trace the stolen funds and identify the attacker's wallet.`,
    category: "forensics",
    difficulty: "expert",
    points: 1000,
    flag: "ctf{reentrancy_funds_traced}",
    hints: [
      "Use Etherscan or a similar block explorer",
      "Follow the money through mixer contracts",
    ],
    attachments: [],
  },
];

async function seedChallenges() {
  console.log("Starting challenge seeding...\n");

  const batch = db.batch();
  const challengesRef = db.collection("challenges");

  // Seed regular challenges
  console.log("=== Active Challenges ===");
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
      isComingSoon: false,
      author: "CTF Admin",
    });

    console.log(`  [ACTIVE] ${challenge.title} (${challenge.category}) - ${challenge.points} pts`);
  }

  // Seed coming soon challenges
  console.log("\n=== Coming Soon Challenges ===");
  for (const challenge of comingSoonChallenges) {
    const docRef = challengesRef.doc();
    
    batch.set(docRef, {
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      flagHash: hashFlag(challenge.flag), // Still hash it for future use
      hints: challenge.hints,
      attachments: challenge.attachments,
      solveCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      isComingSoon: true,
      author: "CTF Admin",
    });

    console.log(`  [COMING SOON] ${challenge.title} (${challenge.category}) - ${challenge.points} pts`);
  }

  await batch.commit();
  
  const totalChallenges = challenges.length + comingSoonChallenges.length;
  console.log(`\nSuccessfully seeded ${totalChallenges} challenges!`);
  console.log(`  - Active: ${challenges.length}`);
  console.log(`  - Coming Soon: ${comingSoonChallenges.length}`);
  
  console.log("\n=== Category Summary ===");
  const allChallenges = [...challenges, ...comingSoonChallenges];
  const categories = [...new Set(allChallenges.map(c => c.category))];
  for (const cat of categories) {
    const active = challenges.filter(c => c.category === cat).length;
    const coming = comingSoonChallenges.filter(c => c.category === cat).length;
    console.log(`  ${cat}: ${active} active, ${coming} coming soon`);
  }
}

// Run the seed function
seedChallenges()
  .then(() => {
    console.log("\nSeeding completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding challenges:", error);
    process.exit(1);
  });
