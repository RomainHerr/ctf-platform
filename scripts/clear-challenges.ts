/**
 * Clear Challenges Script
 * 
 * This script removes all challenges from Firestore.
 * Run with: npx tsx scripts/clear-challenges.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import * as admin from "firebase-admin";

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

async function clearChallenges() {
  console.log("Clearing all challenges from Firestore...\n");

  const challengesRef = db.collection("challenges");
  const snapshot = await challengesRef.get();

  if (snapshot.empty) {
    console.log("No challenges found.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
    console.log(`  Deleting: ${doc.data().title}`);
  });

  await batch.commit();
  console.log(`\nDeleted ${count} challenges.`);
}

clearChallenges()
  .then(() => {
    console.log("Clear completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error clearing challenges:", error);
    process.exit(1);
  });
