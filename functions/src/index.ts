import * as logger from "firebase-functions/logger";

import {onDocumentWrittenWithAuthContext} from "firebase-functions/v2/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";

import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

initializeApp();
const db = getFirestore();

export const modifyDocument =
  onDocumentWrittenWithAuthContext("reservations/{reservationId}",
    (event) => {
      const docId = event.data?.before.id || event.data?.after.id;
      logger.info(`Reservation changed: ${docId}`);

      const previousData = event.data?.before.data();
      const newData = event.data?.after.data();

      // Track the id becoming absent or present to
      // mean the document being deleted or created
      let changeType = "update";
      if (previousData && !newData) {
        changeType = "delete";
      } else if (newData && !previousData) {
        changeType = "create";
      }

      const {authType, authId} = event;
      const who = authType === "system" ? "System" : (authId ? authId : "Unknown");

      const startDate = ((previousData?.startDate || newData?.startDate || "1900") as string);

      db.collection("reservationsAuditLog").doc().create({
        reservationId: docId,
        changeType: changeType,
        before: event.data?.before.data() || {},
        after: event.data?.after.data() || {},
        who: who,
        year: Number((startDate.substring(0, 4))),
        timestamp: new Date(),
      }).then(() => {
        logger.info("Reservation audit log created");
      }).catch((error: any) => {
        logger.error(`Error creating audit log: ${error}`);
      });
    }
  );

export const setUserPassword =
  onCall(async (request) => {
    if (!request.auth) {
      throw new HttpsError("failed-precondition", "Must be admin");
    }
    // Get the list of admins
    const query = await db.collection("permissions").get();

    if (query.docs.length === 0) {
      throw new HttpsError("internal", "Permissions document not found");
    }
    const permissions = query.docs[0].data();

    const adminIds = permissions.adminUserIds as string[];
    if (!adminIds.includes(request.auth.uid)) {
      throw new HttpsError("failed-precondition", "Must be admin");
    }

    const {userId, password} = request.data;

    await getAuth().updateUser(userId, {password: password,})
    return true;
  });
