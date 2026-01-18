/**
 * Reset User Progress Script
 * 
 * This script resets a user's progress (score, solvedChallenges, cheatedChallenges).
 * Useful after re-seeding challenges since IDs change.
 * 
 * Run with: npx tsx scripts/reset-user-progress.ts [email]
 * If no email provided, resets ALL users.
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

async function resetUserProgress(email?: string) {
  console.log("\n=== Reset User Progress ===\n");

  const usersRef = db.collection("users");
  let query: FirebaseFirestore.Query = usersRef;

  if (email) {
    query = usersRef.where("email", "==", email);
    console.log(`Resetting progress for user: ${email}\n`);
  } else {
    console.log("Resetting progress for ALL users\n");
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    
    batch.update(doc.ref, {
      score: 0,
      solvedChallenges: [],
      cheatedChallenges: [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  Reset: ${userData.email || userData.displayName || doc.id}`);
    console.log(`    - Previous score: ${userData.score || 0}`);
    console.log(`    - Previous solved: ${userData.solvedChallenges?.length || 0}`);
    console.log(`    - Previous cheated: ${userData.cheatedChallenges?.length || 0}`);
    count++;
  }

  await batch.commit();
  console.log(`\nSuccessfully reset ${count} user(s).`);
}

// Get email from command line arguments
const email = process.argv[2];

resetUserProgress(email)
  .then(() => {
    console.log("\nReset completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error resetting user progress:", error);
    process.exit(1);
  });
